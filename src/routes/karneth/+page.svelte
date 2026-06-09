<!--
  Karneth sub-page — Kingdom grid + internal navigation.
-->
<script lang="ts">
	import { karnethNav, kingdoms } from '$lib/data/content'
	import { transitionState } from '$lib/states/transition.svelte'
	import { assetLoader } from '$lib/states/assets.svelte'
	import { goto } from '$app/navigation'
	import HoverButton from '$lib/components/ui/HoverButton.svelte'
	import ManagedImage from '$lib/components/ui/ManagedImage.svelte'

	let activeTab = $state('Database')

	async function navigate(href: string) {
		await transitionState.close()
		await assetLoader.preloadCritical(href)
		await goto(href)
	}
</script>

<main class="karneth">
	<!-- Internal navigation header -->
	<nav class="karneth-nav">
		{#each karnethNav as item}
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

	<!-- Page title -->
	<div class="karneth-header">
		<h1 class="karneth-header__title">カーネス</h1>
		<p class="karneth-header__subtitle">KARNETH DATABASE</p>
	</div>

	<!-- Kingdoms grid: 12 crests -->
	<section class="kingdoms">
		<h2 class="kingdoms__label">KINGDOMS</h2>

		<div class="kingdoms__grid">
			{#each kingdoms as kingdom, i}
				<div class="kingdoms__card">
					<!-- Crest placeholder -->
					<div class="kingdoms__crest">
						<ManagedImage
							asset={kingdom.crestAsset}
							alt={kingdom.name}
							class="kingdoms__crest-img"
						/>
						<!-- Fallback index when image is missing -->
						<div class="kingdoms__crest-fallback">
							{String(i + 1).padStart(2, '0')}
						</div>
					</div>

					<p class="kingdoms__name">{kingdom.name}</p>
				</div>
			{/each}
		</div>

		<!-- ACCESS button -->
		<div class="kingdoms__actions">
			<HoverButton label="ACCESS" href="/karneth/empires" />
		</div>
	</section>
</main>

<style>
	.karneth {
		min-height: 100vh;
		padding: 6rem 1.5rem 4rem;
	}

	/* ── Top nav ─────────────────────────────── */
	.karneth-nav {
		margin: 0 auto 4rem;
		display: flex;
		max-width: 64rem;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.karneth-nav {
			gap: 2rem;
		}
	}

	.karneth-nav__item {
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		color: white;
		font-family: var(--font-display);
		font-size: 0.875rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.4;
		transition: opacity 0.3s;
	}

	.karneth-nav__item--active {
		opacity: 1;
	}

	.karneth-nav__underline {
		display: block;
		margin-top: 0.25rem;
		height: 1px;
		width: 0;
		background: white;
		transition: width 0.3s;
	}

	.karneth-nav__underline--active {
		width: 100%;
	}

	/* ── Page title ──────────────────────────── */
	.karneth-header {
		margin: 0 auto 3rem;
		max-width: 64rem;
		text-align: center;
	}

	.karneth-header__title {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 2.25rem;
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	@media (min-width: 768px) {
		.karneth-header__title {
			font-size: 3.75rem;
		}
	}

	.karneth-header__subtitle {
		margin: 1rem 0 0;
		font-family: var(--font-display);
		font-size: 0.875rem;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		opacity: 0.5;
	}

	/* ── Kingdoms grid ───────────────────────── */
	.kingdoms {
		margin: 0 auto;
		max-width: 72rem;
	}

	.kingdoms__label {
		margin: 0 0 2rem;
		text-align: center;
		font-family: var(--font-display);
		font-size: 0.75rem;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		opacity: 0.5;
	}

	.kingdoms__grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.kingdoms__grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 768px) {
		.kingdoms__grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.kingdoms__grid {
			grid-template-columns: repeat(6, 1fr);
		}
	}

	.kingdoms__card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1.5rem;
		transition:
			transform 0.3s,
			border-color 0.3s;
	}

	.kingdoms__card:hover {
		transform: scale(1.05);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.kingdoms__crest {
		position: relative;
		display: flex;
		height: 4rem;
		width: 4rem;
		align-items: center;
		justify-content: center;
	}

	:global(.kingdoms__crest-img) {
		height: 100%;
		width: 100%;
		object-fit: contain;
	}

	.kingdoms__crest-fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		opacity: 0.3;
	}

	.kingdoms__name {
		margin: 0;
		text-align: center;
		font-family: var(--font-serif);
		font-size: 0.875rem;
	}

	.kingdoms__actions {
		margin-top: 3rem;
		display: flex;
		justify-content: center;
	}
</style>
