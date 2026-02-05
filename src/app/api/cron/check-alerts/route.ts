/**
 * Cron Job: Check Alerts
 * GET - Run alert checks
 * 
 * This endpoint is designed to be called by external cron services
 * (e.g., Vercel Cron, cron-job.org) to periodically check alert thresholds.
 * 
 * Should be called every 5 minutes.
 * 
 * Requirements: 14.9
 */
import { NextRequest, NextResponse } from 'next/server';
import { alertingService } from '@/lib/services/alerting.service';

/**
 * GET /api/cron/check-alerts
 * 
 * Runs alert threshold checks
 * 
 * This endpoint should be protected by:
 * 1. Vercel Cron Secret (CRON_SECRET environment variable)
 * 2. Or IP whitelist for external cron services
 * 
 * Responses:
 *   200 - Alert checks completed
 *   401 - Unauthorized (invalid cron secret)
 *   500 - Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      const providedSecret = authHeader?.replace('Bearer ', '');
      
      if (providedSecret !== cronSecret) {
        console.warn('[Cron Alert Checker] Unauthorized access attempt');
        return NextResponse.json(
          {
            error: 'Unauthorized',
          },
          { status: 401 }
        );
      }
    }
    
    console.log('[Cron Alert Checker] Running scheduled alert checks...');
    
    // Run alert checks
    const alerts = await alertingService.checkThresholds();
    
    console.log(`[Cron Alert Checker] Completed. ${alerts.length} alert(s) triggered`);
    
    return NextResponse.json(
      {
        success: true,
        alertsTriggered: alerts.length,
        alerts: alerts.map(a => ({
          name: a.name,
          severity: a.severity,
          timestamp: a.timestamp,
        })),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('[Cron Alert Checker] Error running alert checks:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
