import { get_tool_by_url } from "~/utils/toolList.js";
import { getClientUsageLimits, hasClientConsumedToken, trackClientTokens } from "../../../utils/usage.js";

export default defineEventHandler(async (event) => {
    const params = event.context.params || {};
    const uuid = params.uuid;
    const query = getQuery(event);
    const confirm = (query.confirm + "") === "true";

    if (!uuid) {
        throw createError({
            statusCode: 400,
            statusMessage: 'UUID is required',
        });
    }

    const requiredTokens = get_tool_by_url('/track/http').tokens;
    const usage = await getClientUsageLimits(event);

    // Check whether user already consumed token for this uuid today
    const alreadyConsumed = await hasClientConsumedToken(event, 'http_log', uuid);

    if (!confirm) {
        return {
            success: true,
            data: {
                alreadyConsumed,
            },
            usage,
        };
    }

    if (!alreadyConsumed) {
        if (usage.remaining < requiredTokens) {
            throw createError({
                statusCode: 429,
                statusMessage: 'Usage limit exceeded',
                data: {
                    message: `You have used all your tokens for today.`,
                },
            });
        }
        usage.used += requiredTokens;
        usage.remaining -= requiredTokens;
        await trackClientTokens(event, requiredTokens, 'http_log', uuid);
    }

    // Return the logs for this uuid
    const stmt = event.context.cloudflare.env.DB
        .prepare('SELECT host, headers, body, timestamp, ip, method, url, user_agent, created_at FROM http_request_logs WHERE host = ? OR url LIKE ? ORDER BY created_at DESC LIMIT 200;')
        .bind(uuid, `%${uuid}%`);
    const rows = ((await stmt.run()).results) || [];

    return {
        success: true,
        data: {
            logs: rows,
        },
        usage,
    };
});


