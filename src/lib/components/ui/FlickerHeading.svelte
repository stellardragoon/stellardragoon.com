<!--
  FlickerHeading.svelte — Standalone heading with flicker-in animation.

  Self-contained: manages its own IntersectionObserver and resets on exit.
  Used directly or composed inside TextBlock.
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { observe } from '$lib/utils/intersect'

	interface Props {
		heading: string
	}

	let { heading }: Props = $props()

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
</script>

<h2 class="heading" class:is-entered={entered} bind:this={el}>{heading}</h2>

<style>
	.heading {
		display: inline-block;
		max-width: 100%;
		word-break: break-all;
		margin: 0 0 0.5rem;
		font-family: var(--font-display);
		font-size: 3rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		color: white;
		opacity: 0;
	}

	@media (min-width: 768px) {
		.heading {
			font-size: 4.5rem;
		}
	}

	.is-entered {
		animation: flicker 0.8s 0s forwards;
	}

	@keyframes flicker {
		0% {
			opacity: 0;
		}
		8% {
			opacity: 0.9;
		}
		12% {
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		24% {
			opacity: 0;
		}
		32% {
			opacity: 1;
		}
		36% {
			opacity: 0;
		}
		44% {
			opacity: 0.8;
		}
		48% {
			opacity: 0;
		}
		60% {
			opacity: 1;
		}
		64% {
			opacity: 0;
		}
		72% {
			opacity: 1;
		}
		76% {
			opacity: 0.5;
		}
		84% {
			opacity: 1;
		}
		88% {
			opacity: 0.7;
		}
		94% {
			opacity: 1;
		}
		100% {
			opacity: 1;
		}
	}
</style>
