import dns from "node:dns/promises";

import { dnsProviders } from "~/utils/dnsProviders.js";
import { get_tool_by_url } from "~/utils/toolList.js";
import { getClientUsageLimits } from "../../utils/usage.js";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const domain = query.domain;

    if (!domain) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Domain query parameter is required',
        });
    }

    const requiredTokens = get_tool_by_url('/dns/ns').tokens;
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

    try {
        var nsRecords = await dns.resolveNs(domain);

        const resolvedRecords = await Promise.all(
            nsRecords.map(async (record) => {
                const ip4 = await dns.resolve4(record).catch(() => []);
                const ip6 = await dns.resolve6(record).catch(() => []);
                return { ns: record, ip4, ip6 };
            })
        );
        nsRecords = resolvedRecords;

        usage.used += requiredTokens;
        usage.remaining -= requiredTokens;
        await trackClientTokens(event, requiredTokens, 'dns-ns', domain);

        var suspectedIsp = null;
        for (var i = 0; i < nsRecords.length; i++) {
            for (var j = 0; j < dnsProviders.length; j++) {
                var provider = dnsProviders[j];
                if (new RegExp(provider.pattern).test(nsRecords[i].ns)) {
                    suspectedIsp = {
                        name: provider.name,
                    }
                    break;
                }
            }
            if (suspectedIsp) break;
        }

        return {
            success: true,
            data: {
                suspectedIsp,
                nsRecords,
            },
            usage,
        };
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to lookup MX records',
            data: error.stack,
        });
    }
});
