import { dev } from '$app/environment'

// 暗号の鍵が含まれているから、Gitに上がってません
// 動かしたいなら、src() 関数を引数をそのまま返すように編集してください
// 例： export function src(filename: string): Promise<string> { return Promise.resolve(filename) }
import DesealWorker from '$lib/workers/deseal.worker?worker'

const R2_HOST = 'https://artifacts.stellardragoon.com'
const pendingRequests = new Map<string, { resolve: Function; reject: Function }>()
const memoryCache = new Map<string, Promise<string>>()
let workerInstance: Worker | null = null

// Lazy-load the worker only when needed
function getWorker(): Worker {
	if (workerInstance) return workerInstance

	workerInstance = new DesealWorker()

	// Update the message handler
	workerInstance.onmessage = e => {
		const { id, success, buffer, mimeType, error } = e.data
		const request = pendingRequests.get(id)

		if (request) {
			if (success && buffer) {
				// Create Blob URL
				const blob = new Blob([buffer], { type: mimeType })
				const url = URL.createObjectURL(blob)
				request.resolve(url)
			} else {
				request.reject(new Error(error))
			}
			pendingRequests.delete(id)
		}
	}

	return workerInstance
}

/**
 * Get the source URL for a given filename.\
 * Don't forget to revoke the object URL after use to free up memory! (URL.revokeObjectURL)\
 * 暗号化アセットをロードし、復号された Blob URL を返す\
 * assets are stored in R2 or similar services\
 * https://URL/[filename].enc
 * @param filename The name of the file to retrieve.
 * @returns A promise that resolves to the object URL of the file.
 */
export function src(filename: string): Promise<string> {
	if (typeof window === 'undefined') return Promise.resolve('')
	if (memoryCache.has(filename)) return memoryCache.get(filename)!

	const promise = (async () => {
		const worker = getWorker()
		const id = crypto.randomUUID()
		const fileWithExt = `${filename}.enc`
		const targetUrl = dev ? `/r2-tunnel/${fileWithExt}` : `${R2_HOST}/${fileWithExt}`

		return new Promise<string>((resolve, reject) => {
			pendingRequests.set(id, { resolve, reject })
			worker.postMessage({ id, url: targetUrl, filename })
		})
	})()

	memoryCache.set(filename, promise)
	// On error, remove from cache to allow retry
	promise.catch(() => memoryCache.delete(filename))
	return promise
}
