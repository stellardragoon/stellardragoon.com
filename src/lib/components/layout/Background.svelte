<script lang="ts">
	import { onMount, tick } from 'svelte'
	import { page } from '$app/stores'
	import { gsap } from 'gsap'
	import { assetManifest } from '$lib/data/content'
	import { assetLoader } from '$lib/states/assets.svelte'
	import { transitionState } from '$lib/states/transition.svelte'

	interface Props {
		parallaxFactor?: number
		imageAsset?: string
	}

	let { parallaxFactor = 0.08, imageAsset }: Props = $props()
	let lockedWidth = $state(0)
	let lockedHeight = $state(0)
	let extraHeight = $state(0)
	let yTo: gsap.QuickToFunc | null = null
	let container: HTMLDivElement | null = null
	/** Separate element for blur so GSAP doesn't mix filter + transform on one node. */
	let blurEl = $state<HTMLDivElement | null>(null)

	let imageSrc = $derived(imageAsset ? assetManifest[imageAsset]?.src : undefined)
	let imageReady = $derived(imageAsset ? assetLoader.getStatus(imageAsset) === 'loaded' : false)

	// Hoisted so the $effect can reach them before onMount has completed.
	let calculateBleed: (() => void) | null = null
	let snapParallax: (() => void) | null = null

	// Re-run bleed calculation AND snap the background into place on every
	// route change. tick() ensures Svelte has flushed the new page's DOM
	// before we measure scrollHeight, eliminating the short→long race
	// condition and the long→short inertia-lag gap.
	$effect(() => {
		const _path = $page.url.pathname // reactive dependency

		// Guard: onMount has not run yet on the very first effect execution.
		// The initial position is handled inside onMount directly.
		if (!container || !snapParallax) return

		tick().then(() => {
			calculateBleed?.()
			snapParallax?.()
		})
	})

	// Blur/unblur in sync with the curtain phase.
	// blurEl ($state) is the outer fixed wrapper — separate from the parallax
	// container so GSAP never mixes filter and transform on the same element.
	// Because blurEl is $state, the effect re-runs when bind:this assigns it,
	// guaranteeing the boot blur is always applied.
	$effect(() => {
		if (!blurEl) return
		const phase = transitionState.phase
		const filterFrom = 'blur(4px) brightness(1.3) saturate(0.8)'
		const filterTo = 'blur(0px) brightness(1) saturate(1)'

		if (phase === 'boot') {
			// First load: instant filtered blur before anything is revealed.
			gsap.killTweensOf(blurEl, 'filter')
			gsap.set(blurEl, { filter: filterFrom })
		} else if (phase === 'closing') {
			// Curtain sliding shut: animate the filtered blur in to match panel close duration.
			gsap.killTweensOf(blurEl, 'filter')
			gsap.to(blurEl, {
				filter: filterFrom,
				duration: transitionState.duration / 1000,
				ease: 'power2.in'
			})
		} else if (phase === 'idle') {
			// Curtain is NOW fully open — restore blur/brightness/saturation back to normal.
			gsap.killTweensOf(blurEl, 'filter')
			gsap.fromTo(
				blurEl,
				{ filter: filterFrom },
				{ filter: filterTo, duration: 5, ease: 'power4.out' }
			)
		}
		// 'opening': no action — blur holds at 16px while curtain slides open.
	})

	onMount(() => {
		if (!container) return

		const isMobile = window.matchMedia('(pointer: coarse)').matches

		lockedWidth = window.innerWidth
		lockedHeight = isMobile ? window.screen.height : window.innerHeight

		yTo = gsap.quickTo(container, 'y', {
			duration: 1.2,
			ease: 'power2.out',
			force3D: true
		})

		calculateBleed = () => {
			const docHeight = document.documentElement.scrollHeight
			const maxScroll = Math.max(0, docHeight - lockedHeight)

			// +20 px safety buffer absorbs sub-pixel rounding errors and
			// browser-specific UI shifts at the extreme end of translation.
			extraHeight = maxScroll * parallaxFactor + 20
		}

		// Immediately stop any in-flight 1.2 s ease on the container and
		// teleport it to the correct position for the current scroll offset.
		// Called on navigation so a high-scroll position on the previous page
		// never drags the background too far up on the new (shorter) page.
		snapParallax = () => {
			if (!container) return
			const targetY = -(Math.max(0, window.scrollY) * parallaxFactor)
			gsap.killTweensOf(container)
			gsap.set(container, { y: targetY })
			// Re-point yTo to a fresh quickTo starting from the snapped value
			// so the next scroll event resumes the 1.2 s inertia cleanly.
			yTo = gsap.quickTo(container, 'y', {
				duration: 1.2,
				ease: 'power2.out',
				force3D: true
			})
		}

		// Debounced wrapper used by the MutationObserver.
		// DOM mutations can fire hundreds of times per navigation tick;
		// the 150 ms debounce collapses all of them into a single measurement.
		let debounceTimer: ReturnType<typeof setTimeout> | null = null
		const debouncedCalculateBleed = () => {
			if (debounceTimer !== null) clearTimeout(debounceTimer)
			debounceTimer = setTimeout(() => {
				calculateBleed?.()
				debounceTimer = null
			}, 150)
		}

		// Watch for structural DOM changes (new page content, lazy-loaded sections)
		// and recalculate bleed so the background always covers the full scroll range.
		const observer = new MutationObserver(debouncedCalculateBleed)
		observer.observe(document.body, { childList: true, subtree: true })

		const handleResize = () => {
			const newHeight = isMobile ? window.screen.height : window.innerHeight
			const widthChanged = window.innerWidth !== lockedWidth
			// On mobile the address bar fires resize events that only change innerHeight;
			// we intentionally ignore those to prevent the image-zoom thrash bug (see note 3).
			// On desktop, a genuine height change must also update lockedHeight so the
			// bg-wrapper and bg-container grow to cover the enlarged viewport.
			const heightChanged = !isMobile && newHeight !== lockedHeight
			if (widthChanged || heightChanged) {
				lockedWidth = window.innerWidth
				lockedHeight = newHeight

				// Defer bleed calculation by one rAF so the browser can finish
				// reflowing the page content (which grows taller at narrower widths)
				// before we read scrollHeight. Reading synchronously here gives the
				// old, pre-reflow scrollHeight and produces a stale extraHeight.
				requestAnimationFrame(() => {
					calculateBleed?.()
					const scrollY = Math.max(0, window.scrollY)
					if (yTo) yTo(-scrollY * parallaxFactor)
				})
			}
		}

		const updateParallax = () => {
			const scrollY = Math.max(0, window.scrollY)
			if (yTo) yTo(-scrollY * parallaxFactor)
		}

		let scrollRaf = 0
		const handleScroll = () => {
			if (scrollRaf) return
			scrollRaf = requestAnimationFrame(() => {
				scrollRaf = 0
				updateParallax()
			})
		}

		calculateBleed()
		updateParallax()

		window.addEventListener('resize', handleResize, { passive: true })
		window.addEventListener('scroll', handleScroll, { passive: true })

		return () => {
			window.removeEventListener('resize', handleResize)
			window.removeEventListener('scroll', handleScroll)
			if (scrollRaf) cancelAnimationFrame(scrollRaf)
			observer.disconnect()
			if (debounceTimer !== null) clearTimeout(debounceTimer)
			calculateBleed = null
			snapParallax = null
		}
	})
