<!--
  FooterLinks.svelte — Section 7
  Full-screen deep dark blue backdrop with logo left + social links right.

  Animation lifecycle (IntersectionObserver-driven, NOT scroll-scrubbed):
    1. Footer reaches bgThreshold → background fades in.
    2. Footer reaches contentThreshold → scroll snaps to bottom, then content fades up after contentDelay.
    3. Scrolling back up: background + content stay static, scroll away naturally.
    4. Footer leaves viewport → snap-reset (no transition) for the next visit.

  A single IntersectionObserver handles all three phases via a deduplicated threshold array.
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { externalLinks, heroConfig } from '$lib/data/content'
	import ManagedImage from '$lib/components/ui/ManagedImage.svelte'
	import { observe } from '$lib/utils/intersect'

	// ── Config — edit here to tweak ────────────────────────────
	const ANIM = {
		/** Duration of the background fade-in (ms) */
		bgDuration: 800,
		/** Fraction of footer visible before BACKGROUND fades in (0–1) */
		bgThreshold: 0.75,
		/** Fraction of footer visible before CONTENT animates in (0–1) */
		contentThreshold: 0.75,
		/** Delay after contentThreshold before content appears (ms) */
		contentDelay: 800,
		/** Duration of the content fade-up (ms) */
		contentDuration: 800,
		/** translateY offset content starts from (rem) */
		contentSlide: 2,
		/** Background color */
		bgColor: 'rgb(4, 8, 36)',
		/** Logo max-height in px (overridden by logoHeightCqi on narrow screens) */
		logoHeight: 120,
		/** Responsive logo height cap as % of container inline-size (cqi) */
		logoHeightCqi: 20,
		/** Logo opacity */
		logoOpacity: 0.9,
		/** Link icon size (rem) */
		iconSize: 1.25,
		/** Default link color */
		linkColor: 'rgba(255, 255, 255, 0.55)',
		/** Copyright opacity */
		copyrightOpacity: 0.3,
		/** Smooth-scroll snap duration (ms). 0 = disabled. */
		scrollSnapDuration: 600
	}
	// ──────────────────────────────────────────────────────────

	let footerEl: HTMLElement

	// Deduplicated, sorted threshold array — built once, reused by the single observer.
	const thresholds = [...new Set([0, ANIM.bgThreshold, ANIM.contentThreshold])].sort(
		(a, b) => a - b
	)

	/** Smooth-scroll to targetY over duration ms (ease-out cubic). Cancels any prior scroll. */
	function smoothScrollTo(targetY: number, duration: number) {
		const startY = window.scrollY
		const distance = targetY - startY
		if (Math.abs(distance) < 2) return
		const startTime = performance.now()

		const step = (now: number) => {
			const t = Math.min((now - startTime) / duration, 1)
			window.scrollTo(0, startY + distance * (1 - (1 - t) ** 3))
			rafId = t < 1 ? requestAnimationFrame(step) : 0
		}

		if (rafId) cancelAnimationFrame(rafId)
		rafId = requestAnimationFrame(step)
	}

	// Only bgVisible, contentVisible, snapReset drive DOM — the rest are plain guards.
	let bgVisible = $state(false)
	let contentVisible = $state(false)
	let snapReset = $state(false)

	let bgFired = false
	let contentFired = false
	let contentTimeout: ReturnType<typeof setTimeout> | null = null
	let rafId = 0

	onMount(() => {
		return observe(
			footerEl,
			entry => {
				const { isIntersecting, intersectionRatio: ratio } = entry

				if (isIntersecting) {
					if (!bgFired && ratio >= ANIM.bgThreshold) {
						bgFired = true
						bgVisible = true
					}
					if (!contentFired && ratio >= ANIM.contentThreshold) {
						contentFired = true
						if (ANIM.scrollSnapDuration > 0) {
							smoothScrollTo(
								document.documentElement.scrollHeight - window.innerHeight,
								ANIM.scrollSnapDuration
							)
						}
						contentTimeout = setTimeout(() => {
							contentVisible = true
							contentTimeout = null
						}, ANIM.contentDelay)
					}
				} else {
					// Completely out of view — cancel all pending work, snap-reset without transition.
					if (contentTimeout !== null) {
						clearTimeout(contentTimeout)
						contentTimeout = null
					}
					if (rafId) {
						cancelAnimationFrame(rafId)
						rafId = 0
					}
					bgFired = false
					contentFired = false
					snapReset = true
					bgVisible = false
					contentVisible = false
					requestAnimationFrame(() => {
						snapReset = false
					})
				}
			},
			{ threshold: thresholds }
		)
	})
