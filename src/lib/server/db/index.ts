import { createPostgresDatabase } from './postgres.js';
import { createSqliteDatabase } from './sqlite.js';
import { migrate, seed } from './schema.js';
import type { Database } from './types.js';

/**
 * 接続先の決定。接続文字列があれば Neon（PostgreSQL）、無ければローカルの SQLite。
 * Vercel の Neon 連携は POSTGRES_URL / DATABASE_URL のどちらかを注入するため、両方を見る。
 */
const CONNECTION_STRING = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const SQLITE_FILE = process.env.DATABASE_FILE ?? 'data/app.db';

let pending: Promise<Database> | null = null;

/** 初回呼び出しでスキーマ作成と初期データ投入まで済ませ、以降は同じ接続を返す。 */
export function getDatabase(): Promise<Database> {
	assertConfigured();
	pending ??= connect();
	return pending;
}

async function connect(): Promise<Database> {
	const database = CONNECTION_STRING
		? createPostgresDatabase(CONNECTION_STRING)
		: await createSqliteDatabase(SQLITE_FILE);

	await migrate(database);
	await seed(database);
	return database;
}

/**
 * サーバーレス環境では SQLite のファイルを作れないので、設定漏れを分かりやすい形で止める。
 * 何もしないと mkdir の ENOENT になり、原因がログからすぐ読み取れない。
 */
function assertConfigured(): void {
	if (CONNECTION_STRING || !process.env.VERCEL) return;
	throw new Error(
		'データベースの接続先が設定されていません。' +
			'Vercel 上では書き込み可能なファイルシステムが無いため SQLite は使えません。' +
			'環境変数 DATABASE_URL（または POSTGRES_URL）に Neon の接続文字列を設定してください。'
	);
}
