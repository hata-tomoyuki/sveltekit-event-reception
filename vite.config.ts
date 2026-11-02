import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Vercel へデプロイする前提。node:sqlite ではなく Neon を使うため、
			// エッジではなく Node ランタイムで動かす。
			adapter: adapter({ runtime: 'nodejs22.x' })
		})
	]
});
