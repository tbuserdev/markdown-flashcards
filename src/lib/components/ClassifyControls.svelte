<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { FlashcardStatus } from '../state';

	export let visible = false;

	const dispatch = createEventDispatcher<{ classify: FlashcardStatus }>();
</script>

<div class:hidden={!visible} id="classification-buttons" class="flex items-center gap-2">
	<button
		id="btn-hard"
		class="classify-btn rounded bg-neutral-800 px-5 py-2 text-base font-normal text-neutral-200 ring-neutral-600 ring-offset-1 ring-offset-neutral-900 transition-colors hover:bg-neutral-700 focus:ring-1"
		on:click={() => dispatch('classify', 'hard')}
	>
		Hard <span class="key-hint">1</span>
	</button>
	<button
		id="btn-medium"
		class="classify-btn rounded bg-neutral-800 px-5 py-2 text-base font-normal text-neutral-200 ring-neutral-600 ring-offset-1 ring-offset-neutral-900 transition-colors hover:bg-neutral-700 focus:ring-1"
		on:click={() => dispatch('classify', 'medium')}
	>
		Medium <span class="key-hint">2</span>
	</button>
	<button
		id="btn-easy"
		class="classify-btn rounded bg-neutral-800 px-5 py-2 text-base font-normal text-neutral-200 ring-neutral-600 ring-offset-1 ring-offset-neutral-900 transition-colors hover:bg-neutral-700 focus:ring-1"
		on:click={() => dispatch('classify', 'easy')}
	>
		Easy <span class="key-hint">3</span>
	</button>
</div>
