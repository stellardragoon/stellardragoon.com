/**
 * All site content — zero hardcoded strings in components.
 * Swap text here without touching UI code.
 *
 * Asset paths live in `assetManifest` below — the single source of truth.
 * Data objects store manifest keys (e.g. `silhouetteAsset: 'rioze-silhouette'`)
 * and components resolve real paths via `<ManagedImage asset={key} />`.
 */

// ── Asset Manifest ─────────────────────────────────────────
export type AssetPriority = 'critical' | 'lazy'
export type AssetType = 'image' | 'video'

export interface AssetEntry {
	src: string
	type: AssetType
	priority: AssetPriority
	/** Route(s) this asset is critical for. `'*'` = all routes. Only relevant for critical assets. */
	routes?: string[]
}

export const assetManifest: Record<string, AssetEntry> = {
	// ── Global (all routes) ───────────────────────────────
	'bg-dark': { src: '/assets/bg-dark.png', type: 'image', priority: 'critical', routes: ['*'] },

	// ── Home page (/): Critical ───────────────────────────
	'hero-logo-dark': {
		src: '/assets/placeholders/logo-dark.png',
		type: 'image',
		priority: 'critical',
		routes: ['/']
	},
	'prologue-video': {
		src: '/assets/placeholders/prologue-bg.mp4',
		type: 'video',
		priority: 'critical',
		routes: ['/']
	},
	'worldview-bg': {
		src: '/assets/placeholders/city-concept.jpg',
		type: 'image',
		priority: 'critical',
		routes: ['/']
	},

	// ── Home page (/): Lazy ───────────────────────────────
	'rioze-silhouette': {
		src: '/assets/placeholders/rioze-silhouette.png',
		type: 'image',
		priority: 'lazy'
	},
	'rioze-color': { src: '/assets/placeholders/rioze-color.webp', type: 'image', priority: 'lazy' },
	'rutsuki-silhouette': {
		src: '/assets/placeholders/rutsuki-silhouette.png',
		type: 'image',
		priority: 'lazy'
	},
	'rutsuki-color': {
		src: '/assets/placeholders/rutsuki-color.webp',
		type: 'image',
		priority: 'lazy'
	},
	'work-01': { src: '/assets/placeholders/work-01.jpg', type: 'image', priority: 'lazy' },
	'work-02': { src: '/assets/placeholders/work-02.jpg', type: 'image', priority: 'lazy' },
	'work-03': { src: '/assets/placeholders/work-03.jpg', type: 'image', priority: 'lazy' }
}

// Kingdom crest entries (lazy, /karneth)
for (let i = 1; i <= 12; i++) {
	const key = `kingdom-${String(i).padStart(2, '0')}`
	assetManifest[key] = {
		src: `/assets/placeholders/${key}.png`,
		type: 'image',
		priority: 'lazy'
	}
}

// ── Section 2: Prologue ────────────────────────────────────
export interface PrologueContent {
	/** Section heading */
	title: string
	/** Body lines: [0] former verticalLine, [1-2] paragraph lines, [3] former closingLine */
	paragraphLines: [string, string, string, string]
}

export const prologueContent: PrologueContent = {
	title: 'プロローグ',
	paragraphLines: [
		'ーこれは未来の物語ー',
		'旅する二人の冒険者が流れ着いた見知らぬ場所「異世界」',
		'そこは誰も思いつかない奇想天外なアイディアで満ちている',
		'ステラグーン始動'
	]
}

// ── Section 3: Unit Overview ───────────────────────────────
export interface OverviewBlock {
	heading: string
	body: string
}

export const overviewBlocks: OverviewBlock[] = [
	{
		heading: 'ユニット概要',
		body: '宇宙船を操縦し、異世界に来たリオゼ、ルツキの二人で結成したデザイン制作ユニット。異世界に辿り着いた2人が Tech × Designの融合で新しい "体験・表現・価値" を生み出すクリエイティブユニット。'
	}
]

