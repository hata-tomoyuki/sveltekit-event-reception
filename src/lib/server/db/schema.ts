import type { Database, Dialect } from './types.js';

/**
 * スキーマ定義。方言差が出るのは主キーの採番と日時型だけなので、その2点だけを分けている。
 * Neon HTTP は1リクエストにつき1文なので、文の配列として持つ。
 */
const SCHEMA: Record<Dialect, string[]> = {
	sqlite: [
		`CREATE TABLE IF NOT EXISTS events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			slug TEXT NOT NULL UNIQUE,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			starts_at TEXT NOT NULL,
			venue TEXT NOT NULL,
			capacity INTEGER NOT NULL CHECK (capacity > 0),
			status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'closed'))
		)`,
		`CREATE TABLE IF NOT EXISTS attendees (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			email TEXT NOT NULL,
			company TEXT,
			note TEXT,
			status TEXT NOT NULL CHECK (status IN ('registered', 'checked_in', 'cancelled')),
			registered_at TEXT NOT NULL,
			checked_in_at TEXT,
			UNIQUE (event_id, email)
		)`,
		`CREATE INDEX IF NOT EXISTS attendees_event_idx ON attendees (event_id, status)`
	],
	postgres: [
		`CREATE TABLE IF NOT EXISTS events (
			id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
			slug TEXT NOT NULL UNIQUE,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			starts_at TIMESTAMPTZ NOT NULL,
			venue TEXT NOT NULL,
			capacity INTEGER NOT NULL CHECK (capacity > 0),
			status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'closed'))
		)`,
		`CREATE TABLE IF NOT EXISTS attendees (
			id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
			event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			email TEXT NOT NULL,
			company TEXT,
			note TEXT,
			status TEXT NOT NULL CHECK (status IN ('registered', 'checked_in', 'cancelled')),
			registered_at TIMESTAMPTZ NOT NULL,
			checked_in_at TIMESTAMPTZ,
			UNIQUE (event_id, email)
		)`,
		`CREATE INDEX IF NOT EXISTS attendees_event_idx ON attendees (event_id, status)`
	]
};

export async function migrate(database: Database): Promise<void> {
	for (const statement of SCHEMA[database.dialect]) {
		await database.query(statement);
	}
}

function daysFromNow(days: number, hour: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	date.setHours(hour, 0, 0, 0);
	return date.toISOString();
}

/** デモ用の初期データ。イベントが1件でもあれば何もしない。 */
export async function seed(database: Database): Promise<void> {
	const [row] = await database.query<{ count: number | string }>(
		'SELECT COUNT(*) AS count FROM events'
	);
	if (Number(row?.count ?? 0) > 0) return;

	const events = [
		{
			slug: 'ai-dev-meetup',
			title: 'AI前提の開発ワークフロー勉強会',
			description:
				'Claude Code や Codex を日常の開発に組み込んでいる人が、実際の運用と失敗例を持ち寄る回です。発表20分 + 質疑、その後に懇談の時間をとります。',
			startsAt: daysFromNow(14, 19),
			venue: 'オンライン（Zoom）',
			capacity: 30,
			status: 'open'
		},
		{
			slug: 'sveltekit-workshop',
			title: 'SvelteKitハンズオン: load と form actions',
			description:
				'サーバー側のデータ取得とフォーム処理を、小さな管理画面を作りながら手を動かして確認します。TypeScript の環境構築は済んでいる前提です。',
			startsAt: daysFromNow(28, 13),
			venue: '東京・神田（会場参加のみ）',
			capacity: 12,
			status: 'open'
		},
		{
			slug: 'lp-improvement-clinic',
			title: 'LP改善クリニック（終了）',
			description: '参加者が持ち込んだLPを、導線とスマホ表示の観点で一緒に見直した回です。',
			startsAt: daysFromNow(-7, 19),
			venue: 'オンライン（Zoom）',
			capacity: 20,
			status: 'closed'
		}
	];

	const ids = new Map<string, number>();
	for (const event of events) {
		const [inserted] = await database.query<{ id: number }>(
			`INSERT INTO events (slug, title, description, starts_at, venue, capacity, status)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 RETURNING id`,
			[
				event.slug,
				event.title,
				event.description,
				event.startsAt,
				event.venue,
				event.capacity,
				event.status
			]
		);
		ids.set(event.slug, Number(inserted.id));
	}

	const attendees = [
		{
			slug: 'ai-dev-meetup',
			name: '佐藤 美咲',
			email: 'sato@example.com',
			company: '株式会社サンプル',
			note: null,
			status: 'checked_in',
			registeredAt: daysFromNow(-3, 10),
			checkedInAt: daysFromNow(-3, 11)
		},
		{
			slug: 'ai-dev-meetup',
			name: '鈴木 一郎',
			email: 'suzuki@example.com',
			company: 'フリーランス',
			note: 'オンライン参加希望です',
			status: 'registered',
			registeredAt: daysFromNow(-2, 15),
			checkedInAt: null
		},
		{
			slug: 'sveltekit-workshop',
			name: '田中 花子',
			email: 'tanaka@example.com',
			company: null,
			note: null,
			status: 'registered',
			registeredAt: daysFromNow(-1, 9),
			checkedInAt: null
		}
	];

	for (const attendee of attendees) {
		await database.query(
			`INSERT INTO attendees
				(event_id, name, email, company, note, status, registered_at, checked_in_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			[
				ids.get(attendee.slug) ?? null,
				attendee.name,
				attendee.email,
				attendee.company,
				attendee.note,
				attendee.status,
				attendee.registeredAt,
				attendee.checkedInAt
			]
		);
	}
}
