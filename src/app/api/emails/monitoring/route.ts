/**
 * Email Monitoring API Route
 * 
 * Provides endpoints for email system monitoring and alerting.
 * 
 * GET /api/emails/monitoring - Get current monitoring metrics
 * GET /api/emails/monitoring/alerts - Get recent alerts
 * POST /api/emails/monitoring/check - Manually trigger threshold checks
 * 
 * Requirements: 12.5, 12.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { EmailMonitoringService } from '@/lib/services/email-monitoring.service';

/**
 * GET /api/emails/monitoring
 * 
 * Get current monitoring metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication (uses NextAuth session)
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Use admin client for database operations
    const supabase = createAdminClient();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    // Initialize monitoring service
    const monitoringService = new EmailMonitoringService(supabase);
    
    // Handle different actions
    if (action === 'alerts') {
      // Get alerts
      const type = searchParams.get('type') as any;
      const severity = searchParams.get('severity') as any;
      const limit = parseInt(searchParams.get('limit') || '100');
      
      let alerts;
      if (type) {
        alerts = monitoringService.getAlertsByType(type, limit);
      } else if (severity) {
        alerts = monitoringService.getAlertsBySeverity(severity, limit);
      } else {
        alerts = monitoringService.getRecentAlerts(limit);
      }
      
      return NextResponse.json({
        success: true,
        alerts,
        summary: monitoringService.getAlertSummary(),
      });
    } else if (action === 'performance') {
      // Get performance metrics
      const periodMinutes = parseInt(searchParams.get('period') || '60');
      const performanceMetrics = await monitoringService.getPerformanceMetrics(periodMinutes);
      
      return NextResponse.json({
        success: true,
        performance: performanceMetrics,
      });
    } else {
      // Get current metrics
      const metrics = await monitoringService.collectMetrics();
      
      return NextResponse.json({
        success: true,
        metrics,
        summary: monitoringService.getAlertSummary(),
      });
    }
  } catch (error) {
    console.error('Error in monitoring API:', error);
    return NextResponse.json(
      {
        error: 'Failed to get monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails/monitoring
 * 
 * Manually trigger threshold checks or clear alerts
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication (uses NextAuth session)
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Use admin client for database operations
    const supabase = createAdminClient();
    
    // Parse request body
    const body = await request.json();
    const { action } = body;
    
    // Initialize monitoring service
    const monitoringService = new EmailMonitoringService(supabase);
    
    // Handle different actions
    if (action === 'check') {
      // Manually trigger threshold checks
      const alerts = await monitoringService.checkThresholds();
      
      return NextResponse.json({
        success: true,
        message: `Threshold check completed. ${alerts.length} new alert(s) generated.`,
        alerts,
        summary: monitoringService.getAlertSummary(),
      });
    } else if (action === 'clear') {
      // Clear all alerts
      monitoringService.clearAlerts();
      
      return NextResponse.json({
        success: true,
        message: 'All alerts cleared',
      });
    } else if (action === 'health-check') {
      // Manually trigger provider health check
      const isHealthy = await monitoringService.checkProviderHealth();
      
      return NextResponse.json({
        success: true,
        healthy: isHealthy,
        message: isHealthy ? 'Provider is healthy' : 'Provider health check failed',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: check, clear, health-check' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in monitoring API:', error);
    return NextResponse.json(
      {
        error: 'Failed to process monitoring action',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
