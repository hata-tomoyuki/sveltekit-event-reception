<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FieldName } from '#lib/types.js';

	/**
	 * ラベル・補助文・エラー文と、それらを input に結びつける aria 属性を受け持つ。
	 * 入力要素そのものは呼び出し側が snippet で渡す（input / textarea / select を同じ枠で扱えるようにするため）。
	 */
	type Control = {
		id: string;
		describedBy: string | undefined;
		invalid: boolean;
	};

	type Props = {
		name: FieldName;
		label: string;
		error?: string | undefined;
		hint?: string;
		required?: boolean;
		control: Snippet<[Control]>;
	};

	let { name, label, error, hint, required = false, control }: Props = $props();

	const id = $derived(`field-${name}`);
	const errorId = $derived(`${id}-error`);
	const hintId = $derived(`${id}-hint`);
	const describedBy = $derived(
		[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
	);
</script>

<div class="field">
	<label for={id}>
		{label}
		{#if required}<span class="required">必須</span>{/if}
	</label>

	{#if hint}
		<p class="hint" id={hintId}>{hint}</p>
	{/if}

	{@render control({ id, describedBy, invalid: Boolean(error) })}

	{#if error}
		<p class="error" id={errorId}>{error}</p>
	{/if}
</div>

<style>
	.field {
		display: grid;
		gap: 0.35rem;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.required {
		padding: 0.05rem 0.4rem;
		border-radius: 4px;
		background: var(--accent-soft);
		color: var(--accent-strong);
		font-size: 0.7rem;
		font-weight: 600;
	}

	.hint {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.error {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--danger);
	}
</style>
