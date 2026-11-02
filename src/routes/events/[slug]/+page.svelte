<script lang="ts">
	import { enhance } from '$app/forms';
	import Field from '#lib/components/Field.svelte';
	import SeatGauge from '#lib/components/SeatGauge.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { formatDateTime } from '#lib/format.js';
	import { canRegister, type FieldErrors, type RegistrationInput } from '#lib/types.js';
	import {
		MAX_NOTE_LENGTH,
		hasErrors,
		toRegistrationInput,
		validateRegistration
	} from '#lib/validation.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const EMPTY: RegistrationInput = { name: '', email: '', company: '', note: '' };

	/**
	 * 入力値の保持先はフォーム要素そのもので、コンポーネント側に写しは持たない。
	 * 失敗時はサーバーが返した値を value として描き戻すので、JS 無効でも入力が消えない。
	 */
	const values = $derived<RegistrationInput>(form?.status === 'error' ? form.values : EMPTY);

	let clientErrors = $state<FieldErrors>({});
	/** 文字数カウンタ用。入力が始まるまでは描画された値の長さを使う。 */
	let typedNoteLength = $state<number | null>(null);

	const open = $derived(canRegister(data.event));
	const serverErrors = $derived<FieldErrors>(form?.status === 'error' ? form.errors : {});
	const errors = $derived<FieldErrors>(hasErrors(clientErrors) ? clientErrors : serverErrors);
	const noteLength = $derived(typedNoteLength ?? values.note.length);

	/** 一度エラーを出したフィールドは、入力中に消えるようにする。 */
	function revalidate(event: Event) {
		const formElement = (event.currentTarget as HTMLElement).closest('form');
		if (formElement && hasErrors(clientErrors)) {
			clientErrors = validateRegistration(toRegistrationInput(new FormData(formElement)));
		}
	}
</script>

<svelte:head>
	<title>{data.event.title} | イベント受付</title>
	<meta name="description" content={data.event.description.slice(0, 120)} />
</svelte:head>

