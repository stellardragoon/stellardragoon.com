<script lang="ts">
	import { src } from '$lib/utils/deseal'

	let canvas: HTMLCanvasElement
	let ctx: CanvasRenderingContext2D | null
	let loadedImage: HTMLImageElement | null = null

	const draw = () => {
		if (!ctx || !canvas || !loadedImage) return

		const dpr = window.devicePixelRatio || 1
		const rect = canvas.getBoundingClientRect()

		canvas.width = rect.width * dpr
		canvas.height = rect.height * dpr

		ctx.scale(dpr, dpr)
		ctx.clearRect(0, 0, rect.width, rect.height)

		const scale = Math.min(
			rect.width / loadedImage.naturalWidth,
			rect.height / loadedImage.naturalHeight
		)
		const w = loadedImage.naturalWidth * scale
		const h = loadedImage.naturalHeight * scale
		const x = (rect.width - w) / 2
		const y = (rect.height - h) / 2

		ctx.drawImage(loadedImage, x, y, w, h)
	}

	$effect(() => {
		ctx = canvas.getContext('2d')

		const img = new Image()
		src('stellardragoon-logo-banner-lightanddarkmode.svg').then((url) => {
			img.src = url
			img.onload = () => {
				loadedImage = img
				draw()
			}
		})

		const handleResize = () => requestAnimationFrame(draw)
		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
		}
	})
</script>

<div class="h-full w-full bg-neutral-900">
	<canvas bind:this={canvas} class="fixed top-0 left-0 h-full w-full"></canvas>
</div>
