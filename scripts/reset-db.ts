/**
 * デモ用データの作り直し。テーブルを削除してスキーマと初期データを入れ直す。
 *
 *   npm run db:reset -- --yes                     # ローカル（data/app.db）
 *   DATABASE_URL=... npm run db:reset -- --yes    # Neon
 *
 * 破壊的な操作なので --yes が無ければ何もしない。
 */
import { createPostgresDatabase } from '../src/lib/server/db/postgres.ts';
import { createSqliteDatabase } from '../src/lib/server/db/sqlite.ts';
import { migrate, seed } from '../src/lib/server/db/schema.ts';
import type { Database } from '../src/lib/server/db/types.ts';

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const sqliteFile = process.env.DATABASE_FILE ?? 'data/app.db';
const target = connectionString ? 'Neon (PostgreSQL)' : `SQLite (${sqliteFile})`;

if (!process.argv.includes('--yes')) {
	console.error(`対象: ${target}`);
	console.error('申込データを含む全テーブルを削除します。実行するには --yes を付けてください。');
	process.exit(1);
}

const database: Database = connectionString
	? createPostgresDatabase(connectionString)
	: await createSqliteDatabase(sqliteFile);

console.log(`対象: ${target}`);

// 依存順に落とす。SQLite も PostgreSQL も IF EXISTS を解釈する。
await database.query('DROP TABLE IF EXISTS attendees');
await database.query('DROP TABLE IF EXISTS events');
console.log('テーブルを削除しました');

await migrate(database);
await seed(database);

const [events] = await database.query<{ count: number | string }>(
	'SELECT COUNT(*) AS count FROM events'
);
const [attendees] = await database.query<{ count: number | string }>(
	'SELECT COUNT(*) AS count FROM attendees'
);
console.log(`作り直しました: events=${Number(events.count)} attendees=${Number(attendees.count)}`);
