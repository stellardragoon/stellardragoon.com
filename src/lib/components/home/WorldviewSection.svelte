<script lang="ts">
	import { onMount } from 'svelte'
	import { observe } from '$lib/utils/intersect'
	import { worldviewConfig } from '$lib/data/content'
	import HoverButton from '$lib/components/ui/HoverButton.svelte'
	// import ManagedImage from '$lib/components/ui/ManagedImage.svelte'
	import FlickerHeading from '$lib/components/ui/FlickerHeading.svelte'

	let sectionEl: HTMLElement
	let isVisible = $state(false)

	onMount(() =>
		observe(sectionEl, entry => { isVisible = entry.isIntersecting }, { threshold: 0.1 })
	)
</script>

<section class="worldview" bind:this={sectionEl}>
	<div class="worldview__header">
		<FlickerHeading heading="世界観" />
	</div>

	<div class="stage-wrap">
		<!-- <ManagedImage
			asset={worldviewConfig.backgroundAsset}
			alt="世界観コンセプト"
			class="stage__img"
		/> -->
		<div class="stage__unavailable">
			<span
				class="stage__unavailable-text"
				class:is-animating={isVisible}
				data-text="UNDER PROGRAMMING..."
			>UNDER PROGRAMMING...</span>
		</div>
	</div>

	<div class="worldview__footer">
		<HoverButton label={worldviewConfig.buttonLabel} href={worldviewConfig.buttonHref} disabled />
	</div>
</section>

<style>
	/* ── Section shell ─────────────────────────────── */
	.worldview {
		display: flex;
		flex-direction: column;
		padding: 3rem 1.5rem;
	}

	@media (min-width: 768px) {
		.worldview {
			padding: 3rem 4rem;
		}
	}

	.worldview__header {
		flex-shrink: 0;
		margin-bottom: 2rem;
	}

	/* ── Stage wrapper ─────────────────────────────── */
	.stage-wrap {
		position: relative;
		width: 100%;
		overflow: hidden;
		aspect-ratio: 16 / 9;
		border: 1px solid rgba(255, 255, 255, 0.8);
	}

	@media (min-width: 768px) {
		.stage-wrap {
			aspect-ratio: 21 / 9;
			height: unset;
		}
	}

	/* ── Glitch overlay ──────────────────────────── */
	.stage__unavailable {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ── Glitch text ─────────────────────────────── */
	.stage__unavailable-text {
		position: relative;
		z-index: 1;
		font-family: 'Courier New', Courier, monospace;
		font-size: clamp(1rem, 4vw, 2.5rem);
		font-weight: 900;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.3);
		letter-spacing: 8px;
	}

	.stage__unavailable-text::before,
	.stage__unavailable-text::after {
		content: attr(data-text);
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		color: rgba(255, 255, 255, 0.7);
		opacity: 0;
		will-change: transform, clip-path;
	}

	.stage__unavailable-text.is-animating::before {
		opacity: 1;
		animation: glitch-slice-1 2s infinite step-end alternate-reverse;
	}

	.stage__unavailable-text.is-animating::after {
		opacity: 1;
		animation: glitch-slice-2 2.5s infinite step-end alternate-reverse;
	}

	@keyframes glitch-slice-1 {
		0%   { clip-path: inset(20% 0 80% 0); transform: translate3d(-5px,  2px, 0); }
		10%  { clip-path: inset(60% 0 10% 0); transform: translate3d( 4px, -2px, 0); }
		20%  { clip-path: inset(40% 0 50% 0); transform: translate3d(-4px,  3px, 0); }
		30%  { clip-path: inset(80% 0  5% 0); transform: translate3d( 5px, -4px, 0); }
		40%  { clip-path: inset(10% 0 70% 0); transform: translate3d(-3px,  1px, 0); }
		50%  { clip-path: inset(30% 0 50% 0); transform: translate3d( 3px, -2px, 0); }
		60%  { clip-path: inset(70% 0 20% 0); transform: translate3d(-5px,  2px, 0); }
		70%  { clip-path: inset(15% 0 65% 0); transform: translate3d( 4px, -1px, 0); }
		80%  { clip-path: inset(50% 0 30% 0); transform: translate3d(-4px,  3px, 0); }
		90%  { clip-path: inset( 5% 0 80% 0); transform: translate3d( 2px, -4px, 0); }
		100% { clip-path: inset(45% 0 45% 0); transform: translate3d(-3px,  2px, 0); }
	}

	@keyframes glitch-slice-2 {
		0%   { clip-path: inset(10% 0 60% 0); transform: translate3d( 4px, -2px, 0); }
		15%  { clip-path: inset(30% 0 20% 0); transform: translate3d(-5px,  3px, 0); }
		30%  { clip-path: inset(70% 0 10% 0); transform: translate3d( 3px, -4px, 0); }
		45%  { clip-path: inset(20% 0 50% 0); transform: translate3d(-4px,  1px, 0); }
		60%  { clip-path: inset(50% 0 30% 0); transform: translate3d( 5px, -3px, 0); }
		75%  { clip-path: inset( 5% 0 80% 0); transform: translate3d(-3px,  2px, 0); }
		90%  { clip-path: inset(80% 0  5% 0); transform: translate3d( 4px, -1px, 0); }
		100% { clip-path: inset(40% 0 40% 0); transform: translate3d(-5px,  3px, 0); }
	}

	/* ── Footer ────────────────────────────────────── */
	.worldview__footer {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}
</style>
