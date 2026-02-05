/**
 * Job Queue Monitoring API Endpoint
 * Provides job queue statistics and health metrics
 * 
 * Requirements: 14.4 - Monitor asynchronous job processing
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth.config';
import { getJobQueue } from '@/lib/services/job-queue.service';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/monitoring/jobs
 * Returns job queue statistics and recent jobs
 * 
 * Requires: Admin authentication
 * 
 * Response:
 * {
 *   stats: {
 *     total: number,
 *     pending: number,
 *     processing: number,
 *     completed: number,
 *     failed: number,
 *     retrying: number
 *   },
 *   recentJobs: Job[],
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
    
    // Get job queue statistics
    const jobQueue = getJobQueue();
    const stats = jobQueue.getStats();
    
    // Get recent jobs (last 50)
    const allJobs = jobQueue.getAllJobs();
    const recentJobs = allJobs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50)
      .map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        priority: job.priority,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt.toISOString(),
        processedAt: job.processedAt?.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        error: job.error,
      }));
    
    return NextResponse.json({
      stats,
      recentJobs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[JobQueueMonitoring] Error fetching stats:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch job queue statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/monitoring/jobs/clear
 * Clears completed and failed jobs from the queue
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
    
    // Clear completed jobs
    const jobQueue = getJobQueue();
    jobQueue.clearCompleted();
    
    return NextResponse.json({
      success: true,
      message: 'Completed and failed jobs cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[JobQueueMonitoring] Error clearing jobs:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to clear jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