</script>

<div
	bind:this={blurEl}
	class="bg-wrapper"
	style:width={lockedWidth ? `${lockedWidth}px` : undefined}
	style:height={lockedHeight ? `${lockedHeight}px` : undefined}
	aria-hidden="true"
>
	<div
		bind:this={container}
		class="bg-container"
		style="height: {lockedHeight ? lockedHeight + extraHeight + 'px' : '100lvh'};"
	>
		{#if imageSrc && imageReady}
			<img src={imageSrc} alt="" decoding="async" class="bg-image" />
		{/if}
	</div>
</div>

<!-- 
1. Calculated Bleed
Instead of arbitrarily scaling the background to cover scroll gaps, we calculate the exact distance the image will travel: 
`maxScroll * parallaxFactor`. We add this exact `extraHeight` to the container. 
As the user scrolls to the bottom of the document, the GSAP upward translation consumes this extra height perfectly, 
ensuring the bottom of the image hits the bottom of the screen precisely at the footer.

2. Performance Optimizations
- Hardware Acceleration: Animating `y` with `force3D: true` and `will-change-transform` pushes the rendering entirely to the GPU's compositor thread.
- Memory Management: Using `gsap.quickTo()` instead of `gsap.to()` inside the scroll listener creates a pre-compiled setter. 
  This prevents instantiating and destroying hundreds of Tween objects per second, eliminating Garbage Collection stutters.
- Asset Loading: `decoding="async"` on the <img> tags prevents massive image payloads from blocking the main JavaScript thread during initial render.

3. The Mobile Layout Thrasher & Pixel Locking
- The Problem: Mobile browsers (Safari/Chrome) hide/show their address bars on scroll. 
  Using `100dvh` or `inset-0` (which relies on `bottom: 0`) ties the container to this dynamic UI. 
  As the UI shifts, the container stretches, causing `object-fit: cover` to constantly recalculate and "zoom" the image in and out. 
  It also fires continuous `resize` events.
- The Solution: We sever the container from the dynamic viewport. 
  We use `left-0 top-0` instead of `inset-0` and explicitly lock the container to 
  fixed physical pixels (`lockedWidth` and `lockedHeight` via `window.screen.height`). 
  We gate the `resize` listener to only recalculate the math if the physical width changes (device rotation). 
  The bounding box never changes size, completely neutralizing the zoom bug.

4. The Chrome Compromise
On Chrome for Android, hiding the address bar physically shifts the document up while 
simultaneously swallowing the `scroll` event before JavaScript can read it. 
Because our background is `fixed`, it momentarily freezes while the foreground text natively shifts. 
We consciously accept this layout disconnect. Attempting to fix it by moving the background to `absolute` creates 
violent GSAP "tearing" (the native browser pulls the element up instantly, but the 1.2s GSAP ease lags behind). 
We choose to preserve the grand, 1.2s floating inertia and simply let Chrome do its thing rather than 
fight the browser's native rendering engine and risk top-edge gaps.

5. Navigation Race Condition Fix & Inertia-Lag Snap
Because this component lives in the root layout and persists across SvelteKit client-side navigations,
we must both recalculate the bleed height AND kill any in-flight ease when the route changes.
Three mechanisms work together:

a) `$effect` on `$page.url.pathname` + `tick()`: The reactive effect fires whenever the route changes.
   We await `tick()` so Svelte has flushed the new page's DOM before measuring `scrollHeight`.
   After recalculating bleed, `snapParallax()` calls `gsap.killTweensOf(container)` to abort the
   1.2 s ease immediately, then `gsap.set(container, { y: targetY })` teleports the background to
   the correct offset for the new page's scroll position (always 0 after a navigation). A fresh
   `gsap.quickTo` is re-bound so the very next scroll event resumes smooth inertia from the new
   baseline without any discontinuity. `calculateBleed` and `snapParallax` are hoisted to component
   scope (null until `onMount`) so the effect can reach them via optional chaining on any navigation.

