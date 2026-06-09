<script lang="ts">
	import { gsap } from 'gsap'
	import { heroConfig } from '$lib/data/content'
	import ManagedImage from '$lib/components/ui/ManagedImage.svelte'
	import { scrollState } from '$lib/stores/scrollStateStore.svelte'
	import { transitionState } from '$lib/states/transition.svelte'
	import { tween } from '$lib/utils/scroll'

	const logoAsset = heroConfig.logoAsset

	// ── Scroll-linked animation values ──
	const p = $derived(scrollState.of('hero'))

	let logoOpacity = $derived(tween(p, { from: 1, to: 0, at: [0.5, 0.9] }))
	let hintOpacity = $derived(tween(p, { from: 1, to: 0, at: [0.05, 0.25] }))

	let logoElement: HTMLDivElement

	// Helper to generate a random keyframe object for GSAP
	function generateRandomFlicker(numFlickers = 6) {
		// Ensure it always starts and ends fully visible
		const keyframes: Record<string, { opacity: number }> = {
			'0%': { opacity: 1 },
			'100%': { opacity: 1 }
		}

		for (let i = 0; i < numFlickers; i++) {
			// Pick a random starting percentage between 5% and 85%
			const p = Math.floor(Math.random() * 80) + 5

			// Create a fast dip to 0 opacity and back
			keyframes[`${p}%`] = { opacity: 1 }
			keyframes[`${p + 1}%`] = { opacity: 0.28 }
			keyframes[`${p + 3}%`] = { opacity: 1 }
		}

		return keyframes
	}

	// Trigger the opening animation
	$effect(() => {
		if (transitionState.phase === 'opening' && logoElement) {
			gsap.killTweensOf(logoElement)

			const tl = gsap.timeline()

			// 1. Smooth slide
			tl.fromTo(logoElement, { x: -256 }, { x: 0, duration: 4, ease: 'power4.out' }, 0)

			// 2. Random Flicker
			tl.to(
				logoElement,
				{
					keyframes: generateRandomFlicker(9),
					duration: 2,
					ease: 'none'
				},
				0
			)
		}
	})
</script>

<div class="hero">
	<div class="hero__content" style:opacity={logoOpacity}>
		<div class="logo-inner" bind:this={logoElement}>
			<ManagedImage asset={logoAsset} alt={heroConfig.altText} class="hero__logo" />
		</div>
	</div>

	<div class="hero__scroll-hint" style:opacity={hintOpacity}>
		<svg
			class="hero__scroll-icon"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			viewBox="0 0 24 24"
		>
			<path d="M19 14l-7 7m0 0l-7-7" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</div>
</div>

<style>
	.hero {
		display: flex;
		height: 100%;
		width: 100%;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.hero__content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.logo-inner {
		position: relative;
		will-change: transform, opacity;
	}

	/* Applied to the <img> rendered by ManagedImage */
	:global(.hero__logo) {
		height: auto;
		width: min(56rem, 90cqw);
		object-fit: contain;
	}

	@media (min-width: 768px) {
		:global(.hero__logo) {
			width: min(72rem, 90cqw);
		}
	}

	.hero__scroll-hint {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		animation: scroll-bounce 1s infinite;
	}

	.hero__scroll-icon {
		display: block;
		width: 1.5rem;
		height: 1.5rem;
		color: white;
		opacity: 0.4;
	}

	@keyframes scroll-bounce {
		0%,
		100% {
			transform: translateX(-50%) translateY(-25%);
			animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
		}
		50% {
			transform: translateX(-50%) translateY(0);
			animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
		}
	}
</style>
