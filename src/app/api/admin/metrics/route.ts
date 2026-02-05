/**
 * Admin Metrics API Route
 * GET - Get system metrics for monitoring
 * 
 * This endpoint exposes metrics for monitoring and observability.
 * Only accessible to admin users.
 * 
 * Requirements: 14.9
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { metricsService } from '@/lib/services/metrics.service';

/**
 * GET /api/admin/metrics
 * 
 * Returns system metrics including:
 * - API key validation response times (p50, p95, p99)
 * - API key validation success rate
 * - Plugin download count and failure rate
 * - Active users (daily, weekly, monthly)
 * - Error rates by endpoint
 * - Database query performance
 * 
 * Responses:
 *   200 - Metrics data
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
      console.error('[Admin Metrics] Failed to fetch user profile:', profileError);
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
    
    // Get all metrics
    const metrics = await metricsService.getAllMetrics(supabase);
    
    return NextResponse.json(
      {
        metrics,
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
    console.error('[Admin Metrics] Error fetching metrics:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
