/**
 * ドメイン型。サーバー（load / actions）とコンポーネントの両方が参照する唯一の定義元。
 * DB のカラム名（snake_case）はこの型に入る前に repository.ts で変換する。
 */

/** イベントの公開状態。申込可否は status と残席の両方で決まる。 */
export type EventStatus = 'draft' | 'open' | 'closed';

/** 一覧表示に必要な最小限のイベント情報。 */
export type EventSummary = {
	id: number;
	slug: string;
	title: string;
	/** ISO 8601 文字列。表示直前に format.ts で整形する。 */
	startsAt: string;
	venue: string;
	capacity: number;
	status: EventStatus;
	/** キャンセル済みを除いた申込数。 */
	registeredCount: number;
};

/** 詳細ページ用。一覧の情報に本文を足したもの。 */
export type EventDetail = EventSummary & {
	description: string;
};

export type AttendeeStatus = 'registered' | 'checked_in' | 'cancelled';

export type Attendee = {
	id: number;
	eventId: number;
	name: string;
	email: string;
	company: string | null;
	note: string | null;
	status: AttendeeStatus;
	registeredAt: string;
	checkedInAt: string | null;
};

/** 申込フォームの入力値。バリデーション前なので全て string。 */
export type RegistrationInput = {
	name: string;
	email: string;
	company: string;
	note: string;
};

export type FieldName = keyof RegistrationInput;

/** フィールド単位のエラー。actions から fail() で返し、フォームに差し戻す。 */
export type FieldErrors = Partial<Record<FieldName, string>>;

/** 申込が受け付けられなかった理由。UI の文言はこの値から引く。 */
export type RegistrationRejection = 'closed' | 'full' | 'duplicate';

export type RegistrationResult =
	| { ok: true; attendee: Attendee }
	| { ok: false; reason: RegistrationRejection };

export function remainingSeats(event: EventSummary): number {
	return Math.max(0, event.capacity - event.registeredCount);
}

export function canRegister(event: EventSummary): boolean {
	return event.status === 'open' && remainingSeats(event) > 0;
}
