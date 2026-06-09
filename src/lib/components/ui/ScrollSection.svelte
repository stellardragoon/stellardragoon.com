<!--
  ScrollSection.svelte — Lightweight section wrapper with scroll tracking.

  Props:
    id         — section identifier (nav highlighting, anchor links, scrollState key)
    height     — explicit CSS height (e.g. '150vh', '600px'). Omit for auto height.
    pinned     — GSAP ScrollTrigger pin. When true, `height` defaults to '100vh'.
    pinDistance — scroll distance for pinned sections (e.g. '300vh'). Default: '300vh'.

  Feeds normalised 0→1 progress into:
    1. Global `scrollState` — any component reads via `scrollState.of(id)`
    2. Svelte context — children can call `getScrollContext()` (optional)
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { gsap } from 'gsap'
	import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
	import { scrollState } from '$lib/stores/scrollStateStore.svelte'
	import { createScrollContext } from '$lib/utils/scrollContext.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		id: string
		/** Explicit CSS height. Omit for content-driven auto height. */
		height?: string
		/** Pin the section while scrubbing through its content. */
		pinned?: boolean
		/** Scroll distance while pinned. Default: '300vh'. */
		pinDistance?: string
		children: Snippet
	}

	let { id, height, pinned = false, pinDistance = '300vh', children }: Props = $props()

	const ctx = createScrollContext()
	let triggerEl: HTMLElement

	// Resolve final height: pinned sections need a viewport height for the pin to work.
	let resolvedHeight = $derived(height ?? (pinned ? '100vh' : undefined))

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger)

		const startValue = pinned ? 'top top' : 'top bottom'
		const endValue = pinned ? `+=${pinDistance}` : 'bottom top'

		const st = ScrollTrigger.create({
			trigger: triggerEl,
			start: startValue,
			end: endValue,
			pin: pinned,
			scrub: true,
			onUpdate: self => {
				ctx.progress = self.progress
				scrollState.update(id, self.progress)
			}
		})

		return () => st.kill()
	})
</script>

<section bind:this={triggerEl} {id} class="scroll-section" style:height={resolvedHeight}>
	<div class="scroll-section__inner">
		{@render children()}
	</div>
</section>

<style>
	.scroll-section {
		position: relative;
		width: 100%;
	}

	.scroll-section__inner {
		position: relative;
		height: 100%;
		width: 100%;
	}
</style>
