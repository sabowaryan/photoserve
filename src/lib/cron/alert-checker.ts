/**
 * Alert Checker Cron Job
 * 
 * Periodically checks metrics against alert thresholds and triggers alerts.
 * This should be run as a scheduled task (e.g., every 5 minutes).
 * 
 * Requirements: 14.9
 */

import { alertingService } from '@/lib/services/alerting.service';

/**
 * Run alert checks
 * 
 * This function should be called by a cron job or scheduled task
 */
export async function runAlertChecks(): Promise<void> {
  console.log('[Alert Checker] Running scheduled alert checks...');
  
  try {
    const alerts = await alertingService.checkThresholds();
    
    if (alerts.length > 0) {
      console.log(`[Alert Checker] ${alerts.length} alert(s) triggered`);
      alerts.forEach(alert => {
        console.log(`  - ${alert.severity.toUpperCase()}: ${alert.description}`);
      });
    } else {
      console.log('[Alert Checker] No alerts triggered');
    }
  } catch (error) {
    console.error('[Alert Checker] Error running alert checks:', error);
  }
}

/**
 * Start periodic alert checking
 * 
 * @param intervalMs - Interval in milliseconds (default: 5 minutes)
 */
export function startAlertChecker(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  console.log(`[Alert Checker] Starting periodic alert checks (interval: ${intervalMs}ms)`);
  
  // Run immediately
  runAlertChecks();
  
  // Schedule periodic checks
  return setInterval(runAlertChecks, intervalMs);
}

/**
 * Stop periodic alert checking
 */
export function stopAlertChecker(timer: NodeJS.Timeout): void {
  console.log('[Alert Checker] Stopping periodic alert checks');
  clearInterval(timer);
}
