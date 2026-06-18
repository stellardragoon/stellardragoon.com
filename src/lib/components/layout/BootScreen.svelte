<script lang="ts">
	import { onMount, untrack } from 'svelte'
	import { assetLoader } from '$lib/states/assets.svelte'
	import { transitionState } from '$lib/states/transition.svelte'
	import { SvelteSet } from 'svelte/reactivity'

	interface BootLine {
		hex: string
		label: string
		status: 'ok' | 'load' | 'fail'
	}

	// 霊子演算および魔術回路構築を模した日本語ターミナルログ
	const FAKE_OPS: string[] = [
		'初期化  /視界平面・状態同期...',
		'共鳴    /核・エーテル機関接続',
		'紡織    /描画・術式回路の形成',
		'定着    /記憶・聖痕目録の展開',
		'転移    /連動・因果律トリガー',
		'調律    /外海・使い魔同期シグナル',
		'召喚    /境界・結界カーテンレイヤー',
		'残響    /視差・空間位相魔方陣',
		'展開    /核・アニマ統括機構マウント',
		'解析    /外観・色彩神託所の解決',
		'律動    /動態・時間軸制御シーケンス',
		'索引    /記憶・ルーン原典インデックス',
		'強制    /観測・交差認識領域の固定',
		'潮流    /先読・霊素供給ライン確保',
		'架橋    /境界・現世境界界面の構築',
		'配分    /魔力・霊素演算基盤アロケート',
		'点火    /描画・三次元術式炉の活性化',
		'契約    /記憶・既知契約キャッシュ確認',
		'循環    /核・紋章循環律の同期完了'
	]

	let lines = $state<BootLine[]>([])
	let scrollEl = $state<HTMLDivElement>(undefined as unknown as HTMLDivElement)
	let fakeIdx = 0
	let lineCount = 0
	let intervalId: ReturnType<typeof setInterval> | undefined
	let seenLoadingKeys = new SvelteSet<string>()
	let seenErrorKeys = new SvelteSet<string>()
	let completed = false

	let isActive = $state(false)
	let opacity = $state(0)
	let showWarning = $state(false)

	function randomHex(): string {
		return '0x' + Math.random().toString(16).substring(2, 10).toUpperCase()
	}

	function addLine(label: string, status: BootLine['status'] = 'ok') {
		lineCount++
		lines.push({ hex: randomHex(), label, status })
		if (lineCount > 200) {
			lines.splice(0, lineCount - 200)
			lineCount = 200
		}
	}

	function startScroll() {
		lines = []
		lineCount = 0
		seenLoadingKeys = new SvelteSet()
		seenErrorKeys = new SvelteSet()
		completed = false
		fakeIdx = 0
		addLine('✦ 霊子演算システム起動 ＞ STELLAR DRAGOON OS v5.0-ARCANE')
		addLine('────────────────────────────────────────────────────────────')

		intervalId = setInterval(() => {
			for (const a of assetLoader.loadingAssets) {
				if (!seenLoadingKeys.has(a.key)) {
					seenLoadingKeys.add(a.key)
					addLine(`読込    /術式資産・構成要素 [${a.key}]`, 'load')
				}
			}
			for (const e of assetLoader.criticalErrors) {
				if (!seenErrorKeys.has(e.key)) {
					seenErrorKeys.add(e.key)
					addLine(`断絶    /魔力結晶・破損破片 [${e.key}] ─ ${e.src}`, 'fail')
				}
			}
			addLine(FAKE_OPS[fakeIdx % FAKE_OPS.length])
			fakeIdx++
			if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight
		}, 40)
	}

	function stopScroll() {
		if (intervalId) {
			clearInterval(intervalId)
			intervalId = undefined
		}
	}

	function confirmAndReveal() {
		showWarning = false
		transitionState.open()
		setTimeout(() => {
			opacity = 0
		}, 100)
		setTimeout(() => {
			isActive = false
		}, 600)
	}

	onMount(() => {
		isActive = true
		opacity = 1
		startScroll()
		return () => stopScroll()
	})

	$effect(() => {
		const total = assetLoader.criticalTotal
		const loading = assetLoader.isPreloading

		if (total > 0 && !loading && isActive && !completed) {
			completed = true
			untrack(() => {
				stopScroll()
				const errors = assetLoader.criticalErrors
				if (errors.length > 0) {
					for (const e of errors) {
						if (!seenErrorKeys.has(e.key)) {
							seenErrorKeys.add(e.key)
							addLine(`断絶    /魔力結晶・破損破片 [${e.key}] ─ ${e.src}`, 'fail')
						}
					}
					addLine(`≫ 儀式中断 ─ ${errors.length} 個の構成術式に致命的な乖離が発生`, 'fail')
					addLine('≫ 警告：強制展開には安全制御シークエンスの破棄が必要です', 'fail')
					if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight
					showWarning = true
				} else {
					addLine('✦ 術式展開完了 ─ すべての魔方陣および回路は正常に機能しています')
					if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight
					setTimeout(() => {
						opacity = 0
					}, 500)
					setTimeout(() => {
						isActive = false
					}, 1000)
				}
			})
		}
	})

	let progress = $derived(assetLoader.criticalProgress)
	let errorCount = $derived(assetLoader.criticalErrors.length)
