import { error, fail } from '@sveltejs/kit';
import {
	cancelAttendee,
	checkInAttendee,
	findAttendee,
	findEventBySlug,
	listAttendees,
	undoCheckIn
} from '#lib/server/repository.js';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const event = await findEventBySlug(params.slug);
	if (!event) {
		error(404, 'イベントが見つかりません');
	}
	return { event, attendees: await listAttendees(event.id) };
};

/**
 * 受付操作の3アクションは「対象を解決 → 更新 → 結果を返す」が同じ形なので、
 * 差分（更新処理と文言）だけを渡して組み立てる。
 */
function attendeeAction(
	update: (eventId: number, attendeeId: number) => Promise<boolean>,
	successMessage: (name: string) => string,
	conflictMessage: string
) {
	return async ({ request, params }: RequestEvent) => {
		const event = await findEventBySlug(params.slug);
		if (!event) {
			error(404, 'イベントが見つかりません');
		}

		const data = await request.formData();
		const attendeeId = readAttendeeId(data);
		if (attendeeId === null) {
			return fail(400, { status: 'error' as const, message: '対象の参加者を特定できませんでした。' });
		}

		const target = await findAttendee(event.id, attendeeId);
		if (!target) {
			return fail(404, {
				status: 'error' as const,
				message: 'このイベントに該当する参加者が見つかりません。'
			});
		}

		// 状態が条件に合わないとき（受付済みをもう一度受付など）は更新されない。
		if (!(await update(event.id, attendeeId))) {
			return fail(409, { status: 'error' as const, message: conflictMessage });
		}

		return { status: 'success' as const, message: successMessage(target.name) };
	};
}

function readAttendeeId(data: FormData): number | null {
	const raw = data.get('attendeeId');
	const id = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN;
	return Number.isInteger(id) && id > 0 ? id : null;
}

export const actions: Actions = {
	checkIn: attendeeAction(
		checkInAttendee,
		(name) => `${name} さんを受付しました。`,
		'この参加者は受付できる状態ではありません。画面を再読み込みしてご確認ください。'
	),
	undoCheckIn: attendeeAction(
		undoCheckIn,
		(name) => `${name} さんの受付を取り消しました。`,
		'この参加者は受付済みではありません。'
	),
	cancel: attendeeAction(
		cancelAttendee,
		(name) => `${name} さんの申込をキャンセルしました。`,
		'この参加者はすでにキャンセル済みです。'
	)
};
