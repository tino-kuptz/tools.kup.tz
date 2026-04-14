import { isPostgresConfigured, usePostgres } from './postgres';

/**
 * @param {string} key e.g. crtsh_example.com or dnsscan_example.com
 * @returns {Promise<object|Array|null>} parsed JSON payload or null
 */
export async function dnsScanCacheGet(key) {
    if (!isPostgresConfigured()) {
        return null;
    }
    try {
        const { rows } = await usePostgres().query(
            'SELECT payload FROM dns_scan_cache WHERE cache_key = $1 AND expires_at > NOW()',
            [key],
        );
        const row = rows[0];
        return row ? row.payload : null;
    } catch (err) {
        console.error('[dnsScanCache] get', key, err);
        return null;
    }
}

/**
 * @param {string} key
 * @param {unknown} payload JSON-serializable
 * @param {number} ttlSeconds
 */
export async function dnsScanCacheSet(key, payload, ttlSeconds) {
    if (!isPostgresConfigured()) {
        return;
    }
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    try {
        await usePostgres().query(
            `INSERT INTO dns_scan_cache (cache_key, payload, expires_at)
             VALUES ($1, $2::jsonb, $3::timestamptz)
             ON CONFLICT (cache_key) DO UPDATE SET
               payload = EXCLUDED.payload,
               expires_at = EXCLUDED.expires_at`,
            [key, JSON.stringify(payload), expiresAt],
        );
    } catch (err) {
        console.error('[dnsScanCache] set', key, err);
    }
}
