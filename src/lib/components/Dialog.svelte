<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let title = '';
	export let subtitle = '';
	export let maxWidth = 'max-w-lg';

	const dispatch = createEventDispatcher<{ close: void }>();
	const dialogBaseId = `dialog-${crypto.randomUUID()}`;
	const titleId = `${dialogBaseId}-title`;
	const subtitleId = `${dialogBaseId}-subtitle`;

	const emitClose = () => dispatch('close');
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
		<div
			class={`w-full ${maxWidth} rounded border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/40`}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={subtitle ? subtitleId : undefined}
			tabindex="0"
			on:keydown={(event) => {
				if (event.key === 'Escape') {
					emitClose();
				}
			}}
		>
			<div class="border-b border-neutral-800 p-5">
				<div class="flex items-start justify-between gap-4">
					<div>
						<h2 id={titleId} class="text-base font-semibold text-neutral-100">{title}</h2>
						{#if subtitle}
							<p id={subtitleId} class="mt-1 text-sm text-neutral-400">{subtitle}</p>
						{/if}
					</div>
					<button
						class="rounded border border-neutral-700 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-800"
						type="button"
						on:click={emitClose}
						aria-label="Close dialog"
					>
						×
					</button>
				</div>
			</div>
			<div class="p-5">
				<slot />
			</div>
		</div>
	</div>
{/if}
