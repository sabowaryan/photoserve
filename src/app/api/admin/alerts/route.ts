/**
 * Admin Alerts API Route
 * GET - Get recent alerts
 * POST - Manually trigger alert checks
 * 
 * This endpoint allows administrators to view and manage alerts.
 * Only accessible to admin users.
 * 
 * Requirements: 14.9
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { alertingService } from '@/lib/services/alerting.service';

/**
 * GET /api/admin/alerts
 * 
 * Returns recent alerts and alert summary
 * 
 * Responses:
 *   200 - Alerts data
 *   401 - Not authenticated
 *   403 - Not an admin
 *   500 - Internal server error
 */
export async function GET(_request: NextRequest) {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();
    
    // Verify user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('[Admin Alerts] Failed to fetch user profile:', profileError);
      return NextResponse.json(
        {
          error: 'User profile not found',
        },
        { status: 404 }
      );
    }
    
    // Return 403 if not admin
    if (profile.is_admin !== true) {
      return NextResponse.json(
        {
          error: 'Admin access required',
        },
        { status: 403 }
      );
    }
    
    // Get alert summary
    const summary = alertingService.getAlertSummary();
    
    return NextResponse.json(
      {
        summary,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
    
  } catch (error) {
    // Return 401 if not authenticated
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        {
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    // Log error for debugging
    console.error('[Admin Alerts] Error fetching alerts:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/alerts
 * 
 * Manually trigger alert checks
 * 
 * Responses:
 *   200 - Alert check results
 *   401 - Not authenticated
 *   403 - Not an admin
 *   500 - Internal server error
 */
export async function POST(_request: NextRequest) {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();
    
    // Verify user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('[Admin Alerts] Failed to fetch user profile:', profileError);
      return NextResponse.json(
        {
          error: 'User profile not found',
        },
        { status: 404 }
      );
    }
    
    // Return 403 if not admin
    if (profile.is_admin !== true) {
      return NextResponse.json(
        {
          error: 'Admin access required',
        },
        { status: 403 }
      );
    }
    
    // Trigger alert checks
    const newAlerts = await alertingService.checkThresholds();
    
    return NextResponse.json(
      {
        alertsTriggered: newAlerts.length,
        alerts: newAlerts,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
    
  } catch (error) {
    // Return 401 if not authenticated
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        {
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    // Log error for debugging
    console.error('[Admin Alerts] Error triggering alert checks:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
