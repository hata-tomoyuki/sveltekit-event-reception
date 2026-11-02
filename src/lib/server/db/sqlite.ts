import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Database, SqlValue } from './types.js';

/**
 * ローカル開発用。Node 標準の node:sqlite を使うので追加の依存はいらない。
 * サーバーレス環境ではファイルに書けないため、本番では postgres.ts 側が選ばれる。
 */
export async function createSqliteDatabase(file: string): Promise<Database> {
	// Vercel の Node ランタイムに node:sqlite が無い場合に起動ごと失敗しないよう、
	// 実際に SQLite を使うときだけ読み込む。
	const { DatabaseSync } = await import('node:sqlite');

	mkdirSync(dirname(file), { recursive: true });
	const connection = new DatabaseSync(file);
	connection.exec('PRAGMA foreign_keys = ON');

	async function query<Row>(sql: string, params: SqlValue[] = []): Promise<Row[]> {
		const { text, values } = toPositional(sql, params);
		const statement = connection.prepare(text);
		// node:sqlite は SELECT 以外で all() を使っても空配列が返るだけなので、
		// RETURNING の有無にかかわらず all() で統一できる。
		return statement.all(...values) as Row[];
	}

	return {
		dialect: 'sqlite',
		query,
		// SQLite の書き込みは単一のロックで直列化されるため、1文であれば追加の対処はいらない。
		querySerialized: (_lockKey, sql, params) => query(sql, params)
	};
}

/**
 * `$1` 形式を SQLite の `?` に書き換える。
 * 同じ番号が複数回現れても、出現順に値を並べ直すことで対応する。
 */
function toPositional(sql: string, params: SqlValue[]): { text: string; values: SqlValue[] } {
	const values: SqlValue[] = [];
	const text = sql.replace(/\$(\d+)/g, (_match, index: string) => {
		const position = Number(index) - 1;
		if (position < 0 || position >= params.length) {
			throw new RangeError(`プレースホルダ $${index} に対応する値がありません`);
		}
		values.push(params[position]);
		return '?';
	});
	return { text, values };
}
