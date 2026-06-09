<!--
  Home page — assembles all section components.
  Sections use natural content height unless explicitly sized.
  Pinned sections specify pinDistance for scroll-linked choreography.
  Each section reads scrollState.of(id) + tween() for imperative animations.
-->
<script lang="ts">
	import ScrollSection from '$lib/components/ui/ScrollSection.svelte'
	import TextBlock from '$lib/components/ui/TextBlock.svelte'
	import HeroSection from '$lib/components/home/HeroSection.svelte'
	import MembersSection from '$lib/components/home/MembersSection.svelte'
	import WorldviewSection from '$lib/components/home/WorldviewSection.svelte'
	import WorksSection from '$lib/components/home/WorksSection.svelte'
	import FooterLinks from '$lib/components/home/FooterLinks.svelte'
	import { prologueContent, overviewBlocks } from '$lib/data/content'
</script>

<main>
	<ScrollSection id="hero" height="100dvh">
		<HeroSection />
	</ScrollSection>

	<div class="section-gap"></div>

	<ScrollSection id="prologue">
		<TextBlock
			prose
			heading={prologueContent.title}
			lines={prologueContent.paragraphLines}
			pulseLast={true}
		/>
	</ScrollSection>

	<div class="section-gap"></div>

	<ScrollSection id="overview">
		<TextBlock prose heading={overviewBlocks[0]!.heading} lines={[overviewBlocks[0]!.body]} />
	</ScrollSection>

	<div class="section-gap"></div>

	<ScrollSection id="members">
		<MembersSection />
	</ScrollSection>

	<div class="section-gap"></div>

	<ScrollSection id="worldview">
		<WorldviewSection />
	</ScrollSection>

	<div class="section-gap"></div>

	<ScrollSection id="works">
		<WorksSection />
	</ScrollSection>

	<div class="section-gap"></div>

	<ScrollSection id="footer" height="100dvh">
		<FooterLinks />
	</ScrollSection>
</main>

<style>
	main {
		/* Constrain content to 16:9 of viewport height — handles ultrawide (32:9 etc).
		   Background fills the full viewport separately.
		   --full-height: single source of truth for "one viewport height" within the
		   content column. Use var(--full-height) instead of 100vh in child components
		   so this can be swapped to 100dvh or adjusted without touching each section.
		   container-type: inline-size — enables cqw/cqi units inside children so they
		   size relative to this constrained column, not the full viewport width. */
		max-width: calc(100vh * 16 / 9);
		margin-inline: auto;
		position: relative;
		--full-height: 100dvh;
		container-type: inline-size;
	}

	.section-gap {
		height: calc(var(--full-height) * 0.8);
	}
</style>
