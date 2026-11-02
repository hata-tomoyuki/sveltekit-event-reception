import { neon } from '@neondatabase/serverless';
import type { Database, SqlValue } from './types.js';

/**
 * 本番用（Neon / PostgreSQL）。HTTP 経由の接続なので、サーバーレス環境でも
 * コネクションプールを持ち回る必要がない。
 */
export function createPostgresDatabase(connectionString: string): Database {
	const sql = neon(connectionString);

	async function query<Row>(text: string, params: SqlValue[] = []): Promise<Row[]> {
		return (await sql.query(text, params)) as Row[];
	}

	return {
		dialect: 'postgres',
		query,

		/**
		 * 「数えてから書く」処理は、既定の READ COMMITTED では同時実行で両方通ってしまう。
		 * SERIALIZABLE に上げる方法もあるが、競合が連鎖すると直列化の失敗が多発し、
		 * 再試行で吸収しきれなかった分がそのままエラーになる。
		 * ここではキーごとのアドバイザリロックを先に取り、競合を待機に変えている。
		 * ロックはトランザクション終了時に自動で解放される。
		 */
		async querySerialized<Row>(
			lockKey: string,
			text: string,
			params: SqlValue[] = []
		): Promise<Row[]> {
			const [, rows] = await sql.transaction([
				sql.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]),
				sql.query(text, params)
			]);
			return rows as Row[];
		}
	};
}
