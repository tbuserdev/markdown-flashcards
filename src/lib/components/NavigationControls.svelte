<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let canGoPrev = false;
	export let canGoNext = false;

	const dispatch = createEventDispatcher<{ prev: void; next: void }>();
</script>

<button
	id="prev-btn"
	class="rounded bg-neutral-800 px-6 py-3 font-normal text-neutral-200 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
	disabled={!canGoPrev}
	on:click={() => dispatch('prev')}
>
	&larr;
</button>

<button
	id="next-btn"
	class="rounded bg-neutral-800 px-6 py-3 font-normal text-neutral-200 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
	disabled={!canGoNext}
	on:click={() => dispatch('next')}
>
	&rarr;
</button>
