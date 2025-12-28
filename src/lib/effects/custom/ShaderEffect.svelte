<script lang="ts">
	import { onMount, tick } from 'svelte'
	import { ShaderEffect } from './ShaderEffect' // Import our custom class
	// Adjust this import to match your project structure (e.g. relative path or library alias)
	import { getEffectComposerContext } from 'threlte-postprocessing'
	import { BlendFunction } from 'postprocessing'
	import { useTask } from '@threlte/core'

	// 1. Define Props using Svelte 5 Runes
	let {
		fragmentShader, // The GLSL string required to run the shader
		uniforms = {}, // Optional dictionary of inputs (e.g., { uTime: 0 })
		composerId, // Optional ID if you have multiple EffectComposers in one scene
		blendFunction, // Optional blend mode (e.g., ADD, SCREEN, OVERLAY)
		onerror,
		onsuccess
	} = $props<{
		fragmentShader: string
		uniforms?: Record<string, any>
		composerId?: string
		blendFunction?: BlendFunction
		onerror?: (error: string) => void
		onsuccess?: () => void
	}>()

	// 2. Retrieve the Composer Context
	// This hook gives us access to the post-processing pipeline running in the parent <EffectComposer>.
	// It corresponds to the 'context' used in files like ASCIIEffect.svelte.
	// svelte-ignore state_referenced_locally
	const context = getEffectComposerContext(composerId)

	// 3. Instantiate the Effect ONCE
	// We create the instance immediately. This is lightweight logic (just setting up data).
	// Note: We ignore the 'state_referenced_locally' warning because this class instance
	// is stable and doesn't need to be reactive itself; we mutate it internally.
	// svelte-ignore state_referenced_locally
	let _effect: ShaderEffect | undefined
	try {
		// svelte-ignore state_referenced_locally
		_effect = new ShaderEffect({ fragmentShader, uniforms })
		// svelte-ignore state_referenced_locally
		onsuccess?.()
	} catch (e: any) {
		console.error(e)
		// svelte-ignore state_referenced_locally
		onerror?.(e.message || 'Unknown error')
	}

	// 4. Reactive Uniform Updates
	// Whenever the 'uniforms' prop changes (e.g., parent passes a new time value),
	// this $effect block runs. It calls our helper method to update the GPU values.
	$effect(() => {
		if (!_effect) return
		_effect.updateUniforms(uniforms)

		// Essential: Tell the composer to re-render.
		// In some setups, Threlte/Three might not know the shader changed visually.
		$context.render()
	})

	// 5. Reactive Blend Mode Updates
	// Allows changing how this effect blends with the background layer dynamically.
	$effect(() => {
		if (!_effect) return
		if (blendFunction !== undefined) {
			_effect.blendMode.blendFunction = blendFunction
			$context.render()
		}
	})

	useTask(delta => {
		if (!_effect) return
		const uTime = _effect.uniforms.get('uTime')
		if (uTime) uTime.value += delta
	})

	// 6. Lifecycle Management
	onMount(() => {
		if (!_effect) return
		// We assume 'tick()' ensures the Composer is fully initialized in the parent.
		tick().then(() => {
			// STANDARD LIBRARY PATTERN:
			// Instead of creating a manual EffectPass, we "push" our effect into the context.
			// The library will attempt to bundle this effect with others into a single pass
			// for maximum performance. See ASCIIEffect.svelte.
			if (_effect) $context.push(_effect)
		})

		// Cleanup: When this component is destroyed (unmounted),
		// we must dispose of the effect to free up WebGL resources (shaders, textures).
		return () => {
			_effect?.dispose()
		}
	})
</script>
