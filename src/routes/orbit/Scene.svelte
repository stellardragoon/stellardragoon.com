<script lang="ts">
	import { STATE } from './state.svelte'

	import { T, useLoader, useTask } from '@threlte/core'
	import { EffectComposer } from 'threlte-postprocessing'
	import { OrbitControls, Float, Grid } from '@threlte/extras'
	import { SheetObject } from '@threlte/theatre'

	import fragmentShader from './(shaders)/test.frag'
	import vertexShader from './(shaders)/test.vert'
	import bgFragmentShader from './(shaders)/background.frag?raw' // ?rawで文字列としてインポート
	import bgVertexShader from './(shaders)/background.vert?raw'

	import { Color, MathUtils, Object3D, BackSide, Vector3 } from 'three'
	import { src } from '$lib/utils/deseal'
	import { SVGLoader } from 'three/examples/jsm/Addons.js'

	let enabledEffects = $derived(STATE.postprocessings.filter(p => p.enabled))
	let composerKey = $derived(enabledEffects.map(p => p.id).join(','))

	const uniforms = {
		uTime: { value: 0 },
		uColor: { value: new Color(2, 0, 0) }
	}

	const bgUniforms = {
		uTime: { value: 0 },
		uColorA: { value: new Color('#050011') },
		uColorB: { value: new Color('#00ffff') }
	}

	let ringRotation = $state(0)
	let starRotation = $state(0)

	let light1Pos = new Vector3(0, 2, -3)
	let light2Pos = new Vector3(0, -2, -3)

	useTask(delta => {
		// Global Time
		const time = (uniforms.uTime.value += delta)
		bgUniforms.uTime.value += delta * 0.5 // 背景はゆっくり動かす

		// Logo Animation
		STATE.logo.floatY = Math.sin(time * 1.5) * 0.9
		STATE.logo.tiltX = Math.sin(time * 1) * 0.1
		STATE.logo.tiltZ = Math.sin(time * 1.2) * 0.05

		// Environment Animation
		ringRotation += delta * 0.2
		starRotation += delta * 0.05 // 星々もゆっくり回転

		// Dynamic Lights: 互いに螺旋を描くように動く
		const radius = 8
		light1Pos.x = Math.sin(time * 0.8) * radius
		light1Pos.z = Math.cos(time * 0.8) * radius
		light1Pos.y = Math.sin(time * 0.5) * 3 + 2

		light2Pos.x = Math.sin(time * 0.8 + Math.PI) * radius // 180度ズレ
		light2Pos.z = Math.cos(time * 0.8 + Math.PI) * radius
		light2Pos.y = Math.cos(time * 0.5) * 3 - 2
	})

	// --- Loader ---
	const logoPromise = src('stellardragoon-logo-lightmode.svg').then(async logoData => {
		let text = ''
		if (logoData instanceof ArrayBuffer) {
			text = new TextDecoder().decode(logoData)
		} else {
			throw new Error('Expected ArrayBuffer for SVG')
		}

		const loader = new SVGLoader()
		const data = loader.parse(text)
		return data.paths.flatMap(path => {
			const shapes = SVGLoader.createShapes(path)
			return shapes.map(shape => ({ shape, color: path.color }))
		})
	})

	// --- Star Field Logic ---
	const starCount = 800
	const tempObject = new Object3D()
	const starData = Array.from({ length: starCount }).map(() => ({
		x: (Math.random() - 0.5) * 60, // 範囲を少し広げました
		y: (Math.random() - 0.5) * 60,
		z: (Math.random() - 0.5) * 60, // 奥行きも深く
		scale: Math.random() * 0.5 + 0.1,
		rotation: Math.random() * Math.PI
	}))
</script>