// ── Section 4: Members ─────────────────────────────────────
export interface MemberData {
	name: string
	nameEn: string
	role: string
	/** Manifest key for silhouette image */
	silhouetteAsset: string
	/** Manifest key for full-color image */
	colorAsset: string
	slideDirection: 'top' | 'bottom'
}

export const members: MemberData[] = [
	{
		name: 'リオゼ',
		nameEn: 'Rioze',
		role: 'Tech / Engineering',
		silhouetteAsset: 'rioze-silhouette',
		colorAsset: 'rioze-color',
		slideDirection: 'top'
	},
	{
		name: 'ルツキ',
		nameEn: 'Rutsuki',
		role: 'Design / Creative',
		silhouetteAsset: 'rutsuki-silhouette',
		colorAsset: 'rutsuki-color',
		slideDirection: 'bottom'
	}
]

// ── Section 5: Worldview ───────────────────────────────────
export const worldviewConfig = {
	/** Manifest key for concept art background */
	backgroundAsset: 'worldview-bg',
	buttonLabel: 'ACCESS',
	buttonHref: '/karneth'
}

// ── Section 6: Works carousel ──────────────────────────────
export interface WorkItem {
	title: string
	description: string
	/** Manifest key for thumbnail image */
	imageAsset: string
	status: 'available' | 'locked'
}

export const worksItems: WorkItem[] = [
	{
		title: 'WORK 01',
		description: 'ACCESS DENIED — DATA PENDING',
		imageAsset: 'work-01',
		status: 'locked'
	},
	{
		title: 'WORK 02',
		description: 'ACCESS DENIED — DATA PENDING',
		imageAsset: 'work-02',
		status: 'locked'
	},
	{
		title: 'WORK 03',
		description: 'ACCESS DENIED — DATA PENDING',
		imageAsset: 'work-03',
		status: 'locked'
	}
]

// ── Section 7: Footer links ────────────────────────────────
export interface ExternalLink {
	platform: string
	label: string
	href: string
	/** Simple SVG path(s) for the icon, rendered inside a 24x24 viewBox */
	iconPath: string
}

export const externalLinks: ExternalLink[] = [
	{
		platform: 'x',
		label: 'X (Twitter)',
		href: 'https://x.com/stellar_dragoon',
		iconPath:
			'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
	},
	{
		platform: 'github',
		label: 'GitHub',
		href: 'https://github.com/stellardragoon',
		iconPath:
			'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
	},
]

// ── Karneth page: Kingdoms ────────────────────────────────
export interface Kingdom {
	name: string
	/** Manifest key for crest image */
	crestAsset: string
}

export const kingdoms: Kingdom[] = Array.from({ length: 12 }, (_, i) => ({
	name: `王国 ${String(i + 1).padStart(2, '0')}`,
	crestAsset: `kingdom-${String(i + 1).padStart(2, '0')}`
}))

// ── Karneth page: Sub-navigation ──────────────────────────
export interface KarnethNavItem {
	label: string
	href: string
}

export const karnethNav: KarnethNavItem[] = [
	{ label: 'Database', href: '/karneth' },
	{ label: 'Illustrations', href: '/karneth/illustrations' },
	{ label: 'Info', href: '/karneth/info' },
	{ label: 'Characters', href: '/karneth/characters' },
	{ label: 'Story', href: '/karneth/story' }
]

// ── Hero section ──────────────────────────────────────────
export const heroConfig = {
	/** Manifest key for logo asset */
	logoAsset: 'hero-logo-dark',
	altText: 'Stellar Dragoon'
}

// ── Prologue section video ────────────────────────────────
export const prologueConfig = {
	/** Manifest key for background video */
	videoAsset: 'prologue-video',
	gradientFrom: '#627BBA',
	gradientTo: '#AFB9CE'
}

export const prologueGradient = {
	horizontal: 'linear-gradient(135deg, #627BBA, #AFB9CE)',
	vertical: 'linear-gradient(to bottom, #627BBA, #AFB9CE)'
}
