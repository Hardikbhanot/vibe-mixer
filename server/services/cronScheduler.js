import cron from 'node-cron';
import { runBatchEnrichment } from '../scripts/enrichAudioFeaturesBatch.js';

let isJobRunning = false;

/**
 * Trigger the audio features and artwork enrichment job
 */
export async function triggerEnrichmentJob(options = {}) {
    if (isJobRunning) {
        console.log('[CronScheduler] ⚠️ Enrichment job is already running. Skipping this cycle.');
        return { skipped: true, reason: 'ALREADY_RUNNING' };
    }

    isJobRunning = true;
    console.log('[CronScheduler] ⏰ Starting scheduled weekly track enrichment...');

    try {
        const result = await runBatchEnrichment({
            maxBatches: options.maxBatches || 50, // Enriches up to 500 tracks per weekly run
            batchSize: options.batchSize || 10,
            delayMs: 1500,
            disconnectOnFinish: false
        });
        console.log('[CronScheduler] ✅ Scheduled enrichment completed successfully:', result);
        return { success: true, result };
    } catch (err) {
        console.error('[CronScheduler] ❌ Scheduled enrichment failed:', err.message);
        return { success: false, error: err.message };
    } finally {
        isJobRunning = false;
    }
}

/**
 * Initialize all automated backend cron schedules
 */
export function startCronScheduler() {
    if (process.env.DISABLE_CRON === 'true') {
        console.log('[CronScheduler] Cron scheduler disabled via env (DISABLE_CRON=true).');
        return;
    }

    // Default: Every Sunday at 03:00 AM UTC ('0 3 * * 0')
    const scheduleExpression = process.env.CRON_SCHEDULE || '0 3 * * 0';

    if (!cron.validate(scheduleExpression)) {
        console.error(`[CronScheduler] ❌ Invalid cron expression: "${scheduleExpression}". Scheduling aborted.`);
        return;
    }

    console.log(`[CronScheduler] 🕒 Initializing automated weekly maintenance schedule: "${scheduleExpression}" (Sundays 03:00 UTC)`);

    cron.schedule(scheduleExpression, async () => {
        console.log('[CronScheduler] 🔔 Weekly cron trigger fired.');
        await triggerEnrichmentJob();
    });

    console.log('[CronScheduler] 🚀 Weekly background cron job active.');
}
