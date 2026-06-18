<script lang="ts">
	import { T, useTask } from '@threlte/core'
	import { MeshLineGeometry, MeshLineMaterial, FakeGlowMaterial } from '@threlte/extras'
	import {
		CatmullRomCurve3,
		Vector3,
		Quaternion,
		MathUtils,
		Mesh,
		TextureLoader,
		Texture,
		MeshStandardMaterial
	} from 'three'
	import { assetLoader } from '$lib/states/assets.svelte' // Adjust path if necessary

	interface Props {
		targetProgress: number
	}

	let { targetProgress }: Props = $props()

	const cities = [
		{ lat: 60, lon: -130 },
		{ lat: 0, lon: -120 },
		{ lat: -50, lon: -140 },
		{ lat: -30, lon: -70 },
		{ lat: 10, lon: -40 },
		{ lat: -35, lon: -30 },
		{ lat: -10, lon: 10 },
		{ lat: -35, lon: 80 },
		{ lat: -55, lon: 130 },
		{ lat: 0, lon: 60 },
		{ lat: 45, lon: 90 },
		{ lat: 70, lon: 110 }
	]

	const PLANET_RADIUS = 10
	const PLANET_Y_OFFSET = -11
	const PATH_RADIUS = 10.05

	// The key registered in your assetManifest
	const ASSET_KEY = 'planet-map'

	function latLonToVec3(lat: number, lon: number, r: number) {
		const phi = (90 - lat) * (Math.PI / 180)
		const theta = (lon + 180) * (Math.PI / 180)
		return new Vector3(
			-r * Math.sin(phi) * Math.cos(theta),
			r * Math.cos(phi),
			r * Math.sin(phi) * Math.sin(theta)
		)
	}

	const waypoints = cities.map(c => latLonToVec3(c.lat, c.lon, PATH_RADIUS))
	const curve = new CatmullRomCurve3(waypoints, true, 'catmullrom', 0.2)
	const fullPathPoints = curve
		.getSpacedPoints(2000)
		.map(p => p.normalize().multiplyScalar(PATH_RADIUS))

	let currentProgress = $state(0)
	let planetRotation = $state<[number, number, number, number]>([0, 0, 0, 1])
	const currentQ = new Quaternion()

	let lineMesh: Mesh | undefined = $state()
	let mapTexture = $state.raw<Texture | null>(null)
	let materialRef = $state<MeshStandardMaterial | undefined>()

	// $effect(() => {
	// 	if (mapTexture && materialRef) {
	// 		console.log('[KarnethScene] Setting material.needsUpdate = true to recompile shader.')
	// 		materialRef.needsUpdate = true
	// 	}
	// })

	$effect(() => {
		const src = assetLoader.getSrc(ASSET_KEY)

		if (!src) {
			console.error(`[KarnethScene] Asset key "${ASSET_KEY}" not found in manifest ಠ_ಠ`)
			return
		}

		// If we don't have the texture yet, take control of the fetch
		if (!mapTexture) {
			// Flag it so the global store knows something is handling it
			assetLoader.requestLoad(ASSET_KEY)

			fetch(src)
				.then(res => {
					if (!res.ok) throw new Error(`HTTP ${res.status}`)
					return res.blob()
				})
				.then(blob => {
					const blobUrl = URL.createObjectURL(blob)

					new TextureLoader().load(
						blobUrl,
						tex => {
							URL.revokeObjectURL(blobUrl)

							tex.colorSpace = 'srgb'
							tex.needsUpdate = true
							mapTexture = tex // $state.raw triggers the UI

							if (materialRef) {
								materialRef.needsUpdate = true
							}

							// Close the loop: tell the global store WebGL finished the job
							assetLoader.markLoaded(ASSET_KEY)
						},
						undefined,
						() => assetLoader.markError(ASSET_KEY)
					)
				})
				.catch(() => assetLoader.markError(ASSET_KEY))
		}
	})

	useTask(() => {
		currentProgress = MathUtils.lerp(currentProgress, targetProgress, 0.07)
		const safeP = Math.max(0.00001, Math.min(0.99999, currentProgress))

		if (lineMesh && lineMesh.geometry) {
			const geo = lineMesh.geometry
			const totalItems = geo.index ? geo.index.count : geo.attributes.position.count
			const drawCount = Math.floor(safeP * totalItems)
			geo.setDrawRange(0, drawCount)
		}

		const point = curve.getPoint(safeP).normalize()
		const targetDirection = new Vector3(0, 1, 0.03).normalize()
		const targetQ = new Quaternion().setFromUnitVectors(point, targetDirection)

		currentQ.slerp(targetQ, 1)
		planetRotation = currentQ.toArray() as [number, number, number, number]
	})
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 5]} fov={40} />

<T.DirectionalLight position={[10, 100, 5]} intensity={9} color="#4ade80" />
<T.AmbientLight intensity={0.05} />

<T.Group position={[0, PLANET_Y_OFFSET, 0]} quaternion={planetRotation}>
	<T.Mesh>
		<T.SphereGeometry args={[PLANET_RADIUS, 128, 128]} />

		<T.MeshStandardMaterial
			bind:ref={materialRef}
			map={mapTexture || undefined}
			color={mapTexture ? '#ffffff' : '#022c22'}
			transparent={mapTexture ? true : false}
			roughness={0.2}
			metalness={0.3}
			emissive="#064e3b"
			emissiveIntensity={mapTexture ? 0.4 : 0.1}
		/>
	</T.Mesh>

	<T.Mesh bind:ref={lineMesh} frustumCulled={false}>
		<MeshLineGeometry points={fullPathPoints} />
		<MeshLineMaterial width={0.02} color="#00ffff" attenuate={true} />
	</T.Mesh>
</T.Group>

<T.Mesh position={[0, PLANET_Y_OFFSET, -1]}>
	<T.SphereGeometry args={[PLANET_RADIUS + 0.2, 128, 128]} />
	<FakeGlowMaterial
		glowColor="#10b981"
		falloff={4.0}
		glowInternalRadius={0.8}
		transparent
		opacity={0.4}
	/>
</T.Mesh>
