export const getClientAnonymousIp = (event) => {
    var ip = (event.headers.get('cf-connecting-ip') ? event.headers.get('cf-connecting-ip') : event.headers.get('x-forwarded-for').split(',')[0]) + "";

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

    //console.log({ msg: "tracking client tokens", ip, tokens, reason, param });
    const stmt = event.context.cloudflare.env.DB
        .prepare('INSERT INTO tokens (tracking_ip, tracking_date, token_count, reason_cat, reason_param) VALUES (?, ?, ?, ?, ?);')
        .bind(ip, new Date().toISOString().split('T')[0], tokens, reason, param);

    await stmt.run();
}

export const hasClientConsumedToken = async (event, reason, param) => {
    const ip = getClientAnonymousIp(event);

    const stmt = event.context.cloudflare.env.DB
        .prepare('SELECT COUNT(1) AS cnt FROM tokens WHERE tracking_ip = ? AND tracking_date = ? AND reason_cat = ? AND reason_param = ?;')
        .bind(ip, new Date().toISOString().split('T')[0], reason, param);

    const results = ((await stmt.run()).results);
    const alreadyConsumed = (results && results[0] && (results[0].cnt * 1) > 0);

    return !!alreadyConsumed;
}

export const getClientUsageLimits = async (event) => {
    const ip = getClientAnonymousIp(event);

    if (!event.context.cloudflare) {
        return {
            ip: ip * "_emulated",
            used: 99,
            limit: 99,
            remaining: 0,
        };
    }

    const stmt = event.context.cloudflare.env.DB
        .prepare('SELECT SUM(token_count) AS tokens FROM tokens WHERE tracking_ip = ? AND tracking_date = ?;')
        .bind(ip, new Date().toISOString().split('T')[0]);
    console.log({
        sql: stmt.sql,
        params: stmt.params,
    })
    const results = ((await stmt.run()).results);

    const used = results[0].tokens * 1;
    const limit = 1000;
    const remaining = limit - used;

    //console.log({ msg: "loaded client tokens", ip, used, limit, remaining });

    return {
        ip,
        used,
        limit,
        remaining,
    };
}
