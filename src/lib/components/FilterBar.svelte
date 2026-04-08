<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { FlashcardFilter } from '../state';

	export let activeFilter: FlashcardFilter = 'all';
	export let counts = {
		all: 0,
		unseen: 0,
		easy: 0,
		medium: 0,
		hard: 0
	};

	const dispatch = createEventDispatcher<{ change: FlashcardFilter }>();

	const filters: Array<{ id: FlashcardFilter; label: string }> = [
		{ id: 'all', label: 'All' },
		{ id: 'unseen', label: 'Remaining' },
		{ id: 'easy', label: 'Easy' },
		{ id: 'medium', label: 'Medium' },
		{ id: 'hard', label: 'Hard' }
	];
</script>

<div class="flex w-full flex-wrap justify-between gap-2">
	<div class="flex flex-wrap gap-2 overflow-x-auto md:overflow-visible">
		{#each filters as filter}
			<button
				class:bg-neutral-100={activeFilter === filter.id}
				class:text-neutral-900={activeFilter === filter.id}
				class:bg-neutral-800={activeFilter !== filter.id}
				class:hover:bg-neutral-700={activeFilter !== filter.id}
				class:text-neutral-300={activeFilter !== filter.id}
				class="rounded px-3 py-1 text-sm font-normal transition-colors"
				on:click={() => dispatch('change', filter.id)}
			>
				{filter.label} ({counts[filter.id]})
			</button>
		{/each}
	</div>
</div>
