<!--
  CurtainTransition.svelte
  Two-panel curtain (left/right) for route transitions.
  Controlled by transitionState rune.
-->
<script lang="ts">
	import { transitionState } from '$lib/states/transition.svelte'

	let reducedMotion = $state(false)

	if (typeof window !== 'undefined') {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
	}

	let isClosed = $derived(transitionState.isCurtainClosed)
</script>

<!-- Left curtain -->
<div
	class="curtain curtain--left"
	class:curtain-transition={!reducedMotion}
	style:transform={isClosed ? 'scaleX(1)' : 'scaleX(0)'}
	aria-hidden="true"
></div>

<!-- Right curtain -->
<div
	class="curtain curtain--right"
	class:curtain-transition={!reducedMotion}
	style:transform={isClosed ? 'scaleX(1)' : 'scaleX(0)'}
	aria-hidden="true"
></div>

<style>
	.curtain {
		pointer-events: none;
		position: fixed;
		top: 0;
		bottom: 0;
		z-index: 9999;
		width: 50%;
		background: black;
	}

	.curtain--left {
		left: 0;
		transform-origin: left;
	}

	.curtain--right {
		right: 0;
		transform-origin: right;
	}
</style>
