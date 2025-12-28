import { dev } from '$app/environment'

// 暗号の鍵が含まれているから、Gitに上がってない
// 動かしたいなら、src() 関数を引数をそのまま返すように編集してください
// 例： export function src(filename: string): Promise<string> { return Promise.resolve(filename) }
import DecryptWorker from '$lib/workers/deseal.worker.ts?worker'

const R2_HOST = 'https://artifacts.stellardragoon.com' // カッコいいでしょ？

const CACHE_NAME = 'decrypted-assets-v1'
// Dummy domain used to generate valid Request keys for the Cache API.
// Since decrypted assets are blobs/buffers and don't have real network URLs,
// we use this consistent base to store and retrieve them by filename.
// No actual network requests are made to this domain.
const CACHE_BASE_URL = 'https://cache.local/'

let workerInstance: Worker | null = null
const pendingRequests = new Map<
	string,
	{ resolve: Function; reject: Function; mimeType: string; filename: string }
>()
const memoryCache = new Map<string, Promise<string>>()

function getWorker(): Worker {
	if (workerInstance) return workerInstance

	workerInstance = new DecryptWorker()

	workerInstance.onmessage = async e => {
		const { id, success, buffer, error } = e.data
		const request = pendingRequests.get(id)

		if (request) {
			if (success) {
				const blob = new Blob([buffer], { type: request.mimeType })

				// Cache the decrypted result
				try {
					const cache = await caches.open(CACHE_NAME)
					const cacheUrl = new URL(request.filename, CACHE_BASE_URL).toString()
					await cache.put(cacheUrl, new Response(blob))
				} catch (err) {
					console.warn('Failed to cache asset:', err)
				}

				const objectUrl = URL.createObjectURL(blob)
				request.resolve(objectUrl)
			} else {
				request.reject(new Error(error))
			}
			pendingRequests.delete(id)
		}
	}

	return workerInstance
}

const getMimeType = (filename: string) => {
	const ext = filename
		.replace(/\.enc$/, '')
		.split('.')
		.pop()
		?.toLowerCase()
	switch (ext) {
		case 'svg':
			return 'image/svg+xml'
		case 'png':
			return 'image/png'
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg'
		case 'webp':
			return 'image/webp'
		default:
			return ''
	}
}

/**
 * 暗号化アセットをロードし、復号された Blob URL を返す\
 * assets are stored in R2 or similar services\
 * https://URL/[filename].enc
 * @param filename ファイル名
 */
export function src(filename: string): Promise<string> {
	// SSRガード（SSR使わないから要らないかも？)
	if (typeof window === 'undefined') return Promise.resolve('')

	if (memoryCache.has(filename)) {
		return memoryCache.get(filename)!
	}

	const promise = (async () => {
		// Try to get from Cache API first
		try {
			const cache = await caches.open(CACHE_NAME)
			const cacheUrl = new URL(filename, CACHE_BASE_URL).toString()
			const cachedResponse = await cache.match(cacheUrl)
			if (cachedResponse) {
				const blob = await cachedResponse.blob()
				return URL.createObjectURL(blob)
			}
		} catch (e) {
			console.warn('Cache API error', e)
		}

		const worker = getWorker()
		const id = crypto.randomUUID()

		const fileWithExt = `${filename}.enc`
		const mimeType = getMimeType(fileWithExt)

		let targetUrl: string
		if (dev) {
			targetUrl = `/r2-tunnel/${fileWithExt}` // vite.config.ts のプロキシ設定を利用
		} else {
			targetUrl = `${R2_HOST}/${fileWithExt}`
		}

		return new Promise<string>((resolve, reject) => {
			pendingRequests.set(id, { resolve, reject, mimeType, filename })
			worker.postMessage({ id, url: targetUrl })
		})
	})()

	memoryCache.set(filename, promise)

	// If it fails, remove from memory cache so it can be retried
	promise.catch(() => {
		memoryCache.delete(filename)
	})

	return promise
}
