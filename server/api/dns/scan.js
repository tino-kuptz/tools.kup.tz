import dns from "node:dns/promises";

import { get_tool_by_url } from "~/utils/toolList.js";
import { getClientUsageLimits } from "../../utils/usage.js";

const findRecords = async (event, domain) => {
    var dataFromCrtSh = await event.context.cloudflare.env.KV.get(`crtsh_${domain}`);
    if (!dataFromCrtSh) {
        //console.log('Fetching data from crt.sh');
        const response = await fetch(`https://crt.sh/?CN=${domain}&output=json`);
        dataFromCrtSh = await response
            .json()
            .catch(() => []);
        // Cache 4 hours
        if (dataFromCrtSh.length > 0) {
            await event.context.cloudflare.env.KV.put(`crtsh_${domain}`, JSON.stringify(dataFromCrtSh), { expirationTtl: 60 * 60 * 4 });
        }
    } else {
        //console.log('Using cached data from KV');
        dataFromCrtSh = JSON.parse(dataFromCrtSh);
    }

    return dataFromCrtSh
        .map((s) => s.name_value)
        .filter((value, index, array) => array.indexOf(value) === index);
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const domain = query.domain;

    if (!domain) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Domain query parameter is required',
        });
    }

    const requiredTokens = get_tool_by_url('/dns/scan').tokens;
    const usage = await getClientUsageLimits(event)
    if (usage.remaining < requiredTokens) {
        throw createError({
            statusCode: 429,
            statusMessage: 'Usage limit exceeded',
            data: {
                message: `You have used all your tokens for today.`,
            },
        });
    }

    var checkIfInCache = await event.context.cloudflare.env.KV.get(`dnsscan_${domain}`);
    if (checkIfInCache) {
        return {
            success: true,
            data: {
                records: JSON.parse(checkIfInCache),
            },
            usage,
        };
    }

    var domains = [
        `${domain}`,
        `autodiscover.${domain}`,
        ... await findRecords(event, domain),
    ]
        .filter((value, index, array) => array.indexOf(value) === index)
    // Wegen Cloudflare limits... leider

    var wasTruncated = false;
    if (domains.length > 20) {
        wasTruncated = true;
        domains = domains.slice(0, 20);
    }

    try {

        const records = await Promise.all(
            domains.map(async (subdomain) => {
                try {
                    const recordTypes = await Promise.allSettled([
                        // [0] CNAME
                        dns.resolveCname(subdomain),
                        // [1] A
                        dns.resolve4(subdomain),
                        // [2] AAAA
                        dns.resolve6(subdomain),
                        // [3] TXT
                        dns.resolveTxt(subdomain),
                        // [4] MX
                        dns.resolveMx(subdomain),
                    ])
                    return {
                        subdomain,
                        error: null,
                        cname: recordTypes[0].status == "rejected" ? null : recordTypes[0].value,
                        a: recordTypes[1].status == "rejected" ? [] : recordTypes[1].value,
                        aaaa: recordTypes[2].status == "rejected" ? [] : recordTypes[2].value,
                        txt: recordTypes[3].status == "rejected" ? null : recordTypes[3].value,
                        mx: recordTypes[4].status == "rejected" ? null : recordTypes[4].value,
                    };
                } catch (error) {
                    return {
                        subdomain,
                        error: error.message,
                        cname: null,
                        a: null,
                        aaaa: null,
                        txt: null,
                        mx: null,
                    };
                }
            })
        );

        var retRecords = [];
        for (var i = 0; i < records.length; i++) {
            if (records[i].error)
                continue;
            if (records[i].txt != null) {
                for (var z = 0; z < records[i].txt.length; z++) {
                    retRecords.push({
                        domain: records[i].subdomain,
                        type: 'TXT',
                        value: records[i].txt[z].join(''),
                        resolve_a: [],
                        resolve_aaaa: [],
                    });
                }
            }
            if (records[i].mx != null) {
                for (var z = 0; z < records[i].mx.length; z++) {
                    retRecords.push({
                        domain: records[i].subdomain,
                        type: 'MX',
                        value: records[i].mx[z].exchange,
                        resolve_a: await dns.resolve4(records[i].mx[z].exchange).catch(() => []),
                        resolve_aaaa: await dns.resolve6(records[i].mx[z].exchange).catch(() => []),
                    });
                }
            }
            if (records[i].cname != null) {
                for (var z = 0; z < records[i].cname.length; z++) {
                    retRecords.push({
                        domain: records[i].subdomain,
                        type: 'CNAME',
                        value: records[i].cname[z],
                        resolve_a: records[i].a,
                        resolve_aaaa: records[i].aaaa,
                    });
                }
                continue;
            }
            // Kein CNAME, aber A und AAAA -> direkte DNS Records
            if (records[i].a != null) {
                for (var z = 0; z < records[i].a.length; z++) {
                    retRecords.push({
                        domain: records[i].subdomain,
                        type: 'A',
                        value: records[i].a[z],
                        resolve_a: [],
                        resolve_aaaa: [],
                    });
                }
            }
            if (records[i].aaaa != null) {
                for (var z = 0; z < records[i].aaaa.length; z++) {
                    retRecords.push({
                        domain: records[i].subdomain,
                        type: 'AAAA',
                        value: records[i].aaaa[z],
                        resolve_a: [],
                        resolve_aaaa: [],
                    });
                }
            }
        }

        usage.used += requiredTokens;
        usage.remaining -= requiredTokens;
        await trackClientTokens(event, requiredTokens, 'dns-scan', domain);

        // 1 Stunde in den Cache hauen
        await event.context.cloudflare.env.KV.put(`dnsscan_${domain}`, JSON.stringify(retRecords), { expirationTtl: 60 * 60 });

        return {
            success: true,
            data: {
                truncated: wasTruncated,
                records: retRecords,
            },
            usage
        };
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to lookup MX records',
            data: error.stack,
        });
    }
});
