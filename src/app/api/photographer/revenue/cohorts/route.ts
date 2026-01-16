/**
 * Revenue Cohorts API Route
 * Returns cohort analysis data for customer retention
 * 
 * @module app/api/photographer/revenue/cohorts
 * Requirements: 9.1 - Revenue Analytics - detailed analytics for pricing optimization
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createRevenueService } from '@/lib/services/revenue.service';

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startMonth = searchParams.get('startMonth') || undefined;
    const endMonth = searchParams.get('endMonth') || undefined;
    const monthsToAnalyze = searchParams.get('months') 
      ? parseInt(searchParams.get('months')!, 10) 
      : 6;

    // Create revenue service and fetch cohort data
    const revenueService = createRevenueService(supabase);
    const cohortData = await revenueService.getCohortAnalysis(userId, {
      startMonth,
      endMonth,
      monthsToAnalyze,
    });

    return NextResponse.json(cohortData);
  } catch (error) {
    console.error('[API] Error fetching cohort analysis:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch cohort analysis' },
      { status: 500 }
    );
  }
}
