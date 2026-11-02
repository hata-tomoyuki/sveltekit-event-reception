<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<header class="site-header">
		<a class="brand" href="/">イベント受付</a>
		<p class="tagline">申込から当日の受付までの最小構成</p>
	</header>

	<main>
		{@render children()}
	</main>

	<footer class="site-footer">
		<p>SvelteKit / TypeScript の学習用に作成したサンプルです。</p>
	</footer>
</div>

<style>
	:global(:root) {
		--bg: #f7f8fa;
		--surface: #ffffff;
		--surface-sunken: #eef0f4;
		--border: #e2e5ea;
		--border-strong: #c8ccd4;
		--text: #1a1d23;
		--text-muted: #666d7a;
		--accent: #2563eb;
		--accent-strong: #1d4ed8;
		--accent-soft: #e5edff;
		--danger: #c0362c;
		--danger-soft: #fdeceb;
		--warn: #c97a16;

		color-scheme: light dark;
	}

	@media (prefers-color-scheme: dark) {
		:global(:root) {
			--bg: #14161a;
			--surface: #1c1f25;
			--surface-sunken: #262a31;
			--border: #2d323a;
			--border-strong: #434a55;
			--text: #e9ebef;
			--text-muted: #9aa2b1;
			--accent: #6f9bff;
			--accent-strong: #a9c3ff;
			--accent-soft: #1f2b45;
			--danger: #ff8d82;
			--danger-soft: #3a211f;
			--warn: #e0a444;
		}
	}

	:global(body) {
		margin: 0;
		background: var(--bg);
		color: var(--text);
		font-family:
			system-ui,
			-apple-system,
			'Hiragino Kaku Gothic ProN',
			'Noto Sans JP',
			sans-serif;
		line-height: 1.7;
	}

	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	:global(a) {
		color: var(--accent-strong);
	}

	/* ボタンとリンクボタンの見た目は全ページで共通にするため、ここで定義する。 */
	:global(.button) {
		display: inline-block;
		padding: 0.55rem 1.1rem;
		border: 1px solid transparent;
		border-radius: 8px;
		background: var(--accent);
		color: #ffffff;
		font: inherit;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	:global(.button:hover) {
		filter: brightness(1.08);
	}

	:global(.button--muted) {
		background: var(--surface-sunken);
		border-color: var(--border-strong);
		color: var(--text);
	}

	:global(.button--small) {
		padding: 0.35rem 0.8rem;
		font-size: 0.85rem;
	}

	:global(.link) {
		padding: 0;
		border: none;
		background: none;
		color: var(--accent-strong);
		font: inherit;
		font-size: 0.9rem;
		text-decoration: underline;
		cursor: pointer;
	}

	:global(.link--danger) {
		color: var(--danger);
	}

	:global(.page-header) {
		margin: 0 0 2rem;
	}

	:global(.page-header h1) {
		margin: 0.5rem 0 0;
		font-size: 1.6rem;
		line-height: 1.4;
	}

	:global(.page-header > p) {
		margin: 0.75rem 0 0;
		color: var(--text-muted);
	}

	.shell {
		display: grid;
		grid-template-rows: auto 1fr auto;
		min-height: 100vh;
		max-width: 68rem;
		margin: 0 auto;
		padding: 0 1.25rem;
	}

	.site-header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 1rem;
		padding: 1.75rem 0;
	}

	.brand {
		color: var(--text);
		font-size: 1.05rem;
		font-weight: 700;
		text-decoration: none;
	}

	.tagline {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	main {
		padding-bottom: 3rem;
	}

	.site-footer {
		padding: 1.5rem 0 2.5rem;
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	.site-footer p {
		margin: 0;
	}
</style>
