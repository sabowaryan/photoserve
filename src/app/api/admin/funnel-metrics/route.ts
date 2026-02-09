/**
 * Funnel Metrics Admin API
 * 
 * Provides endpoints for fetching conversion funnel metrics.
 */

import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAnalyticsService } from '@/lib/services/analytics.service';

/**
 * GET /api/admin/funnel-metrics
 * 
 * Fetch conversion funnel metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return createApiResponse(
        { error: authResult.error },
        authResult.status
      );
    }

    const supabase = createAdminClient();

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const dateFromStr = searchParams.get('dateFrom');
    const dateToStr = searchParams.get('dateTo');

    const dateFrom = dateFromStr ? new Date(dateFromStr) : undefined;
    const dateTo = dateToStr ? new Date(dateToStr) : undefined;

    // Get funnel metrics
    const analyticsService = createAnalyticsService(supabase);
    const metrics = await analyticsService.getFunnelMetrics(dateFrom, dateTo);

    return createApiResponse({
      metrics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
