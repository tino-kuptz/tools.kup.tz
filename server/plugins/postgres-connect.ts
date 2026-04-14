import { getPostgresPool, isPostgresConfigured } from '../utils/postgres';

export default defineNitroPlugin(async () => {
  if (!isPostgresConfigured()) {
    console.warn('[postgres] POSTGRES_HOST / POSTGRES_USER / POSTGRES_DB not set — exiting');
    process.exit(1);
  }
  try {
    const pool = getPostgresPool();
    await pool.query('SELECT 1');
    console.info('[postgres] Startup connection check OK');
  } catch (err) {
    console.error('[postgres] Startup connection check failed:', err);
    throw err;
  }
});