</script>

{#if isActive}
	<div class="boot-screen" style="opacity: {opacity};" aria-hidden={!showWarning}>
		<div class="boot-screen__scanlines"></div>
		<div class="boot-screen__grid"></div>
		<div class="boot-screen__aura"></div>

		<div class="boot-screen__frame">
			<span class="boot-screen__corner tl">🝔</span>
			<span class="boot-screen__corner tr">🝔</span>
			<span class="boot-screen__corner bl">🝔</span>
			<span class="boot-screen__corner br">🝔</span>
		</div>

		<div bind:this={scrollEl} class="boot-screen__log">
			{#each lines as line (line.hex)}
				<div class="boot-screen__line {line.status === 'fail' ? 'boot-screen__line--error' : ''}">
					{#if line.hex}
						<span class="boot-screen__hex">⎔ {line.hex}</span>
					{/if}
					<span class="boot-screen__text boot-screen__text--{line.status}"> {line.label}</span>
					{#if line.status === 'ok'}
						<span class="boot-screen__status boot-screen__status--ok">◆ 展開完了</span>
					{:else if line.status === 'load'}
						<span class="boot-screen__status boot-screen__status--load">⚡ 詠唱中</span>
					{:else}
						<span class="boot-screen__status boot-screen__status--fail">✕ 崩壊</span>
					{/if}
				</div>
			{/each}
		</div>

		<div class="boot-screen__panel">
			{#if showWarning}
				<div class="boot-screen__warning">
					<div class="boot-screen__warning-header">
						<span class="boot-screen__warning-icon">⚠</span>
						<p class="boot-screen__warning-title">術式構成エラー：世界の乖離を検知</p>
					</div>
					<p class="boot-screen__warning-body">
						{errorCount} 個の固有資産エレメントが虚無に霧散しました。 現実構造の構築プロセスが劣化、または一部の視覚要素が不完全に顕現する可能性があります。
					</p>
					<button
						type="button"
						class="boot-screen__confirm"
						onclick={confirmAndReveal}
						aria-label="強制顕現"
					>
						[ 安全制御を破棄して強制展開 ]
					</button>
				</div>
			{:else}
				<div class="boot-screen__progress">
					<div class="boot-screen__progress-meta">
						<span class="boot-screen__progress-label">魔力回路同調率 (MANA ALIGNMENT)</span>
						<span class="boot-screen__progress-pct">{progress}%</span>
					</div>
					<div class="boot-screen__progress-track">
						<div class="boot-screen__progress-fill" style="width: {progress}%;">
							<div class="boot-screen__progress-light"></div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* ── ベースレイアウト & 環境光 ─────────────────── */
	.boot-screen {
		position: fixed;
		inset: 0;
		z-index: 10003;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		background: #030108; /* 深淵なる黒紫 */
		padding: 2rem;
		font-family: 'Courier New', Courier, monospace;
		overflow: hidden;
		transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* 空間を漂う魔力オーラ */
	.boot-screen__aura {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle at 50% 30%,
			rgba(147, 51, 234, 0.15) 0%,
			rgba(6, 182, 212, 0.05) 45%,
			transparent 70%
		);
		pointer-events: none;
		animation: auraBreath 8s ease-in-out infinite alternate;
	}

	/* レトロサイバーな走査線 */
	.boot-screen__scanlines {
		position: absolute;
		inset: 0;
		background: linear-gradient(rgba(18, 10, 36, 0) 50%, rgba(0, 0, 0, 0.4) 50%);
		background-size: 100% 4px;
		pointer-events: none;
		z-index: 5;
		opacity: 0.6;
	}

	/* デジタル魔方陣のバックグラウンドグリッド */
	.boot-screen__grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
		background-size: 40px 40px;
		background-position: center;
		pointer-events: none;
		transform: perspective(500px) rotateX(60deg) translateY(-10%) scale(2);
		opacity: 0.5;
		transform-origin: top center;
	}

	/* 魔術結界フレーム */
	.boot-screen__frame {
		position: absolute;
		inset: 1.25rem;
		border: 1px solid rgba(6, 182, 212, 0.15);
		pointer-events: none;
		z-index: 4;
	}

	.boot-screen__corner {
		position: absolute;
		font-size: 14px;
		color: rgba(6, 182, 212, 0.5);
		text-shadow: 0 0 6px rgba(6, 182, 212, 0.8);
	}
	.tl {
		top: -8px;
		left: -6px;
	}
	.tr {
		top: -8px;
		right: -6px;
	}
	.bl {
		bottom: -12px;
		left: -6px;
	}
	.br {
		bottom: -12px;
		right: -6px;
	}

	/* ── スクロールログ ───────────────────────────────── */
	.boot-screen__log {
		flex: 1;
		overflow: hidden;
		font-size: 11px;
		line-height: 1.9;
		letter-spacing: 0.08em;
		color: rgba(165, 243, 252, 0.85); /* ネオンシアン */
		mask-image: linear-gradient(to bottom, transparent 0%, #000 12%);
		padding-top: 3rem;
		z-index: 2;
	}

	@media (min-width: 768px) {
		.boot-screen__log {
			font-size: 0.85rem;
		}
	}

	.boot-screen__line {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		white-space: nowrap;
		text-shadow: 0 0 8px rgba(6, 182, 212, 0.2);
		animation: lineSlipIn 0.2s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
	}

	.boot-screen__hex {
		color: rgba(147, 51, 234, 0.6); /* 魔術パープル */
		font-size: 10px;
	}

	.boot-screen__text {
		flex: 1;
	}
	.boot-screen__text--ok {
		color: rgba(207, 250, 254, 0.9);
	}
	.boot-screen__text--load {
		color: #fef08a;
		text-shadow: 0 0 8px rgba(254, 240, 138, 0.5);
	}
	.boot-screen__text--fail {
		color: #fca5a5;
	}

	/* ステータスバッジ */
	.boot-screen__status {
		font-size: 9px;
		font-weight: bold;
		padding: 2px 8px;
		border-radius: 2px;
		background: rgba(0, 0, 0, 0.4);
	}
	.boot-screen__status--ok {
		color: #34d399;
		border: 1px solid rgba(52, 211, 153, 0.3);
		text-shadow: 0 0 6px rgba(52, 211, 153, 0.5);
	}
	.boot-screen__status--load {
		color: #fbbf24;
		border: 1px solid rgba(251, 191, 36, 0.3);
		animation: pulseLight 0.8s ease-in-out infinite alternate;
	}
	.boot-screen__status--fail {
		color: #f87171;
		border: 1px solid rgba(248, 113, 113, 0.4);
		background: rgba(239, 68, 68, 0.1);
		text-shadow: 0 0 6px rgba(248, 113, 113, 0.6);
	}

	/* エラー発生時のアラートパルス */
	.boot-screen__line--error {
		animation: errorGlitch 1.5s infinite;
	}

	/* ── コンソールデッキ・コントロール ─────────────────── */
	.boot-screen__panel {
		position: relative;
		z-index: 3;
		margin-top: 1.5rem;
		background: rgba(10, 6, 22, 0.8);
		border: 1px solid rgba(6, 182, 212, 0.25);
		box-shadow:
			0 0 30px rgba(0, 0, 0, 0.7),
			inset 0 0 20px rgba(139, 92, 246, 0.15);
		backdrop-filter: blur(12px);
		padding: 1.5rem;
		border-radius: 4px;
	}

	/* ── 警告（術式崩壊）パネル ─────────────────────── */
	.boot-screen__warning {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.boot-screen__warning-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.boot-screen__warning-icon {
		color: #ef4444;
		font-size: 16px;
		animation: alertFlash 0.5s ease-in-out infinite alternate;
	}

	.boot-screen__warning-title {
		margin: 0;
		font-size: 12px;
		font-weight: bold;
		letter-spacing: 0.05em;
		color: #f87171;
		text-shadow: 0 0 10px rgba(248, 113, 113, 0.4);
	}

	.boot-screen__warning-body {
		margin: 0 0 0.5rem;
		font-size: 11px;
		line-height: 1.6;
		color: rgba(252, 165, 165, 0.8);
	}

	.boot-screen__confirm {
		align-self: flex-start;
		border: 1px solid #ef4444;
		background: rgba(239, 68, 68, 0.05);
		padding: 0.75rem 2rem;
		font-family: inherit;
		font-size: 11px;
		font-weight: bold;
		color: #fca5a5;
		cursor: pointer;
		box-shadow: 0 0 15px rgba(239, 68, 68, 0.1);
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.boot-screen__confirm:hover {
		background: #ef4444;
		color: #ffffff;
		box-shadow: 0 0 25px rgba(239, 68, 68, 0.6);
		text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
	}

	/* ── 魔力プログレスバー ───────────────────────────── */
	.boot-screen__progress {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.boot-screen__progress-meta {
		display: flex;
		justify-content: space-between;
		font-size: 10px;
		letter-spacing: 0.15em;
		color: rgba(6, 182, 212, 0.7);
		text-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
	}

	.boot-screen__progress-pct {
		font-weight: bold;
		color: #38bdf8;
	}

	.boot-screen__track {
		position: relative;
	}

	.boot-screen__progress-track {
		height: 6px;
		background: rgba(0, 0, 0, 0.6);
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: 3px;
		overflow: hidden;
	}

	.boot-screen__progress-fill {
		position: relative;
		height: 100%;
		background: linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%);
		transition: width 0.2s cubic-bezier(0.1, 0.8, 0.2, 1);
		border-radius: 3px;
	}

	/* プログレスバー上を流れる光の波動 */
	.boot-screen__progress-light {
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
		animation: streamPass 1.8s infinite linear;
	}

	/* ── アニメーション定義 ───────────────────────────── */
	@keyframes auraBreath {
		0% {
			transform: scale(1);
			opacity: 0.7;
		}
		100% {
			transform: scale(1.1);
			opacity: 1;
		}
	}

	@keyframes lineSlipIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes pulseLight {
		0% {
			opacity: 0.5;
		}
		100% {
			opacity: 1;
		}
	}

	@keyframes errorGlitch {
		0%,
		100% {
			background: transparent;
		}
		50% {
			background: rgba(239, 68, 68, 0.05);
		}
	}

	@keyframes streamPass {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	@keyframes alertFlash {
		0% {
			transform: scale(1);
			filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.5));
		}
		100% {
			transform: scale(1.2);
			filter: drop-shadow(0 0 10px rgba(239, 68, 68, 1));
		}
	}
</style>
