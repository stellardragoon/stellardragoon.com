/**
 * Global asset loading state.
 *
 * Tracks the loading status of every asset in the manifest.
 * Two tiers:
 *   1. **Critical** — preloaded before the curtain opens (boot / route transition).
 *   2. **Lazy** — loaded on demand when a `<ManagedImage>` enters the viewport.
 *
 * Components never call the loader directly — they use `<ManagedImage asset={key} />`
 * and the loader is consulted reactively.
 */

import { assetManifest, type AssetEntry } from '$lib/data/content'

export type AssetStatus = 'idle' | 'loading' | 'loaded' | 'error'

class AssetLoader {
	// ── Reactive state ──────────────────────────────────────
	/** Per-key status record. Svelte 5 deep proxy tracks individual-key reads. */
	statuses = $state<Record<string, AssetStatus>>({})

	/** Bumped on every status change so aggregate getters re-derive correctly. */
	private _tick = $state(0)

	/** True while a `preloadCritical()` call is in-flight. */
	isPreloading = $state(false)

	/** Total number of critical assets targeted by the current preload call. */
	criticalTotal = $state(0)

	/** Number of critical assets that have finished loading (loaded or error). */
	criticalDone = $state(0)

	// ── Accessors ───────────────────────────────────────────

	/** Get status for a single key (reactive). */
	getStatus(key: string): AssetStatus {
		return this.statuses[key] ?? 'idle'
	}

	/** Resolve a manifest key to its `src` path. */
	getSrc(key: string): string | undefined {
		return assetManifest[key]?.src
	}

	/** Get the full manifest entry. */
	getEntry(key: string): AssetEntry | undefined {
		return assetManifest[key]
	}

	/** 0–100 progress of the current critical preload. */
	get criticalProgress(): number {
		void this._tick
		if (this.criticalTotal === 0) return 100
		return Math.round((this.criticalDone / this.criticalTotal) * 100)
	}

	/** Critical assets that failed to load (404, network error, timeout). */
	get criticalErrors(): { key: string; src: string }[] {
		void this._tick
		const result: { key: string; src: string }[] = []
		for (const key of Object.keys(this.statuses)) {
			if (this.statuses[key] === 'error' && assetManifest[key]?.priority === 'critical') {
				result.push({ key, src: assetManifest[key]!.src })
			}
		}
		return result
	}

	/** Number of lazy assets currently in-flight. */
	get lazyInFlight(): number {
		void this._tick
		let n = 0
		for (const key of Object.keys(this.statuses)) {
			if (this.statuses[key] === 'loading' && assetManifest[key]?.priority === 'lazy') n++
		}
		return n
	}

	/** List of assets currently loading (for the boot / indicator text). */
	get loadingAssets(): { key: string; entry: AssetEntry }[] {
		void this._tick
		const result: { key: string; entry: AssetEntry }[] = []
		for (const key of Object.keys(this.statuses)) {
			if (this.statuses[key] === 'loading') {
				const entry = assetManifest[key]
				if (entry) result.push({ key, entry })
			}
		}
		return result
	}

	// ── Mutations ───────────────────────────────────────────

	/** Mark an asset as 'loading'. Called by ManagedImage on intersection. */
	requestLoad(key: string): void {
		const current = this.statuses[key]
		if (!current || current === 'idle') {
			this.statuses[key] = 'loading'
			this._tick++
		}
	}

	/** Mark an asset as successfully loaded. */
	markLoaded(key: string): void {
		if (this.statuses[key] !== 'loaded') {
			this.statuses[key] = 'loaded'
			this._tick++
		}
	}

	/** Mark an asset as failed to load. */
	markError(key: string): void {
		if (this.statuses[key] !== 'error') {
			this.statuses[key] = 'error'
			this._tick++
		}
	}

	// ── Preloading ──────────────────────────────────────────

	/**
	 * Preload all critical assets that match the given route.
	 * Returns when every critical asset is loaded (or errored / timed out).
	 */
	async preloadCritical(route: string): Promise<void> {
		const entries = Object.entries(assetManifest).filter(([, entry]) => {
			if (entry.priority !== 'critical') return false
			return entry.routes?.some(r => r === '*' || r === route) ?? false
		})

		// Skip assets already loaded (e.g. from a previous navigation)
		const pending = entries.filter(([key]) => this.statuses[key] !== 'loaded')

		this.criticalTotal = pending.length
		this.criticalDone = 0
		this.isPreloading = true

		await Promise.allSettled(
			pending.map(([key, entry]) =>
				this._preloadOne(key, entry).finally(() => {
					this.criticalDone++
				})
			)
		)

		this.isPreloading = false
	}

	// ── Internal helpers ────────────────────────────────────

	private async _preloadOne(key: string, entry: AssetEntry): Promise<void> {
		this.requestLoad(key)
		try {
			if (entry.type === 'image') {
				await this._preloadImage(entry.src)
			} else if (entry.type === 'video') {
				await this._preloadVideo(entry.src)
			}
			this.markLoaded(key)
		} catch {
			// Graceful degradation — mark error but don't block boot
			this.markError(key)
		}
	}

	private _preloadImage(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const img = new Image()
			const timer = setTimeout(() => resolve(), 10_000) // 10 s timeout
			img.onload = () => {
				clearTimeout(timer)
				resolve()
			}
			img.onerror = () => {
				clearTimeout(timer)
				reject(new Error(`Image load failed: ${src}`))
			}
			img.src = src
		})
	}

	private _preloadVideo(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const video = document.createElement('video')
			video.preload = 'auto'
			video.muted = true
			const timer = setTimeout(() => {
				cleanup()
				resolve()
			}, 15_000) // 15 s timeout
			const cleanup = () => {
				clearTimeout(timer)
				video.oncanplay = null
				video.onerror = null
				video.src = ''
				video.remove()
			}
			video.oncanplay = () => {
				cleanup()
				resolve()
			}
			video.onerror = () => {
				cleanup()
				reject(new Error(`Video load failed: ${src}`))
			}
			video.src = src
		})
	}
}

export const assetLoader = new AssetLoader()
