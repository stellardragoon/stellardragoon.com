<!--
  BootScreen.svelte
  Full-screen OS-boot text animation shown over the closed curtain.

  Displays rapidly scrolling hex-ID lines mixed with real asset-loading
  events and fake system operations, plus a progress percentage.

  On failure (404 / network error):
    - Each failed asset is printed as a red ERR log line.
    - After preload finishes, a warning panel + "CONTINUE ANYWAY" button
      is shown inline — no dialog. User must acknowledge before the
      curtain opens, allowing the site to reveal in a degraded state.
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte'
	import { assetLoader } from '$lib/states/assets.svelte'
	import { transitionState } from '$lib/states/transition.svelte'

	// ── Boot line model ─────────────────────────────────────
	interface BootLine {
		hex: string
		label: string
		status: 'ok' | 'load' | 'fail'
	}

	// Fake system operations for the speed-of-light scroll effect
	const FAKE_OPS: string[] = [
		'INIT   /sys/viewport-state',
		'SYNC   /core/runtime-engine',
		'MOUNT  /gfx/render-pipeline',
		'VERIFY /cache/asset-manifest',
		'LOAD   /sys/scroll-trigger',
		'CHECK  /net/service-worker',
		'INIT   /ui/curtain-layer',
		'SYNC   /gfx/parallax-engine',
		'MOUNT  /core/state-manager',
		'VERIFY /sys/theme-resolver',
		'LOAD   /gfx/gsap-runtime',
		'CHECK  /cache/font-registry',
		'INIT   /sys/intersection-obs',
		'SYNC   /net/prefetch-queue',
		'MOUNT  /ui/navigation-layer',
		'VERIFY /core/ssr-boundary',
		'LOAD   /sys/proxy-allocator',
		'CHECK  /gfx/compositing-ctx',
		'INIT   /net/http-cache',
		'SYNC   /core/event-loop',
		'MOUNT  /sys/mutation-tracker',
		'VERIFY /gfx/webgl-context',
		'LOAD   /net/dns-prefetch',
		'CHECK  /sys/gpu-scheduler',
		'INIT   /core/tick-engine',
		'SYNC   /ui/layout-solver',
		'MOUNT  /gfx/paint-worker',
		'VERIFY /net/tls-handshake'
	]

	// ── State ───────────────────────────────────────────────
	let lines = $state<BootLine[]>([])
	let scrollEl = $state<HTMLDivElement>(undefined as unknown as HTMLDivElement)
	let fakeIdx = 0
	/**
	 * Plain (non-reactive) counter tracking how many lines have been added.
	 * Used instead of reading `lines.length` so that addLine() never touches
	 * a reactive read while running inside an effect or the setInterval tick —
	 * which would otherwise create spurious subscriptions / infinite re-runs.
	 */
	let lineCount = 0
	let intervalId: ReturnType<typeof setInterval> | undefined
	let seenLoadingKeys = new Set<string>()
	let seenErrorKeys = new Set<string>()
	/**
	 * Guards the completion logic so it only fires once even if the effect's
	 * tracked dependencies (criticalTotal / isPreloading) re-evaluate later.
	 */
	let completed = false

	let isActive = $state(false)
	let opacity = $state(0)
	/** True after preload finishes with ≥1 critical failure — shows warning panel. */
	let showWarning = $state(false)

	function randomHex(): string {
		return '0x' + Math.random().toString(16).substring(2, 10)
	}

	function addLine(label: string, status: BootLine['status'] = 'ok') {
		lineCount++
		lines.push({ hex: randomHex(), label, status })
		// Trim using lineCount (not lines.length) to avoid any reactive reads here
		if (lineCount > 200) {
			lines.splice(0, lineCount - 200)
			lineCount = 200
		}
	}

	function startScroll() {
		lines = []
		lineCount = 0
		seenLoadingKeys = new Set()
		seenErrorKeys = new Set()
		completed = false
		fakeIdx = 0
		addLine('SYS.INIT > STELLAR DRAGOON RUNTIME v3.1.7')
		addLine('────────────────────────────────────')

		// setInterval runs outside any reactive scope, so reads here
		// (loadingAssets, criticalErrors) do NOT create effect subscriptions.
		intervalId = setInterval(() => {
			for (const a of assetLoader.loadingAssets) {
				if (!seenLoadingKeys.has(a.key)) {
					seenLoadingKeys.add(a.key)
					addLine(`LOAD   /gfx/${a.key}`, 'load')
				}
			}
			for (const e of assetLoader.criticalErrors) {
				if (!seenErrorKeys.has(e.key)) {
					seenErrorKeys.add(e.key)
					addLine(`ERR    /gfx/${e.key} — ${e.src}`, 'fail')
				}
			}
			addLine(FAKE_OPS[fakeIdx % FAKE_OPS.length])
			fakeIdx++
			if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight
		}, 50)
	}

	function stopScroll() {
		if (intervalId) {
			clearInterval(intervalId)
			intervalId = undefined
		}
	}

	/** Called by the "CONTINUE ANYWAY" button — user acknowledges degraded state. */
	function confirmAndReveal() {
		showWarning = false
		transitionState.open()
		setTimeout(() => {
			opacity = 0
		}, 100)
		setTimeout(() => {
			isActive = false
		}, 500)
	}

	// ── Lifecycle ───────────────────────────────────────────

	// Start the boot scroll once on mount — no reactive deps, runs exactly once.
	onMount(() => {
		isActive = true
		opacity = 1
		startScroll()
		return () => stopScroll()
	})

	// Completion effect: only tracks criticalTotal + isPreloading.
	// Body is wrapped in untrack() so that reads inside (criticalErrors, scrollEl)
	// do NOT add extra subscriptions that would cause the effect to re-run.
	$effect(() => {
		const total = assetLoader.criticalTotal
		const loading = assetLoader.isPreloading

		if (total > 0 && !loading && isActive && !completed) {
			completed = true
			untrack(() => {
				stopScroll()
				const errors = assetLoader.criticalErrors
				if (errors.length > 0) {
					// Flush any error lines the interval may have missed
					for (const e of errors) {
						if (!seenErrorKeys.has(e.key)) {
							seenErrorKeys.add(e.key)
							addLine(`ERR    /gfx/${e.key} — ${e.src}`, 'fail')
						}
					}
					addLine(`> BOOT HALTED — ${errors.length} ASSET(S) FAILED TO LOAD`, 'fail')
					addLine('> ACKNOWLEDGE TO CONTINUE IN DEGRADED MODE', 'fail')
					if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight
					showWarning = true
				} else {
					addLine('> BOOT COMPLETE — ALL SYSTEMS NOMINAL')
					if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight
					setTimeout(() => {
						opacity = 0
					}, 250)
					setTimeout(() => {
						isActive = false
					}, 650)
				}
			})
		}
	})

	let progress = $derived(assetLoader.criticalProgress)
	let errorCount = $derived(assetLoader.criticalErrors.length)
