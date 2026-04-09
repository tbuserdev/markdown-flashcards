import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	extensions: ['.svelte'],
	compilerOptions: {},
	preprocess: vitePreprocess(),
	onwarn: (warning, handler) => handler(warning),
	vitePlugin: {
		exclude: [],
		experimental: {}
	}
};
