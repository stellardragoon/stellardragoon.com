/**
 * Main navigation items for the hamburger overlay.
 */
export interface NavItem {
	label: string
	href: string
	/** Section anchor on the home page (for same-page jumps) */
	sectionId?: string
}

export const mainNavItems: NavItem[] = [
	{ label: 'ホーム', href: '/', sectionId: 'hero' },
	{ label: 'プロローグ', href: '/#prologue', sectionId: 'prologue' },
	{ label: 'ユニット概要', href: '/#overview', sectionId: 'overview' },
	{ label: 'メンバー', href: '/#members', sectionId: 'members' },
	{ label: '世界観', href: '/#worldview', sectionId: 'worldview' },
	{ label: '作品', href: '/#works', sectionId: 'works' },
	// { label: 'カーネス', href: '/karneth' }
]
