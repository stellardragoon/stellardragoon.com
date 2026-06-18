<script lang="ts">
	export let barHeight: string = '10vh'
	export let scrollRange: string = '0px 300px'
</script>

<div class="cinema-bar top" style:height={barHeight} style:--scroll-range={scrollRange}></div>

<div class="cinema-bar bottom" style:height={barHeight} style:--scroll-range={scrollRange}>
	<div class="subtitle-container">
		<div class="subtitle-ja">このサイトは現在制作中です</div>
		<div class="subtitle-en">This site is under construction</div>
	</div>
</div>

<style>
	.cinema-bar {
		position: fixed;
		left: 0;
		width: 100vw;
		background-color: #000000;
		z-index: 10002;
		pointer-events: none;

		/* 1. SCROLL LOGIC: Uses the 'transform' property */
		animation: slideOut linear both;
		animation-timeline: scroll(root);
		animation-range: var(--scroll-range);

		/* 2. MENU LOGIC: Uses the independent 'translate' property */
		translate: 0 0;
		transition: translate 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.cinema-bar.top {
		top: 0;
		--slide-direction: -100%;
	}

	.cinema-bar.bottom {
		bottom: 0;
		--slide-direction: 100%;

		/* Center the subtitles within the bottom bar */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Subtitle Styling */
	.subtitle-container {
		text-align: center;
		color: #ffffff;
		/* Cinematic text clarity relies heavily on a distinct text-shadow */
		text-shadow:
			0px 2px 4px rgba(0, 0, 0, 0.9),
			0px 0px 2px rgba(0, 0, 0, 0.5);
		font-family: 'Times New Roman', Times, 'Hiragino Mincho ProN', serif;
		user-select: none;
	}

	.subtitle-ja {
		font-size: 1.15rem;
		letter-spacing: 0.08em;
		margin-bottom: 2px;
	}

	.subtitle-en {
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.9;
	}

	/* Target the independent translate property so it smoothly transitions both ways */
	:global(html.nav-drawer-open) .cinema-bar.top {
		translate: 0 -100%;
	}

	:global(html.nav-drawer-open) .cinema-bar.bottom {
		translate: 0 100%;
	}

	@keyframes slideOut {
		to {
			/* The scroll timeline only touches transform */
			transform: translateY(var(--slide-direction));
		}
	}
</style>
