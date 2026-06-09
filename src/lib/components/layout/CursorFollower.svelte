<!--
	CursorFollower.svelte
	Diamond-shaped glowing cursor follower with spring-chase behaviour.
	Follows mouse on desktop and the primary touch point on mobile.

	Animation strategy:
	- RAF only runs while the element is in motion; it idles when settled.
	- `rotate` is set once at mount; only `translate` is written per frame.
	- Visibility is toggled via direct classList manipulation — no Svelte reactivity in the hot path.
	- On first activation the position is teleported to the pointer to avoid a visible fly-in.
-->
<script lang="ts">
	import { onMount } from 'svelte'

	// Chase factor per frame (0 < n < 1) — lower = more lag
	const FACTOR = 0.08
	// Squared-distance threshold below which the RAF loop stops
	const IDLE_SQ = 0.0025 // ≈ 0.05 px per axis

	let el: HTMLDivElement
	let rafId = 0
	let initialized = false

	let tx = 0,
		ty = 0 // target (pointer)
	let cx = 0,
		cy = 0 // current (animated)

	// Core animation step — self-schedules until settled, then idles.
	function step() {
		rafId = 0
		const dx = tx - cx
		const dy = ty - cy
		cx += dx * FACTOR
		cy += dy * FACTOR
		el.style.translate = cx + 'px ' + cy + 'px'
		if (dx * dx + dy * dy > IDLE_SQ) rafId = requestAnimationFrame(step)
	}

	function wake() {
		if (!rafId) rafId = requestAnimationFrame(step)
	}

	function moveTo(x: number, y: number) {
		if (!initialized) {
			// Teleport on first activation so the element doesn't fly in from off-screen.
			cx = x
			cy = y
			el.style.translate = cx + 'px ' + cy + 'px'
			initialized = true
		}
		tx = x
		ty = y
		el.classList.remove('is-hidden')
		wake()
	}

	const onMouseMove = (e: MouseEvent) => moveTo(e.clientX, e.clientY)
	const onTouchMove = (e: TouchEvent) => {
		const t = e.touches[0]
		if (t) moveTo(t.clientX, t.clientY)
	}
	const hide = () => el.classList.add('is-hidden')
	const show = () => el.classList.remove('is-hidden')

	onMount(() => {
		window.addEventListener('mousemove', onMouseMove)
		document.documentElement.addEventListener('mouseleave', hide)
		document.documentElement.addEventListener('mouseenter', show)
		window.addEventListener('touchmove', onTouchMove, { passive: true })
		window.addEventListener('touchend', hide)
		window.addEventListener('touchcancel', hide)

		return () => {
			cancelAnimationFrame(rafId)
			window.removeEventListener('mousemove', onMouseMove)
			document.documentElement.removeEventListener('mouseleave', hide)
			document.documentElement.removeEventListener('mouseenter', show)
			window.removeEventListener('touchmove', onTouchMove)
			window.removeEventListener('touchend', hide)
			window.removeEventListener('touchcancel', hide)
		}
	})
</script>

<div class="cursor-follower is-hidden" bind:this={el} aria-hidden="true"></div>

<style>
	.cursor-follower {
		position: fixed;
		top: 0;
		left: 0;
		width: 18px;
		height: 18px;
		/* Centre the element on the pointer point */
		margin-left: -9px;
		margin-top: -9px;
		/* Fixed 45° rotation makes it a diamond — only translate changes at runtime */
		rotate: 45deg;
		border: 1.5px solid var(--color-cyan, #00e5ff);
		background: transparent;
		box-shadow:
			0 0 6px 1px color-mix(in srgb, var(--color-cyan, #00e5ff) 80%, transparent),
			0 0 18px 3px color-mix(in srgb, var(--color-cyan, #00e5ff) 35%, transparent),
			0 0 40px 6px color-mix(in srgb, var(--color-cyan, #00e5ff) 15%, transparent);
		pointer-events: none;
		z-index: 9999;
		will-change: translate;
		transition: opacity 0.3s ease;
	}

	.cursor-follower.is-hidden {
		opacity: 0;
	}
</style>
