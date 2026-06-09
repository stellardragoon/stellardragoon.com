<!--
  ManagedVideo.svelte
  Drop-in <video> replacement that hooks into the asset loading pipeline.

  Critical background videos are preloaded during boot (via AssetLoader).
  By the time this component mounts the browser cache should have the data,
  so the video starts almost immediately.
-->
<script lang="ts">
	import { assetManifest } from '$lib/data/content'
	import { assetLoader } from '$lib/states/assets.svelte'

	interface Props {
		/** Manifest key from `assetManifest` in content.ts. */
		asset: string
		class?: string
		style?: string
		autoplay?: boolean
		loop?: boolean
		muted?: boolean
		playsinline?: boolean
	}

	let {
		asset,
		class: className = '',
		style: styleStr = '',
		autoplay = false,
		loop = false,
		muted = false,
		playsinline = false
	}: Props = $props()

	let entry = $derived(assetManifest[asset])
	let isReady = $derived(
		assetLoader.getStatus(asset) === 'loaded' || assetLoader.getStatus(asset) === 'error'
	)

	function handleCanPlay() {
		assetLoader.markLoaded(asset)
	}

	function handleError() {
		assetLoader.markError(asset)
	}
</script>

{#if entry}
	{#if isReady}
		<video
			class={className}
			style={styleStr}
			src={entry.src}
			{autoplay}
			{loop}
			{muted}
			{playsinline}
			oncanplay={handleCanPlay}
			onerror={handleError}
			aria-hidden="true"
		>
			<track kind="captions" />
		</video>
	{:else}
		<!-- Placeholder while video loads -->
		<div class="{className} managed-shimmer" style={styleStr}></div>
	{/if}
{/if}
