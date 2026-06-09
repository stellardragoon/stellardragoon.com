<!--
  TypewriterLines.svelte — Typewriter body lines with left-border underline animation.

  Self-contained: manages its own IntersectionObserver and resets on exit.
  Used directly or composed inside TextBlock.
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { observe } from '$lib/utils/intersect'

	interface Props {
		lines: string[]
		pulseLast?: boolean
	}

	let { lines, pulseLast = false }: Props = $props()

	let entered = $state(false)
	let el: HTMLElement

	onMount(() => {
		return observe(
			el,
			entry => {
				entered = entry.isIntersecting
			},
			{ threshold: [0, 0.15] }
		)
	})

	const BODY_START = 0.3
	const LINE_GAP = 0.15

	function charDelay(lineIdx: number, charIdx: number, lineLen: number): string {
		const t = BODY_START + lineIdx * LINE_GAP + charIdx * (lineLen > 1 ? 0.8 / lineLen : 0.8)
		return t.toFixed(3) + 's'
	}

	function pulseDelay(lineIdx: number, lineLen: number): string {
		const t = BODY_START + lineIdx * LINE_GAP + lineLen * (lineLen > 1 ? 0.8 / lineLen : 0.8) + 0.3
		return t.toFixed(3) + 's'
	}
</script>

<div class="lines" class:is-entered={entered} bind:this={el}>
	{#each lines as line, lineIdx}
		{@const isLast = pulseLast && lineIdx === lines.length - 1}
		<p
			class="line"
			class:line--pulse={isLast}
			style={isLast ? `--pulse-delay: ${pulseDelay(lineIdx, line.length)}` : ''}
		>
			{#each [...line] as char, charIdx}<span
					class="char"
					style="--t: {charDelay(lineIdx, charIdx, line.length)}"
					>{char === ' ' ? '\u00A0' : char}</span
				>{/each}
		</p>
	{/each}
</div>

<style>
	.lines {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.5rem;
		padding-left: 1.25rem;
	}

	.lines::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 1px;
		background: rgb(202, 202, 202);
		transform-origin: top;
		transform: scaleY(0);
	}

	.line {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 1rem;
		line-height: 1.75;
		color: white;
		overflow-wrap: anywhere;
	}

	@media (min-width: 768px) {
		.line {
			font-size: 1.25rem;
		}
	}

	.char {
		display: inline;
		opacity: 0;
	}

	/* ── Entry animations ──────────────────────── */

	.is-entered::before {
		animation: underline-expand 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
	}

	.is-entered .char {
		animation: char-appear 0.01s linear var(--t) forwards;
	}

	.is-entered .line--pulse {
		animation: pulse-opacity 2.5s ease-in-out var(--pulse-delay, 0s) infinite;
	}

	/* ── Keyframes ─────────────────────────────── */

	@keyframes underline-expand {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}

	@keyframes char-appear {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes pulse-opacity {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.35;
		}
	}
</style>
