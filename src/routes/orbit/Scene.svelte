<script lang="ts">
	const { State } = $props()

	import { T, useTask } from '@threlte/core'
	import { EffectComposer } from 'threlte-postprocessing'
	import { BloomEffect, WaterEffect } from 'threlte-postprocessing/effects'
	import { OrbitControls } from '@threlte/extras'
	import { SheetObject } from '@threlte/theatre'

	import fragmentShader from './(shaders)/test.frag'
	import vertexShader from './(shaders)/test.vert'
	import { Color } from 'three'

	const uniforms = {
		uTime: { value: 0 },
		uColor: { value: new Color('red') }
	}

	useTask(delta => {
		uniforms.uTime.value += delta
	})
</script>

<T.PerspectiveCamera makeDefault position={[3, 3, 3]} oncreate={ref => ref.lookAt(0, 0, 0)}>
	<OrbitControls enableDamping />
</T.PerspectiveCamera>

<EffectComposer>
	<BloomEffect intensity={20} luminanceThreshold={0} luminanceSmoothing={1} mipmapBlur={true} />
	<!-- これ何のエフェクトなんだろうね -->
	<WaterEffect />
</EffectComposer>

<T.DirectionalLight position={[5, 10, 5]} intensity={0.5} />
<T.AmbientLight intensity={0.05} />

<SheetObject key="Box">
	{#snippet children({ Transform, Sync })}
		<Transform>
			<T.Mesh rotation.y={State.rotation.current} rotation.x={State.rotation.current}>
				<T.BoxGeometry args={[1, 1, 1]} />
				<T.ShaderMaterial {fragmentShader} {vertexShader} {uniforms}><Sync /></T.ShaderMaterial>
			</T.Mesh>
		</Transform>
	{/snippet}
</SheetObject>