<article>
	<a class="back" href="/">← イベント一覧</a>

	<header class="page-header">
		<StatusBadge status={data.event.status} />
		<h1>{data.event.title}</h1>
		<dl class="meta">
			<dt>日時</dt>
			<dd>{formatDateTime(data.event.startsAt)}</dd>
			<dt>会場</dt>
			<dd>{data.event.venue}</dd>
		</dl>
	</header>

	<p class="description">{data.event.description}</p>

	<div class="panel">
		<SeatGauge capacity={data.event.capacity} registeredCount={data.event.registeredCount} />
	</div>

	{#if form?.status === 'success'}
		<div class="notice notice--success" role="status">
			<h2>申込を受け付けました</h2>
			<p>
				{form.name} さんの申込を登録しました。確認のご連絡を {form.email} 宛にお送りします。
			</p>
			<a class="link" href="/events/{data.event.slug}/attendees">参加者一覧で確認する</a>
		</div>
	{/if}

	{#if open}
		<section class="form-section">
			<h2>参加申込</h2>

			{#if form?.status === 'error' && form.message}
				<p class="notice notice--error" role="alert">{form.message}</p>
			{/if}

			<form
				method="POST"
				novalidate
				use:enhance={({ formData, cancel }) => {
					// 送信前のチェックはサーバーと同じ関数で行う（ルールの二重管理を避ける）。
					clientErrors = validateRegistration(toRegistrationInput(formData));
					if (hasErrors(clientErrors)) {
						cancel();
						return;
					}

					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							clientErrors = {};
							typedNoteLength = null;
						}
					};
				}}
			>
				<Field name="name" label="お名前" required error={errors.name}>
					{#snippet control({ id, describedBy, invalid })}
						<input
							{id}
							name="name"
							type="text"
							autocomplete="name"
							value={values.name}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							oninput={revalidate}
						/>
					{/snippet}
				</Field>

				<Field
					name="email"
					label="メールアドレス"
					required
					hint="当日の参加URLをこのアドレスへお送りします。"
					error={errors.email}
				>
					{#snippet control({ id, describedBy, invalid })}
						<input
							{id}
							name="email"
							type="email"
							autocomplete="email"
							value={values.email}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							oninput={revalidate}
						/>
					{/snippet}
				</Field>

				<Field name="company" label="会社名・所属" error={errors.company}>
					{#snippet control({ id, describedBy, invalid })}
						<input
							{id}
							name="company"
							type="text"
							autocomplete="organization"
							value={values.company}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							oninput={revalidate}
						/>
					{/snippet}
				</Field>

				<Field
					name="note"
					label="備考"
					hint="参加目的や当日に聞きたいことがあればご記入ください。"
					error={errors.note}
				>
					{#snippet control({ id, describedBy, invalid })}
						<textarea
							{id}
							name="note"
							rows="4"
							value={values.note}
							aria-describedby={describedBy}
							aria-invalid={invalid}
							oninput={(event) => {
								typedNoteLength = event.currentTarget.value.length;
								revalidate(event);
							}}
						></textarea>
					{/snippet}
				</Field>

				<p class="counter" class:counter--over={noteLength > MAX_NOTE_LENGTH}>
					備考 {noteLength} / {MAX_NOTE_LENGTH} 文字
				</p>

				<button class="button">この内容で申し込む</button>
			</form>
		</section>
	{:else}
		<p class="notice notice--muted">
			{#if data.event.status === 'closed'}
				このイベントの受付は終了しました。
			{:else if data.event.status === 'draft'}
				このイベントはまだ受付を開始していません。
			{:else}
				定員に達したため、現在は申込を受け付けていません。
			{/if}
		</p>
	{/if}

	<p class="admin-link">
		運営向け: <a class="link" href="/events/{data.event.slug}/attendees">参加者管理</a>
	</p>
</article>

<style>
	article {
		max-width: 44rem;
	}

	.back {
		display: inline-block;
		margin-bottom: 1.5rem;
		color: var(--text-muted);
		font-size: 0.9rem;
		text-decoration: none;
	}

	.back:hover {
		color: var(--text);
	}

	.meta {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.3rem 1rem;
		margin: 1rem 0 0;
		font-size: 0.9rem;
	}

	dt {
		color: var(--text-muted);
	}

	dd {
		margin: 0;
	}

	.description {
		margin: 0 0 1.5rem;
		line-height: 1.9;
	}

	.panel {
		padding: 1.25rem 1.5rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--surface);
	}

	.form-section {
		margin-top: 2.5rem;
	}

	.form-section h2 {
		margin: 0 0 1.25rem;
		font-size: 1.1rem;
	}

	form {
		display: grid;
		gap: 1.25rem;
		justify-items: stretch;
	}

	form :global(input),
	form :global(textarea) {
		width: 100%; /* metric-ok: CSSの寸法指定 */
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
	}

	form :global(input:focus-visible),
	form :global(textarea:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	form :global([aria-invalid='true']) {
		border-color: var(--danger);
	}

	.counter {
		margin: -0.75rem 0 0;
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	.counter--over {
		color: var(--danger);
		font-weight: 600;
	}

	form button {
		justify-self: start;
	}

	.notice {
		margin: 1.5rem 0 0;
		padding: 1rem 1.25rem;
		border-radius: 12px;
		line-height: 1.8;
	}

	.notice--success {
		background: var(--accent-soft);
		color: var(--accent-strong);
	}

	.notice--success h2 {
		margin: 0 0 0.3rem;
		font-size: 1rem;
	}

	.notice--success p {
		margin: 0 0 0.5rem;
	}

	.notice--error {
		background: var(--danger-soft);
		color: var(--danger);
		font-weight: 600;
	}

	.notice--muted {
		background: var(--surface-sunken);
		color: var(--text-muted);
	}

	.admin-link {
		margin: 3rem 0 0;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.85rem;
	}
</style>
