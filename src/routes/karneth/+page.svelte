<script lang="ts">
	import { karnethNav, kingdoms } from '$lib/data/content'
	import { transitionState } from '$lib/states/transition.svelte'
	import { assetLoader } from '$lib/states/assets.svelte'
	import { goto } from '$app/navigation'
	import HoverButton from '$lib/components/ui/HoverButton.svelte'
	import ManagedImage from '$lib/components/ui/ManagedImage.svelte'
	import Karneth from '$lib/components/karneth/Karneth.svelte'
	import { resolve } from '$app/paths'
	import CinematicBars from '$lib/components/home/CinematicBars.svelte'

	let activeTab = $state('Database')

	async function navigate(href: string) {
		await transitionState.close()
		await assetLoader.preloadCritical(href)
		// @ts-expect-error - href is a dynamic string, but resolve expects a strict route literal union
		await goto(resolve(href))
	}

	function intersect(node: HTMLElement) {
		const observer = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						node.classList.add('is-ignited')
					} else {
						node.classList.remove('is-ignited')
					}
				})
			},
			{ threshold: 0.35 }
		)

		observer.observe(node)
		return {
			destroy() {
				observer.disconnect()
			}
		}
	}
</script>

<CinematicBars barHeight="12vh" scrollRange="0px 400px" />
<Karneth />
<main class="karneth-forge-sequence page-wrapper">
	<header class="karneth-hero">
		<nav class="karneth-nav">
			{#each karnethNav as item (item.href)}
				<button
					type="button"
					class="karneth-nav__item"
					class:karneth-nav__item--active={activeTab === item.label}
					onclick={() => {
						activeTab = item.label
						if (item.href !== '/karneth') navigate(item.href)
					}}
				>
					{item.label}
					<span
						class="karneth-nav__underline"
						class:karneth-nav__underline--active={activeTab === item.label}
					></span>
				</button>
			{/each}
		</nav>

		<div class="karneth-header">
			<h1 class="karneth-header__title">カルネース</h1>
			<p class="karneth-header__subtitle">AETHERIC CELESTIAL REGISTER</p>
		</div>

		<div class="karneth-hero__scroll-hint">
			<span class="scroll-hint-text">✦ SCROLL TO MANIFEST SEALS ✦</span>
			<div class="scroll-hint-line"></div>
		</div>
	</header>

	<section class="kingdom-sequence">
		<div class="kingdom-sequence__track">
			<div class="kingdom-sequence__line"></div>

			{#each kingdoms as kingdom, i (kingdom.name)}
				<article class="kingdom-step" use:intersect>
					<div class="kingdom-step__layout" class:is-reversed={i % 2 !== 0}>
						<div class="kingdom-step__visual">
							<div class="emblem-forge-zone" style="--nebula-hue: {i * 45}deg">
								<div class="emblem-nebula"></div>

								<div class="rune-ring outer"></div>
								<div class="rune-ring inner"></div>
								<div class="rune-ring core"></div>

								<div class="ignition-flare"></div>

								<div class="orbiting-system">
									<div class="orb orb--1"></div>
									<div class="orb orb--2"></div>
									<div class="orb orb--3"></div>
									<div class="orb orb--4"></div>
								</div>

								<div class="emblem-container">
									<ManagedImage
										asset={kingdom.crestAsset}
										alt={kingdom.name}
										class="kingdom-step__crest-img"
									/>
									<div class="kingdom-step__crest-fallback">
										✦ {String(i + 1).padStart(2, '0')} ✦
									</div>
								</div>

								<div class="star-cluster">
									<span></span><span></span><span></span><span></span>
									<span></span><span></span><span></span><span></span>
								</div>
							</div>

							<div class="kingdom-step__index">
								SEAL NO. {String(i + 1).padStart(2, '0')}
							</div>
						</div>

						<div class="kingdom-step__content">
							<h2 class="kingdom-step__name">{kingdom.name}</h2>
							<h3 class="kingdom-step__sub">KINGDOM CLASSIFICATION</h3>

							<div class="scroll-divider"></div>

							<p class="kingdom-step__desc">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
								incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
								exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
								irure dolor in reprehenderit in voluptate.
							</p>

							<div class="kingdom-step__action">
								<HoverButton
									label="BREAK SEAL"
									href="/karneth/empires/{kingdom.name.toLowerCase()}"
								/>
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="karneth-outro">
		<div class="outro-sigil">✦</div>
		<h2 class="karneth-outro__title">ALL SYSTEMS SYNCHRONIZED</h2>
		<HoverButton label="RETURN TO MAIN ACCESS" href="/karneth/empires" />
	</section>
</main>

<style>
	/* ── Core Base Rules (Fully Transparent Elements) ── */
	.karneth-forge-sequence {
		position: relative;
		min-height: 100vh;
		color: white;
		overflow-x: hidden;
		background: transparent;
	}

	/* ── Top Hero Block ──────────────────────────── */
	.karneth-hero {
		position: relative;
		z-index: 10;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 6rem 1.5rem 2rem;
		background: transparent;
	}

	.karneth-nav {
		margin: 0 auto 4rem;
		display: flex;
		max-width: 64rem;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 2rem;
	}

	.karneth-nav__item {
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		color: white;
		font-family: var(--font-display), sans-serif;
		font-size: 0.875rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.4;
		transition:
			opacity 0.3s,
			text-shadow 0.3s;
	}

	.karneth-nav__item:hover,
	.karneth-nav__item--active {
		opacity: 1;
		text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
	}

	.karneth-nav__underline {
		display: block;
		margin-top: 0.25rem;
		height: 1px;
		width: 0;
		background: white;
		transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.karneth-nav__underline--active {
		width: 100%;
	}

	.karneth-header {
		margin: auto;
		text-align: center;
	}

	.karneth-header__title {
		margin: 0;
		font-family: var(--font-serif), serif;
		font-size: 3.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		background: linear-gradient(to bottom, #ffffff 50%, rgba(255, 255, 255, 0.6));
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.karneth-header__subtitle {
		margin: 1rem 0 0;
		font-family: var(--font-display), sans-serif;
		font-size: 0.875rem;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		opacity: 0.5;
	}

	.karneth-hero__scroll-hint {
		margin: auto auto 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		opacity: 0.5;
	}

	.scroll-hint-text {
		font-family: var(--font-display), sans-serif;
		font-size: 0.65rem;
		letter-spacing: 0.25em;
		color: #e2d2fe;
	}

	.scroll-hint-line {
		width: 1px;
		height: 40px;
		background: linear-gradient(to bottom, white, transparent);
	}

	/* ── Tracking Track Configuration ────────────── */
	.kingdom-sequence {
		position: relative;
		z-index: 10;
		padding: 0 1.5rem;
		background: transparent;
	}

	.kingdom-sequence__track {
		position: relative;
		max-width: 72rem;
		margin: 0 auto;
	}

	.kingdom-sequence__line {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 1px;
		background: linear-gradient(
			to bottom,
			transparent,
			rgba(255, 255, 255, 0.08) 5%,
			rgba(255, 255, 255, 0.08) 95%,
			transparent
		);
		transform: translateX(-50%);
		z-index: -1;
	}

	.kingdom-step {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 6rem 0;
	}

	.kingdom-step__layout {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4rem;
		width: 100%;
	}

	@media (min-width: 768px) {
		.kingdom-step__layout {
			flex-direction: row;
			justify-content: space-between;
			gap: 6rem;
		}
		.kingdom-step__layout.is-reversed {
			flex-direction: row-reverse;
		}
	}

	/* ── Constellation Forge Emblem Zone ─────────── */
	.kingdom-step__visual {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem;
	}

	.emblem-forge-zone {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18rem;
		height: 18rem;
	}

	/* Soft chromatic cloud aura */
	.emblem-nebula {
		position: absolute;
		width: 12rem;
		height: 12rem;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			cubic-bezier(0.16, 1, 0.3, 1),
			hsl(var(--nebula-hue), 75%, 50%, 0.18) 0%,
			transparent 70%
		);
		filter: blur(20px);
		opacity: 0;
		transition: opacity 1.5s ease-out;
		pointer-events: none;
		z-index: 5;
	}

	:global(.is-ignited) .emblem-nebula {
		opacity: 1;
	}

	.emblem-container {
		width: 65%;
		height: 65%;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 15;

		opacity: 0;
		filter: blur(25px) brightness(3) contrast(2);
		transform: scale(0.7) rotate(-10deg);
		transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	:global(.is-ignited) .emblem-container {
		opacity: 1;
		filter: blur(0px) brightness(1) contrast(1) drop-shadow(0 0 25px rgba(255, 255, 255, 0.35));
		transform: scale(1) rotate(0deg);
	}

	:global(.kingdom-step__crest-img) {
		height: 100%;
		width: 100%;
		object-fit: contain;
		transition: transform 0.5s ease;
	}

	.kingdom-step:hover :global(.kingdom-step__crest-img) {
		transform: scale(1.05);
	}

	.kingdom-step__crest-fallback {
		position: absolute;
		font-family: var(--font-mono), monospace;
		font-size: 1.5rem;
		opacity: 0.2;
		letter-spacing: 0.1em;
	}

	/* Concentric Magical Runic Array */
	.rune-ring {
		position: absolute;
		border-radius: 50%;
		border: 1px dashed transparent;
		z-index: 10;
		pointer-events: none;
		transform: scale(0.5) rotate(0deg);
		transition: all 1.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.rune-ring.outer {
		width: 100%;
		height: 100%;
		border-color: rgba(255, 255, 255, 0.12);
	}
	.rune-ring.inner {
		width: 84%;
		height: 84%;
		border-color: rgba(255, 255, 255, 0.06);
	}
	.rune-ring.core {
		width: 68%;
		height: 68%;
		border-color: rgba(255, 255, 255, 0.18);
		border-style: dotted;
	}

	:global(.is-ignited) .rune-ring.outer {
		transform: scale(1) rotate(45deg);
	}
	:global(.is-ignited) .rune-ring.inner {
		transform: scale(1) rotate(-60deg);
	}
	:global(.is-ignited) .rune-ring.core {
		transform: scale(1) rotate(90deg);
	}

	/* Ignition lens flare */
	.ignition-flare {
		position: absolute;
		width: 1px;
		height: 1px;
		background-color: #ffffff;
		border-radius: 50%;
		z-index: 12;
		opacity: 0;
		pointer-events: none;
	}

	:global(.is-ignited) .ignition-flare {
		animation: quickBurst 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes quickBurst {
		0% {
			opacity: 0;
			box-shadow: 0 0 0px 0px #ffffff;
		}
		20% {
			opacity: 1;
			box-shadow:
				0 0 30px 10px #ffffff,
				0 0 70px 30px rgba(255, 255, 255, 0.3);
		}
		100% {
			opacity: 0;
			box-shadow: 0 0 50px 0px transparent;
			transform: scale(1.5);
		}
	}

	/* ── preserve-3d Particle Orbit System ───────── */
	.orbiting-system {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 20; /* Sits in front and rolls deep behind visual components */
		perspective: 1000px;
		transform-style: preserve-3d;
		opacity: 0;
		transition: opacity 1s ease-in-out;
	}

	:global(.is-ignited) .orbiting-system {
		opacity: 1;
	}

	.orb {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: #ffffff;
		box-shadow:
			0 0 10px 2px rgba(255, 255, 255, 0.8),
			0 0 20px 4px hsl(var(--nebula-hue), 100%, 70%);
	}

	/* Skewing transformations on different coordinate poles to maximize random space paths */
	.orb--1 {
		animation: orbitX 5s linear infinite;
	}
	.orb--2 {
		animation: orbitY 7s linear infinite;
		animation-delay: -1s;
	}
	.orb--3 {
		animation: orbitZ 6s linear infinite;
		animation-delay: -3s;
	}
	.orb--4 {
		animation: orbitDiagonal 8s linear infinite;
		animation-delay: -1.5s;
	}

	@keyframes orbitX {
		0% {
			transform: translate(-50%, -50%) rotateX(70deg) rotateZ(0deg) translateX(110px) rotateZ(0deg);
		}
		100% {
			transform: translate(-50%, -50%) rotateX(70deg) rotateZ(360deg) translateX(110px)
				rotateZ(-360deg);
		}
	}
	@keyframes orbitY {
		0% {
			transform: translate(-50%, -50%) rotateY(65deg) rotateZ(0deg) translateY(95px) rotateZ(0deg);
		}
		100% {
			transform: translate(-50%, -50%) rotateY(65deg) rotateZ(360deg) translateY(95px)
				rotateZ(-360deg);
		}
	}
	@keyframes orbitZ {
		0% {
			transform: translate(-50%, -50%) rotateX(30deg) rotateY(30deg) rotateZ(0deg) translateX(120px)
				rotateZ(0deg);
		}
		100% {
			transform: translate(-50%, -50%) rotateX(30deg) rotateY(30deg) rotateZ(360deg)
				translateX(120px) rotateZ(-360deg);
		}
	}
	@keyframes orbitDiagonal {
		0% {
			transform: translate(-50%, -50%) rotateX(-45deg) rotateY(20deg) rotateZ(0deg)
				translateX(100px) rotateZ(0deg);
		}
		100% {
			transform: translate(-50%, -50%) rotateX(-45deg) rotateY(20deg) rotateZ(360deg)
				translateX(100px) rotateZ(-360deg);
		}
	}

	/* ── High-Density Star Cluster Arrangement ───── */
	.star-cluster span {
		position: absolute;
		width: 2px;
		height: 2px;
		background: #ffffff;
		border-radius: 50%;
		opacity: 0;
		transition: all 1.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* Cross-vector configurations */
	.star-cluster span:nth-child(1) {
		top: 15%;
		left: 15%;
		transform: translate(25px, 25px);
	}
	.star-cluster span:nth-child(2) {
		top: 85%;
		left: 20%;
		transform: translate(25px, -25px);
	}
	.star-cluster span:nth-child(3) {
		top: 20%;
		right: 15%;
		transform: translate(-25px, 25px);
	}
	.star-cluster span:nth-child(4) {
		top: 80%;
		right: 15%;
		transform: translate(-25px, -25px);
	}
	.star-cluster span:nth-child(5) {
		top: 50%;
		left: 5%;
		transform: translate(30px, 0px);
	}
	.star-cluster span:nth-child(6) {
		top: 50%;
		right: 5%;
		transform: translate(-30px, 0px);
	}
	.star-cluster span:nth-child(7) {
		top: 8%;
		left: 50%;
		transform: translate(0px, 30px);
	}
	.star-cluster span:nth-child(8) {
		top: 92%;
		left: 50%;
		transform: translate(0px, -30px);
	}

	:global(.is-ignited) .star-cluster span {
		opacity: 0.5;
		box-shadow:
			0 0 6px #ffffff,
			0 0 12px hsl(var(--nebula-hue), 100%, 75%);
		transform: translate(0, 0);
	}

	/* Shimmer pulsing variations on micro stars */
	.star-cluster span:nth-child(even) {
		animation: starPulse 2s infinite alternate ease-in-out;
	}
	.star-cluster span:nth-child(odd) {
		animation: starPulse 3s infinite alternate ease-in-out;
		animation-delay: -1s;
	}

	@keyframes starPulse {
		0% {
			opacity: 0.2;
			transform: scale(0.8);
		}
		100% {
			opacity: 0.7;
			transform: scale(1.3);
		}
	}

	.kingdom-step__index {
		font-family: var(--font-display), sans-serif;
		font-size: 0.7rem;
		letter-spacing: 0.35em;
		opacity: 0.4;
		color: #e2d2fe;
	}

	/* ── Text Layout Panels ──────────────────────── */
	.kingdom-step__content {
		flex: 1;
		max-width: 32rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 2.5rem;
		background: rgba(0, 0, 0, 0.25);
		backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 1.25rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);

		opacity: 0;
		transform: translateY(30px);
		transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: 0.15s;
	}

	:global(.is-ignited) .kingdom-step__content {
		opacity: 1;
		transform: translateY(0);
	}

	.kingdom-step__name {
		margin: 0;
		font-family: var(--font-serif), serif;
		font-size: 2.5rem;
		font-weight: 300;
		line-height: 1.1;
		letter-spacing: 0.05em;
	}

	.kingdom-step__sub {
		margin: 0;
		font-family: var(--font-display), sans-serif;
		font-size: 0.65rem;
		letter-spacing: 0.3em;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
	}

	.scroll-divider {
		width: 40px;
		height: 1px;
		background: linear-gradient(90deg, rgba(255, 255, 255, 0.4), transparent);
		transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: 0.3s;
	}

	:global(.is-ignited) .scroll-divider {
		width: 100px;
	}

	.kingdom-step__desc {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.8;
		color: rgba(255, 255, 255, 0.65);
	}

	.kingdom-step__action {
		margin-top: 0.75rem;
	}

	/* ── Outro Target ────────────────────────────── */
	.karneth-outro {
		position: relative;
		z-index: 10;
		min-height: 60vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		padding: 4rem 1.5rem;
		background: transparent;
	}

	.outro-sigil {
		font-size: 1.2rem;
		opacity: 0.3;
		color: #e2d2fe;
	}

	.karneth-outro__title {
		font-family: var(--font-display), sans-serif;
		font-size: 0.8rem;
		letter-spacing: 0.5em;
		opacity: 0.3;
		margin: 0;
	}
</style>