</script>

{#if isActive}
	<div
		class="boot-screen"
		style="opacity: {opacity}; transition: opacity 0.4s ease;"
		aria-hidden={!showWarning}
	>
		<!-- Scrolling text area -->
		<div bind:this={scrollEl} class="boot-screen__log">
			{#each lines as line}
				<div class="boot-screen__line">
					{#if line.hex}
						<span class="boot-screen__hex">[{line.hex}]</span>
					{/if}
					<span class="boot-screen__text boot-screen__text--{line.status}"> {line.label}</span>
					{#if line.status === 'ok'}
						<span class="boot-screen__status boot-screen__status--ok"> OK</span>
					{:else if line.status === 'load'}
						<span class="boot-screen__status boot-screen__status--load"> ▓▓▓</span>
					{:else}
						<span class="boot-screen__status boot-screen__status--fail"> ✕ ERR</span>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Warning panel — shown only on critical failures -->
		{#if showWarning}
			<div class="boot-screen__warning">
				<p class="boot-screen__warning-title">⚠ WARNING — ASSET LOAD FAILURE</p>
				<p class="boot-screen__warning-body">
					{errorCount} critical asset{errorCount === 1 ? '' : 's'} could not be retrieved (404 / network
					error). The site may appear broken or incomplete.
				</p>
				<button
					type="button"
					class="boot-screen__confirm"
					onclick={confirmAndReveal}
					aria-label="Continue with broken assets"
				>
					[ CONTINUE ANYWAY ]
				</button>
			</div>
		{:else}
			<!-- Progress bar (hidden when warning is shown) -->
			<div class="boot-screen__progress">
				<div class="boot-screen__progress-row">
					<span class="boot-screen__progress-label">&gt; LOADING ASSETS</span>
					<div class="boot-screen__progress-track">
						<div class="boot-screen__progress-fill" style="width: {progress}%;"></div>
					</div>
					<span class="boot-screen__progress-pct">{progress}%</span>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.boot-screen {
		position: fixed;
		inset: 0;
		z-index: 10001;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		background: black;
		padding: 1.5rem;
		font-family: var(--font-mono);
	}

	@media (min-width: 768px) {
		.boot-screen {
			padding: 2.5rem;
		}
	}

	/* ── Scrolling log ─────────────────────── */
	.boot-screen__log {
		flex: 1;
		overflow: hidden;
		font-size: 10px;
		line-height: 1.6;
		color: rgba(0, 240, 255, 0.7);
	}

	@media (min-width: 768px) {
		.boot-screen__log {
			font-size: 0.75rem;
		}
	}

	.boot-screen__line {
		white-space: nowrap;
	}

	.boot-screen__hex {
		color: rgba(0, 240, 255, 0.4);
	}

	.boot-screen__text--ok {
		color: rgba(0, 240, 255, 0.7);
	}

	.boot-screen__text--load {
		color: #ffe800;
	}

	.boot-screen__text--fail {
		color: #f87171;
	}

	.boot-screen__status--ok {
		color: #4ade80;
	}

	.boot-screen__status--load {
		color: rgba(255, 232, 0, 0.6);
	}

	.boot-screen__status--fail {
		color: #f87171;
	}

	/* ── Warning panel ─────────────────────── */
	.boot-screen__warning {
		margin-top: 1rem;
		border: 1px solid rgba(239, 68, 68, 0.4);
		background: rgba(69, 10, 10, 0.3);
		padding: 1rem;
	}

	.boot-screen__warning-title {
		margin: 0 0 0.25rem;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #f87171;
	}

	@media (min-width: 768px) {
		.boot-screen__warning-title {
			font-size: 0.75rem;
		}
	}

	.boot-screen__warning-body {
		margin: 0 0 0.75rem;
		font-size: 10px;
		color: rgba(252, 165, 165, 0.7);
	}

	@media (min-width: 768px) {
		.boot-screen__warning-body {
			font-size: 0.75rem;
		}
	}

	.boot-screen__confirm {
		border: 1px solid rgba(239, 68, 68, 0.6);
		background: none;
		padding: 0.5rem 1.5rem;
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		color: #f87171;
		cursor: pointer;
		transition:
			background 0.2s,
			color 0.2s;
	}

	@media (min-width: 768px) {
		.boot-screen__confirm {
			font-size: 0.75rem;
		}
	}

	.boot-screen__confirm:hover {
		background: rgba(239, 68, 68, 0.1);
		color: #fca5a5;
	}

	/* ── Progress bar ──────────────────────── */
	.boot-screen__progress {
		margin-top: 1rem;
	}

	.boot-screen__progress-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 10px;
		color: rgba(0, 240, 255, 0.5);
	}

	@media (min-width: 768px) {
		.boot-screen__progress-row {
			font-size: 0.75rem;
		}
	}

	.boot-screen__progress-label {
		flex-shrink: 0;
	}

	.boot-screen__progress-track {
		flex: 1;
		height: 0.375rem;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
	}

	.boot-screen__progress-fill {
		height: 100%;
		background: var(--color-accent-cyan);
		transition: width 0.2s;
	}

	.boot-screen__progress-pct {
		width: 2.5rem;
		text-align: right;
		font-weight: 700;
		color: var(--color-accent-cyan);
	}
</style>
