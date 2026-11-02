<script lang="ts">
	import { attendeeStatusLabel, eventStatusLabel } from '#lib/format.js';
	import type { AttendeeStatus, EventStatus } from '#lib/types.js';

	type Status = EventStatus | AttendeeStatus;

	let { status }: { status: Status } = $props();

	// 状態 → 見た目の対応はここだけに置く。ルート側では色を選ばせない。
	const TONES: Record<Status, 'accent' | 'neutral' | 'muted'> = {
		draft: 'neutral',
		open: 'accent',
		closed: 'muted',
		registered: 'neutral',
		checked_in: 'accent',
		cancelled: 'muted'
	};

	const LABELS: Record<Status, string> = { ...eventStatusLabel, ...attendeeStatusLabel };

	const tone = $derived(TONES[status]);
	const label = $derived(LABELS[status]);
</script>

<span class="badge badge--{tone}">{label}</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1.6;
		white-space: nowrap;
	}

	.badge--accent {
		background: var(--accent-soft);
		color: var(--accent-strong);
	}

	.badge--neutral {
		background: var(--surface-sunken);
		color: var(--text);
	}

	.badge--muted {
		background: var(--surface-sunken);
		color: var(--text-muted);
	}
</style>
