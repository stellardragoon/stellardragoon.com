/**
 * Scroll animation utilities.
 *
 * All helpers are pure functions — no reactive state, no side effects.
 * Sections use these with `$derived` to turn a 0→1 scroll progress
 * into per-element animation values.
 */

/** Clamp a value between `min` and `max`. */
export function clamp(value: number, min = 0, max = 1): number {
	return Math.min(max, Math.max(min, value))
}

/**
 * Map a section progress (0→1) into a sub-range.
 *
 * Returns 0 when `progress ≤ start`, 1 when `progress ≥ end`,
 * and a linearly interpolated value in between.
 *
 * @example
 * // Fade in during the first 30% of scroll
 * let opacity = $derived(range(progress, 0, 0.3))
 *
 * // Fade out during the last 20%
 * let opacity = $derived(1 - range(progress, 0.8, 1))
 */
export function range(progress: number, start: number, end: number): number {
	if (end <= start) return progress >= end ? 1 : 0
	return clamp((progress - start) / (end - start))
}

/**
 * Linear interpolation between `a` and `b` by factor `t` (clamped 0→1).
 *
 * @example
 * // Scale from 0.5 → 1 during progress range
 * let scale = $derived(lerp(0.5, 1, range(progress, 0.1, 0.5)))
 */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * clamp(t)
}

// ── tween() — the primary animation helper ────────────────────────

export interface TweenOpts {
	/** Start value. */
	from: number
	/** End value. */
	to: number
	/** Progress sub-range [start, end] during which the tween plays. */
	at: [number, number]
}

/**
 * Interpolate a value across a progress sub-range. Combines `range` + `lerp`
 * into a single readable call.
 *
 * @param progress  Current scroll progress (0→1)
 * @param opts      `{ from, to, at: [start, end] }`
 * @returns         Interpolated value, clamped to `from`..`to`
 *
 * @example
 * // Title slides from y:-50 to y:0 during the first 15% of scroll
 * let titleY = $derived(tween(p, { from: -50, to: 0, at: [0, 0.15] }))
 *
 * // Opacity fades from 0→1 during 10%–35%
 * let opacity = $derived(tween(p, { from: 0, to: 1, at: [0.1, 0.35] }))
 *
 * // Scale from 0.88→1 during 84%–100%
 * let scale = $derived(tween(p, { from: 0.88, to: 1, at: [0.84, 1] }))
 */
export function tween(progress: number, opts: TweenOpts): number {
	const t = range(progress, opts.at[0], opts.at[1])
	return lerp(opts.from, opts.to, t)
}
