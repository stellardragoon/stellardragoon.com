<script lang="ts">
	import { renderToCanvas } from '$lib/utils/deseal'

	let { src, alt = '', class: className = '' } = $props()
	let canvasRef: HTMLCanvasElement

	$effect(() => {
		if (!canvasRef || !src) return
		renderToCanvas(canvasRef, src)
	})
</script>

<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
<canvas bind:this={canvasRef} class={className} role="img" aria-label={alt}></canvas>

<style>
	canvas {
		display: block;
		max-width: 100%;
		height: auto;
	}
</style>
