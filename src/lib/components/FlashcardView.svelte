<script lang="ts">
	export let questionHtml = '';
	export let answerHtml = '';
	export let answerVisible = false;
	export let emptyMessage = 'No questions found. Load a Markdown file.';
	export let answerLabel = 'Answer';
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<div id="question-area">
	<div class="mb-6 text-lg font-normal text-neutral-100 md:text-xl" id="question-text">
		{#if questionHtml}
			{@html questionHtml}
		{:else}
			<p>{emptyMessage}</p>
		{/if}
	</div>
</div>

<div id="answer-area" class:hidden={!answerVisible} class="border-t border-neutral-800 pt-6">
	<h3 class="mb-4 text-base font-normal text-neutral-400">{answerLabel}</h3>
	<div id="answer-text" class="markdown-content text-base leading-relaxed text-neutral-300">
		{@html answerHtml}
	</div>
</div>
