<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Deck } from '../state';

	export let decks: Deck[] = [];
	export let activeDeckId: string | null = null;

	const dispatch = createEventDispatcher<{
		select: string;
		add: void;
		rename: void;
		delete: void;
		share: void;
	}>();
</script>

<div class="flex flex-wrap items-center gap-2">
	<select
		class="rounded bg-neutral-800 px-3 py-1 text-sm font-normal text-neutral-300 transition-colors hover:bg-neutral-700 focus:ring-1 focus:ring-neutral-500 focus:outline-none md:w-auto"
		value={activeDeckId ?? ''}
		on:change={(event) => dispatch('select', (event.currentTarget as HTMLSelectElement).value)}
	>
		{#each decks as deck}
			<option value={deck.id}>{deck.name}</option>
		{/each}
	</select>

	<button
		class="rounded bg-neutral-800 px-3 py-1 text-sm font-normal text-neutral-200 transition-colors hover:bg-neutral-700"
		on:click={() => dispatch('rename')}
	>
		Rename
	</button>
	<button
		class="rounded bg-neutral-800 px-3 py-1 text-sm font-normal text-neutral-200 transition-colors hover:bg-neutral-700"
		on:click={() => dispatch('delete')}
	>
		Delete
	</button>
	<button
		class="rounded bg-neutral-800 px-3 py-1 text-sm font-normal text-neutral-200 transition-colors hover:bg-neutral-700"
		on:click={() => dispatch('add')}
	>
		Add New
	</button>
	<button
		class="rounded bg-neutral-800 px-3 py-1 text-sm font-normal text-neutral-200 transition-colors hover:bg-neutral-700"
		on:click={() => dispatch('share')}
	>
		Share
	</button>
</div>
