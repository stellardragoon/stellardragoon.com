import { dev } from '$app/environment'

// 暗号の鍵が含まれているから、Gitに上がってません
// 動かしたいなら、src() 関数を引数をそのまま返すように編集してください
// 例： export function src(filename: string): Promise<AssetData> { return Promise.resolve(new ArrayBuffer(0)) }
import DesealWorker from '$lib/workers/deseal.worker?worker'

const R2_HOST = 'https://artifacts.stellardragoon.com'

// --- CONFIGURATION ---
const CACHE_MAX_SIZE_MB = 256 // Max 256MB in RAM
const MAX_BYTE_SIZE = CACHE_MAX_SIZE_MB * 1024 * 1024
// ---------------------

// Unified type for any decrypted asset
export type AssetData = ImageBitmap | ArrayBuffer

/**
 * Size-Aware LRU Cache
 * Evicts items based on total byte usage, not just item count.
 */
class SmartCache {
	private map = new Map<string, AssetData>()
	private currentSizeBytes = 0

	get(key: string): AssetData | undefined {
		const item = this.map.get(key)
		if (item) {
			// Refresh LRU: Move to end (Most Recently Used)
			this.map.delete(key)
			this.map.set(key, item)
		}
		return item
	}

	add(key: string, data: AssetData) {
		const itemSize = this.estimateSize(data)

		// Safety: If single item is larger than entire cache, don't cache it
		if (itemSize > MAX_BYTE_SIZE) {
			console.warn(
				`[SmartCache] Item ${key} (${(itemSize / 1024 / 1024).toFixed(1)}MB) exceeds cache limit. Skipping.`
			)
			return
		}

		// Eviction Loop: Make room for new item
		while (this.currentSizeBytes + itemSize > MAX_BYTE_SIZE) {
			const oldestKey = this.map.keys().next().value
			if (!oldestKey) break

			const oldestItem = this.map.get(oldestKey)!
			const oldestSize = this.estimateSize(oldestItem)

			// Cleanup GPU memory for bitmaps
			if (oldestItem instanceof ImageBitmap) {
				oldestItem.close()
			}

			this.map.delete(oldestKey)
			this.currentSizeBytes -= oldestSize
			// console.log(`[SmartCache] Evicted ${oldestKey} to free ${(oldestSize/1024/1024).toFixed(1)}MB`);
		}

		this.map.set(key, data)
		this.currentSizeBytes += itemSize
	}

	private estimateSize(data: AssetData): number {
		if (data instanceof ImageBitmap) {
			// Rough estimate: Width * Height * 4 bytes (RGBA)
			return data.width * data.height * 4
		}
		if (data instanceof ArrayBuffer) {
			return data.byteLength
		}
		return 0
	}
}

const memoryCache = new SmartCache()

// --- WORKER SETUP ---

let workerInstance: Worker | null = null
const pendingRequests = new Map<string, { resolve: Function; reject: Function }>()

function getWorker(): Worker {
	if (workerInstance) return workerInstance
	workerInstance = new DesealWorker()

	workerInstance.onmessage = async e => {
		const { id, success, buffer, mimeType, error } = e.data
		const request = pendingRequests.get(id)

		if (request) {
			if (success && buffer) {
				try {
					// LOGIC: Decide how to process based on type
					let result: AssetData

					if (mimeType.startsWith('image/') && mimeType !== 'image/svg+xml') {
						// 1. Convert Images to Bitmaps (GPU Ready)
						const blob = new Blob([buffer], { type: mimeType })
						result = await createImageBitmap(blob)
					} else {
						// 2. Keep 3D Models / Audio / SVG as Raw Buffers
						// (GLTFLoader, etc. expect ArrayBuffer)
						result = buffer
					}

					request.resolve(result)
				} catch (err) {
					console.error('Asset processing failed:', err)
					request.reject(err)
				}
			} else {
				request.reject(new Error(error))
			}
			pendingRequests.delete(id)
		}
	}
	return workerInstance
}

