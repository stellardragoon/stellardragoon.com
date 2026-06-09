/**
 * Global curtain transition state.
 * Used by CurtainTransition.svelte, BootScreen.svelte, and layout routing hooks.
 *
 * Phases:
 *   boot    → first load, curtain is closed, boot screen is visible
 *   idle    → curtain fully open, page visible
 *   closing → curtain panels sliding shut
 *   closed  → curtain fully shut (route transition), may preload assets
 *   opening → curtain panels sliding open
 */

export type TransitionPhase = 'boot' | 'idle' | 'closing' | 'closed' | 'opening'

class TransitionState {
	/** Starts in 'boot' — curtain is closed until critical assets load. */
	phase = $state<TransitionPhase>('boot')

	/** Duration of the curtain close/open animation in ms */
	readonly duration = 600

	get isTransitioning(): boolean {
		return this.phase !== 'idle'
	}

	/** True when curtain should be shut (boot, closing, or closed). */
	get isCurtainClosed(): boolean {
		return this.phase === 'boot' || this.phase === 'closing' || this.phase === 'closed'
	}

	/** Start closing the curtain. Returns a promise that resolves when fully closed. */
	async close(): Promise<void> {
		this.phase = 'closing'
		return new Promise(resolve => {
			setTimeout(() => {
				this.phase = 'closed'
				resolve()
			}, this.duration)
		})
	}

	/** Open the curtain after navigation / boot completes. */
	open() {
		this.phase = 'opening'
		setTimeout(() => {
			this.phase = 'idle'
		}, this.duration)
	}

	/** Instantly reset (for reduced-motion or fallback). */
	reset() {
		this.phase = 'idle'
	}
}

export const transitionState = new TransitionState()
