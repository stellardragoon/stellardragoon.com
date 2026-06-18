<!--
  WorksSection.svelte — Section 6

  Layout: FlickerHeading → TypewriterLines (current work detail) → 16:9 stage → footer row.
  Consistent with MembersSection and WorldviewSection (same 16:9 rectangle).

  Scroll-Linked Horizontal Strip:
    A 300%-wide strip holds [prev | current | next] panels gaplessly.
    Default: translateX(-33.3333%) → current panel centered.
    When scroll progress < 0.4 (entering): strip shifts right, prev panel fades in.
    When scroll progress > 0.6 (exiting):  strip shifts left,  next panel fades in.
    Center zone [0.4, 0.6]: strip locked at center, side panels hidden.
    Edit SCROLL config to tweak opacities and translation range.

  Carousel: Staggered Inset Wipe — 4 GPU-accelerated clip-path layers (no reflow):
    layer-4 (z:1)  incoming image (staged before wipe starts)
    layer-3 (z:2)  blue accent
    layer-2 (z:3)  green accent   ← shorter duration so it fully clears before layer-3 midpoint
    layer-1 (z:4)  current image  ← top, wipes first
  All timing and color values live in the WIPE config object — edit there to tweak.
  .is-transitioning wipes layers z:4→z:2 right-to-left via clip-path inset with staggered delays.
  .is-transitioning-prev mirrors the wipe left-to-right for previous navigation.
  After WIPE_TOTAL ms: content is swapped and clip-paths are reset without animation.

  Footer row: [prev]  [ACCESS]  [next] — prev/next at left/right edges.
-->
<script lang="ts">
	import { tick } from 'svelte'
	import { worksItems, assetManifest } from '$lib/data/content'
	import HoverButton from '$lib/components/ui/HoverButton.svelte'
	import ManagedImage from '$lib/components/ui/ManagedImage.svelte'
	import FlickerHeading from '$lib/components/ui/FlickerHeading.svelte'
	import TypewriterLines from '$lib/components/ui/TypewriterLines.svelte'
	import { scrollState } from '$lib/stores/scrollStateStore.svelte'
	import { tween } from '$lib/utils/scroll'

	// ── Wipe animation config — edit here to tweak the transition ──────────────
	//
	// Cascade rule: each layer should start AFTER the previous one finishes.
	// With easeOutQuart the motion is ~85% done at 40% of the duration, so
	// layers that overlap in time will appear to arrive at the left edge together.
	// Keep delay3 ≥ delay2 + duration2 to guarantee a clean three-step sequence:
	//   layer-1 wipes  →  layer-2 flashes  →  layer-3 wipes  →  next image
	//
	const WIPE = {
		duration: 700, // ms — base clip-path transition (layer-1 and layer-3)
		duration2: 450, // ms — layer-2: fast flash bar (finishes at delay2 + duration2)
		ease: 'cubic-bezier(0.25, 1, 0.5, 1)',
		color2: 'rgb(20, 160, 90)', // green
		color3: 'rgb(40, 100, 220)', // blue
		delay1: 0, // ms — layer-1 starts immediately
		delay2: 100, // ms — layer-2 starts just after layer-1  → finishes at 100+450 = 550ms
		delay3: 650 // ms — layer-3 starts after layer-2 is done (≥ 550ms, 100ms buffer)
	} as const

	// Total ms before swapping state = latest layer's finish time
	const WIPE_TOTAL = Math.max(
		WIPE.delay1 + WIPE.duration,
		WIPE.delay2 + WIPE.duration2,
		WIPE.delay3 + WIPE.duration
	)
	// ─────────────────────────────────────────────────────────────────────────────

	const itemCount = worksItems.length

	let currentIndex = $state(0)
	// stageNextIndex: the item staged in layer-4 during a wipe transition
	let stageNextIndex = $state(itemCount > 1 ? 1 : 0)

	let galleryEl: HTMLElement

	let currentItem = $derived(worksItems[currentIndex])
	let stageNextItem = $derived(worksItems[stageNextIndex])

	// Strip preview: neighbors of the current carousel item
	let prevPreviewItem = $derived(worksItems[(currentIndex - 1 + itemCount) % itemCount])
	let nextPreviewItem = $derived(worksItems[(currentIndex + 1) % itemCount])

	function hasImage(key: string): boolean {
		return !!assetManifest[key]?.src
	}

	// Plain variable — not reactive state; only indices need reactivity
	let transitioning = false

	async function navigate(dir: 'next' | 'prev', target?: number) {
		if (transitioning || itemCount < 2) return
		transitioning = true

		const ni =
			target !== undefined
				? target
				: dir === 'next'
					? (currentIndex + 1) % itemCount
					: (currentIndex - 1 + itemCount) % itemCount

		if (ni === currentIndex) {
			transitioning = false
			return
		}

		// Stage the incoming image in layer-4 before the wipe starts
		stageNextIndex = ni
		await tick()

		// Trigger CSS wipe
		if (dir === 'prev') galleryEl.classList.add('is-transitioning-prev')
		galleryEl.classList.add('is-transitioning')

		await new Promise<void>(r => setTimeout(r, WIPE_TOTAL))

		// 1. Suppress transitions so the clip-path reset is instant
		galleryEl.classList.add('no-transition')

		// 2. Swap reactive state — layer-1 now renders the new current; layer-4 preloads next
		currentIndex = ni
		stageNextIndex = (ni + 1) % itemCount

		// 3. Flush Svelte DOM updates before resetting clip-paths
		await tick()

		// 4. Reset clip-paths (instant, no-transition active)
		galleryEl.classList.remove('is-transitioning', 'is-transitioning-prev')

		// 5. Two rAFs: first flushes the clip-path reset paint, second re-enables transitions
		await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))

		galleryEl.classList.remove('no-transition')
		transitioning = false
	}

	// ── Scroll-Linked Strip config — edit here to tweak ─────────────────────────
	const SCROLL = {
		// Progress thresholds: side panels visible outside [centerMin, centerMax]
		centerMin: 0.35,
		centerMax: 0.55,
		// Max horizontal shift of the strip as % of stage width (positive = right)
		shiftPct: 60
	} as const
	// ─────────────────────────────────────────────────────────────────────────────

	const p = $derived(scrollState.of('works'))

	// Side panel opacities: prev fades in entering zone, next in exiting zone
	let prevPanelOpacity = $derived(tween(p, { from: 1, to: 0, at: [0, SCROLL.centerMin] }))
	let nextPanelOpacity = $derived(tween(p, { from: 0, to: 1, at: [SCROLL.centerMax, 1] }))

	// Horizontal strip shift (% of stage width); strip is 3× stage so divide by 3 for strip %
	let enterShift = $derived(tween(p, { from: SCROLL.shiftPct, to: 0, at: [0, SCROLL.centerMin] }))
	let exitShift = $derived(tween(p, { from: 0, to: -SCROLL.shiftPct, at: [SCROLL.centerMax, 1] }))
	let stripTransform = $derived(
		`translateX(calc(-33.3333% + ${((enterShift + exitShift) / 3).toFixed(4)}%))`
	)