<SheetObject key="Camera">
	{#snippet children({ Transform })}
		<Transform>
			<T.PerspectiveCamera makeDefault position={[10, 0, 10]} oncreate={ref => ref.lookAt(0, 0, 0)}>
				<OrbitControls enableDamping />
			</T.PerspectiveCamera>
		</Transform>
	{/snippet}
</SheetObject>

{#key composerKey}
	<EffectComposer>
		{#each enabledEffects as pp (pp.id + ((pp.props as any).fragmentShader || ''))}
			<pp.component
				{...pp.props as any}
				onerror={(e: string) => ((pp as any).error = e)}
				onsuccess={() => ((pp as any).error = null)}
			/>
		{/each}
	</EffectComposer>
{/key}

<SheetObject key="Background">
	{#snippet children({ Transform })}
		<Transform>
			<T.Mesh scale={80}>
				<T.SphereGeometry args={[1, 64, 64]} />
				<T.ShaderMaterial
					fragmentShader={bgFragmentShader}
					vertexShader={bgVertexShader}
					uniforms={bgUniforms}
					side={BackSide}
				/>
			</T.Mesh>
		</Transform>
	{/snippet}
</SheetObject>

<SheetObject key="Fog">
	{#snippet children({ Sync })}
		<T.FogExp2 color="#050011" density={0.02}>
			<Sync color density />
		</T.FogExp2>
	{/snippet}
</SheetObject>

<SheetObject key="DirectionalLight">
	{#snippet children({ Transform, Sync })}
		<Transform>
			<T.DirectionalLight position={[10, 10, 10]} intensity={0.5}>
				<Sync intensity />
			</T.DirectionalLight>
		</Transform>
	{/snippet}
</SheetObject>
<SheetObject key="AmbientLight">
	{#snippet children({ Sync })}
		<T.AmbientLight intensity={0.2}>
			<Sync intensity />
		</T.AmbientLight>
	{/snippet}
</SheetObject>

<SheetObject key="Light1">
	{#snippet children({ Transform, Sync })}
		<Transform>
			<T.Group position={[light1Pos.x, light1Pos.y, light1Pos.z]}>
				<T.PointLight intensity={15} distance={20} decay={2} color="#00ffff">
					<Sync intensity distance decay color />
				</T.PointLight>
				<T.Mesh>
					<T.SphereGeometry args={[0.2]} />
					<T.MeshBasicMaterial color="#00ffff" toneMapped={false} />
				</T.Mesh>
			</T.Group>
		</Transform>
	{/snippet}
</SheetObject>

<SheetObject key="Light2">
	{#snippet children({ Transform, Sync })}
		<Transform>
			<T.Group position={[light2Pos.x, light2Pos.y, light2Pos.z]}>
				<T.PointLight intensity={15} distance={20} decay={2} color="#ff00aa">
					<Sync intensity distance decay color />
				</T.PointLight>
				<T.Mesh>
					<T.SphereGeometry args={[0.2]} />
					<T.MeshBasicMaterial color="#ff00aa" toneMapped={false} />
				</T.Mesh>
			</T.Group>
		</Transform>
	{/snippet}
</SheetObject>

<T.Group position={[0, -8, 0]}>
	<Grid
		infiniteGrid
		sectionColor="#ff0080"
		cellColor="#00ffff"
		fadeDistance={40}
		sectionThickness={1.5}
	/>
</T.Group>

<T.Group rotation.y={starRotation}>
	<T.InstancedMesh args={[undefined, undefined, starCount]}>
		{#snippet children({ ref })}
			<T.OctahedronGeometry args={[0.05, 0]} />
			<T.MeshBasicMaterial color="#ffffff" toneMapped={false} />

			{#each starData as d, i}
				{@const _ =
					(tempObject.position.set(d.x, d.y, d.z),
					tempObject.rotation.set(d.rotation, d.rotation, 0),
					tempObject.scale.setScalar(d.scale),
					tempObject.updateMatrix(),
					ref.setMatrixAt(i, tempObject.matrix))}
			{/each}
			{@const _ = ref.instanceMatrix.needsUpdate = true}
		{/snippet}
	</T.InstancedMesh>
</T.Group>

{#each Array(8) as _, i}
	<SheetObject key={'FloatingObject-' + i}>
		{#snippet children({ Transform })}
			<Transform>
				<Float speed={1 + i * 0.2} rotationIntensity={0.5} floatIntensity={3}>
					<T.Mesh
						position={[
							MathUtils.randFloatSpread(20),
							MathUtils.randFloatSpread(15),
							MathUtils.randFloat(-5, -20)
						]}
					>
						<T.IcosahedronGeometry args={[MathUtils.randFloat(0.5, 1.5), 0]} />
						<T.MeshStandardMaterial
							color="#111"
							emissive={i % 2 === 0 ? '#00ffff' : '#ff00aa'}
							emissiveIntensity={2}
							wireframe={true}
							toneMapped={false}
						/>
					</T.Mesh>
				</Float>
			</Transform>
		{/snippet}
	</SheetObject>
{/each}

<SheetObject key="Rings">
	{#snippet children({ Transform })}
		<Transform>
			<T.Group rotation.z={ringRotation} rotation.x={Math.PI / 4} position={[0, 0, -2]}>
				<T.Mesh>
					<T.TorusGeometry args={[8, 0.02, 16, 100]} />
					<T.MeshBasicMaterial color="#444" transparent opacity={0.3} />
				</T.Mesh>
				<T.Mesh rotation.y={ringRotation * 1.5}>
					<T.TorusGeometry args={[7.5, 0.05, 16, 100]} />
					<T.MeshStandardMaterial
						color="#000"
						emissive="#ff00aa"
						emissiveIntensity={4}
						toneMapped={false}
					/>
				</T.Mesh>
			</T.Group>
		</Transform>
	{/snippet}
</SheetObject>

<SheetObject key="Box">
	{#snippet children({ Transform, Sync })}
		<Transform>
			<T.Mesh
				rotation.y={STATE.rotation.current}
				rotation.x={STATE.rotation.current}
				position={[0, 0, 0]}
			>
				<T.BoxGeometry args={[1, 1, 1]} />
				<T.ShaderMaterial {fragmentShader} {vertexShader} {uniforms}></T.ShaderMaterial><Sync
					rotation
					position
				/>
			</T.Mesh>
		</Transform>
	{/snippet}
</SheetObject>

<SheetObject key="Logo">
	{#snippet children({ Transform, Sync })}
		{#await logoPromise then parts}
			<Transform>
				<T.Group scale={0.005} scale.y={-0.005} position={[-5, 4, 0]}>
					{#each parts as { shape, color }}
						<T.Mesh>
							<T.ExtrudeGeometry
								args={[
									shape,
									{
										depth: 10,
										bevelEnabled: true,
										bevelThickness: 2,
										bevelSize: 2,
										bevelSegments: 5
									}
								]}
							/>
							<T.MeshStandardMaterial
								{color}
								emissive={color}
								emissiveIntensity={3.0}
								toneMapped={false}
								roughness={0.2}
								metalness={0.9}
							/>
						</T.Mesh>
					{/each}
				</T.Group>
			</Transform>
		{/await}
	{/snippet}
</SheetObject>
