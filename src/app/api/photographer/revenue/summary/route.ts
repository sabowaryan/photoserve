/**
 * Revenue Summary API Route
 * Returns advanced analytics summary for the photographer
 * 
 * @module app/api/photographer/revenue/summary
 * Requirements: 9.1 - Revenue Analytics - Revenue per gallery, avg time to conversion, peak hours
 */
import { NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createRevenueService } from '@/lib/services/revenue.service';

export async function GET() {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    // Create revenue service and fetch summary data
    const revenueService = createRevenueService(supabase);
    const summaryData = await revenueService.getAdvancedAnalyticsSummary(userId);

    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('[API] Error fetching analytics summary:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics summary' },
      { status: 500 }
    );
  }
}
