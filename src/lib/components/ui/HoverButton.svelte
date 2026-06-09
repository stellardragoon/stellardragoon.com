<script lang="ts">
	import { gsap } from 'gsap'
	import { fade } from 'svelte/transition'
	import { transitionState } from '$lib/states/transition.svelte'
	import { assetLoader } from '$lib/states/assets.svelte'
	import { goto } from '$app/navigation'

	// ── Props ──────────────────────────────────────────────────────────────────

	interface Props {
		label: string
		href?: string
		useTransition?: boolean
		variant?: 'primary' | 'secondary'
		disabled?: boolean
	}

	let { label, href = '#', useTransition = true, variant = 'primary', disabled = false }: Props = $props()

	// ── State ──────────────────────────────────────────────────────────────────

	let isHovered = $state(false)

	let orbitRect: SVGRectElement | null = null
	let cruiseTween: gsap.core.Tween | null = null
	let tsScaleTween: gsap.core.Tween | null = null

	const INNER_PERIMETER = 280
	const ORBIT_PERIOD = -50
	const ORBIT_CRUISE_DURATION = 2.5
	const ORBIT_BURST_SCALE = 16

	// ── Theme derivations ──────────────────────────────────────────────────────

	const rgb = '255,255,255'
	let borderColor = $derived(variant === 'primary' ? `rgba(${rgb},0.8)` : `rgba(${rgb},0.4)`)
	const textColorClass = 'text-white'

	function ensureCruiseTween() {
		if (cruiseTween || !orbitRect) return
		gsap.set(orbitRect, { strokeDashoffset: 0 })
		cruiseTween = gsap.to(orbitRect, {
			strokeDashoffset: ORBIT_PERIOD,
			duration: ORBIT_CRUISE_DURATION,
			ease: 'none',
			repeat: -1
		})
	}

	function startOrbit() {
		if (!orbitRect) return
		ensureCruiseTween()
		tsScaleTween?.kill()
		cruiseTween!.timeScale(ORBIT_BURST_SCALE)
		tsScaleTween = gsap.to(cruiseTween!, { timeScale: 1, duration: 1.4, ease: 'power4.out' })
	}

	function stopOrbit() {
		if (!cruiseTween) return
		tsScaleTween?.kill()
		tsScaleTween = gsap.to(cruiseTween!, {
			timeScale: 0,
			duration: 0.5,
			ease: 'power2.in',
			onComplete: () => {
				cruiseTween?.kill()
				cruiseTween = null
				tsScaleTween = null
			}
		})
	}

	// ── Interaction handlers ───────────────────────────────────────────────────

	function onEnter() {
		isHovered = true
		startOrbit()
	}

	function onLeave() {
		isHovered = false
		stopOrbit()
	}

	async function handleClick(e: MouseEvent) {
		e.preventDefault()
		if (href === '#') return
		if (useTransition) {
			await transitionState.close()
			await assetLoader.preloadCritical(href)
		}
		await goto(href)
	}
</script>

<button
	type="button"
	class="hover-btn"
	onmouseenter={onEnter}
	onmouseleave={onLeave}
	onclick={handleClick}
	{disabled}
