import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { sveltekit } from '@sveltejs/kit/vite'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
	plugins: [
		glsl({
			minify: true,
			watch: true
		}),
		tailwindcss(),
		sveltekit()
	],

	server: {
		proxy: {
			// accessing R2 via web worker or fetch() when in dev mode leads to CORS issue
			// so we set up a proxy to bypass it during development
			// (used in deseal.ts)
			'/r2-tunnel': {
				target: 'https://artifacts.stellardragoon.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/r2-tunnel/, '')
			}
		}
	},

	test: {
		expect: { requireAssertions: true },

		projects: [
			{
				extends: './vite.config.ts',

				test: {
					name: 'client',

					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},

					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
})
