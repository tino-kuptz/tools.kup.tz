
export default defineEventHandler(async (event) => {
    try {
        return {
            success: true,
            data: {},
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