</script>

<!--
  All ANIM values are passed as CSS custom properties on the root element once,
  keeping inline styles out of the #each loop and off child elements entirely.
-->
<footer
	bind:this={footerEl}
	class="footer"
	class:snap-reset={snapReset}
	style:--bg-color={ANIM.bgColor}
	style:--bg-duration="{ANIM.bgDuration}ms"
	style:--content-duration="{ANIM.contentDuration}ms"
	style:--content-slide="{ANIM.contentSlide}rem"
	style:--icon-size="{ANIM.iconSize}rem"
	style:--link-color={ANIM.linkColor}
	style:--copyright-opacity={ANIM.copyrightOpacity}
>
	<!-- Full-viewport background — fades in first -->
	<div class="footer__bg" class:footer__bg--visible={bgVisible}></div>

	<!-- Content: logo left, links right — fades up after background settles -->
	<div class="footer__body" class:footer__body--visible={contentVisible}>
		<!-- Logo -->
		<div class="footer__logo-wrap">
			<ManagedImage
				asset={heroConfig.logoAsset}
				alt="Stellar Dragoon"
				style="max-height:min({ANIM.logoHeight}px,{ANIM.logoHeightCqi}cqi);opacity:{ANIM.logoOpacity}"
			/>
		</div>

		<!-- Right column: links + copyright -->
		<div class="footer__right">
			<nav class="footer__links" aria-label="Social links">
				{#each externalLinks as link}
					<a
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
						class="footer__link"
						aria-label={link.label}
					>
						<span class="footer__link-label">{link.label}</span>
						<svg
							class="footer__link-icon"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d={link.iconPath} />
						</svg>
					</a>
				{/each}
			</nav>
			<p class="footer__copyright">© 2026 STELLAR DRAGOON</p>
		</div>
	</div>
</footer>

<style>
	/* ── Shell ──────────────────────────────────────────────── */
	.footer {
		position: relative;
		height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ── Instant reset — suppress transitions while snapping back ── */
	.footer.snap-reset .footer__bg,
	.footer.snap-reset .footer__body {
		transition: none;
	}

	/* ── Background ─────────────────────────────────────────── */
	.footer__bg {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100vw;
		height: 100%;
		background: var(--bg-color);
		opacity: 0;
		transition: opacity var(--bg-duration) ease;
		pointer-events: none;
		z-index: 0;
	}

	.footer__bg--visible {
		opacity: 1;
	}

	/* ── Content wrapper ────────────────────────────────────── */
	.footer__body {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 56rem;
		padding: 0 3rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2.5rem;
		opacity: 0;
		transform: translateY(var(--content-slide));
		transition:
			opacity var(--content-duration) ease-out,
			transform var(--content-duration) ease-out;
	}

	@media (min-width: 480px) {
		.footer__body {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 4rem;
		}
	}

	.footer__body--visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* ── Logo ───────────────────────────────────────────────── */
	.footer__logo-wrap {
		flex: 0 0 auto;
	}

	.footer__logo-wrap :global(img) {
		display: block;
		width: auto;
	}

	/* ── Right column ───────────────────────────────────────── */
	.footer__right {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}

	@media (min-width: 480px) {
		.footer__right {
			align-items: flex-end;
		}
	}

	/* ── Links ──────────────────────────────────────────────── */
	.footer__links {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
	}

	@media (min-width: 480px) {
		.footer__links {
			align-items: flex-end;
		}
	}

	.footer__link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--link-color);
		text-decoration: none;
		transition: color 0.3s;
	}

	.footer__link:hover {
		color: white;
	}

	.footer__link-icon {
		width: var(--icon-size);
		height: var(--icon-size);
		flex-shrink: 0;
		transition: transform 0.3s;
	}

	.footer__link:hover .footer__link-icon {
		transform: scale(1.1);
	}

	.footer__link-label {
		font-family: var(--font-display);
		font-size: 0.75rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	/* ── Copyright ──────────────────────────────────────────── */
	.footer__copyright {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		color: white;
		opacity: var(--copyright-opacity);
	}
</style>
