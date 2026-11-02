/** クエリに渡せる値。日時は ISO 8601 文字列で受け渡しする。 */
export type SqlValue = string | number | null;

export type Dialect = 'sqlite' | 'postgres';

/**
 * データベースへの最小のインターフェース。
 * 呼び出し側は「`$1` 形式のプレースホルダで問い合わせる」ことだけを知っていればよく、
 * 方言の違い（プレースホルダの記法、型の返り方）は実装側に閉じる。
 */
export type Database = {
	readonly dialect: Dialect;
	query<Row>(sql: string, params?: SqlValue[]): Promise<Row[]>;
	/**
	 * 読み取り結果に依存して書き込む1文を、`lockKey` ごとに直列化して実行する。
	 *
	 * PostgreSQL では同じキーに対するアドバイザリロックを取ってから実行するため、
	 * 競合するリクエストはアボートではなく待機になる。SQLite では単一の書き込みロックで
	 * 元から直列化されるため、そのまま実行する。
	 */
	querySerialized<Row>(lockKey: string, sql: string, params?: SqlValue[]): Promise<Row[]>;
};

/**
 * 日時カラムの正規化。SQLite は TEXT をそのまま返し、PostgreSQL の timestamptz は
 * Date として返ってくるため、ドメイン型（ISO 8601 文字列）に揃える。
 */
export function toIsoString(value: unknown): string {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === 'string') return value;
	throw new TypeError(`日時として解釈できない値です: ${String(value)}`);
}

export function toIsoStringOrNull(value: unknown): string | null {
	return value === null || value === undefined ? null : toIsoString(value);
}