/**
 * Main entry point.\
 * Returns ImageBitmap for images, or ArrayBuffer for everything else (GLB, BIN, etc).\
 * 暗号化アセットをロードし、復号されたデータを返す\
 * assets are stored in R2 or similar services\
 * https://URL/[filename].enc \
 * please use SVGs inside Three.js environments only\
 * using it on a \<canvas\> will leak data to the network tab\
 * use PNG or JPEG for \<canvas\> usage.
 */
export async function src(filename: string): Promise<AssetData> {
	if (typeof window === 'undefined') return Promise.reject('SSR not supported')

	// 1. Cache Hit?
	const cached = memoryCache.get(filename)
	if (cached) return cached

	// 2. Worker Fetch
	const worker = getWorker()
	const id = crypto.randomUUID()
	const fileWithExt = `${filename}.enc`
	const targetUrl = dev ? `/r2-tunnel/${fileWithExt}` : `${R2_HOST}/${fileWithExt}`

	const data = await new Promise<AssetData>((resolve, reject) => {
		pendingRequests.set(id, { resolve, reject })
		worker.postMessage({ id, url: targetUrl, filename })
	})

	// 3. Store in Smart Cache
	memoryCache.add(filename, data)

	return data
}

/**
 * Helper for SecureImg component.
 * Safely handles the type check.
 */
export async function renderToCanvas(canvas: HTMLCanvasElement, filename: string) {
	try {
		const data = await src(filename)

		if (data instanceof ImageBitmap) {
			canvas.width = data.width
			canvas.height = data.height
			const ctx = canvas.getContext('2d')
			ctx?.drawImage(data, 0, 0)
		} else if (data instanceof ArrayBuffer && filename.endsWith('.svg')) {
			// Fallback for SVGs: We MUST use a Blob URL because createImageBitmap
			// does not support SVG Blobs in most browsers.
			// NOTE: This will show up in the Network tab as a blob: request.
			const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' })
			const url = URL.createObjectURL(blob)
			const img = new Image()
			await new Promise<void>((resolve, reject) => {
				img.onload = () => {
					canvas.width = img.width
					canvas.height = img.height
					const ctx = canvas.getContext('2d')
					ctx?.drawImage(img, 0, 0)
					URL.revokeObjectURL(url)
					resolve()
				}
				img.onerror = reject
				img.src = url
			})
		} else {
			console.warn(`[renderToCanvas] ${filename} is not an image (Got ${data.constructor.name})`)
		}
	} catch (e) {
		console.error(`Failed to render ${filename}`, e)
	}
}

/*
monday 29122025
アセットの暗号化システムまわりで結構戦った私です。

やりたかったのは、復号した SVG をそのまま `<canvas>` に描画することだったけど、結論から言うと **現状のブラウザでは無理** というところに行き着いた。
Chrome をはじめとして、SVG の Blob を `createImageBitmap` で直接扱うことができないらしい。

結局、SVG を canvas に描画するには一度 `<img>` に読み込ませる必要があって、そのためには `blob:` や `data:` の URL を使うしかない。
そしてそれをやると、必ず Network タブにリソースとして表示されてしまう。
これは実装ミスというより、ブラウザの仕様・限界の問題。

なので、`<canvas>` 上で表示する用途については、SVG を使うのを諦めて PNG / JPEG に妥協することにした。
見た目だけならこれで十分。

一方で、Three.js の扱いは全然違っていて、ここはちょっと救いだった。
Three.js の `SVGLoader` は、SVG を URL 経由で読み込むのではなく、生の XML テキストを JavaScript で直接パースしてジオメトリを生成する。
つまり、ブラウザの画像読み込みパイプラインを通らない。

そのおかげで、復号した生データをそのまま渡しても Network タブには何も漏れない。
Three.js の中で使う分には、SVG を使い続けて問題なさそう。

あと、`src()` の使い方にも注意が必要だと学んだ。
`src()` から返ってくる生データを、いったん `src=` や `url=` に渡すために Blob や Base64 に変換すると、その時点で Network タブに出てしまう。

結論としては、

* `src()` は **生データを直接扱える場所でのみ使う**
* Blob / Base64 を経由してブラウザに「URL として」渡した時点でアウト
* canvas 表示は画像形式に割り切る
* Three.js 内では SVG を使う

という整理になった。

技術的にどうしようもない線引きがどこにあるのか、ちゃんと把握できたのは収穫だった。
*/
