export default {
	extensions: ['.svelte'],
	compilerOptions: {},
	preprocess: [],
	onwarn: (warning, handler) => handler(warning),
	vitePlugin: {
		exclude: [],
		experimental: {}
	}
};
