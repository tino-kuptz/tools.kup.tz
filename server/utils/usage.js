import { isPostgresConfigured, usePostgres } from './postgres';

/**
 * Best-effort client IP for rate limits (Cloudflare, reverse proxy, or direct socket).
 * Internal SSR $fetch and some Docker setups send no X-Forwarded-For — must not throw.
 */
function getRawClientIp(event) {
    const h = event.headers;
    const cf = h.get('cf-connecting-ip')?.trim();
    if (cf) {
        return cf;
    }
    const xff = h.get('x-forwarded-for');
    if (xff) {
        const first = xff.split(',')[0]?.trim();
        if (first) {
            return first;
        }
    }
    const xri = h.get('x-real-ip')?.trim();
    if (xri) {
        return xri;
    }
    const socketIp = event.node?.req?.socket?.remoteAddress;
    if (socketIp) {
        return socketIp.replace(/^::ffff:/, '');
    }
    return '';
}

export const getClientAnonymousIp = (event) => {
    let ip = getRawClientIp(event);
    if (!ip) {
        ip = '0.0.0.0';
    }

    if (ip.indexOf(':') < 0) {
        // IPv4
        ip = ip.split('.').map((segment, index) => {
            if (index === 3) {
                const binary = parseInt(segment, 10).toString(2).padStart(8, '0');
                const modifiedBinary = binary.substring(0, 4) + '0000';
                return parseInt(modifiedBinary, 2).toString(10);
            }
            return segment;
        }).join('.');
    } else {
        // IPv6
        ip = ip.split(':').map(segment => parseInt(segment, 16).toString(2).padStart(16, '0')).join('');
        ip = ip.substring(0, ip.length - 24) + '0'.repeat(24);
        ip = ip.match(/.{1,16}/g).map(binary => parseInt(binary, 2).toString(16)).join(':');
    }

    return ip;
}

export const trackClientTokens = async (event, tokens, reason, param) => {
    const ip = getClientAnonymousIp(event);

    if (!isPostgresConfigured()) {
        return;
    }

    const day = new Date().toISOString().split('T')[0];
    await usePostgres().query(
        'INSERT INTO tokens (tracking_ip, tracking_date, token_count, reason_cat, reason_param) VALUES ($1, $2::date, $3, $4, $5)',
        [ip, day, tokens, reason, param],
    );
}

export const hasClientConsumedToken = async (event, reason, param) => {
    const ip = getClientAnonymousIp(event);

    if (!isPostgresConfigured()) {
        return false;
    }

    const day = new Date().toISOString().split('T')[0];
    const { rows } = await usePostgres().query(
        'SELECT COUNT(1)::int AS cnt FROM tokens WHERE tracking_ip = $1 AND tracking_date = $2::date AND reason_cat = $3 AND reason_param = $4',
        [ip, day, reason, param],
    );

    const alreadyConsumed = rows[0] && (rows[0].cnt * 1) > 0;

    return !!alreadyConsumed;
}

export const getClientUsageLimits = async (event) => {
    const ip = getClientAnonymousIp(event);

    if (!isPostgresConfigured()) {
        return {
            ip: `${ip}_emulated`,
            used: 99,
            limit: 99,
            remaining: 0,
        };
    }

    const day = new Date().toISOString().split('T')[0];
    const { rows } = await usePostgres().query(
        'SELECT COALESCE(SUM(token_count), 0)::int AS tokens FROM tokens WHERE tracking_ip = $1 AND tracking_date = $2::date',
        [ip, day],
    );

    const used = rows[0].tokens * 1;
    const limit = (process.env.TOKEN_LIMIT ?? 1000) * 1;
    const remaining = limit - used;

    return {
        ip,
        used,
        limit,
        remaining,
    };
}
