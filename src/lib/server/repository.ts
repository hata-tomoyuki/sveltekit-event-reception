import { getDatabase } from '#lib/server/db/index.js';
import { toIsoString, toIsoStringOrNull } from '#lib/server/db/types.js';
import type {
	Attendee,
	EventDetail,
	EventSummary,
	RegistrationInput,
	RegistrationRejection,
	RegistrationResult
} from '#lib/types.js';

/**
 * データアクセスの境界。ルート側はここで公開した関数しか呼ばず、SQL も行の形も知らない。
 * SQLite と PostgreSQL の差は db/ 配下に閉じているので、このファイルの SQL は 1 種類で済む。
 */

/** events テーブル + 集計列の行の形。map 関数を通してからドメイン型になる。 */
type EventRow = {
	id: number;
	slug: string;
	title: string;
	description: string;
	starts_at: unknown;
	venue: string;
	capacity: number;
	status: string;
	registered_count: number | string;
};

type AttendeeRow = {
	id: number;
	event_id: number;
	name: string;
	email: string;
	company: string | null;
	note: string | null;
	status: string;
	registered_at: unknown;
	checked_in_at: unknown;
};

const EVENT_COLUMNS = `
	e.id, e.slug, e.title, e.description, e.starts_at, e.venue, e.capacity, e.status,
	(SELECT COUNT(*) FROM attendees a WHERE a.event_id = e.id AND a.status <> 'cancelled')
		AS registered_count
`;

/** 開催が近い順。受付終了のイベントも一覧には残す。 */
export async function listEvents(): Promise<EventSummary[]> {
	const database = await getDatabase();
	const rows = await database.query<EventRow>(
		`SELECT ${EVENT_COLUMNS} FROM events e ORDER BY e.starts_at ASC`
	);
	return rows.map(toEventSummary);
}

export async function findEventBySlug(slug: string): Promise<EventDetail | null> {
	const database = await getDatabase();
	const [row] = await database.query<EventRow>(
		`SELECT ${EVENT_COLUMNS} FROM events e WHERE e.slug = $1`,
		[slug]
	);
	return row ? toEventDetail(row) : null;
}

/** 管理画面用。キャンセルも含め、申込が新しい順に返す。 */
export async function listAttendees(eventId: number): Promise<Attendee[]> {
	const database = await getDatabase();
	const rows = await database.query<AttendeeRow>(
		'SELECT * FROM attendees WHERE event_id = $1 ORDER BY registered_at DESC',
		[eventId]
	);
	return rows.map(toAttendee);
}

export async function findAttendee(eventId: number, attendeeId: number): Promise<Attendee | null> {
	const database = await getDatabase();
	const [row] = await database.query<AttendeeRow>(
		'SELECT * FROM attendees WHERE id = $1 AND event_id = $2',
		[attendeeId, eventId]
	);
	return row ? toAttendee(row) : null;
}

/**
 * 申込の登録。
 *
 * 「受付中か」「定員に空きがあるか」「同じメールアドレスで申込済みでないか」の判定と挿入を
 * 1 文にまとめている。別々に問い合わせてから挿入すると、残り 1 席に同時に申し込まれたときに
 * 定員を超えるため。キャンセル済みの行に同じアドレスで申し込み直した場合だけ、
 * ON CONFLICT 側でその行を復活させる。
 *
 * 1 件も挿入されなかったときは、理由を知るために改めて状態を読み直す（メッセージの出し分け用で、
 * 登録の可否そのものはこの 1 文で確定している）。
 */
