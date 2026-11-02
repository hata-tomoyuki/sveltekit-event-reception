<script lang="ts">
	import { enhance } from '$app/forms';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { formatDateTime, formatTime } from '#lib/format.js';
	import type { Attendee } from '#lib/types.js';

	let { attendees }: { attendees: Attendee[] } = $props();

	/** 受付当日に押す順に並べたいので、キャンセル済みは末尾へ落とす。 */
	const sorted = $derived(
		[...attendees].sort((a, b) => {
			const weight = (attendee: Attendee) => (attendee.status === 'cancelled' ? 1 : 0);
			return weight(a) - weight(b);
		})
	);
</script>

{#if sorted.length === 0}
	<p class="empty">まだ申込はありません。</p>
{:else}
	<div class="scroll">
		<table>
			<thead>
				<tr>
					<th scope="col">参加者</th>
					<th scope="col">所属</th>
					<th scope="col">状態</th>
					<th scope="col">申込日時</th>
					<th scope="col"><span class="sr-only">操作</span></th>
				</tr>
			</thead>
			<tbody>
				{#each sorted as attendee (attendee.id)}
					<tr class:row--cancelled={attendee.status === 'cancelled'}>
						<th scope="row">
							<span class="name">{attendee.name}</span>
							<a class="email" href="mailto:{attendee.email}">{attendee.email}</a>
							{#if attendee.note}
								<p class="note">{attendee.note}</p>
							{/if}
						</th>
						<td>{attendee.company ?? '—'}</td>
						<td>
							<StatusBadge status={attendee.status} />
							{#if attendee.checkedInAt}
								<p class="checked-in">{formatTime(attendee.checkedInAt)} 受付</p>
							{/if}
						</td>
						<td class="timestamp">{formatDateTime(attendee.registeredAt)}</td>
						<td>
							<div class="actions">
								{#if attendee.status === 'registered'}
									<form method="POST" action="?/checkIn" use:enhance>
										<input type="hidden" name="attendeeId" value={attendee.id} />
										<button class="button button--small">受付する</button>
									</form>
								{:else if attendee.status === 'checked_in'}
									<form method="POST" action="?/undoCheckIn" use:enhance>
										<input type="hidden" name="attendeeId" value={attendee.id} />
										<button class="button button--small button--muted">受付を取り消す</button>
									</form>
								{/if}

								{#if attendee.status !== 'cancelled'}
									<form method="POST" action="?/cancel" use:enhance>
										<input type="hidden" name="attendeeId" value={attendee.id} />
										<button class="link link--danger">キャンセル</button>
									</form>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.empty {
		margin: 0;
		padding: 2rem;
		border: 1px dashed var(--border);
		border-radius: 12px;
		color: var(--text-muted);
		text-align: center;
	}

	.scroll {
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--surface);
	}

	table {
		width: 100%; /* metric-ok: CSSの寸法指定 */
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th,
	td {
		padding: 0.9rem 1rem;
		text-align: left;
		vertical-align: top;
	}

	thead th {
		border-bottom: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
	}

	tbody tr + tr th,
	tbody tr + tr td {
		border-top: 1px solid var(--border);
	}

	tbody th {
		display: grid;
		gap: 0.15rem;
		font-weight: 400;
	}

	.name {
		font-weight: 600;
	}

	.email,
	.timestamp,
	.checked-in {
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	.note {
		margin: 0.3rem 0 0;
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	.checked-in {
		margin: 0.3rem 0 0;
	}

	.timestamp {
		white-space: nowrap;
	}

	.row--cancelled .name {
		text-decoration: line-through;
		color: var(--text-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%); /* metric-ok: CSSの寸法指定 */
		white-space: nowrap;
	}
</style>
