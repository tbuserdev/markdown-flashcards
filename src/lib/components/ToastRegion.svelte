<script lang="ts">
	export type ToastTone = 'info' | 'success' | 'warning' | 'error';

	export interface ToastItem {
		id: number;
		tone: ToastTone;
		message: string;
	}

	export let toasts: ToastItem[] = [];
</script>

<div class="fixed right-4 bottom-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-2">
	{#each toasts as toast (toast.id)}
		<div
			class={`rounded border px-4 py-3 text-sm shadow-lg backdrop-blur ${
				toast.tone === 'success'
					? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100'
					: toast.tone === 'warning'
						? 'border-amber-500/40 bg-amber-950/90 text-amber-100'
						: toast.tone === 'error'
							? 'border-red-500/40 bg-red-950/90 text-red-100'
							: 'border-neutral-700 bg-neutral-950/90 text-neutral-100'
			}`}
		>
			{toast.message}
		</div>
	{/each}
</div>
