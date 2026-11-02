import { error, fail } from '@sveltejs/kit';
import { findEventBySlug, registerAttendee } from '#lib/server/repository.js';
import type { RegistrationRejection } from '#lib/types.js';
import { hasErrors, toRegistrationInput, validateRegistration } from '#lib/validation.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const event = await findEventBySlug(params.slug);
	if (!event) {
		error(404, 'イベントが見つかりません');
	}
	return { event };
};

/** 申込を受け付けられなかったときの文言。理由ごとに次の行動が変わるので使い分ける。 */
const REJECTION_MESSAGE: Record<RegistrationRejection, string> = {
	closed: 'このイベントは現在申込を受け付けていません。',
	full: '定員に達したため、申込を受け付けられませんでした。キャンセルが出た場合は再度ご確認ください。',
	duplicate: 'このメールアドレスでの申込はすでに登録されています。'
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const values = toRegistrationInput(await request.formData());

		// 入力チェックはサーバー側を正とする。クライアント側の早出しは同じ関数を使う。
		const errors = validateRegistration(values);
		if (hasErrors(errors)) {
			return fail(400, { status: 'error' as const, values, errors, message: null });
		}

		// 定員・重複の判定は DB のトランザクション内で行う（repository 側）。
		const result = await registerAttendee(params.slug, values);
		if (!result.ok) {
			return fail(409, {
				status: 'error' as const,
				values,
				errors: {},
				message: REJECTION_MESSAGE[result.reason]
			});
		}

		return {
			status: 'success' as const,
			name: result.attendee.name,
			email: result.attendee.email
		};
	}
};
