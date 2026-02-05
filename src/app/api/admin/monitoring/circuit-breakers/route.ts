/**
 * Circuit Breaker Monitoring API Endpoint
 * Provides circuit breaker status and metrics for all external services
 * 
 * Requirements: 14.8 - Monitor graceful degradation and circuit breaker status
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth.config';
import { getCircuitBreakerRegistry } from '@/lib/utils/circuit-breaker';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/monitoring/circuit-breakers
 * Returns circuit breaker status and metrics for all services
 * 
 * Requires: Admin authentication
 * 
 * Response:
 * {
 *   circuitBreakers: {
 *     [serviceName]: {
 *       state: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
 *       failures: number,
 *       successes: number,
 *       rejections: number,
 *       lastFailureTime?: string,
 *       lastSuccessTime?: string,
 *       stateChangedAt: string
 *     }
 *   },
 *   summary: {
 *     total: number,
 *     healthy: number,
 *     degraded: number,
 *     failed: number
 *   },
 *   timestamp: string
 * }
 */
export async function GET(_request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const supabase = createAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get circuit breaker metrics
    const registry = getCircuitBreakerRegistry();
    const allMetrics = registry.getAllMetrics();
    
    // Calculate summary
    const summary = {
      total: Object.keys(allMetrics).length,
      healthy: 0,
      degraded: 0,
      failed: 0,
    };
    
    for (const metrics of Object.values(allMetrics)) {
      switch (metrics.state) {
        case 'CLOSED':
          summary.healthy++;
          break;
        case 'HALF_OPEN':
          summary.degraded++;
          break;
        case 'OPEN':
          summary.failed++;
          break;
      }
    }
    
    // Format metrics for response
    const formattedMetrics: Record<string, any> = {};
    for (const [name, metrics] of Object.entries(allMetrics)) {
      formattedMetrics[name] = {
        state: metrics.state,
        failures: metrics.failures,
        successes: metrics.successes,
        rejections: metrics.rejections,
        lastFailureTime: metrics.lastFailureTime?.toISOString(),
        lastSuccessTime: metrics.lastSuccessTime?.toISOString(),
        stateChangedAt: metrics.stateChangedAt.toISOString(),
      };
    }
    
    return NextResponse.json({
      circuitBreakers: formattedMetrics,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CircuitBreakerMonitoring] Error fetching metrics:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch circuit breaker metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/monitoring/circuit-breakers/reset
 * Resets all circuit breakers to CLOSED state
 * 
 * Requires: Admin authentication
 */
export async function POST(_request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const supabase = createAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Reset all circuit breakers
    const registry = getCircuitBreakerRegistry();
    registry.resetAll();
    
    return NextResponse.json({
      success: true,
      message: 'All circuit breakers reset to CLOSED state',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CircuitBreakerMonitoring] Error resetting circuit breakers:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to reset circuit breakers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
