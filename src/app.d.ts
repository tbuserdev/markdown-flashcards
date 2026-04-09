declare module '*.svelte' {
	import type { Component } from 'svelte';

	const component: Component;
	export default component;
}

declare global {
	interface Window {
		MathJax?: {
			typesetPromise?: () => Promise<void>;
		};
	}
}

export {};
