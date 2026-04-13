import { Pool, type PoolConfig, type QueryResult, type QueryResultRow } from 'pg';

const poolSymbol = Symbol.for('tools.kup.tz.postgresPool');

type GlobalWithPool = typeof globalThis & { [poolSymbol]?: Pool };

function buildPoolConfig(): PoolConfig {
  const host = process.env.POSTGRES_HOST?.trim();
  const user = process.env.POSTGRES_USER?.trim();
  const database = process.env.POSTGRES_DB?.trim();
  if (!host || !user || !database) {
    throw new Error('Set POSTGRES_HOST, POSTGRES_USER, and POSTGRES_DB to use PostgreSQL.');
  }
  return {
    host,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user,
    password: process.env.POSTGRES_PASSWORD ?? '',
    database,
  };
}

export function isPostgresConfigured(): boolean {
  return Boolean(
    process.env.POSTGRES_HOST?.trim()
    && process.env.POSTGRES_USER?.trim()
    && process.env.POSTGRES_DB?.trim(),
  );
}

/**
 * Shared connection pool for the Nitro server. Prefer `usePostgres()` in handlers.
 * Call only when `isPostgresConfigured()` is true.
 */
export function getPostgresPool(): Pool {
  const g = globalThis as GlobalWithPool;
  if (!g[poolSymbol]) {
    g[poolSymbol] = new Pool(buildPoolConfig());
  }
  return g[poolSymbol];
}

export function usePostgres() {
  const pool = getPostgresPool();
  return {
    pool,
    query: <T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) =>
      pool.query<T>(text, params) as Promise<QueryResult<T>>,
  };
}
