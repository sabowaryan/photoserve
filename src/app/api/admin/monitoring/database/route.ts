/**
 * Database Monitoring API Endpoint
 * Provides connection pool statistics and health metrics
 * 
 * Requirements: 14.6 - Monitor connection pool usage
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth.config';
import { getPoolMonitor } from '@/lib/config/database.config';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/monitoring/database
 * Returns database connection pool statistics
 * 
 * Requires: Admin authentication
 * 
 * Response:
 * {
 *   poolStats: {
 *     activeConnections: number,
 *     idleConnections: number,
 *     waitingRequests: number,
 *     totalConnections: number,
 *     maxConnections: number,
 *     utilizationPercent: number
 *   },
 *   health: {
 *     isHealthy: boolean,
 *     isNearCapacity: boolean,
 *     isExhausted: boolean
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
    
    // Get pool statistics
    const poolMonitor = getPoolMonitor();
    const poolStats = poolMonitor.getStats();
    
    // Check pool health
    const isNearCapacity = poolMonitor.isNearCapacity(80);
    const isExhausted = poolMonitor.isExhausted();
    const isHealthy = !isExhausted && !isNearCapacity;
    
    // Test database connectivity
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    const isDatabaseConnected = !dbError;
    
    return NextResponse.json({
      poolStats,
      health: {
        isHealthy,
        isNearCapacity,
        isExhausted,
        isDatabaseConnected,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[DatabaseMonitoring] Error fetching stats:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch database statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