>
	{#if isHovered}
		<div class="hover-btn__aurora" transition:fade={{ duration: 700 }} aria-hidden="true">
			<div
				class="aurora-blob blob-1"
				style:background="radial-gradient(circle, rgba({rgb}, 0.35) 0%, transparent 60%)"
			></div>
			<div
				class="aurora-blob blob-2"
				style:background="radial-gradient(circle, rgba({rgb}, 0.25) 0%, transparent 60%)"
			></div>
			<div
				class="aurora-blob blob-3"
				style:background="radial-gradient(circle, rgba({rgb}, 0.2) 0%, transparent 60%)"
			></div>
		</div>
	{/if}

	<svg
		class="hover-btn__orbit-svg"
		class:hover-btn__orbit-svg--visible={isHovered}
		aria-hidden="true"
	>
		<rect
			bind:this={orbitRect}
			width="100%"
			height="100%"
			rx="4"
			fill="none"
			stroke={borderColor}
			stroke-width="1.5"
			stroke-linecap="round"
			pathLength="100"
			stroke-dasharray="2 48"
		/>
	</svg>

	<svg
		class="hover-btn__border-svg"
		viewBox="0 0 100 40"
		preserveAspectRatio="none"
		fill="none"
		aria-hidden="true"
	>
		<rect
			x="1"
			y="1"
			width="98"
			height="38"
			stroke={borderColor}
			stroke-width="0.5"
			opacity="0.3"
			rx="2"
		/>
		<rect
			x="1"
			y="1"
			width="98"
			height="38"
			rx="2"
			stroke={borderColor}
			stroke-width="1"
			stroke-dasharray={INNER_PERIMETER}
			stroke-dashoffset={isHovered ? 0 : INNER_PERIMETER}
			style:transition="stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
		/>
	</svg>

	<div class="hover-btn__fill" style:opacity={isHovered ? 0.08 : 0}></div>

	<span class="hover-btn__label">
		{label}
		<svg
			class="hover-btn__arrow"
			class:hover-btn__arrow--shifted={isHovered}
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</span>
</button>

<style>
	.hover-btn {
		position: relative;
		display: inline-flex;
		max-width: 100%;
		cursor: pointer;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 2rem;
		font-family: var(--font-display);
		font-size: 0.875rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: white;
		background: none;
		border: none;
		transition: color 0.3s;
	}

	.hover-btn__aurora {
		pointer-events: none;
		position: absolute;
		inset: -2rem;
		z-index: 0;
	}

	.hover-btn__orbit-svg {
		pointer-events: none;
		position: absolute;
		inset: -0.375rem;
		height: calc(100% + 12px);
		width: calc(100% + 12px);
		opacity: 0;
		transition: opacity 0.5s;
	}

	.hover-btn__orbit-svg--visible {
		opacity: 1;
	}

	.hover-btn__border-svg {
		pointer-events: none;
		position: absolute;
		inset: 0;
		height: 100%;
		width: 100%;
	}

	.hover-btn__fill {
		position: absolute;
		inset: 0;
		border-radius: 2px;
		background: white;
		transition: opacity 0.3s;
	}

	.hover-btn__label {
		position: relative;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.hover-btn__arrow {
		width: 0.75rem;
		height: 0.75rem;
		transition: transform 0.3s;
	}

	.hover-btn__arrow--shifted {
		transform: translateX(0.25rem);
	}

	/* ── Extreme narrow: square icon-only button ──────────── */
	@media (max-width: 100px) {
		.hover-btn {
			padding: 0.6rem;
			width: 2.25rem;
			height: 2.25rem;
		}

		.hover-btn__label {
			display: none;
		}
	}

	/* ── Aurora blobs ─────────────────────────────────────
       Base size established by the wrapper's inset: -2rem. */
	.aurora-blob {
		position: absolute;
		inset: 0;
		filter: blur(24px);
		will-change: transform;
	}

	.blob-1 {
		animation: drift-1 2.5s infinite alternate ease-in-out;
	}
	.blob-2 {
		animation: drift-2 3.5s infinite alternate-reverse ease-in-out;
	}
	.blob-3 {
		animation: drift-3 4.5s infinite alternate ease-in-out;
	}

	@keyframes drift-1 {
		0% {
			transform: translate(-10%, -10%);
		}
		100% {
			transform: translate(10%, 10%);
		}
	}
	@keyframes drift-2 {
		0% {
			transform: translate(10%, -10%);
		}
		100% {
			transform: translate(-10%, 10%);
		}
	}
	@keyframes drift-3 {
		0% {
			transform: translate(0%, 15%);
		}
		100% {
			transform: translate(0%, -15%);
		}
	}
</style>
