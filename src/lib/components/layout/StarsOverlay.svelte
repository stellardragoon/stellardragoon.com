<!--
    StarsOverlay.svelte (Optimized Canvas Edition with Motion Blur)
    High-performance HTML5 Canvas starfield with mobile-specific parameters
    and scroll-speed based motion blur.
-->
<script lang="ts">
	import { onMount } from 'svelte'

	interface Props {
		density?: number
		driftAmount?: number
		driftSpeed?: number
		mobileDensity?: number
		maxMobileLayers?: number
		mobileBreakpoint?: number
		// モーションブラー関連の新規プロパティ
		motionBlurEnabled?: boolean
		blurAmount?: number // ブラーの強さ倍率
		blurThreshold?: number // ブラーが開始される最小スクロール速度 (px/frame)
		disableGlowOnBlur?: boolean // ブラー中にグロー効果を無効化してパフォーマンスを稼ぐ
		// Constellation interaction
		interactionEnabled?: boolean
		interactionRadius?: number // CSS px radius around pointer to light up stars
		hubChance?: number // probability [0-1] a lit star becomes a hub
		maxHubs?: number // max simultaneous hubs
		connectionRadius?: number // max CSS px between hubs to form a connection
		connectionAlpha?: number // max opacity of constellation lines
		lightUpDuration?: number // ms a star stays lit after interaction
		maxConnectionsPerHub?: number // max simultaneous connections per hub (default 3)
		fadeConnectionsOnScroll?: boolean // fade constellation lines during motion blur
		autoHubEnabled?: boolean // periodically spawn hubs at random screen positions
		autoHubInterval?: number // base ms between auto-spawns (default 3000); actual gap is interval + random(2000)
		autoHubPoints?: number // number of simultaneous simulated touch points per auto-spawn
		autoHubRadius?: number // CSS px radius for each auto-spawn point (default: interactionRadius * 2.5)
	}

	let {
		density = 0.3,
		driftAmount = 0.5,
		driftSpeed = 0.25,
		mobileDensity = 0.25,
		maxMobileLayers = 5,
		mobileBreakpoint = 768,
		motionBlurEnabled = true,
		blurAmount = 1.5,
		blurThreshold = 0.6,
		disableGlowOnBlur = false,
		interactionEnabled = true,
		interactionRadius = 200,
		hubChance = 0.08,
		maxHubs = 10,
		connectionRadius = 260,
		connectionAlpha = 0.22,
		lightUpDuration = 1400,
		maxConnectionsPerHub = 2,
		fadeConnectionsOnScroll = false,
		autoHubEnabled = true,
		autoHubInterval = 3000,
		autoHubPoints = 1,
		autoHubRadius = interactionRadius * 3
	}: Props = $props()

	let canvas: HTMLCanvasElement
	let animationFrameId: number
	let isVisible = true

	interface Star {
		x: number
		y: number
		size: number
		baseOpacity: number
		speed: number
		// Accumulated phase values — mutated incrementally each rendered frame
		phDX1: number // drift X, primary frequency
		phDX2: number // drift X, secondary (×0.7)
		phDY1: number // drift Y, primary frequency
		phDY2: number // drift Y, secondary (×0.8)
		phTw1: number // twinkle main
		phTw2: number // twinkle secondary (×0.6)
		phPl: number // pulse
		// Per-second increments baked at init — avoids mul inside drawStar
		dDX1: number
		dDX2: number
		dDY1: number
		dDY2: number
		dTw1: number
		dTw2: number
		dPl: number
	}

	interface Hub {
		star: Star
		screenX: number // CSS px, updated each frame
		screenY: number
		createdAt: number
		expiresAt: number
		connCount: number // active connections (max 3)
	}

	interface Connection {
		hubA: Hub
		hubB: Hub
		createdAt: number
		expiresAt: number
	}

	let coldStars: Star[] = []
	let warmStars: Star[] = []

	const rnd = (min: number, max: number) => Math.random() * (max - min) + min

	// Fast sin/cos via lookup table — avoids Math.sin/cos overhead on hot draw paths
	const _SIN_N = 8192
	const _SIN_MASK = _SIN_N - 1
	const _SIN_SCALE = _SIN_N / (Math.PI * 2)
	const _sinTable = (() => {
		const t = new Float32Array(_SIN_N)
		for (let i = 0; i < _SIN_N; i++) t[i] = Math.sin((i / _SIN_N) * Math.PI * 2)
		return t
	})()
	// Negative x is safe: `(neg | 0) & mask` wraps correctly via JS 32-bit integer semantics
	const fastSin = (x: number): number => _sinTable[((x * _SIN_SCALE) | 0) & _SIN_MASK]
	const fastCos = (x: number): number =>
		_sinTable[((x * _SIN_SCALE + _SIN_N * 0.25) | 0) & _SIN_MASK]

	onMount(() => {
		const ctx = canvas.getContext('2d', { alpha: true })
		if (!ctx) return

		let dpr = 1
		let viewW = window.innerWidth
		let viewH = window.innerHeight
		let isMobile = viewW <= mobileBreakpoint

		// モーションブラー計算用の状態管理
		let lastScrollY = window.scrollY
		let currentScrollVelocity = 0

		// Adaptive FPS: render every frame by default; back off only under sustained perf pressure
		const PERF_SAMPLES = 60 // ~1 second of samples at 60fps
		const PERF_BUDGET_MS = 1000 / 60 // 16.67 ms — target frame budget
		const PERF_BUDGET_RATIO = 0.75 // trigger at 75% budget usage
		let targetFrameInterval = 0 // 0 = render every RAF frame
		let lastRenderTime = -Infinity
		let lastTime = -1 // tracks every RAF tick for smooth dt
		let frameDurations: number[] = []

		// Constellation interaction runtime state
		let hubs: Hub[] = []
		let connections: Connection[] = []
		const hubStarSet = new Set<Star>()
		const litMap = new Map<Star, number>() // star → expiry timestamp
		const CONN_FADE = 350 // ms for line fade in / out

		const ALL_LAYERS = [
			{ speed: 0.12, baseCount: 90, sizeRange: [1, 1.5] },
			{ speed: 0.32, baseCount: 75, sizeRange: [1.2, 2.0] },
			{ speed: 0.52, baseCount: 60, sizeRange: [1.6, 2.4] },
			{ speed: 0.72, baseCount: 45, sizeRange: [2.0, 2.8] },
			{ speed: 0.9, baseCount: 30, sizeRange: [2.4, 3.0] }
		]

		const initStars = () => {
			coldStars = []
			warmStars = []
			hubs = []
			connections = []
			hubStarSet.clear()
			litMap.clear()
			isMobile = viewW <= mobileBreakpoint
			const currentDensity = isMobile ? mobileDensity : density
			const activeLayers = isMobile ? ALL_LAYERS.slice(0, maxMobileLayers) : ALL_LAYERS

			activeLayers.forEach(({ speed, baseCount, sizeRange }) => {
				const count = Math.round(baseCount * currentDensity)
				for (let i = 0; i < count; i++) {
					const size = rnd(sizeRange[0], sizeRange[1])
					const isWarm = size >= 3.5
					const speedMod = driftSpeed * rnd(0.8, 1.2)
					const twinkleSpeed = rnd(1, 3) + (1 - size / sizeRange[1])
					const pulseSpeed = rnd(0.5, 1.5) + (1 - size / sizeRange[1])

					const star: Star = {
						x: rnd(0, 1),
						y: rnd(0, 1),
						size,
						baseOpacity: rnd(0.15, 0.9),
						speed,
						// Random initial phase offsets
						phDX1: rnd(0, Math.PI * 2),
						phDX2: rnd(0, Math.PI * 2),
						phDY1: rnd(0, Math.PI * 2),
						phDY2: rnd(0, Math.PI * 2),
						phTw1: rnd(0, Math.PI * 2),
						phTw2: rnd(0, Math.PI * 2),
						phPl: rnd(0, Math.PI * 2),
						// Per-second increments (baked, avoids runtime mul)
						dDX1: speedMod,
						dDX2: speedMod * 0.7,
						dDY1: speedMod,
						dDY2: speedMod * 0.8,
						dTw1: twinkleSpeed,
						dTw2: twinkleSpeed * 0.6,
						dPl: pulseSpeed
					}
					if (isWarm) warmStars.push(star)
					else coldStars.push(star)
				}
			})
		}

		const resize = () => {
			viewW = window.innerWidth
			viewH = window.innerHeight
			const wasMobile = isMobile
			isMobile = viewW <= mobileBreakpoint
			const targetDpr = window.devicePixelRatio || 1
			dpr = isMobile ? Math.min(targetDpr, 2) : targetDpr

			canvas.width = viewW * dpr
			canvas.height = viewH * dpr
			canvas.style.width = `${viewW}px`
			canvas.style.height = `${viewH}px`

			if (wasMobile !== isMobile) initStars()
		}

		let resizeTimer: ReturnType<typeof setTimeout>
		const handleResize = () => {
			clearTimeout(resizeTimer)
			resizeTimer = setTimeout(resize, 150)
		}

		// Hoisted frame-state — mutated each tick, closed over by advance/drawStar.
		// Defined once at mount so no closure is allocated on every RAF call.
		let dt = 0
		let currentScrollY = window.scrollY
		let isBlurring = false
		let driftAmp = 0
		let currentNow = 0
		let pendingPointerX = -1
		let pendingPointerY = -1
		let hasPendingPointer = false
		let reconnectTimer = 0
		// Auto-hub: absolute timestamp of next ambient spawn
		let autoHubNextAt = 0 // 0 = schedule on first frame
		// Smooth multiplier for constellation line visibility during motion blur (0=hidden, 1=shown)
		let connLineAlpha = 1

		const advance = (star: Star) => {
			star.phDX1 += star.dDX1 * dt
			star.phDX2 += star.dDX2 * dt
			star.phDY1 += star.dDY1 * dt
			star.phDY2 += star.dDY2 * dt
			star.phTw1 += star.dTw1 * dt
			star.phTw2 += star.dTw2 * dt
			star.phPl += star.dPl * dt
		}

		const drawStar = (star: Star) => {
			let drawY = (star.y * viewH - currentScrollY * star.speed) % viewH
			if (drawY < 0) drawY += viewH

			const dx = (fastSin(star.phDX1) + fastSin(star.phDX2)) * driftAmp
			const dy = (fastSin(star.phDY1) + fastSin(star.phDY2)) * driftAmp

			const x = (star.x * viewW + dx) * dpr
			const y = (drawY + dy) * dpr

			const twinkleOsc = fastSin(star.phTw1) * fastCos(star.phTw2)
			let currentOpacity = star.baseOpacity * (0.6 + 0.4 * twinkleOsc)
			const pulseOsc = fastSin(star.phPl)
			const radius = (star.size * (1 + 0.15 * pulseOsc) * dpr) / 2

			// Lit-up boost from pointer interaction
			const litExpiry = litMap.get(star)
			if (litExpiry !== undefined) {
				if (currentNow >= litExpiry) {
					litMap.delete(star)
				} else {
					const litFade = Math.min(1, (litExpiry - currentNow) / 400)
					currentOpacity = Math.min(1, currentOpacity * (1 + 1.2 * litFade))
				}
			}

			ctx.globalAlpha = currentOpacity < 0 ? 0 : currentOpacity > 1 ? 1 : currentOpacity

			if (isBlurring) {
				const blurVectY = -currentScrollVelocity * star.speed * blurAmount * dpr
				ctx.beginPath()
				ctx.lineWidth = radius * 2
				ctx.moveTo(x, y)
				ctx.lineTo(x, y + blurVectY)
				ctx.stroke()
			} else {
				ctx.beginPath()
				ctx.arc(x, y, radius < 0.1 ? 0.1 : radius, 0, Math.PI * 2)
				ctx.fill()
			}
		}

		// --- Constellation helpers (use hoisted frame-state: currentScrollY, driftAmp, currentNow) ---

		// Returns the current CSS-pixel screen position of a star, matching drawStar's parallax math.
		const getStarScreenPos = (star: Star): [number, number] => {
			let sy = (star.y * viewH - currentScrollY * star.speed) % viewH
			if (sy < 0) sy += viewH
			const dx = (fastSin(star.phDX1) + fastSin(star.phDX2)) * driftAmp
			const dy = (fastSin(star.phDY1) + fastSin(star.phDY2)) * driftAmp
			return [star.x * viewW + dx, sy + dy]
		}

		const isConnected = (a: Hub, b: Hub): boolean =>
			connections.some(c => (c.hubA === a && c.hubB === b) || (c.hubA === b && c.hubB === a))

		const tryConnect = (hub: Hub) => {
			const connRSq = connectionRadius * connectionRadius
			for (const other of hubs) {
				if (
					other === hub ||
					hub.connCount >= maxConnectionsPerHub ||
					other.connCount >= maxConnectionsPerHub
				)
					continue
				if (isConnected(hub, other)) continue
				const dx = hub.screenX - other.screenX
				const dy = hub.screenY - other.screenY
				if (dx * dx + dy * dy < connRSq) {
					connections.push({
						hubA: hub,
						hubB: other,
						createdAt: currentNow,
						expiresAt: currentNow + 2000 + Math.random() * 5000
					})
					hub.connCount++
					other.connCount++
				}
			}
		}

		const promoteToHub = (star: Star, sx: number, sy: number) => {
			if (hubs.length >= maxHubs) return
			const hub: Hub = {
				star,
				screenX: sx,
				screenY: sy,
				createdAt: currentNow,
				expiresAt: currentNow + 3000 + Math.random() * 5000,
				connCount: 0
			}
			hubs.push(hub)
			hubStarSet.add(star)
			tryConnect(hub)
		}

		const handlePointerInteraction = (px: number, py: number, radius = interactionRadius) => {
			const irSq = radius * radius
			const checkStar = (star: Star) => {
				const [sx, sy] = getStarScreenPos(star)
				const dx = sx - px
				const dy = sy - py
				if (dx * dx + dy * dy < irSq) {
					litMap.set(star, currentNow + lightUpDuration)
					if (!hubStarSet.has(star) && Math.random() < hubChance) {
						promoteToHub(star, sx, sy)
					}
				}
			}
			coldStars.forEach(checkStar)
			warmStars.forEach(checkStar)
		}

		const render = (time: number) => {
			animationFrameId = requestAnimationFrame(render)
			if (!isVisible) return

			// dt from every RAF tick — decoupled from throttle so phases never stutter
			dt = lastTime < 0 ? 0 : Math.min((time - lastTime) / 1000, 0.1)
			lastTime = time

			// Advance phases every frame regardless of throttle
			if (dt > 0) {
				coldStars.forEach(advance)
				warmStars.forEach(advance)
			}

			// Skip draw if throttled — phases already advanced so motion stays smooth
			if (time - lastRenderTime < targetFrameInterval) return
			lastRenderTime = time

			const renderStart = performance.now()

			currentScrollY = window.scrollY
			currentScrollVelocity = currentScrollY - lastScrollY
			lastScrollY = currentScrollY

			isBlurring = motionBlurEnabled && Math.abs(currentScrollVelocity) > blurThreshold
			driftAmp = 9 * driftAmount
			currentNow = time
			// Fade constellation lines in/out smoothly around blur state (250ms ramp)
			const connLineTarget = fadeConnectionsOnScroll && isBlurring ? 0 : 1
			const connLineStep = dt / 0.25 // 250 ms full ramp
			if (connLineAlpha < connLineTarget) connLineAlpha = Math.min(connLineAlpha + connLineStep, 1)
			else if (connLineAlpha > connLineTarget)
				connLineAlpha = Math.max(connLineAlpha - connLineStep, 0)

			// Process buffered pointer (uses current frame's scrollY + driftAmp for exact parallax match)
			if (hasPendingPointer && interactionEnabled) {
				hasPendingPointer = false
				handlePointerInteraction(pendingPointerX, pendingPointerY)
			}

			// Ambient auto-hub: simulate multiple random touch points on a timer
			if (autoHubEnabled && interactionEnabled) {
				if (autoHubNextAt === 0) {
					// First frame — schedule the first spawn
					autoHubNextAt = currentNow + autoHubInterval + Math.random() * 2000
				} else if (currentNow >= autoHubNextAt) {
					for (let ap = 0; ap < autoHubPoints; ap++) {
						handlePointerInteraction(Math.random() * viewW, Math.random() * viewH, autoHubRadius)
					}
					autoHubNextAt = currentNow + autoHubInterval + Math.random() * 2000
				}
			}

			// 1. Expire connections by their own timeout; guard connCount against double-expire
			for (let i = connections.length - 1; i >= 0; i--) {
				const c = connections[i]
				if (currentNow >= c.expiresAt) {
					if (currentNow < c.hubA.expiresAt) c.hubA.connCount = Math.max(0, c.hubA.connCount - 1)
					if (currentNow < c.hubB.expiresAt) c.hubB.connCount = Math.max(0, c.hubB.connCount - 1)
					connections.splice(i, 1)
				}
			}

			// 2. Expire hubs; clean orphaned connections; refresh screen positions
			for (let i = hubs.length - 1; i >= 0; i--) {
				const h = hubs[i]
				const [sx, sy] = getStarScreenPos(h.star)
				// Drop hub if its timer expired, star scrolled off-screen, OR the star wrapped
				// around (modulo jump > half the viewport height means it teleported).
				const offScreen = sy < -h.star.size * 2 || sy > viewH + h.star.size * 2
				const wrapped = Math.abs(sy - h.screenY) > viewH * 0.5
				if (currentNow >= h.expiresAt || offScreen || wrapped) {
					hubStarSet.delete(h.star)
					for (let j = connections.length - 1; j >= 0; j--) {
						const c = connections[j]
						if (c.hubA === h || c.hubB === h) {
							const other = c.hubA === h ? c.hubB : c.hubA
							if (currentNow < other.expiresAt) other.connCount = Math.max(0, other.connCount - 1)
							connections.splice(j, 1)
						}
					}
					hubs.splice(i, 1)
				} else {
					h.screenX = sx
					h.screenY = sy
				}
			}

			// Periodic reconnect scan — catches hubs that scroll into range of each other (~1.5s)
			if (currentNow - reconnectTimer > 1500 && hubs.length > 1) {
				reconnectTimer = currentNow
				for (let i = 0; i < hubs.length; i++) {
					tryConnect(hubs[i])
				}
			}

			ctx.clearRect(0, 0, canvas.width, canvas.height)
			ctx.fillStyle = '#fff'
			ctx.strokeStyle = '#fff'
			ctx.lineCap = 'round'

			// Cold Stars (グローなし)
			ctx.shadowBlur = 0
			coldStars.forEach(drawStar)

			// Warm Stars — glow disabled on mobile and during scroll blur if opted in
			const glowRadius = 4 * dpr
			const shouldApplyGlow = !isMobile && !(isBlurring && disableGlowOnBlur)
			if (shouldApplyGlow) {
				ctx.shadowColor = 'rgba(180, 220, 255, 0.35)'
				ctx.shadowBlur = glowRadius
			} else {
				ctx.shadowBlur = 0
			}

			warmStars.forEach(drawStar)
			ctx.globalAlpha = 1
			ctx.shadowBlur = 0

			// Draw constellation lines — fade out during motion blur; data/age keeps running
			if (connections.length > 0 && connLineAlpha > 0) {
				ctx.lineCap = 'round'
				ctx.lineWidth = dpr // 1 CSS px
				ctx.strokeStyle = '#b4dcff'
				ctx.shadowBlur = 0
				for (const conn of connections) {
					const age = currentNow - conn.createdAt
					const remaining = conn.expiresAt - currentNow
					const alpha =
						Math.min(age / CONN_FADE, 1) *
						Math.min(remaining / CONN_FADE, 1) *
						connectionAlpha *
						connLineAlpha
					if (alpha <= 0) continue
					ctx.globalAlpha = alpha
					ctx.beginPath()
					ctx.moveTo(conn.hubA.screenX * dpr, conn.hubA.screenY * dpr)
					ctx.lineTo(conn.hubB.screenX * dpr, conn.hubB.screenY * dpr)
					ctx.stroke()
				}
				ctx.globalAlpha = 1
			}

			// Adaptive reduction: if draw cost exceeds 75% of a 60fps budget, throttle back
			frameDurations.push(performance.now() - renderStart)
			if (frameDurations.length >= PERF_SAMPLES) {
				let sum = 0
				for (let i = 0; i < frameDurations.length; i++) sum += frameDurations[i]
				const avg = sum / PERF_SAMPLES
				if (avg > PERF_BUDGET_MS * PERF_BUDGET_RATIO) {
					targetFrameInterval = Math.min((targetFrameInterval || PERF_BUDGET_MS) * 1.25, 100)
				}
				frameDurations = []
			}
		}

		const handleVisibilityChange = () => {
			isVisible = document.visibilityState === 'visible'
			if (isVisible) {
				// Reset on resume to prevent velocity/dt spikes
				lastScrollY = window.scrollY
				lastRenderTime = -Infinity
				lastTime = -1
				animationFrameId = requestAnimationFrame(render)
			} else {
				cancelAnimationFrame(animationFrameId)
			}
		}

		resize()
		initStars()
		// 初期描画前に一度 lastScrollY を設定
		lastScrollY = window.scrollY
		animationFrameId = requestAnimationFrame(render)

		window.addEventListener('resize', handleResize)
		document.addEventListener('visibilitychange', handleVisibilityChange)

		const onPointerMove = (e: PointerEvent) => {
			pendingPointerX = e.clientX
			pendingPointerY = e.clientY
			hasPendingPointer = true
		}
		const onPointerDown = (e: PointerEvent) => {
			pendingPointerX = e.clientX
			pendingPointerY = e.clientY
			hasPendingPointer = true
		}

		if (interactionEnabled) {
			window.addEventListener('pointermove', onPointerMove, { passive: true })
			window.addEventListener('pointerdown', onPointerDown, { passive: true })
		}

		return () => {
			window.removeEventListener('resize', handleResize)
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			window.removeEventListener('pointermove', onPointerMove)
			window.removeEventListener('pointerdown', onPointerDown)
			clearTimeout(resizeTimer)
			cancelAnimationFrame(animationFrameId)
		}
	})
</script>

<canvas bind:this={canvas} class="stars-root" aria-hidden="true"></canvas>

<style>
	.stars-root {
		position: fixed;
		top: 0;
		left: 0;
		pointer-events: none;
		z-index: -5;
		image-rendering: -moz-crisp-edges;
		image-rendering: pixelated;
	}
</style>
