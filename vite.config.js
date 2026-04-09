import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	base: '/markdown-flashcards/',
	plugins: [tailwindcss(), svelte()]
});
