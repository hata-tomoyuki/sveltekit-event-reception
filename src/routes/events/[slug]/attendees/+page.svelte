<script lang="ts">
	import AttendeeTable from '#lib/components/AttendeeTable.svelte';
	import SeatGauge from '#lib/components/SeatGauge.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { formatDateTime } from '#lib/format.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const counts = $derived({
		checkedIn: data.attendees.filter((attendee) => attendee.status === 'checked_in').length,
		registered: data.attendees.filter((attendee) => attendee.status === 'registered').length,
		cancelled: data.attendees.filter((attendee) => attendee.status === 'cancelled').length
	});
</script>

<svelte:head>
	<title>参加者管理: {data.event.title} | イベント受付</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section>
	<a class="back" href="/events/{data.event.slug}">← イベント詳細</a>

	<header class="page-header">
		<StatusBadge status={data.event.status} />
		<h1>参加者管理</h1>
		<p>{data.event.title} ／ {formatDateTime(data.event.startsAt)}</p>
	</header>

	<div class="summary">
		<div class="stat">
			<dt>受付済み</dt>
			<dd>{counts.checkedIn}</dd>
		</div>
		<div class="stat">
			<dt>未受付</dt>
			<dd>{counts.registered}</dd>
		</div>
		<div class="stat">
			<dt>キャンセル</dt>
			<dd>{counts.cancelled}</dd>
		</div>
		<div class="gauge-cell">
			<SeatGauge capacity={data.event.capacity} registeredCount={data.event.registeredCount} />
		</div>
	</div>

	{#if form}
		<p
			class="notice"
			class:notice--success={form.status === 'success'}
			class:notice--error={form.status === 'error'}
			role={form.status === 'error' ? 'alert' : 'status'}
		>
			{form.message}
		</p>
	{/if}

	<AttendeeTable attendees={data.attendees} />
</section>

<style>
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

	.page-header p {
		margin: 0.75rem 0 0;
		color: var(--text-muted);
	}

	.summary {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		margin-bottom: 1.5rem;
	}

	.stat,
	.gauge-cell {
		padding: 1rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--surface);
	}

	.gauge-cell {
		display: grid;
		align-content: center;
		grid-column: span 2;
	}

	dt {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	dd {
		margin: 0.2rem 0 0;
		font-size: 1.6rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.notice {
		margin: 0 0 1.5rem;
		padding: 0.9rem 1.25rem;
		border-radius: 12px;
		font-weight: 600;
	}

	.notice--success {
		background: var(--accent-soft);
		color: var(--accent-strong);
	}

	.notice--error {
		background: var(--danger-soft);
		color: var(--danger);
	}
</style>
