/**
 * smoothScroll.ts — MOS-style smooth scroll with automatic input detection.
 *
 * On first load, samples the first few wheel events. If any produce a large
 * discrete jump (bare mouse wheel, no OS-level smoothing), JS-based smooth
 * scrolling is enabled for the session. Trackpad users and those already running
 * MOS / SteelSeries Engine / etc. get native scrolling untouched.
 *
 * Algorithm: TARGET ACCUMULATION + EXPONENTIAL LERP
 *   Each wheel notch adds (STEP × SPEED) pixels to a target position.
 *   The actual scroll position eases toward that target via a lerp whose rate
 *   is derived from DURATION. Total distance per notch ≈ STEP × SPEED px —
 *   predictable, bounded, and proportional to the MOS panel settings.
 *
 *   This is fundamentally different from a velocity-decay model where the total
 *   displacement = velocity₀ / (1 − decay), which grows unboundedly with
 *   long durations. The target-lerp approach avoids that entirely.
 *
 * Config mirrors the MOS settings panel:
 *   STEP     — pixels added to target per standard notch  (33.60)
 *   SPEED    — multiplier: one notch ≈ STEP × SPEED px    (2.70  → ~90.7 px)
 *   DURATION — ease-out duration in seconds               (4.35)
 *
 * Hot path (tick + onWheel) is allocation-free: all mutable state lives at
 * module level so no closures or objects are created per frame or event.
 */

// ── Config ────────────────────────────────────────────────────────────────────
// PER_NOTCH  — pixels added to scroll target per standard mouse notch (deltaY≈100)
//              100–120 px is the industry sweet spot; increase for faster travel.
// LERP_RATE  — fraction of remaining gap closed each frame at 60 fps.
//              0.1 ≈ settles in ~0.75 s (Lenis / Smooth Scrollbar default).
//              Lower = floatier; higher = snappier.
const PER_NOTCH = 100 // px per notch
const LERP_RATE = 0.1 // ~0.75 s ease-out at 60 fps

// Normalized |deltaY| threshold for classifying a wheel event as unsmoothed.
// Trackpad / MOS output: typically < 10 px. Bare mouse wheel: 100–120 px.
const MOUSE_THRESHOLD = 50

// Events to sample before deciding input type.
const DETECTION_SAMPLES = 2

// Gap below this (px) is considered settled — stops the rAF loop.
const STOP_THRESHOLD = 0.5

// ── Module-level animation state (allocation-free hot path) ──────────────────
let _targetY = 0 // destination the scroll is heading toward
let _currentY = 0 // animated position (authoritative, avoids re-reading scrollY)
let _rafId = 0

// ── Animation tick ────────────────────────────────────────────────────────────
function tick(): void {
	// Clamp target to page bounds.
	const maxY = document.documentElement.scrollHeight - window.innerHeight
	if (_targetY < 0) _targetY = 0
	else if (_targetY > maxY) _targetY = maxY

	const diff = _targetY - _currentY

	if (diff > STOP_THRESHOLD || diff < -STOP_THRESHOLD) {
		_currentY += diff * LERP_RATE
		window.scrollTo(0, _currentY)
		_rafId = requestAnimationFrame(tick)
	} else {
		// Snap to target and stop.
		_currentY = _targetY
		window.scrollTo(0, _currentY)
		_rafId = 0
	}
}

// ── Wheel event handler (only registered after mouse is confirmed) ─────────────
function onWheel(e: WheelEvent): void {
	e.preventDefault()

	// Normalize deltaY to pixels regardless of deltaMode.
	let d = e.deltaY
	if (e.deltaMode === 1)
		d *= 40 // DOM_DELTA_LINE  (~40 px/line)
	else if (e.deltaMode === 2) d *= window.innerHeight // DOM_DELTA_PAGE

	if (!_rafId) {
		// Sync BOTH state values to current scroll on the first event of a new
		// gesture — _targetY must start at the real position or the first tick
		// computes a massive negative diff and jumps to the top of the page.
		_currentY = window.scrollY
		_targetY = _currentY + (d / 100) * PER_NOTCH
		_rafId = requestAnimationFrame(tick)
	} else {
		_targetY += (d / 100) * PER_NOTCH
	}
}

// ── Public API ────────────────────────────────────────────────────────────────
export interface SmoothScrollHandle {
	/** Remove all listeners and cancel any in-flight animation. */
	destroy(): void
	/** Reset momentum (call on page/route change). */
	reset(): void
}

/**
 * Start the smooth-scroll detection/activation lifecycle.
 * Call once from `onMount` in the root layout.
 */
export function initSmoothScroll(): SmoothScrollHandle {
	if (typeof window === 'undefined') {
		return { destroy: noop, reset: noop }
	}

	let samples = 0
	let mouseDetected = false

	function detect(e: WheelEvent): void {
		// Normalise before threshold check so LINE-mode mice are treated equally.
		const abs = e.deltaMode === 0 ? Math.abs(e.deltaY) : Math.abs(e.deltaY) * 40
		if (abs >= MOUSE_THRESHOLD) mouseDetected = true

		if (++samples < DETECTION_SAMPLES) return

		// Detection complete — teardown passive listener.
		window.removeEventListener('wheel', detect)

		if (mouseDetected) {
			// Bare mouse wheel confirmed: activate momentum scroll.
			window.addEventListener('wheel', onWheel, { passive: false })
		}
		// Trackpad / pre-smoothed input: do nothing, native scroll is already great.
	}

	window.addEventListener('wheel', detect, { passive: true })

	return {
		destroy(): void {
			window.removeEventListener('wheel', detect)
			window.removeEventListener('wheel', onWheel)
			if (_rafId) {
				cancelAnimationFrame(_rafId)
				_rafId = 0
			}
			_targetY = 0
			_currentY = 0
		},
		reset(): void {
			if (_rafId) {
				cancelAnimationFrame(_rafId)
				_rafId = 0
			}
			_targetY = typeof window !== 'undefined' ? window.scrollY : 0
			_currentY = _targetY
		}
	}
}

function noop(): void {}
