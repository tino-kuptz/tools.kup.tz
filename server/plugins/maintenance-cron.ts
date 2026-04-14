import { isPostgresConfigured, usePostgres } from '../utils/postgres';

const ONE_HOUR_MS = 60 * 60 * 1000;

function getMsUntilNextFullHour(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function getMsUntilNextDailyRunAtFour(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(4, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

async function cleanupExpiredCacheKeys() {
  if (!isPostgresConfigured()) {
    return;
  }

  try {
    const { rowCount } = await usePostgres().query(
      'DELETE FROM dns_scan_cache WHERE expires_at <= NOW()',
    );
    console.info(`[cron] Cache cleanup removed ${rowCount ?? 0} expired key(s)`);
  } catch (error) {
    console.error('[cron] Cache cleanup failed:', error);
  }
}

async function cleanupOldTokens() {
  if (!isPostgresConfigured()) {
    return;
  }

  try {
    const { rowCount } = await usePostgres().query(
      'DELETE FROM tokens WHERE tracking_date <= (CURRENT_DATE - INTERVAL \'2 days\')::date',
    );
    console.info(`[cron] Token cleanup removed ${rowCount ?? 0} old row(s)`);
  } catch (error) {
    console.error('[cron] Token cleanup failed:', error);
  }
}

export default defineNitroPlugin((nitroApp) => {
  let nextHourTimer: NodeJS.Timeout | undefined;
  let hourlyTimer: NodeJS.Timeout | undefined;
  let dailyFourAmTimer: NodeJS.Timeout | undefined;

  const scheduleHourlyCacheCleanup = () => {
    nextHourTimer = setTimeout(() => {
      void cleanupExpiredCacheKeys();
      hourlyTimer = setInterval(() => {
        void cleanupExpiredCacheKeys();
      }, ONE_HOUR_MS);
    }, getMsUntilNextFullHour());
  };

  const scheduleDailyTokenCleanup = () => {
    const runAndReschedule = () => {
      void cleanupOldTokens();
      dailyFourAmTimer = setTimeout(runAndReschedule, getMsUntilNextDailyRunAtFour());
    };
    dailyFourAmTimer = setTimeout(runAndReschedule, getMsUntilNextDailyRunAtFour());
  };

  scheduleHourlyCacheCleanup();
  scheduleDailyTokenCleanup();

  console.info('[cron] Scheduled hourly cache cleanup and 04:00 token cleanup');

  nitroApp.hooks.hook('close', () => {
    if (nextHourTimer) {
      clearTimeout(nextHourTimer);
    }
    if (hourlyTimer) {
      clearInterval(hourlyTimer);
    }
    if (dailyFourAmTimer) {
      clearTimeout(dailyFourAmTimer);
    }
  });
});
