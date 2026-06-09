<!--
  MembersSection.svelte — Section 4

  Two identically-sized rectangles stacked in the same bounding box.
  Both cards are clip-path'd to complementary regions that tile the stage perfectly:

    --cut ∈ [0,1]  → drives --c = cut×100% (center of the diagonal)
    --d = 17.5%    → half-spread ≈ 25° on a 4:3 stage

    Desktop (vertical diagonal):
      Rioze   (left):   polygon(0 0, (c-d) 0, (c+d) 100%, 0 100%)
      Rutsuki (right):  polygon((c-d) 0, 100% 0, 100% 100%, (c+d) 100%)

    Mobile (horizontal diagonal, same math, axes swapped):
      Rioze   (top):    polygon(0 0, 100% 0, 100% (c-d), 0 (c+d))
      Rutsuki (bottom): polygon(100% (c-d), 100% 100%, 0 100%, 0 (c+d))

  Hover zones are independent because clip-path also clips pointer events:
    left/top  → .card--rioze:hover
    right/bottom → .card--rutsuki:hover

  Animation (all JS, bypasses Svelte reactivity for zero-overhead hot path):
    • Entrance: ease-out 0→0.5, delayed 0.8s after entering view
    • Mouse:    smoothly pushes divider away from cursor, range 45%–55%
    • Exit:     spring resets, rAF cancelled

  Entrance slide: CSS transition on card images (translateX ±40px → 0 when .is-entered).
  Hover silhouette: filter chain flattens image to a colour-tinted solid fill.
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { gsap } from 'gsap'
	import { members, assetManifest } from '$lib/data/content'
	import FlickerHeading from '$lib/components/ui/FlickerHeading.svelte'
	import { observe } from '$lib/utils/intersect'

	const rioze = members[0]!
	const rutsuki = members[1]!

	// entered: set after CONFIG.entrance.delay — starts character + typewriter animations
	let entered = $state(false)
	let sectionEl: HTMLElement
	let stageEl: HTMLElement
	let veilEl: HTMLElement
	let curtainEl: HTMLElement
	let curtainLeftEl: HTMLElement
	let curtainRightEl: HTMLElement
	let riozeImgEl: HTMLImageElement
	let rutsukiImgEl: HTMLImageElement

	const src = (key: string) => assetManifest[key]?.src ?? ''

	// ── Config ─────────────────────────────────────────────────────────
	// All tweakable values in one place.
	const CONFIG = {
		// Diagonal occlusion tween
		entrance: {
			delay: 0.8, // when .is-entered fires (char slide + typewriter + diagonal)
			duration: 1.4 // diagonal tween duration (seconds)
		},
		// Veil: green overlay that cross-fades with the stage
		veil: {
			color: 'rgba(20, 160, 90, 0.5)', // Rutsuki green, semi-transparent
			holdFor: 0.5, // seconds of solid veil before the cross-fade begins
			fadeFor: 0.8 // seconds for veil to fade out / stage to fade in
			//              → stage fully visible at holdFor + fadeFor = 1.3s
		},
		// Curtain: white split panels that open from center over entrance.delay
		curtain: {
			color: 'rgba(240, 240, 240, 0.95)' // dimmer, more opaque white
			// duration reuses entrance.delay so curtain finishes just as content begins
		},
		// Character image slide-in
		slide: {
			offset: '20%', // starting translate distance (added to resting pos)
			duration: 2.2, // longer tween for a very slow finish
			ease: 'power4.out' // strong deceleration — much slower toward the end
		},
		// Resting position of each character image after the slide completes.
		// x/y are GSAP transforms (pixels or %, relative to the element itself).
		// desktop = left/right split; mobile = top/bottom split.
		pos: {
			rioze: {
				desktop: { x: '10%', y: '0%' },
				mobile: { x: '-15%', y: '0%' } // tweak to nudge rioze on mobile
			},
			rutsuki: {
				desktop: { x: '-10%', y: '0%' },
				mobile: { x: '3%', y: '52%' } // tweak to nudge rutsuki on mobile
			}
		},
		// Continuous mouse-follow
		mouse: {
			duration: 0.35, // quickTo smoothing (seconds)
			range: 0.05 // max divider offset from center (0.05 = ±5%)
		},
		// Typewriter labels
		label: {
			start: 0.4, // seconds after .is-entered before first char
			lineGap: 0.35, // extra delay between name and meta lines
			charSpeed: 0.5 // total seconds to type all chars in one line
		},
		// IntersectionObserver: exit when visibility drops BELOW this ratio.
		// Using a single threshold fixes the partial-scroll inconsistency:
		// both entry and exit fire at the same ratio, so the same reset
		// always runs before any new entrance animation starts.
		exitThreshold: 0.15
	} as const

	function charDelay(_lineIdx: number, charIdx: number, lineLen: number): string {
		const { start, charSpeed } = CONFIG.label
		const t = start + charIdx * (lineLen > 1 ? charSpeed / lineLen : 0.01)
		return t.toFixed(3) + 's'
	}

	onMount(() => {
		/*
		  gsap.quickTo — GSAP's optimised pattern for continuous mouse-driven updates.
		  Animates --cut on stageEl. overwrite:true ensures the entrance tween is
		  cancelled the moment the user moves the mouse.
		*/
		const quickCut = gsap.quickTo(stageEl, '--cut', {
			duration: CONFIG.mouse.duration,
			ease: 'power2.out',
			overwrite: true
		})

		let entranceTween: gsap.core.Tween | null = null
		let slideTweenRioze: gsap.core.Tween | null = null
		let slideTweenRutsuki: gsap.core.Tween | null = null
		let veilTween: gsap.core.Tween | null = null
		let curtainTransitionEndHandler: (() => void) | null = null
		let enterTimeout: ReturnType<typeof setTimeout> | null = null

		// Set initial state before first paint
		const mobile = window.innerWidth < 768
		// GSAP x/y don't accept calc() — resolve percent arithmetic to a plain string
		const pct = (base: string, delta: number) => `${parseFloat(base) + delta}%`
		const off = parseFloat(CONFIG.slide.offset)
		gsap.set(veilEl, { opacity: 1, background: CONFIG.veil.color })
		gsap.set(stageEl, { opacity: 0 })
		// Curtain initial state is handled by CSS; ensure panels are visible
		curtainLeftEl.style.visibility = 'visible'
		curtainRightEl.style.visibility = 'visible'
		if (mobile) {
			gsap.set(riozeImgEl, {
				x: CONFIG.pos.rioze.mobile.x,
				y: pct(CONFIG.pos.rioze.mobile.y, -off)
			})
			gsap.set(rutsukiImgEl, {
				x: CONFIG.pos.rutsuki.mobile.x,
				y: pct(CONFIG.pos.rutsuki.mobile.y, +off)
			})
		} else {
			gsap.set(riozeImgEl, {
				x: pct(CONFIG.pos.rioze.desktop.x, -off),
				y: CONFIG.pos.rioze.desktop.y
			})
			gsap.set(rutsukiImgEl, {
				x: pct(CONFIG.pos.rutsuki.desktop.x, +off),
				y: CONFIG.pos.rutsuki.desktop.y
			})
		}

		// ── IntersectionObserver ─────────────────────────
		// Single threshold: fires only when crossing CONFIG.exitThreshold in either
		// direction. isIntersecting=true always means "crossed in from below",
		// isIntersecting=false always means "crossed out from above" — so the reset
		// always runs before a new entrance, whether the scroll was shallow or deep.
		const cleanupIO = observe(
			sectionEl,
			entry => {
				if (entry.isIntersecting) {
					// Reset to initial covered state
					gsap.set(veilEl, { opacity: 1 })
					gsap.set(stageEl, { opacity: 0, '--cut': 0 })
					// Curtain: instant reset — suppress CSS transition, snap closed
					if (curtainTransitionEndHandler) {
						curtainLeftEl.removeEventListener('transitionend', curtainTransitionEndHandler)
						curtainTransitionEndHandler = null
					}
					curtainEl.classList.add('curtain--no-transition')
					curtainEl.classList.remove('curtain--open')
					curtainLeftEl.style.visibility = 'visible'
					curtainRightEl.style.visibility = 'visible'
					if (mobile) {
						gsap.set(riozeImgEl, {
							x: CONFIG.pos.rioze.mobile.x,
							y: pct(CONFIG.pos.rioze.mobile.y, -off)
						})
						gsap.set(rutsukiImgEl, {
							x: CONFIG.pos.rutsuki.mobile.x,
							y: pct(CONFIG.pos.rutsuki.mobile.y, +off)
						})
					} else {
						gsap.set(riozeImgEl, {
							x: pct(CONFIG.pos.rioze.desktop.x, -off),
							y: CONFIG.pos.rioze.desktop.y
						})
						gsap.set(rutsukiImgEl, {
							x: pct(CONFIG.pos.rutsuki.desktop.x, +off),
							y: CONFIG.pos.rutsuki.desktop.y
						})
					}
					// Curtain: flush styles (commits instant reset), then open via CSS transition
					// The transition runs fully on the compositor thread — zero JS per frame.
					void curtainEl.offsetWidth // force style flush before re-enabling transition
					curtainEl.classList.remove('curtain--no-transition')
					curtainEl.classList.add('curtain--open')
					// Hide panels once offscreen to avoid compositing invisible layers
					curtainTransitionEndHandler = () => {
						curtainLeftEl.style.visibility = 'hidden'
						curtainRightEl.style.visibility = 'hidden'
						curtainTransitionEndHandler = null
					}
					curtainLeftEl.addEventListener('transitionend', curtainTransitionEndHandler, {
						once: true
					})
					// Cross-fade: veil out, stage in — both start at holdFor, last fadeFor
					veilTween = gsap.to(veilEl, {
						opacity: 0,
						delay: CONFIG.veil.holdFor,
						duration: CONFIG.veil.fadeFor,
						ease: 'power1.inOut',
						overwrite: true
					})
					gsap.to(stageEl, {
						opacity: 1,
						delay: CONFIG.veil.holdFor,
						duration: CONFIG.veil.fadeFor,
						ease: 'power1.inOut',
						overwrite: true
					})
					// Diagonal opens after entrance.delay
					entranceTween = gsap.to(stageEl, {
						'--cut': 0.5,
						duration: CONFIG.entrance.duration,
						delay: CONFIG.entrance.delay,
						ease: 'power2.out'
					})
					// Character images slide to rest
					const slideProps = {
						duration: CONFIG.slide.duration,
						delay: CONFIG.entrance.delay,
						ease: CONFIG.slide.ease,
						overwrite: true
					}
					slideTweenRioze = gsap.to(riozeImgEl, {
						...(mobile ? CONFIG.pos.rioze.mobile : CONFIG.pos.rioze.desktop),
						...slideProps
					})
					slideTweenRutsuki = gsap.to(rutsukiImgEl, {
						...(mobile ? CONFIG.pos.rutsuki.mobile : CONFIG.pos.rutsuki.desktop),
						...slideProps
					})
					enterTimeout = setTimeout(() => {
						entered = true
					}, CONFIG.entrance.delay * 1000)
				} else {
					if (enterTimeout) {
						clearTimeout(enterTimeout)
						enterTimeout = null
					}
					entranceTween?.kill()
					slideTweenRioze?.kill()
					slideTweenRutsuki?.kill()
					veilTween?.kill()
					entered = false
					// Snap back to covered for next entrance
					gsap.set(veilEl, { opacity: 1 })
					gsap.set(stageEl, { opacity: 0, '--cut': 0 })
					// Curtain: stop any in-flight transition and snap closed instantly
					if (curtainTransitionEndHandler) {
						curtainLeftEl.removeEventListener('transitionend', curtainTransitionEndHandler)
						curtainTransitionEndHandler = null
					}
					curtainEl.classList.add('curtain--no-transition')
					curtainEl.classList.remove('curtain--open')
					curtainLeftEl.style.visibility = 'visible'
					curtainRightEl.style.visibility = 'visible'
					if (mobile) {
						gsap.set(riozeImgEl, {
							x: CONFIG.pos.rioze.mobile.x,
							y: pct(CONFIG.pos.rioze.mobile.y, -off)
						})
						gsap.set(rutsukiImgEl, {
							x: CONFIG.pos.rutsuki.mobile.x,
							y: pct(CONFIG.pos.rutsuki.mobile.y, +off)
						})
					} else {
						gsap.set(riozeImgEl, {
							x: pct(CONFIG.pos.rioze.desktop.x, -off),
							y: CONFIG.pos.rioze.desktop.y
						})
						gsap.set(rutsukiImgEl, {
							x: pct(CONFIG.pos.rutsuki.desktop.x, +off),
							y: CONFIG.pos.rutsuki.desktop.y
						})
					}
				}
			},
			{ threshold: CONFIG.exitThreshold }
		)

		// ── Pointer tracking ─────────────────────────────
		// Cache the stage rect instead of calling getBoundingClientRect() on every
		// pointermove. Reading layout per-frame forces a synchronous reflow that
		// competes with the clip-path repaint — the main source of the frame drop.
		// The rect is refreshed lazily on scroll/resize (passive listeners), so the
		// hot pointermove path stays free of any layout reads.
		let stageRect = stageEl.getBoundingClientRect()
		let rectDirty = false
		function refreshRect() {
			stageRect = stageEl.getBoundingClientRect()
			rectDirty = false
		}
		function markRectDirty() {
			rectDirty = true
		}

		function onMove(e: PointerEvent) {
			if (rectDirty) refreshRect()
			const nx = Math.max(0, Math.min(1, (e.clientX - stageRect.left) / stageRect.width))
			const r = CONFIG.mouse.range
			// Push the divider away from cursor within ±range
			const offset = Math.max(-r, Math.min(r, -(nx - 0.5) * r * 2))
			quickCut(0.5 + offset)
		}

		function onLeave() {
			quickCut(0.5)
		}

		stageEl.addEventListener('pointermove', onMove, { passive: true })
		stageEl.addEventListener('pointerleave', onLeave, { passive: true })
		window.addEventListener('scroll', markRectDirty, { passive: true })
		window.addEventListener('resize', markRectDirty, { passive: true })

		return () => {
			cleanupIO()
			entranceTween?.kill()
			slideTweenRioze?.kill()
			slideTweenRutsuki?.kill()
			veilTween?.kill()
			if (curtainTransitionEndHandler) {
				curtainLeftEl.removeEventListener('transitionend', curtainTransitionEndHandler)
			}
			if (enterTimeout) clearTimeout(enterTimeout)
			stageEl.removeEventListener('pointermove', onMove)
			stageEl.removeEventListener('pointerleave', onLeave)
			window.removeEventListener('scroll', markRectDirty)
			window.removeEventListener('resize', markRectDirty)
		}
	})
