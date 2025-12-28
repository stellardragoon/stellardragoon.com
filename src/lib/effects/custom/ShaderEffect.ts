import { Effect } from 'postprocessing'
import { Uniform } from 'three'

/**
 * A generic wrapper class that extends the standard 'Effect' from postprocessing.
 * It allows us to pass a raw GLSL string and a dictionary of values (uniforms)
 * without creating a specific class file for every single effect.
 */
export class ShaderEffect extends Effect {
	constructor({
		fragmentShader,
		uniforms = {}
	}: {
		fragmentShader: string
		uniforms?: Record<string, any>
	}) {
		// 1. Transform the simple JS object { uTime: 0 } into a Map of Three.js Uniforms.
		// The 'postprocessing' library requires uniforms to be passed as a Map<String, Uniform>.
		const _uniforms = new Map<string, Uniform>()

		for (const key in uniforms) {
			// We wrap the raw value (number, Vector3, Color) in a THREE.Uniform instance.
			_uniforms.set(key, new Uniform(uniforms[key]))
		}

		// 2. Call the parent 'Effect' constructor.
		// - "ShaderEffect": A name for debugging/identifying the effect.
		// - fragmentShader: The actual GLSL code that processes pixels.
		// - { uniforms }: The configuration object containing our mapped uniforms.
		super('ShaderEffect', fragmentShader, {
			uniforms: _uniforms
		})
	}

	/**
	 * A helper method to update uniform values in real-time.
	 * This allows us to animate the shader (e.g., changing time or color)
	 * without destroying and re-creating the entire Effect instance, which is expensive.
	 */
	updateUniforms(uniforms: Record<string, any>) {
		for (const key in uniforms) {
			// Retrieve the existing THREE.Uniform instance from the map
			const uniform = this.uniforms.get(key)

			// If it exists, update its .value property.
			// This change is automatically picked up by the GPU on the next frame.
			if (uniform) {
				uniform.value = uniforms[key]
			}
		}
	}
}
