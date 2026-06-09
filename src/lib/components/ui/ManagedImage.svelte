<!--
  ManagedImage.svelte
  Drop-in <img> replacement that hooks into the asset loading pipeline.

  Critical assets: rendered immediately (already preloaded by boot).
  Lazy assets: shimmer placeholder until IntersectionObserver fires,
  then load and swap in. Registers with AssetLoader so the floating
  LoadingIndicator can track in-flight lazy assets.
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { assetManifest } from '$lib/data/content'
	import { assetLoader } from '$lib/states/assets.svelte'
	import { observe } from '$lib/utils/intersect'

	/** 1×1 transparent GIF — shown while lazy assets haven't loaded yet. */
	const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

	interface Props {
		/** Manifest key from `assetManifest` in content.ts. */
		asset: string
		alt?: string
		class?: string
		style?: string
	}

	let { asset, alt = '', class: className = '', style: styleStr = '' }: Props = $props()

	let entry = $derived(assetManifest[asset])
	let el: HTMLImageElement
	let forceLoad = $state(false)
	let shouldLoad = $derived(forceLoad || entry?.priority === 'critical')
	let isLoaded = $derived(assetLoader.getStatus(asset) === 'loaded')
	let isError = $derived(assetLoader.getStatus(asset) === 'error')

	onMount(() => {
		// Critical assets are already preloaded — just render
		if (!entry || entry.priority === 'critical') return

		return observe(
			el,
			e => {
				if (e.isIntersecting) {
					forceLoad = true
					assetLoader.requestLoad(asset)
				}
			},
			{ rootMargin: '300px' }
		)
	})

	function handleLoad() {
		assetLoader.markLoaded(asset)
	}

	function handleError() {
		assetLoader.markError(asset)
	}
</script>

<img
	bind:this={el}
	src={shouldLoad && entry ? entry.src : PIXEL}
	{alt}
	class="{className}{!isLoaded && !isError ? ' managed-shimmer' : ''}"
	style={styleStr}
	onload={handleLoad}
	onerror={shouldLoad ? handleError : undefined}
/>