</script>

<section class="members" bind:this={sectionEl}>
	<div class="members__header">
		<FlickerHeading heading="メンバー" />
	</div>

	<div class="stage-wrap">
		<div class="stage" class:is-entered={entered} bind:this={stageEl}>
			<!-- Rutsuki — base layer, right/bottom region -->
			<div class="card card--rutsuki">
				<img
					src={src(rutsuki.colorAsset)}
					alt={rutsuki.name}
					class="card__img"
					bind:this={rutsukiImgEl}
				/>
				<div class="card__label card__label--right">
					<p class="card__name">
						{#each [...rutsuki.name] as ch, i}<span
								class="char"
								style="--t: {charDelay(0, i, rutsuki.name.length)}"
								>{ch === ' ' ? '\u00A0' : ch}</span
							>{/each}
					</p>
				</div>
			</div>

			<!-- Rioze — top layer, left/top region -->
			<div class="card card--rioze">
				<img
					src={src(rioze.colorAsset)}
					alt={rioze.name}
					class="card__img"
					bind:this={riozeImgEl}
				/>
				<div class="card__label card__label--left">
					<p class="card__name">
						{#each [...rioze.name] as ch, i}<span
								class="char"
								style="--t: {charDelay(0, i, rioze.name.length)}">{ch === ' ' ? '\u00A0' : ch}</span
							>{/each}
					</p>
				</div>
			</div>
		</div>

		<!-- Veil — sibling of .stage inside .stage-wrap, unaffected by stage opacity -->
		<div class="veil" aria-hidden="true" bind:this={veilEl}></div>

		<!-- Curtain — white panels that split open from center, above the veil ─── -->
		<div class="curtain" aria-hidden="true" bind:this={curtainEl}>
			<div class="curtain__half curtain__half--left" bind:this={curtainLeftEl}></div>
			<div class="curtain__half curtain__half--right" bind:this={curtainRightEl}></div>
		</div>
	</div>
</section>

<style>
	/* ── Section shell ──────────────────────────── */
	.members {
		display: flex;
		flex-direction: column;
		padding: 3rem 1.5rem;
	}

	@media (min-width: 768px) {
		.members {
			padding: 3rem 4rem;
		}
	}

	.members__header {
		flex-shrink: 0;
		margin-bottom: 2rem;
	}

	/* \u2500\u2500 Stage \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
	/* opacity driven by GSAP; veil covers during the hold phase */
	/* ── Stage wrapper ────────────────────────────── */
	/* Positioned container shared by .stage and .veil */
	.stage-wrap {
		position: relative;
		width: 100%;
		overflow: hidden;
		aspect-ratio: 3 / 4; /* mobile: portrait */
	}

	/* Desktop: cinematic 21:9 */
	@media (min-width: 768px) {
		.stage-wrap {
			aspect-ratio: 21 / 9;
			height: unset;
		}
	}

	/* ── Stage ──────────────────────────────────── */
	/* opacity driven by GSAP; veil covers during the hold phase */
	.stage {
		position: absolute;
		inset: 0;
		overflow: hidden;
		/* Isolate clip-path repaints to this subtree so they don't invalidate
		   the rest of the page during the per-frame --cut animation. */
		contain: layout paint;
		--cut: 0;
		--c: calc(var(--cut) * 100%);
		--d: 17.5%;
	}

	/* ── Cards — both fill the stage exactly ────── */
	.card {
		position: absolute;
		inset: 0;
		overflow: hidden;
		/* Contain paint so each card repaints independently and only within its
		   own box when clip-path changes. */
		contain: paint;
	}

	/* Promote clip-path to its own layer ONLY while animating (entrance + mouse
	   follow). A permanent will-change keeps an extra compositor layer alive at
	   all times, wasting memory; scoping it to .is-entered limits the cost to the
	   active window. */
	.stage.is-entered .card {
		will-change: clip-path;
	}

	/* ── Rutsuki — right/bottom region ─────────── */
	.card--rutsuki {
		z-index: 0;
		background: rgba(20, 160, 90, 0.3);
		clip-path: polygon(
			calc(var(--c) - var(--d)) 0%,
			100% 0%,
			100% 100%,
			calc(var(--c) + var(--d)) 100%
		);
		transition: background 0.4s ease;
	}

	.card--rutsuki:hover {
		background: rgba(20, 160, 90, 0.85);
	}

	/* ── Rioze — left/top region (z:1 so pointer events hit it first) */
	.card--rioze {
		z-index: 1;
		background: rgba(40, 100, 220, 0.3);
		clip-path: polygon(
			0% 0%,
			calc(var(--c) - var(--d)) 0%,
			calc(var(--c) + var(--d)) 100%,
			0% 100%
		);
		transition: background 0.4s ease;
	}

	.card--rioze:hover {
		background: rgba(40, 100, 220, 0.85);
	}

	/* Mobile: horizontal diagonal — same math, axes swapped */
	@media (max-width: 767px) {
		.card--rioze {
			clip-path: polygon(
				0% 0%,
				100% 0%,
				100% calc(var(--c) - var(--d)),
				0% calc(var(--c) + var(--d))
			);
		}
		.card--rutsuki {
			clip-path: polygon(
				100% calc(var(--c) - var(--d)),
				100% 100%,
				0% 100%,
				0% calc(var(--c) + var(--d))
			);
		}
	}

	/* ═══════════════════════════════════════════════════════════════
	   POSITIONING — edit here to reposition characters and labels

	   • object-position: where the character art is anchored inside
	     its container (e.g. "left bottom" = bottom-left corner).
	   • transform (pre-enter): how far the image slides from before
	     .is-entered. Use translateX for desktop, translateY for mobile.
	   • Label positions: .card__label--left / --right further below.
	   ═══════════════════════════════════════════════════════════════ */

	/* Rioze — left panel */
	.card--rioze .card__img {
		object-position: left bottom; /* anchor: bottom-left corner */
	}

	/* Rutsuki — right panel */
	.card--rutsuki .card__img {
		object-position: right bottom; /* anchor: bottom-right corner */
	}

	/* ═══════════════════════════════════════════════════════════════
	   END POSITIONING
	   ═══════════════════════════════════════════════════════════════ */

	/* ── Images ─────────────────────────────────── */
	.card__img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		transition: filter 0.4s ease;
	}

	/*
	  Hover silhouette: flatten all colour to a solid tinted fill.
	  brightness(0) → black shape
	  invert(1)     → white shape
	  sepia(1) + saturate(4) + hue-rotate → vivid colour tint
	*/
	.card--rioze:hover .card__img {
		filter: brightness(0) invert(1) sepia(1) saturate(4) hue-rotate(185deg);
	}
	.card--rutsuki:hover .card__img {
		filter: brightness(0) invert(1) sepia(1) saturate(4) hue-rotate(100deg);
	}

	/* ── Veil ──────────────────────────────────── */
	.veil {
		position: absolute;
		inset: 0;
		z-index: 2; /* above stage, below curtain */
		pointer-events: none;
		will-change: opacity;
	}

	/* ── Curtain ────────────────────────────────── */
	.curtain {
		position: absolute;
		inset: 0;
		z-index: 3; /* above veil */
		display: flex;
		pointer-events: none;
	}
	.curtain__half {
		flex: 0 0 50%;
		height: 100%;
		background: rgba(240, 240, 240, 0.95); /* CONFIG.curtain.color */
		will-change: transform;
	}

	/* CSS-driven open animation — runs on the compositor thread, zero JS per frame.
	   Duration matches CONFIG.entrance.delay (0.8s). cubic-bezier ≈ power2.in. */
	.curtain__half--left {
		transition: transform 0.8s cubic-bezier(0.32, 0, 0.67, 0);
	}
	.curtain__half--right {
		transition: transform 0.8s cubic-bezier(0.32, 0, 0.67, 0);
	}
	:global(.curtain--open) .curtain__half--left {
		transform: translateX(-100%);
	}
	:global(.curtain--open) .curtain__half--right {
		transform: translateX(100%);
	}
	/* Suppress transition for instant reset (applied before removing .curtain--open) */
	:global(.curtain--no-transition) .curtain__half {
		transition: none !important;
	}

	/* ── Typewriter chars ───────────────────────── */
	.char {
		display: inline;
		opacity: 0;
	}

	.stage.is-entered .char {
		animation: char-appear 0.01s linear var(--t) forwards;
	}

	@keyframes char-appear {
		to {
			opacity: 1;
		}
	}

	/* ── Labels ─────────────────────────────────── */
	.card__label {
		position: absolute;
		z-index: 2;
	}

	/* Label positions — vertical text, slide-in on enter */
	.card__label--left {
		top: 50%;
		left: 1.5rem;
		transform: translateY(calc(-50% + 50px)); /* desktop: below rest, slides up */
		transition: none;
	}
	.card__label--right {
		top: 50%;
		right: 1.5rem;
		transform: translateY(calc(-50% - 50px)); /* desktop: above rest, slides down */
		transition: none;
	}

	/* Slide labels to rest when entered */
	.stage.is-entered .card__label--left {
		transform: translateY(-50%);
		transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.stage.is-entered .card__label--right {
		transform: translateY(-50%);
		transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@media (max-width: 767px) {
		/* Rioze: top-right, slide from top */
		.card__label--left {
			top: 1.5rem;
			left: unset;
			right: 1.5rem;
			transform: translateY(-40px);
		}
		.stage.is-entered .card__label--left {
			transform: translateY(0);
		}
		/* Rutsuki: bottom-left, slide from below */
		.card__label--right {
			top: unset;
			bottom: 1.5rem;
			right: unset;
			left: 1.5rem;
			transform: translateY(40px);
		}
		.stage.is-entered .card__label--right {
			transform: translateY(0);
		}
	}

	.card__name {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 2rem;
		font-weight: 700;
		color: white;
		writing-mode: vertical-rl;
	}

	@media (min-width: 768px) {
		.card__name {
			font-size: 3rem;
		}
	}
</style>
