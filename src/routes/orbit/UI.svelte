<script lang="ts">
	import { STATE } from './state.svelte'
	import ShaderEffect from '$lib/effects/custom/ShaderEffect.svelte'

	let draggingIndex: number | null = $state(null)

	function addNewEffect() {
		STATE.postprocessings.unshift({
			id: 'custom-shader-' + Date.now(),
			enabled: true,
			component: ShaderEffect,
			props: {
				uniforms: { uTime: 0 },
				fragmentShader: `void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	outputColor = inputColor * vec4(uv, 1.0, 1.0);
}`
			}
		})
	}

	function getProps(key: string, value: any) {
		const k = key.toLowerCase()
		let min = 0
		let max = 1
		let step = 0.01

		if (['angle', 'rotation'].some(s => k.includes(s))) {
			min = -Math.PI
			max = Math.PI
		} else if (k.includes('hue')) {
			max = Math.PI * 2
		} else if (['offset', 'brightness', 'contrast', 'saturation'].some(s => k.includes(s))) {
			min = -1
			max = 1
		} else if (
			[
				'granularity',
				'levels',
				'bits',
				'samples',
				'resolution',
				'dtsize',
				'fontsize',
				'cellsize'
			].some(s => k.includes(s))
		) {
			max = 64
			step = 1
			if (k.includes('resolution')) max = 2
			if (k.includes('samples')) max = 64
			if (k.includes('fontsize')) max = 100
		} else if (['intensity', 'scale', 'amount', 'strength'].some(s => k.includes(s))) {
			max = 5
		}

		if (typeof value === 'number') {
			if (value < min) min = value * 2
			if (value > max) max = value * 2
		}

		return { min, max, step }
	}

	function dragStart(e: DragEvent, index: number) {
		draggingIndex = index
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move'
		}
	}

	function dragOver(e: DragEvent, index: number) {
		e.preventDefault()
		if (draggingIndex === null || draggingIndex === index) return

		const item = STATE.postprocessings[draggingIndex]
		STATE.postprocessings.splice(draggingIndex, 1)
		STATE.postprocessings.splice(index, 0, item)
		draggingIndex = index
	}

	function dragEnd() {
		draggingIndex = null
	}
</script>

<div
	class="no-scrollbar absolute top-4 left-4 z-10 max-h-[95vh] w-96 overflow-y-auto font-mono text-sm text-white"
>
	<div>&lt;EffectComposer&gt;</div>
	<button class="pl-4 text-left text-green-400 hover:underline" onclick={addNewEffect}>
		[add new effect+]
	</button>
	<div class="flex flex-col pl-4">
		{#each STATE.postprocessings as effect, index (effect.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="cursor-move"
				draggable="true"
				ondragstart={e => dragStart(e, index)}
				ondragover={e => dragOver(e, index)}
				ondragend={dragEnd}
			>
				{#if !effect.enabled}
					<button
						class="text-left opacity-50 hover:underline"
						onclick={() => (effect.enabled = true)}
					>
						&lt;{effect.id} ... /&gt;
					</button>
				{:else}
					<button class="text-left hover:underline" onclick={() => (effect.enabled = false)}>
						&lt;{effect.id}
					</button>

					<div class="flex flex-col pl-4">
						{#each Object.entries(effect.props as any) as [key, value]}
							<div class="flex items-start gap-1">
								<span class="shrink-0">{key}=</span>

								{#if key === 'fragmentShader'}
									<div class="w-full">
										<textarea
											bind:value={(effect.props as any)[key]}
											class="h-32 w-full border border-white/30 bg-black/50 p-1 font-mono text-xs outline-none {(
												effect as any
											).error
												? 'border-red-500 bg-red-900/20'
												: ''}"
											spellcheck="false"
										></textarea>
										{#if (effect as any).error}
											<div class="text-xs whitespace-pre-wrap text-red-400">
												{(effect as any).error}
											</div>
										{/if}
									</div>
								{:else if typeof value === 'number' || value === null}
									{@const props = getProps(key, value)}
									<div class="flex flex-1 items-center gap-2">
										<input
											type="number"
											bind:value={(effect.props as any)[key]}
											step={props.step}
											class="w-16 border-b border-white/30 bg-transparent text-right outline-none"
										/>
										<input
											type="range"
											bind:value={(effect.props as any)[key]}
											min={props.min}
											max={props.max}
											step={props.step}
											class="h-1 w-24 cursor-pointer appearance-none rounded-lg bg-white/20 accent-white"
										/>
									</div>
								{:else if typeof value === 'boolean'}
									<input type="checkbox" bind:checked={(effect.props as any)[key]} />
								{:else if typeof value === 'string'}
									<input
										type="text"
										bind:value={(effect.props as any)[key]}
										class="w-full border-b border-white/30 bg-transparent outline-none"
									/>
								{:else if value && typeof value === 'object'}
									<div class="flex flex-wrap items-center gap-2">
										{#if 'x' in value}
											<span>{['delay', 'duration', 'strength'].includes(key) ? 'min' : 'x'}</span>
											<input
												type="number"
												bind:value={(value as any).x}
												step="0.01"
												class="w-12 border-b border-white/30 bg-transparent outline-none"
											/>
										{/if}
										{#if 'y' in value}
											<span>{['delay', 'duration', 'strength'].includes(key) ? 'max' : 'y'}</span>
											<input
												type="number"
												bind:value={(value as any).y}
												step="0.01"
												class="w-12 border-b border-white/30 bg-transparent outline-none"
											/>
										{/if}
										{#if 'z' in value}
											<span>z</span>
											<input
												type="number"
												bind:value={(value as any).z}
												step="0.01"
												class="w-12 border-b border-white/30 bg-transparent outline-none"
											/>
										{/if}
										{#if 'r' in value && 'g' in value && 'b' in value}
											<span>r</span>
											<input
												type="number"
												bind:value={(value as any).r}
												step="0.01"
												class="w-10 border-b border-white/30 bg-transparent outline-none"
											/>
											<span>g</span>
											<input
												type="number"
												bind:value={(value as any).g}
												step="0.01"
												class="w-10 border-b border-white/30 bg-transparent outline-none"
											/>
											<span>b</span>
											<input
												type="number"
												bind:value={(value as any).b}
												step="0.01"
												class="w-10 border-b border-white/30 bg-transparent outline-none"
											/>
										{/if}
									</div>
								{:else}
									<span>{String(value)}</span>
								{/if}
							</div>
						{/each}
					</div>
					<div>/&gt;</div>
				{/if}
			</div>
		{/each}
	</div>
	<div>&lt;/EffectComposer&gt;</div>

	<div class="mt-4 whitespace-pre text-gray-500">
		&lt;!-- 遊び方：<br /> オンにしたいエフェクトをクリックして<br /> 値をいじりましょう <br />
		何か動作が変だったらリフレッシュしましょう<br /> --&gt;
	</div>
	<div class="mt-4 whitespace-pre text-gray-500">
		&lt;!-- Removed Effects:<br /> god-rays lens-flare lut selective-bloom ssao texture<br /> --&gt;
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
