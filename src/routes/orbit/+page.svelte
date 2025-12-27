<script lang="ts">
	import { Canvas } from '@threlte/core'
	import { Project, Sheet, Studio } from '@threlte/theatre'
	import Scene from './Scene.svelte'

	import { dev } from '$app/environment'

	import theatreconfig from './Orbit.theatre-project-state.json' // これ無いとエラー
	import UI from './UI.svelte'

	import { State } from './state.svelte'
</script>

<svelte:head>
	<title>Orbit - 軌道上実験場</title>
	<meta name="description" content="ステラグーンの軌道上実験場" />
</svelte:head>

<Studio enabled={dev} hide={true} />

<div class="h-screen w-full bg-[#050505]">
	<div
		class={[
			State.isModalOpened ? '-translate-x-36' : '',
			'h-full w-full transition-transform duration-500 ease-out'
		]}
	>
		<Canvas>
			<Project name="Orbit" config={{ state: theatreconfig }}>
				<Sheet name="Object-001">
					<Scene {State} />
				</Sheet>
			</Project>
		</Canvas>
	</div>
	<UI {State} />
</div>
