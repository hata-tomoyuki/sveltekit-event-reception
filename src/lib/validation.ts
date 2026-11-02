import type { FieldErrors, RegistrationInput } from '#lib/types.js';

/**
 * 申込フォームのバリデーション。サーバー（actions）が正とし、
 * クライアントは同じ関数で送信前に早出しするだけ。片方だけ直すと挙動がずれるので、
 * ルールの追加はこのファイルに閉じる。
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_NOTE_LENGTH = 200;

/** FormData を入力型へ。trim まで済ませ、差し戻し時もこの値を使う。 */
export function toRegistrationInput(data: FormData): RegistrationInput {
	return {
		name: readField(data, 'name'),
		email: readField(data, 'email'),
		company: readField(data, 'company'),
		note: readField(data, 'note')
	};
}

export function validateRegistration(input: RegistrationInput): FieldErrors {
	const errors: FieldErrors = {};

	if (input.name.length === 0) {
		errors.name = 'お名前を入力してください';
	} else if (input.name.length > 50) {
		errors.name = 'お名前は50文字以内で入力してください';
	}

	if (input.email.length === 0) {
		errors.email = 'メールアドレスを入力してください';
	} else if (!EMAIL_PATTERN.test(input.email)) {
		errors.email = 'メールアドレスの形式が正しくありません';
	}

	if (input.company.length > 80) {
		errors.company = '会社名・所属は80文字以内で入力してください';
	}

	if (input.note.length > MAX_NOTE_LENGTH) {
		errors.note = `備考は${MAX_NOTE_LENGTH}文字以内で入力してください`;
	}

	return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
	return Object.keys(errors).length > 0;
}

function readField(data: FormData, name: string): string {
	const value = data.get(name);
	return typeof value === 'string' ? value.trim() : '';
}
