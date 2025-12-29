<script lang="ts">
	import SecureImg from '$lib/components/SecureImg.svelte'
	import { src } from '$lib/utils/deseal'

	let canvas: HTMLCanvasElement
	let ctx: CanvasRenderingContext2D | null
	let bitmap: CanvasImageSource | null = null

	const draw = () => {
		if (!ctx || !canvas || !bitmap) return

		const dpr = window.devicePixelRatio || 1
		const rect = canvas.getBoundingClientRect()

		canvas.width = rect.width * dpr
		canvas.height = rect.height * dpr

		ctx.scale(dpr, dpr)
		ctx.clearRect(0, 0, rect.width, rect.height)

		// CanvasImageSource has width/height but TS might complain if it's not specific.
		// ImageBitmap has width/height. HTMLImageElement has width/height.
		// SVGImageElement has width/height.
		// VideoFrame has codedWidth/codedHeight.
		// Let's cast to any or check type if needed, but for now let's assume it has width/height.
		// Actually CanvasImageSource doesn't guarantee width/height properties on the interface itself in all cases (like VideoFrame uses codedWidth).
		// But here we expect ImageBitmap or HTMLImageElement.
		const width = 'width' in bitmap ? (bitmap.width as number) : 0
		const height = 'height' in bitmap ? (bitmap.height as number) : 0

		const scale = Math.min(rect.width / width, rect.height / height)
		const w = width * scale
		const h = height * scale
		const x = (rect.width - w) / 2
		const y = (rect.height - h) / 2

		ctx.drawImage(bitmap, x, y, w, h)
	}

	$effect(() => {
		ctx = canvas.getContext('2d')

		// Use PNG to avoid network tab leakage (SVG requires blob: URL which leaks)
		src('stellardragoon-logo-banner-lightanddarkmode.png')
			.then(async data => {
				if (data instanceof ImageBitmap) return data
				throw new Error('Expected ImageBitmap for PNG')
			})
			.then(img => {
				bitmap = img
				draw()
			})
			.catch(err => {
				console.error('Failed to load secure image', err)
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
