import adapter from '@sveltejs/adapter-cloudflare'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Cloudflare Workers adapter. The site is fully prerendered (see
		// src/routes/+layout.ts), so the Worker simply serves the static
		// assets emitted into `.svelte-kit/cloudflare`.
		adapter: adapter()
	}
}

export default config
