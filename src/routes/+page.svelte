<script lang="ts">
	import SecureImg from '$lib/components/SecureImg.svelte'
	import { src } from '$lib/utils/deseal'

	let canvas: HTMLCanvasElement
	let ctx: CanvasRenderingContext2D | null
	let bitmap: HTMLImageElement | null = null

	const draw = () => {
		if (!ctx || !canvas || !bitmap) return

		const dpr = window.devicePixelRatio || 1
		const rect = canvas.getBoundingClientRect()

		canvas.width = rect.width * dpr
		canvas.height = rect.height * dpr

		ctx.scale(dpr, dpr)
		ctx.clearRect(0, 0, rect.width, rect.height)

		const scale = Math.min(rect.width / bitmap.width, rect.height / bitmap.height)
		const w = bitmap.width * scale
		const h = bitmap.height * scale
		const x = (rect.width - w) / 2
		const y = (rect.height - h) / 2

		ctx.drawImage(bitmap, x, y, w, h)
	}

	$effect(() => {
		ctx = canvas.getContext('2d')

		src('stellardragoon-logo-banner-lightanddarkmode.svg')
			.then(url => {
				return new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image()
					img.onload = () => resolve(img)
					img.onerror = reject
					img.src = url
				})
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
