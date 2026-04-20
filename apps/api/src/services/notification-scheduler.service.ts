import { processDueNotificationCampaigns } from './notification-campaign.service';
import { logger } from '../utils/logger';

let schedulerTimer: NodeJS.Timeout | null = null;
let schedulerRunning = false;

export function startNotificationScheduler(intervalMs = 60_000) {
    if (process.env.NOTIFICATION_SCHEDULER_ENABLED === 'false') {
        logger.info('Notification scheduler disabled via NOTIFICATION_SCHEDULER_ENABLED=false');
        return;
    }

    if (schedulerTimer) {
        return;
    }

    const runTick = async () => {
        if (schedulerRunning) return;
        schedulerRunning = true;
        try {
            const processed = await processDueNotificationCampaigns(15);
            if (processed > 0) {
                logger.info({ processed }, 'Notification scheduler processed due campaigns');
            }
        } catch (error) {
            logger.error({ error }, 'Notification scheduler tick failed');
        } finally {
            schedulerRunning = false;
        }
    };

    schedulerTimer = setInterval(runTick, intervalMs);
    setTimeout(runTick, 8_000);
    logger.info({ intervalMs }, 'Notification scheduler started');
}

export function stopNotificationScheduler() {
    if (!schedulerTimer) return;
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    logger.info('Notification scheduler stopped');
}
