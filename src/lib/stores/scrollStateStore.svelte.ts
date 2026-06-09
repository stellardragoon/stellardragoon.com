/**
 * Global scroll state — single source of truth for all section progress.
 *
 * ScrollSection feeds progress into this store via `update()`.
 * Any component reads any section's progress via `scrollState.of('sectionId')`.
 *
 * @example
 * import { scrollState } from '$lib/stores/scrollStateStore.svelte'
 * import { tween } from '$lib/utils/scroll'
 *
 * const p = $derived(scrollState.of('hero'))
 * let opacity = $derived(tween(p, { from: 0, to: 1, at: [0.1, 0.35] }))
 */
class ScrollState {
	/** Per-section progress map. Reassigned on every update to trigger reactivity. */
	private sections = $state<Record<string, number>>({})

	/** Which section was most recently active. */
	activeId = $state('')

	/** Saved scroll position for page transitions. */
	savedScrollY = $state(0)

	/**
	 * Get reactive progress for a section.
	 * Returns 0 if the section hasn't been tracked yet.
	 */
	of(id: string): number {
		return this.sections[id] ?? 0
	}

	/**
	 * Called by ScrollSection's ScrollTrigger on every scroll update.
	 * @param id       Section identifier
	 * @param progress Normalised 0→1 progress
	 */
	update(id: string, progress: number) {
		// Direct property mutation — Svelte 5's deep proxy tracks per-key reads,
		// so only subscribers of this.sections[id] re-evaluate (not all sections).
		const rounded = Number(progress.toFixed(4))
		if (this.sections[id] !== rounded) {
			this.sections[id] = rounded
		}

		// Track the most recently active section (for nav highlighting)
		if (progress > 0 && progress < 1) {
			this.activeId = id
		}
	}

	saveScroll() {
		if (typeof window !== 'undefined') {
			this.savedScrollY = window.scrollY
		}
	}

	restoreScroll() {
		if (typeof window !== 'undefined' && this.savedScrollY > 0) {
			window.scrollTo(0, this.savedScrollY)
		}
	}
}

export const scrollState = new ScrollState()
