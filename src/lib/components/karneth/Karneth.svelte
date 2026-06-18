<script lang="ts">
	import { Canvas } from '@threlte/core'
	import { browser } from '$app/environment'
	import { scrollState } from '../../stores/scrollStateStore.svelte'
	import KarnethScene from './KarnethScene.svelte'

	interface Props {
		sectionIds?: string[]
	}
	let { sectionIds = [] }: Props = $props()

	let scrollY = $state(0)
	let innerHeight = $state(0)
	let scrollHeight = $state(0)

	$effect(() => {
		if (typeof document !== 'undefined') {
			scrollHeight = document.documentElement.scrollHeight
			const handleResize = () => (scrollHeight = document.documentElement.scrollHeight)
			window.addEventListener('resize', handleResize)
			return () => window.removeEventListener('resize', handleResize)
		}
	})

	const globalProgress = $derived(
		scrollHeight > innerHeight
			? Math.max(0, Math.min(1, scrollY / (scrollHeight - innerHeight)))
			: 0
	)

	const rawTargetProgress = $derived(() => {
		if (sectionIds.length === 0) return globalProgress
		const total = sectionIds.reduce((sum, id) => sum + scrollState.of(id), 0)
		return total / sectionIds.length
	})
</script>

<svelte:window bind:scrollY bind:innerHeight />

<div
	style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none; overflow: hidden;"
>
	{#if browser}
		<Canvas>
			<KarnethScene targetProgress={rawTargetProgress()} />
		</Canvas>
	{/if}
</div>
