<script lang="ts">
	import './layout.css'
	import favicon from '$lib/assets/favicon.svg'
	import Background from '$lib/components/layout/Background.svelte'
	import StarsOverlay from '$lib/components/layout/StarsOverlay.svelte'
	import Navigation from '$lib/components/layout/Navigation.svelte'
	import CurtainTransition from '$lib/components/layout/CurtainTransition.svelte'
	import BootScreen from '$lib/components/layout/BootScreen.svelte'
	import LoadingIndicator from '$lib/components/layout/LoadingIndicator.svelte'
	import CursorFollower from '$lib/components/layout/CursorFollower.svelte'
	import { transitionState } from '$lib/states/transition.svelte'
	import { assetLoader } from '$lib/states/assets.svelte'
	import { afterNavigate } from '$app/navigation'
	import { onMount, onDestroy } from 'svelte'
	import { initSmoothScroll, type SmoothScrollHandle } from '$lib/utils/smoothScroll'

	let { children } = $props()

	let smoothScroll: SmoothScrollHandle | undefined

	// ── Boot sequence ────────────────────────────────────────
	// On first load: preload critical assets for the current route,
	// then open the curtain. The BootScreen overlays the closed curtain
	// and shows the OS-boot text animation during this time.
	onMount(async () => {
		smoothScroll = initSmoothScroll()

		const route = window.location.pathname
		await assetLoader.preloadCritical(route)
		if (assetLoader.criticalErrors.length === 0) {
			// All clear — brief pause so user can see "BOOT COMPLETE", then reveal
			await new Promise(r => setTimeout(r, 400))
			transitionState.open()
		}
		// If there are errors, BootScreen shows a warning + confirmation button
		// that calls transitionState.open() when the user acknowledges.
	})

	onDestroy(() => smoothScroll?.destroy())

	// ── Route transition integration ─────────────────────────
	// afterNavigate: open the curtain once the new page is rendered.
	// The preloading happens BEFORE goto() in HoverButton / Navigation.
	afterNavigate(() => {
		// Reset momentum so in-flight scroll animation doesn't bleed into new page.
		smoothScroll?.reset()
		if (transitionState.phase === 'closed') {
			transitionState.open()
		}
	})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>ステラグーン | STELLAR DRAGOON</title>
</svelte:head>

<div class="app-shell">
	<CurtainTransition />
	<BootScreen />
	<LoadingIndicator />
	<Navigation />
	<Background imageAsset="bg-dark" />
	<StarsOverlay />
	<CursorFollower />
	{@render children()}
</div>

<style>
	.app-shell {
		position: relative;
		min-height: 100dvh;
	}
</style>