b) MutationObserver on `document.body`: Catches deferred layout expansion — lazy-loaded sections,
   images settling, GSAP-animated reveals that grow scroll height after the initial navigation snap.
   Mutations are collapsed via a 150 ms debounce so a burst of DOM changes produces exactly one
   `calculateBleed()` call, not hundreds. The observer is disconnected in `onMount` cleanup.

   Note: `handleResize` defers `calculateBleed` by one `requestAnimationFrame` so the browser
   has finished reflowing the (newly taller) page content before we read `scrollHeight`. Reading
   synchronously on the resize event returns the pre-reflow height, producing a stale `extraHeight`
   that is too small; the MutationObserver then overcorrects with an inflated mid-animation value,
   creating an oscillating drag on the background.

c) +20 px safety buffer in `calculateBleed`: Absorbs sub-pixel rounding errors and browser-specific
   UI shifts (e.g. mobile address bar) at the extreme end of the parallax translation, ensuring the
   bottom of the image never falls short of the bottom of the viewport by even one pixel.
-->

<style>
	.bg-wrapper {
		pointer-events: none;
		position: fixed;
		top: 0;
		left: 0;
		z-index: -10;
		height: 100dvh;
		width: 100%;
		overflow: hidden;
	}

	.bg-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		will-change: transform;
	}

	.bg-image {
		position: absolute;
		inset: 0;
		height: 100%;
		width: 100%;
		object-fit: cover;
	}
</style>
