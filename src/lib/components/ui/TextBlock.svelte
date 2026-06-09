<!--
  TextBlock.svelte — Heading + body lines block.

  Composes FlickerHeading + TypewriterLines.
  prose prop applies page-level padding + max-width for direct ScrollSection use.

  Each sub-component is self-contained with its own IntersectionObserver.
-->
<script lang="ts">
	import FlickerHeading from '$lib/components/ui/FlickerHeading.svelte'
	import TypewriterLines from '$lib/components/ui/TypewriterLines.svelte'

	interface Props {
		heading: string
		lines: string[]
		pulseLast?: boolean
		/** Applies page-level prose padding and max-width. Use when placed directly in a ScrollSection. */
		prose?: boolean
	}

	let { heading, lines, pulseLast = false, prose = false }: Props = $props()
</script>

<div class="block" class:block--prose={prose}>
	<FlickerHeading {heading} />
	{#if lines.length > 0}
		<TypewriterLines {lines} {pulseLast} />
	{/if}
</div>

<style>
	.block {
		text-align: left;
	}

	.block--prose {
		padding-left: 1.5rem;
		padding-right: 1.5rem;
		max-width: 56rem;
	}

	@media (min-width: 768px) {
		.block--prose {
			padding-left: 4rem;
			padding-right: 4rem;
		}
	}
</style>
