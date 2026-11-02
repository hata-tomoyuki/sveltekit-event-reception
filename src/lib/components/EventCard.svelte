<script lang="ts">
	import SeatGauge from '#lib/components/SeatGauge.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { formatDateTime } from '#lib/format.js';
	import { canRegister, type EventSummary } from '#lib/types.js';

	let { event }: { event: EventSummary } = $props();

	const open = $derived(canRegister(event));
</script>

<article class="card">
	<header>
		<StatusBadge status={event.status} />
		<h2><a href="/events/{event.slug}">{event.title}</a></h2>
	</header>

	<dl class="meta">
		<dt>日時</dt>
		<dd>{formatDateTime(event.startsAt)}</dd>
		<dt>会場</dt>
		<dd>{event.venue}</dd>
	</dl>

	<SeatGauge capacity={event.capacity} registeredCount={event.registeredCount} />

	<footer>
		<a class="button" class:button--muted={!open} href="/events/{event.slug}">
			{open ? '詳細を見て申し込む' : '詳細を見る'}
		</a>
		<a class="link" href="/events/{event.slug}/attendees">参加者管理</a>
	</footer>
</article>

<style>
	.card {
		display: grid;
		gap: 1rem;
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--surface);
	}

	header {
		display: grid;
		gap: 0.5rem;
		justify-items: start;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.5;
	}

	h2 a {
		color: inherit;
		text-decoration: none;
	}

	h2 a:hover {
		text-decoration: underline;
	}

	.meta {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.3rem 1rem;
		margin: 0;
		font-size: 0.9rem;
	}

	dt {
		color: var(--text-muted);
	}

	dd {
		margin: 0;
	}

	footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}
</style>
