import type { AttendeeStatus, EventStatus } from '#lib/types.js';

const DATE_TIME = new Intl.DateTimeFormat('ja-JP', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	weekday: 'short'
});

const TIME = new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit' });

export function formatDateTime(isoString: string): string {
	return DATE_TIME.format(new Date(isoString));
}

export function formatTime(isoString: string): string {
	return TIME.format(new Date(isoString));
}

export const eventStatusLabel: Record<EventStatus, string> = {
	draft: '準備中',
	open: '受付中',
	closed: '受付終了'
};

export const attendeeStatusLabel: Record<AttendeeStatus, string> = {
	registered: '申込済み',
	checked_in: '受付済み',
	cancelled: 'キャンセル'
};
