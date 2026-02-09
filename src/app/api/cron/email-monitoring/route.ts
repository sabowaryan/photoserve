/**
 * Email Monitoring Cron Job
 * 
 * Automated monitoring checks that run every 5 minutes.
 * Checks queue size, failure rate, bounce rate, provider health, and performance.
 * 
 * This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 * with the CRON_SECRET for authentication.
 * 
 * Requirements: 12.5, 12.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { EmailMonitoringService } from '@/lib/services/email-monitoring.service';

/**
 * POST /api/cron/email-monitoring
 * 
 * Run automated monitoring checks
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('[Email Monitoring Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Email Monitoring Cron] Invalid authorization');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('[Email Monitoring Cron] Starting monitoring checks...');
    
    // Create Supabase admin client (bypasses RLS for system operations)
    const supabase = createAdminClient();
    
    // Initialize monitoring service
    const monitoringService = new EmailMonitoringService(supabase);
    
    // Collect current metrics
    const metrics = await monitoringService.collectMetrics();
    console.log('[Email Monitoring Cron] Metrics collected:', {
      queueSize: metrics.queueSize,
      failureRate: `${metrics.failureRate.toFixed(1)}%`,
      bounceRate: `${metrics.bounceRate.toFixed(1)}%`,
      providerHealthy: metrics.providerHealthy,
      avgLatency: `${metrics.avgLatency.toFixed(0)}ms`,
    });
    
    // Check thresholds and generate alerts
    const alerts = await monitoringService.checkThresholds();
    
    if (alerts.length > 0) {
      console.log(`[Email Monitoring Cron] ${alerts.length} alert(s) generated:`);
      alerts.forEach(alert => {
        console.log(`  - [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
      });
    } else {
      console.log('[Email Monitoring Cron] No alerts generated - all metrics within thresholds');
    }
    
    // Get alert summary
    const summary = monitoringService.getAlertSummary();
    
    return NextResponse.json({
      success: true,
      message: 'Monitoring checks completed',
      metrics,
      alerts: {
        new: alerts.length,
        total: summary.total,
        critical: summary.critical,
        warning: summary.warning,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Email Monitoring Cron] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run monitoring checks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/email-monitoring
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'email-monitoring-cron',
    timestamp: new Date().toISOString(),
  });
}
