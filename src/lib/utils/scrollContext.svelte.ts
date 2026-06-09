/**
 * Svelte context for passing scroll progress from ScrollSection to its children.
 *
 * ScrollSection calls `createScrollContext()` during initialisation.
 * Children call `getScrollContext()` to get a reactive `SectionScroll`
 * whose `.progress` (0→1) is updated by ScrollSection's ScrollTrigger.
 *
 * This avoids coupling children to a global store — they just read their
 * own section's progress via context.
 */

import { getContext, setContext } from 'svelte'

const SCROLL_KEY = Symbol('section-scroll-progress')

/** Reactive scroll state passed through context. */
export class SectionScroll {
	/** Normalised scroll progress for this section: 0 → 1. */
	progress = $state(0)
}

/**
 * Create and register a new SectionScroll context.
 * Call this once at the top level of ScrollSection's `<script>`.
 */
export function createScrollContext(): SectionScroll {
	const ctx = new SectionScroll()
	setContext(SCROLL_KEY, ctx)
	return ctx
}

/**
 * Retrieve the SectionScroll from the nearest parent ScrollSection.
 * Call this at the top level of a child component's `<script>`.
 */
export function getScrollContext(): SectionScroll {
	return getContext<SectionScroll>(SCROLL_KEY)
}
