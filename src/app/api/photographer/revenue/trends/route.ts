/**
 * Revenue Trends API Route
 * Returns revenue trends with growth rates for the photographer
 * 
 * @module app/api/photographer/revenue/trends
 * Requirements: 9.1 - Revenue Analytics - trends, conversion rate
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createRevenueService, AnalyticsPeriod } from '@/lib/services/revenue.service';

const VALID_PERIODS: AnalyticsPeriod[] = ['today', 'week', 'month', 'quarter', 'year', 'all'];

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const periodParam = searchParams.get('period') || 'month';
    
    // Validate period
    const period = VALID_PERIODS.includes(periodParam as AnalyticsPeriod) 
      ? (periodParam as AnalyticsPeriod) 
      : 'month';

    // Create revenue service and fetch trends data
    const revenueService = createRevenueService(supabase);
    const trendsData = await revenueService.getRevenueTrends(userId, period);

    return NextResponse.json(trendsData);
  } catch (error) {
    console.error('[API] Error fetching revenue trends:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch revenue trends' },
      { status: 500 }
    );
  }
}
