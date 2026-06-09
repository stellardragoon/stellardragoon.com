/**
 * Shared IntersectionObserver pool.
 *
 * Instead of each component creating its own `new IntersectionObserver(...)`,
 * all elements that share the same options reuse a single observer instance.
 * During fast scroll the browser fires ONE batched callback with all entries
 * rather than N separate callbacks — reducing per-frame reactive update cost.
 *
 * Usage:
 *   import { observe } from '$lib/utils/intersect'
 *
 *   onMount(() => {
 *     return observe(el, (entry) => { ... }, { threshold: 0.15 })
 *   })
 */

type IntersectCallback = (entry: IntersectionObserverEntry) => void

interface PoolEntry {
	io: IntersectionObserver
	callbacks: Map<Element, IntersectCallback>
}

const pool = new Map<string, PoolEntry>()

function optionsKey(options: IntersectionObserverInit): string {
	return JSON.stringify({
		rootMargin: options.rootMargin ?? '0px',
		threshold: options.threshold ?? 0
	})
}

/**
 * Observe `el` with a shared IntersectionObserver.
 * Returns a cleanup function — call it in `onMount`'s return or `onDestroy`.
 */
export function observe(
	el: Element,
	callback: IntersectCallback,
	options: IntersectionObserverInit = {}
): () => void {
	const key = optionsKey(options)

	if (!pool.has(key)) {
		const callbacks = new Map<Element, IntersectCallback>()
		const io = new IntersectionObserver(entries => {
			for (const entry of entries) {
				callbacks.get(entry.target)?.(entry)
			}
		}, options)
		pool.set(key, { io, callbacks })
	}

	const { io, callbacks } = pool.get(key)!
	callbacks.set(el, callback)
	io.observe(el)

	return () => {
		io.unobserve(el)
		callbacks.delete(el)
		// Tear down the shared observer when no elements remain
		if (callbacks.size === 0) {
			io.disconnect()
			pool.delete(key)
		}
	}
}
