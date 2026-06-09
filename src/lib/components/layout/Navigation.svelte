<!--
  Navigation.svelte
  Hamburger menu + full-screen overlay.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { mainNavItems } from '$lib/data/navigation'
	import { transitionState } from '$lib/states/transition.svelte'
	import { assetLoader } from '$lib/states/assets.svelte'
	import { goto } from '$app/navigation'

	let isOpen = $state(false)
	let activeSection = $state<string | null>(null)

	function toggle() {
		isOpen = !isOpen
	}

	async function navigate(href: string) {
		isOpen = false
		if (href.startsWith('/#')) {
			const el = document.getElementById(href.replace('/#', ''))
			if (el) {
				el.scrollIntoView({ behavior: 'smooth' })
				return
			}
		}
		await transitionState.close()
		await assetLoader.preloadCritical(href)
		await goto(href)
	}

	function isExternal(href: string) {
		return !href.startsWith('/#')
	}

	function updateActiveSection() {
		const threshold = window.innerHeight * 0.4
		let best: string | null = null
		let bestTop = -Infinity

		for (const item of mainNavItems) {
			if (!item.sectionId) continue
			const el = document.getElementById(item.sectionId)
			if (!el) continue
			const top = el.getBoundingClientRect().top
			if (top <= threshold && top > bestTop) {
				bestTop = top
				best = item.sectionId
			}
		}

		activeSection = best
	}

	onMount(() => {
		updateActiveSection()
		window.addEventListener('scroll', updateActiveSection, { passive: true })
	})

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('scroll', updateActiveSection)
		}
	})
</script>

<!-- Desktop inline nav -->
<nav class="nav-desktop" aria-label="メインナビゲーション">
	{#each mainNavItems as item}
		<button
			type="button"
			class="nav-desktop__item"
			class:nav-desktop__item--active={item.sectionId === activeSection}
			onclick={() => navigate(item.href)}
		>
			{item.label}
			{#if isExternal(item.href)}
				<span class="nav-desktop__ext" aria-hidden="true">↗</span>
			{/if}
		</button>
	{/each}
</nav>

<!-- Hamburger trigger (mobile only) -->
<button
	type="button"
	class="nav-toggle"
	class:nav-toggle--open={isOpen}
	onclick={toggle}
	aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
	aria-expanded={isOpen}
>
	<span class="nav-toggle__line nav-toggle__line--top"></span>
	<span class="nav-toggle__line nav-toggle__line--mid"></span>
	<span class="nav-toggle__line nav-toggle__line--bot"></span>
</button>

<!-- Full-screen overlay (mobile only) -->
{#if isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="nav-overlay"
		onclick={e => {
			if (e.target === e.currentTarget) isOpen = false
		}}
		onkeydown={e => {
			if (e.key === 'Escape') isOpen = false
		}}
	>
		<nav class="nav-menu">
			{#each mainNavItems as item, i}
				<button
					type="button"
					class="nav-item"
					style="animation: navSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) {i * 60}ms both;"
					onclick={() => navigate(item.href)}
				>
					{item.label}
					<span class="nav-item__underline"></span>
				</button>
			{/each}
		</nav>
	</div>
{/if}

<style>
	/* ── Desktop inline nav ──────────────────────── */
	.nav-desktop {
		display: none;
	}

	@media (min-width: 1024px) {
		.nav-desktop {
			position: fixed;
			top: 3rem;
			right: 3rem;
			z-index: 10000;
			display: flex;
			align-items: center;
			gap: 2rem;
		}

		.nav-toggle,
		.nav-overlay {
			display: none !important;
		}
	}

	.nav-desktop__item {
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		color: white;
		font-family: var(--font-display);
		font-size: 1rem;
		letter-spacing: 0.1em;
		transition: text-shadow 0.4s ease;
		position: relative;
	}

	@media (min-width: 768px) {
		.nav-desktop__item {
			font-size: 1.25rem;
		}
	}

	.nav-desktop__item:hover {
		text-shadow:
			0 0 6px rgba(255, 255, 255, 0.7),
			0 0 18px rgba(255, 255, 255, 0.25);
	}

	.nav-desktop__item--active {
		text-shadow:
			0 0 8px rgba(255, 255, 255, 0.95),
			0 0 24px rgba(255, 255, 255, 0.5),
			0 0 48px rgba(255, 255, 255, 0.15);
	}

	.nav-desktop__ext {
		font-size: 0.6em;
		vertical-align: super;
		margin-left: 0.15em;
		opacity: 0.5;
		transition: opacity 0.4s ease;
	}

	.nav-desktop__item:hover .nav-desktop__ext {
		opacity: 0.9;
	}

	/* ── Hamburger ───────────────────────────────── */
	.nav-toggle {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 10000;
		display: flex;
		height: 3rem;
		width: 3rem;
		cursor: pointer;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		background: none;
		border: none;
		padding: 0;
	}

	.nav-toggle__line {
		display: block;
		height: 2px;
		width: 1.5rem;
		background: white;
		transition: all 0.3s;
	}

	.nav-toggle--open .nav-toggle__line--top {
		transform: translateY(8px) rotate(45deg);
	}

	.nav-toggle--open .nav-toggle__line--mid {
		opacity: 0;
	}

	.nav-toggle--open .nav-toggle__line--bot {
		transform: translateY(-8px) rotate(-45deg);
	}

	/* ── Overlay ─────────────────────────────────── */
	.nav-overlay {
		position: fixed;
		inset: 0;
		z-index: 9998;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.95);
		backdrop-filter: blur(4px);
	}

	.nav-menu {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}

	/* ── Nav items ───────────────────────────────── */
	.nav-item {
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		color: white;
		font-family: var(--font-display);
		font-size: 1.875rem;
		letter-spacing: 0.1em;
		transition: letter-spacing 0.3s;
	}

	@media (min-width: 768px) {
		.nav-item {
			font-size: 3rem;
		}
	}

	.nav-item:hover {
		letter-spacing: 0.4em;
	}

	.nav-item__underline {
		display: block;
		height: 1px;
		width: 0;
		background: white;
		transition: width 0.3s;
	}

	.nav-item:hover .nav-item__underline {
		width: 100%;
	}

	/* ── Slide-in animation ──────────────────────── */
	@keyframes navSlideIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
