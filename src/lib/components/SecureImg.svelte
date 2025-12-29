<script lang="ts">
	import { src as _src } from '$lib/utils/deseal'
	import { dev } from '$app/environment'

	let { src, alt = '', class: className = '' } = $props()
	let canvasRef: HTMLCanvasElement

	$effect(() => {
		if (!canvasRef) return

		_src(src).then(url => {
			const img = new Image()

			img.onload = () => {
				canvasRef.width = img.width
				canvasRef.height = img.height

				const ctx = canvasRef.getContext('2d')
				ctx?.drawImage(img, 0, 0)

				if (!dev) URL.revokeObjectURL(url) // prevent memory leaks
			}

			img.onerror = e => {
				console.error('Failed to render secure image', e)
				if (!dev) URL.revokeObjectURL(url) // prevent memory leaks
			}

			img.src = url
		})
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
