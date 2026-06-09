<!--
  LoadingIndicator.svelte
  Small fixed bottom-right panel using the same OS-text style as BootScreen.
  Visible only when lazy assets are currently loading.
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { assetLoader } from '$lib/states/assets.svelte'

	interface IndicatorLine {
		hex: string
		label: string
	}

	let lines = $state<IndicatorLine[]>([])
	let scrollEl = $state<HTMLDivElement>(undefined as unknown as HTMLDivElement)
	let intervalId: ReturnType<typeof setInterval> | undefined
	let seenKeys = new Set<string>()

	let isVisible = $derived(assetLoader.lazyInFlight > 0)

	function randomHex(): string {
		return '0x' + Math.random().toString(16).substring(2, 8)
	}

	// Fake micro-operations for the speed effect
	const MICRO_OPS = [
		'DECODE /px/rgba-scan',
		'VERIFY /cache/etag',
		'SYNC   /gfx/tile-map',
		'READ   /io/buffer-fill',
		'CHECK  /net/chunk-rx',
		'MOUNT  /gfx/blit-ctx'
	]
	let fakeIdx = 0

	$effect(() => {
		if (isVisible) {
			seenKeys = new Set()
			lines = []
			fakeIdx = 0
			intervalId = setInterval(() => {
				// Real asset lines
				for (const a of assetLoader.loadingAssets) {
					if (a.entry.priority === 'lazy' && !seenKeys.has(a.key)) {
						seenKeys.add(a.key)
						lines.push({ hex: randomHex(), label: a.key })
					}
				}
				// Fake micro line
				lines.push({ hex: randomHex(), label: MICRO_OPS[fakeIdx % MICRO_OPS.length] })
				fakeIdx++

				if (lines.length > 40) lines.splice(0, lines.length - 40)
				if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight
			}, 70)
		} else {
			if (intervalId) {
				clearInterval(intervalId)
				intervalId = undefined
			}
		}
	})

	onMount(() => {
		return () => {
			if (intervalId) clearInterval(intervalId)
		}
	})
</script>

{#if isVisible}
	<div class="loader" aria-hidden="true">
		<!-- Scrolling text -->
		<div bind:this={scrollEl} class="loader__log">
			{#each lines as line}
				<div class="loader__line">
					<span class="loader__hex">[{line.hex}]</span>
					{' '}{line.label}
				</div>
			{/each}
		</div>

		<!-- Tiny progress bar -->
		<div class="loader__footer">
			<div class="loader__track">
				<div class="loading-indicator-bar loader__bar"></div>
			</div>
			<span class="loader__count">{assetLoader.lazyInFlight}</span>
		</div>
	</div>
{/if}

<style>
	.loader {
		position: fixed;
		right: 1rem;
		bottom: 1rem;
		z-index: 9990;
		width: 14rem;
		overflow: hidden;
		border-radius: 0.25rem;
		border: 1px solid rgba(0, 240, 255, 0.2);
		background: rgba(0, 0, 0, 0.9);
		padding: 0.5rem;
		font-family: var(--font-mono);
		font-size: 9px;
		line-height: 1.5;
		backdrop-filter: blur(4px);
	}

	@media (min-width: 768px) {
		.loader {
			width: 16rem;
			font-size: 10px;
		}
	}

	.loader__log {
		max-height: 3.5rem;
		overflow: hidden;
	}

	.loader__line {
		white-space: nowrap;
		color: rgba(0, 240, 255, 0.5);
	}

	.loader__hex {
		color: rgba(0, 240, 255, 0.3);
	}

	.loader__footer {
		margin-top: 0.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.loader__track {
		flex: 1;
		height: 0.25rem;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
	}

	.loader__bar {
		height: 100%;
		width: 33.333%;
		background: rgba(0, 240, 255, 0.6);
	}

	.loader__count {
		color: rgba(0, 240, 255, 0.4);
	}

	@keyframes indicatorSlide {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(300%);
		}
	}

	.loading-indicator-bar {
		animation: indicatorSlide 1s ease-in-out infinite;
	}
</style>
