import dns from "node:dns/promises";

import { emailProviders } from "~/utils/emailProviders.js";
import { get_tool_by_url } from "~/utils/toolList.js";
import { trackClientTokens } from "../../utils/usage.js";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const domain = query.domain;

    if (!domain) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Domain query parameter is required',
        });
    }

    const requiredTokens = get_tool_by_url('/dns/mx').tokens;
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
        var mxRecords = await dns.resolveMx(domain);
        const resolvedRecords = await Promise.all(
            mxRecords.map(async (record) => {
                const ip4 = await dns.resolve4(record.exchange).catch(() => []);
                const ip6 = await dns.resolve6(record.exchange).catch(() => []);
                return { ...record, ip4, ip6 };
            })
        );
        mxRecords = resolvedRecords;

        usage.used += requiredTokens;
        usage.remaining -= requiredTokens;
        await trackClientTokens(event, requiredTokens, 'dns-mx', domain);

        var suspectedIsp = null;
        for (var i = 0; i < mxRecords.length; i++) {
            for (var j = 0; j < emailProviders.length; j++) {
                var provider = emailProviders[j];
                if (new RegExp(provider.pattern).test(mxRecords[i].exchange)) {
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
                mxRecords,
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
