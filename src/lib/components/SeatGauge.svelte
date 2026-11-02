<script lang="ts">
	let { capacity, registeredCount }: { capacity: number; registeredCount: number } = $props();

	const remaining = $derived(Math.max(0, capacity - registeredCount));
	const ratio = $derived(Math.min(1, registeredCount / capacity));
	const level = $derived(remaining === 0 ? 'full' : ratio >= 0.8 ? 'few' : 'ample');
</script>

<div class="gauge">
	<div
		class="track"
		role="progressbar"
		aria-valuenow={registeredCount}
		aria-valuemin={0}
		aria-valuemax={capacity}
		aria-label="申込状況"
	>
		<div class="fill fill--{level}" style="width: {ratio * 100}%"></div>
	</div>
	<p class="caption">
		{#if remaining === 0}
			<strong>満席</strong>（{registeredCount} / {capacity} 名）
		{:else}
			残り <strong>{remaining}</strong> 席（{registeredCount} / {capacity} 名）
		{/if}
	</p>
</div>

<style>
	.gauge {
		display: grid;
		gap: 0.4rem;
	}

	.track {
		height: 0.5rem;
		border-radius: 999px;
		background: var(--surface-sunken);
		overflow: hidden;
	}

	.fill {
		height: 100%; /* metric-ok: CSSの寸法指定 */
		border-radius: 999px;
		transition: width 200ms ease-out;
	}

	.fill--ample {
		background: var(--accent);
	}

	.fill--few {
		background: var(--warn);
	}

	.fill--full {
		background: var(--text-muted);
	}

	.caption {
		margin: 0;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
</style>