export async function registerAttendee(
	slug: string,
	input: RegistrationInput
): Promise<RegistrationResult> {
	const database = await getDatabase();
	const registeredAt = new Date().toISOString();

	// イベント単位で直列化する。同じイベントへの同時申込だけが待ち合わせる。
	const rows = await database.querySerialized<AttendeeRow>(
		slug,
		`INSERT INTO attendees
			(event_id, name, email, company, note, status, registered_at, checked_in_at)
		 SELECT e.id, $2, $3, $4, $5, 'registered', $6, NULL
		   FROM events e
		  WHERE e.slug = $1
		    AND e.status = 'open'
		    AND (
		          SELECT COUNT(*) FROM attendees a
		           WHERE a.event_id = e.id AND a.status <> 'cancelled'
		        ) < e.capacity
		 ON CONFLICT (event_id, email) DO UPDATE
		    SET name = excluded.name,
		        company = excluded.company,
		        note = excluded.note,
		        status = 'registered',
		        registered_at = excluded.registered_at,
		        checked_in_at = NULL
		  WHERE attendees.status = 'cancelled'
		 RETURNING *`,
		[slug, input.name, input.email, input.company || null, input.note || null, registeredAt]
	);

	if (rows.length > 0) {
		return { ok: true, attendee: toAttendee(rows[0]) };
	}

	return { ok: false, reason: await classifyRejection(slug, input.email) };
}

async function classifyRejection(slug: string, email: string): Promise<RegistrationRejection> {
	const event = await findEventBySlug(slug);
	if (!event || event.status !== 'open') return 'closed';

	const database = await getDatabase();
	const existing = await database.query<{ id: number }>(
		`SELECT id FROM attendees
		  WHERE event_id = $1 AND email = $2 AND status <> 'cancelled'`,
		[event.id, email]
	);
	return existing.length > 0 ? 'duplicate' : 'full';
}

/** 当日の受付。すでに受付済み・キャンセル済みなら false を返して何もしない。 */
export async function checkInAttendee(eventId: number, attendeeId: number): Promise<boolean> {
	return updateAttendeeStatus(
		`UPDATE attendees SET status = 'checked_in', checked_in_at = $3
		  WHERE id = $1 AND event_id = $2 AND status = 'registered'
		 RETURNING id`,
		[attendeeId, eventId, new Date().toISOString()]
	);
}

/** 受付済みを申込済みへ戻す（受付の押し間違いの取り消し）。 */
export async function undoCheckIn(eventId: number, attendeeId: number): Promise<boolean> {
	return updateAttendeeStatus(
		`UPDATE attendees SET status = 'registered', checked_in_at = NULL
		  WHERE id = $1 AND event_id = $2 AND status = 'checked_in'
		 RETURNING id`,
		[attendeeId, eventId]
	);
}

/** キャンセル。行は消さず status を変える（残席の集計から外れる）。 */
export async function cancelAttendee(eventId: number, attendeeId: number): Promise<boolean> {
	return updateAttendeeStatus(
		`UPDATE attendees SET status = 'cancelled', checked_in_at = NULL
		  WHERE id = $1 AND event_id = $2 AND status <> 'cancelled'
		 RETURNING id`,
		[attendeeId, eventId]
	);
}

/**
 * 状態の更新。更新できた行を RETURNING で受け取ることで、
 * 「対象が条件に合わず何も変わらなかった」を方言に依存せず判定する。
 */
async function updateAttendeeStatus(sql: string, params: (string | number)[]): Promise<boolean> {
	const database = await getDatabase();
	const rows = await database.query<{ id: number }>(sql, params);
	return rows.length > 0;
}

function toEventSummary(row: EventRow): EventSummary {
	return {
		id: Number(row.id),
		slug: row.slug,
		title: row.title,
		startsAt: toIsoString(row.starts_at),
		venue: row.venue,
		capacity: Number(row.capacity),
		status: row.status as EventSummary['status'],
		registeredCount: Number(row.registered_count)
	};
}

function toEventDetail(row: EventRow): EventDetail {
	return { ...toEventSummary(row), description: row.description };
}

function toAttendee(row: AttendeeRow): Attendee {
	return {
		id: Number(row.id),
		eventId: Number(row.event_id),
		name: row.name,
		email: row.email,
		company: row.company,
		note: row.note,
		status: row.status as Attendee['status'],
		registeredAt: toIsoString(row.registered_at),
		checkedInAt: toIsoStringOrNull(row.checked_in_at)
	};
}
