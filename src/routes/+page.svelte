<script lang="ts">
	import EventCard from '#lib/components/EventCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const open = $derived(data.events.filter((event) => event.status === 'open'));
	const others = $derived(data.events.filter((event) => event.status !== 'open'));
</script>

<svelte:head>
	<title>開催予定のイベント | イベント受付</title>
	<meta name="description" content="開催予定のイベント一覧と申込状況" />
</svelte:head>

<section>
	<header class="page-header">
		<h1>開催予定のイベント</h1>
		<p>申込から当日の受付までを、ひとつの画面でまとめて扱えるようにしています。</p>
	</header>

	{#if open.length > 0}
		<div class="grid">
			{#each open as event (event.id)}
				<EventCard {event} />
			{/each}
		</div>
	{:else}
		<p class="empty">現在、受付中のイベントはありません。</p>
	{/if}

	{#if others.length > 0}
		<h2 class="section-title">受付中ではないイベント</h2>
		<div class="grid">
			{#each others as event (event.id)}
				<EventCard {event} />
			{/each}
		</div>
	{/if}
</section>

<style>
	.grid {
		display: grid;
		gap: 1.25rem;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	}

	.section-title {
		margin: 2.5rem 0 1.25rem;
		font-size: 1rem;
		color: var(--text-muted);
	}

	.empty {
		margin: 0;
		padding: 2rem;
		border: 1px dashed var(--border);
		border-radius: 12px;
		color: var(--text-muted);
		text-align: center;
	}
</style>
