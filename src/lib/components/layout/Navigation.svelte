<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { mainNavItems } from '$lib/data/navigation'
	import { transitionState } from '$lib/states/transition.svelte'
	import { assetLoader } from '$lib/states/assets.svelte'
	import { goto } from '$app/navigation'

	let isOpen = $state(false)
	let activeSection = $state<string | null>(null)

	// Sync drawer state with HTML tag for external page-shift effect
	$effect(() => {
		if (typeof document !== 'undefined') {
			if (isOpen) {
				document.documentElement.classList.add('nav-drawer-open')
			} else {
				document.documentElement.classList.remove('nav-drawer-open')
			}
		}
	})

	function toggle() {
		isOpen = !isOpen
	}

	// Standard async function handles the promise chain cleanly
	async function handleNavigate(href: string) {
		isOpen = false

		if (href.startsWith('/#')) {
			const el = document.getElementById(href.replace('/#', ''))
			if (el) {
				el.scrollIntoView({ behavior: 'smooth' })
			}
			return
		}

		try {
			await transitionState.close()
			await assetLoader.preloadCritical(href)
			// eslint-disable-next-line
			await goto(href)
		} catch (error) {
			console.error('Navigation error:', error)
		}
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
			document.documentElement.classList.remove('nav-drawer-open')
		}
	})
</script>

<svelte:window onkeydown={e => e.key === 'Escape' && (isOpen = false)} />

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

<button
	type="button"
	class="nav-backdrop"
	class:nav-backdrop--open={isOpen}
	onclick={() => (isOpen = false)}
	aria-hidden="true"
	tabindex="-1"
></button>

<aside class="nav-drawer" class:nav-drawer--open={isOpen}>
	<nav class="nav-menu">
		{#each mainNavItems as item, i (item.href)}
			<button
				type="button"
				class="nav-item"
				class:nav-item--active={item.sectionId === activeSection}
				style="transition-delay: {isOpen ? i * 50 + 200 : 0}ms;"
				onclick={() => handleNavigate(item.href)}
			>
				{item.label}
				<span class="nav-item__underline"></span>
			</button>
		{/each}
	</nav>
</aside>

<style>
	/* ── Hamburger ───────────────────────────────── */
	.nav-toggle {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 10001;
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
		transition:
			transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
			opacity 0.4s ease;
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

	/* ── Backdrop ────────────────────────────────── */
	.nav-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: rgba(0, 0, 0, 0.3);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);

		/* Add these resets to keep the button completely invisible */
		border: none;
		padding: 0;
		cursor: default;
		outline: none;
	}

	.nav-backdrop--open {
		opacity: 1;
		pointer-events: auto;
	}

	/* ── Side Drawer ─────────────────────────────── */
	.nav-drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		width: min(400px, 85vw);

		background: rgba(15, 15, 15, 0.65);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow:
			-4px 0 24px rgba(255, 255, 255, 0.08),
			inset 1px 0 0 rgba(255, 255, 255, 0.15);

		transform: translateX(100%);
		transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.nav-drawer--open {
		transform: translateX(0);
	}

	.nav-menu {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2.5rem;
		width: 100%;
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
		opacity: 0;
		transform: translateX(20px);
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.nav-drawer--open .nav-item {
		opacity: 1;
		transform: translateX(0);
	}

	@media (min-width: 768px) {
		.nav-item {
			font-size: 2.5rem;
		}
	}

	.nav-item:hover,
	.nav-item--active {
		letter-spacing: 0.3em;
		text-shadow: 0 0 12px rgba(255, 255, 255, 0.6);
	}

	.nav-item__underline {
		display: block;
		height: 1px;
		width: 0;
		background: rgba(255, 255, 255, 0.8);
		transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		margin: 4px auto 0 auto;
		box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
	}

	.nav-item:hover .nav-item__underline,
	.nav-item--active .nav-item__underline {
		width: 100%;
	}
</style>