</script>

<section class="works">
	<!-- Header -->
	<div class="works__header">
		<FlickerHeading heading="WORKS" />
	</div>

	<!-- Current work detail — replays typewriter on every slide change -->
	{#key currentIndex}
		<TypewriterLines lines={[currentItem.title, currentItem.description]} />
	{/key}

	<!-- 16:9 Stage — scroll-linked horizontal strip -->
	<div class="stage-wrap">
		<!-- 300%-wide strip: [prev | current | next]; translateX driven by scroll -->
		<div class="strip" style:transform={stripTransform}>
			<!-- Prev panel: fades in when section is entering viewport -->
			<div class="panel" style:opacity={prevPanelOpacity}>
				{#if hasImage(prevPreviewItem.imageAsset)}
					<ManagedImage
						asset={prevPreviewItem.imageAsset}
						alt={prevPreviewItem.title}
						class="panel__img"
					/>
				{:else}
					<div class="panel__empty"><span>EMPTY</span></div>
				{/if}
			</div>

			<!-- Current panel: contains the wipe-transition gallery -->
			<div class="panel">
				<div
					class="gallery"
					bind:this={galleryEl}
					style:--wipe-dur="{WIPE.duration}ms"
					style:--wipe-dur2="{WIPE.duration2}ms"
					style:--wipe-ease={WIPE.ease}
					style:--wipe-color2={WIPE.color2}
					style:--wipe-color3={WIPE.color3}
					style:--delay-1="{WIPE.delay1}ms"
					style:--delay-2="{WIPE.delay2}ms"
					style:--delay-3="{WIPE.delay3}ms"
				>
					<!-- Layer 4 — incoming image (staged before wipe starts) -->
					<div class="layer layer-4">
						{#if hasImage(stageNextItem.imageAsset)}
							<ManagedImage
								asset={stageNextItem.imageAsset}
								alt={stageNextItem.title}
								class="layer__img"
							/>
						{:else}
							<div class="layer__empty"><span>EMPTY</span></div>
						{/if}
					</div>

					<!-- Layer 3 — blue accent bar -->
					<div class="layer layer-3"></div>

					<!-- Layer 2 — green accent bar -->
					<div class="layer layer-2"></div>

					<!-- Layer 1 — current image (top, wipes away first) -->
					<div class="layer layer-1">
						{#if hasImage(currentItem.imageAsset)}
							<ManagedImage
								asset={currentItem.imageAsset}
								alt={currentItem.title}
								class="layer__img"
							/>
						{:else}
							<div class="layer__empty"><span>EMPTY</span></div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Next panel: fades in when section is exiting viewport -->
			<div class="panel" style:opacity={nextPanelOpacity}>
				{#if hasImage(nextPreviewItem.imageAsset)}
					<ManagedImage
						asset={nextPreviewItem.imageAsset}
						alt={nextPreviewItem.title}
						class="panel__img"
					/>
				{:else}
					<div class="panel__empty"><span>EMPTY</span></div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Footer: prev / ACCESS / next -->
	<div class="works__footer">
		<button
			type="button"
			class="works__nav"
			onclick={() => navigate('prev')}
			aria-label="前へ"
			disabled={itemCount < 2}
		>
			<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		<HoverButton label="ACCESS" href="/works" disabled />

		<button
			type="button"
			class="works__nav"
			onclick={() => navigate('next')}
			aria-label="次へ"
			disabled={itemCount < 2}
		>
			<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>
	</div>

	<!-- Dots indicator -->
	<div class="works__dots" role="tablist" aria-label="作品ページ">
		{#each worksItems as _, i (i)}
			<button
				type="button"
				role="tab"
				class="works__dot"
				class:works__dot--active={i === currentIndex}
				onclick={() => navigate(i > currentIndex ? 'next' : 'prev', i)}
				aria-label="スライド {i + 1}"
				aria-selected={i === currentIndex}
			></button>
		{/each}
	</div>
</section>

<style>
	/* ── Section shell ─────────────────────────────── */
	.works {
		display: flex;
		flex-direction: column;
		padding: 3rem 1.5rem;
	}

	@media (min-width: 768px) {
		.works {
			padding: 3rem 4rem;
		}
	}

	.works__header {
		flex-shrink: 0;
	}

	/* ── Stage wrapper ─────────────────────────────── */
	.stage-wrap {
		position: relative;
		width: 100%;
		overflow: hidden;
		aspect-ratio: 16 / 9;
		margin-top: 2rem;
	}

	/* Desktop: cinematic 21:9 */
	@media (min-width: 768px) {
		.stage-wrap {
			aspect-ratio: 21 / 9;
			height: unset;
		}
	}

	/* ── Strip: 300%-wide flex row of [prev | current | next] ── */
	.strip {
		display: flex;
		width: 300%;
		height: 100%;
		/* JS applies translateX(calc(-33.3333% + scrollShift)) */
	}

	/* ── Panel: each is 1/3 of strip = 100% of stage ────────── */
	.panel {
		position: relative;
		flex: 0 0 33.3333%;
		height: 100%;
		overflow: hidden;
	}

	/* ── Gallery: fills the current panel ───────────────────── */
	.gallery {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	/* ── Layers ──────────────────────────────────────── */
	.layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		clip-path: inset(0 0 0 0);
		transition: clip-path var(--wipe-dur) var(--wipe-ease);
	}

	/* Stacking context */
	.layer-4 {
		z-index: 1;
	}
	.layer-3 {
		z-index: 2;
		background-color: var(--wipe-color3);
	}
	.layer-2 {
		z-index: 3;
		background-color: var(--wipe-color2);
	}
	.layer-1 {
		z-index: 4;
	}

	/* ── Transition: Right-to-Left wipe (next) ───────── */
	/* Classes added imperatively via classList — :global() bypasses Svelte's scope check */
	:global(.gallery.is-transitioning) .layer-1 {
		clip-path: inset(0 100% 0 0);
		transition-delay: var(--delay-1);
	}
	:global(.gallery.is-transitioning) .layer-2 {
		clip-path: inset(0 100% 0 0);
		transition-delay: var(--delay-2);
		transition-duration: var(--wipe-dur2); /* shorter: hides layer-1 before layer-3 midpoint */
	}
	:global(.gallery.is-transitioning) .layer-3 {
		clip-path: inset(0 100% 0 0);
		transition-delay: var(--delay-3);
	}

	/* ── Transition: Left-to-Right wipe (prev) ───────── */
	:global(.gallery.is-transitioning.is-transitioning-prev) .layer-1 {
		clip-path: inset(0 0 0 100%);
	}
	:global(.gallery.is-transitioning.is-transitioning-prev) .layer-2 {
		clip-path: inset(0 0 0 100%);
	}
	:global(.gallery.is-transitioning.is-transitioning-prev) .layer-3 {
		clip-path: inset(0 0 0 100%);
	}

	/* ── Suppress transitions during state reset ──────── */
	:global(.gallery.no-transition) .layer {
		transition: none !important;
	}

	/* ── Images (gallery layers and side panels) ─────── */
	:global(.layer__img),
	:global(.panel__img) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* ── Empty placeholder ───────────────────────────── */
	.layer__empty,
	.panel__empty {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.layer__empty span,
	.panel__empty span {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		opacity: 0.2;
	}

	/* ── Footer ──────────────────────────────────────── */
	.works__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 2rem;
	}
	@media (max-width: 100px) {
		.works__footer {
			flex-direction: column;
			justify-content: center;
			gap: 0.75rem;
		}
	}
	.works__nav {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		flex-shrink: 0;
		border-radius: 9999px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: transparent;
		color: white;
		cursor: pointer;
		transition:
			border-color 0.2s,
			background 0.2s;
	}

	.works__nav:hover:not(:disabled) {
		border-color: rgba(255, 255, 255, 0.6);
		background: rgba(255, 255, 255, 0.08);
	}

	.works__nav:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.works__nav svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* ── Dots ────────────────────────────────────────── */
	.works__dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.works__dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		border: none;
		padding: 0;
		cursor: pointer;
		background: rgba(255, 255, 255, 0.3);
		transition: background 0.3s;
	}

	.works__dot--active {
		background: white;
	}
</style>
