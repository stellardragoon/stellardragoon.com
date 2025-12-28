// postprocessings global state for the Orbit
// referenced by state.svelte.ts

import { BlendFunction, GlitchMode, KernelSize, ToneMappingMode } from 'postprocessing'
import { Color, Vector2, Vector3 } from 'three'
import {
	BloomEffect,
	WaterEffect,
	PixelationEffect,
	ASCIIEffect,
	BrightnessContrastEffect,
	ChromaticAberrationEffect,
	ColorAverageEffect,
	ColorDepthEffect,
	DepthEffect,
	DepthOfFieldEffect,
	DotScreenEffect,
	FXAAEffect,
	GodRaysEffect,
	GridEffect,
	HueSaturationEffect,
	LUTEffect,
	LensFlareEffect,
	NoiseEffect,
	OutlineEffect,
	RampEffect,
	SMAAEffect,
	SSAOEffect,
	ScanlineEffect,
	SelectiveBloomEffect,
	SepiaEffect,
	ShockWaveEffect,
	TextureEffect,
	TiltShiftEffect,
	ToneMappingEffect,
	VignetteEffect
} from 'threlte-postprocessing/effects'

import { GlitchEffect } from '../../../../node_modules/threlte-postprocessing/dist/effects/glitch'

export const postprocessings = [
	{
		id: 'pixelation',
		enabled: false,
		component: PixelationEffect,
		props: {
			granularity: 20 // Default from PixelationEffect.svelte
		}
	},
	{
		id: 'ascii',
		enabled: false,
		component: ASCIIEffect,
		props: {
			font: 'arial', // Default from effect.ts
			characters: ` .:,'-^=*+?!|0#X%WM@`, // Default from effect.ts
			fontSize: 54, // Default from effect.ts
			cellSize: 16, // Default from effect.ts
			color: '#ffffff', // Default from effect.ts
			invert: false // Default from effect.ts
		}
	},
	{
		id: 'bloom',
		enabled: true,
		component: BloomEffect,
		props: {
			blendFunction: BlendFunction.ADD, // Default from BloomEffect.svelte
			mipmapBlur: true, // Default from BloomEffect.svelte
			intensity: 1.0, // Optional
			resolutionScale: 0.5, // Optional
			radius: 0.85, // Optional
			levels: 8, // Optional
			luminanceThreshold: 0.1, // Optional
			luminanceSmoothing: 0.025, // Optional
			kernelSize: KernelSize.LARGE // Optional
		}
	},
	{
		id: 'brightness-contrast',
		enabled: false,
		component: BrightnessContrastEffect,
		props: {
			brightness: 0, // Default from BrightnessContrastEffect.svelte
			contrast: 0, // Default from BrightnessContrastEffect.svelte
			blendFunction: BlendFunction.ALPHA // Default from BrightnessContrastEffect.svelte
		}
	},
	{
		id: 'chromatic-aberration',
		enabled: true,
		component: ChromaticAberrationEffect,
		props: {
			offset: new Vector2(0.001, 0.002), // Optional
			radialModulation: false, // Optional
			modulationOffset: 0.15, // Optional
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'color-average',
		enabled: false,
		component: ColorAverageEffect,
		props: {
			// blendFunction: BlendFunction.NORMAL // Removed as it causes errors
		}
	},
	{
		id: 'color-depth',
		enabled: false,
		component: ColorDepthEffect,
		props: {
			bits: 16, // Optional
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'depth',
		enabled: false,
		component: DepthEffect,
		props: {
			inverted: false, // Optional
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'depth-of-field',
		enabled: false,
		component: DepthOfFieldEffect,
		props: {
			focusDistance: 0.0,
			focalLength: 0.05,
			bokehScale: 1.0,
			resolutionScale: 0.5,
			target: null, // Vector3
			depthTexture: null, // { texture, packing }
			worldFocusDistance: undefined,
			worldFocusRange: undefined
		}
	},
	{
		id: 'dot-screen',
		enabled: false,
		component: DotScreenEffect,
		props: {
			angle: 1.57,
			scale: 1.0,
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'fxaa',
		enabled: false,
		component: FXAAEffect,
		props: {
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'glitch',
		enabled: false,
		component: GlitchEffect,
		props: {
			mode: GlitchMode.SPORADIC, // Default logic in GlitchEffect.svelte
			active: true, // Default from GlitchEffect.svelte
			columns: 0.05,
			dtSize: 64,
			delay: new Vector2(1.5, 3.5),
			duration: new Vector2(0.6, 1.0),
			strength: new Vector2(0.3, 1.0),
			ratio: 0.85,
			chromaticAberrationOffset: new Vector2(0.005, 0.005),
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'grid',
		enabled: false,
		component: GridEffect,
		props: {
			scale: 1.0,
			lineWidth: 0.0,
			size: null, // { width, height }
			blendFunction: BlendFunction.OVERLAY
		}
	},
	{
		id: 'hue-saturation',
		enabled: false,
		component: HueSaturationEffect,
		props: {
			hue: 0,
			saturation: 0,
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'noise',
		enabled: false,
		component: NoiseEffect,
		props: {
			premultiply: false,
			blendFunction: BlendFunction.SCREEN
		}
	},
	{
		id: 'scanline',
		enabled: false,
		component: ScanlineEffect,
		props: {
			density: 1.25, // Default from ScanlineEffect.svelte
			blendFunction: BlendFunction.OVERLAY // Default from ScanlineEffect.svelte
		}
	},
	{
		id: 'sepia',
		enabled: false,
		component: SepiaEffect,
		props: {
			intensity: 1.0,
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'shock-wave',
		enabled: false,
		component: ShockWaveEffect,
		props: {
			position: new Vector3(0, 0, 0),
			speed: 2.0,
			maxRadius: 1.0,
			waveSize: 0.2,
			amplitude: 0.05
		}
	},
	{
		id: 'smaa',
		enabled: false,
		component: SMAAEffect,
		props: {
			preset: undefined, // SMAAPreset
			edgeDetectionMode: undefined, // EdgeDetectionMode
			predicationMode: undefined // PredicationMode
		}
	},
	{
		id: 'tilt-shift',
		enabled: false,
		component: TiltShiftEffect,
		props: {
			offset: 0.0,
			rotation: 0.0,
			focusArea: 0.4,
			feather: 0.3,
			bias: 0.25,
			kernelSize: KernelSize.VERY_SMALL,
			resolutionScale: 0.5,
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'tone-mapping',
		enabled: false,
		component: ToneMappingEffect,
		props: {
			mode: ToneMappingMode.REINHARD2,
			resolution: 256,
			maxLuminance: 16.0,
			minLuminance: 0.01,
			middleGrey: 0.6,
			adaptive: true,
			adaptationRate: 1.0,
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'vignette',
		enabled: false,
		component: VignetteEffect,
		props: {
			technique: 0, // VignetteTechnique.DEFAULT
			eskil: false,
			offset: 0.5,
			darkness: 0.5,
			blendFunction: BlendFunction.NORMAL
		}
	},
	{
		id: 'water',
		enabled: false,
		component: WaterEffect,
		props: {
			factor: 0, // Default from effect.ts
			blendFunction: BlendFunction.NORMAL // Default from effect.ts
		}
	}
]
