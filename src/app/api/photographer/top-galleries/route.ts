/**
 * Top Galleries API Route
 * Returns top performing galleries by revenue
 * 
 * @module app/api/photographer/top-galleries/route
 * Requirements: 5.2 - API Routes - Revenue
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
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
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '5', 10);
    limit = Math.min(Math.max(limit, 1), 20);

    const revenueService = createRevenueService(supabase);
    const topGalleries = await revenueService.getTopGalleries(userId, limit);

    return createApiResponse(topGalleries);
  } catch (error) {
    console.error('[TopGalleries] Error:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch top galleries', code: 'TOP_GALLERIES_ERROR' },
      { status: 500 }
    );
  }
}
