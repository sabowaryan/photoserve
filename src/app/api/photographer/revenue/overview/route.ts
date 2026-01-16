/**
 * Revenue Overview API Route
 * Returns revenue metrics for the authenticated photographer
 * 
 * @module app/api/photographer/revenue/overview/route
 * Requirements: 5.2 - API Routes - Revenue
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRevenueService, AnalyticsPeriod } from '@/lib/services/revenue.service';
import { createApiResponse, ApiErrorResponse } from '@/lib/api/error-handler';

const VALID_PERIODS: AnalyticsPeriod[] = ['today', 'week', 'month', 'quarter', 'year', 'all'];

/**
 * GET /api/photographer/revenue/overview
 * Get revenue overview for the authenticated photographer
 * 
 * Query params:
 * - period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get period from query params
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'month') as AnalyticsPeriod;

    if (!VALID_PERIODS.includes(period)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}`, code: 'INVALID_PERIOD' },
        { status: 400 }
      );
    }

    const revenueService = createRevenueService(supabase);
    const overview = await revenueService.getOverview(user.id, period);

    return createApiResponse(overview);
  } catch (error) {
    console.error('[RevenueOverview] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch revenue overview', code: 'REVENUE_ERROR' },
      { status: 500 }
    );
  }
}
