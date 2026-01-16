/**
 * Top Galleries API Route
 * Returns top performing galleries by revenue
 * 
 * @module app/api/photographer/top-galleries/route
 * Requirements: 5.2 - API Routes - Revenue
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRevenueService } from '@/lib/services/revenue.service';
import { createApiResponse, ApiErrorResponse } from '@/lib/api/error-handler';

/**
 * GET /api/photographer/top-galleries
 * Get top performing galleries by revenue
 * 
 * Query params:
 * - limit: Number of galleries to return (default: 5, max: 20)
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

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '5', 10);
    limit = Math.min(Math.max(limit, 1), 20);

    const revenueService = createRevenueService(supabase);
    const topGalleries = await revenueService.getTopGalleries(user.id, limit);

    return createApiResponse(topGalleries);
  } catch (error) {
    console.error('[TopGalleries] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch top galleries', code: 'TOP_GALLERIES_ERROR' },
      { status: 500 }
    );
  }
}
