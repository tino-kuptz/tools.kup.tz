
export default defineEventHandler(async (event) => {
    try {
        const headers = getHeaders(event);
        return {
            success: true,
            data: {
                ip: headers['cf-connecting-ip'] || 'unknown',
                country: headers['cf-ipcountry'] || 'unknown',

            },
            usage: await getClientUsageLimits(event)
        };
    } catch (error) {
        console.error('Error fetching usage limits:', error.stack);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch usage limits',
            data: error.stack,
        });
    }
});
