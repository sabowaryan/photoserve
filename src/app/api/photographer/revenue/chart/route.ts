/**
 * Revenue Chart API Route
 * Returns chart data for revenue visualization
 * 
 * @module app/api/photographer/revenue/chart/route
 * Requirements: 5.2 - API Routes - Revenue
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRevenueService, AnalyticsPeriod } from '@/lib/services/revenue.service';
import { createApiResponse, ApiErrorResponse } from '@/lib/api/error-handler';

const VALID_RANGES: AnalyticsPeriod[] = ['today', 'week', 'month', 'quarter', 'year', 'all'];

/**
 * GET /api/photographer/revenue/chart
 * Get chart data for revenue visualization
 * 
 * Query params:
 * - range: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'
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

    // Get range from query params
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || 'month') as AnalyticsPeriod;

    if (!VALID_RANGES.includes(range)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Invalid range. Must be one of: ${VALID_RANGES.join(', ')}`, code: 'INVALID_RANGE' },
        { status: 400 }
      );
    }

    const revenueService = createRevenueService(supabase);
    const chartData = await revenueService.getChartData(user.id, range);

    return createApiResponse(chartData);
  } catch (error) {
    console.error('[RevenueChart] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch chart data', code: 'CHART_ERROR' },
      { status: 500 }
    );
  }
}
