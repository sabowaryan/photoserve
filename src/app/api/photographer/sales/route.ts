/**
 * Sales API Route
 * Returns paginated sales list for the authenticated photographer
 * 
 * @module app/api/photographer/sales/route
 * Requirements: 5.2 - API Routes - Revenue
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createRevenueService, SaleFilters } from '@/lib/services/revenue.service';
import { createApiResponse, ApiErrorResponse } from '@/lib/api/error-handler';

/**
 * GET /api/photographer/sales
 * Get paginated sales list
 * 
 * Query params:
 * - galleryId: Filter by gallery
 * - status: Filter by status (succeeded, refunded, disputed)
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - search: Search by buyer email
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filters: SaleFilters = {
      galleryId: searchParams.get('galleryId') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    };

    // Validate page and limit
    if (filters.page && filters.page < 1) {
      filters.page = 1;
    }
    if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
      filters.limit = Math.min(Math.max(filters.limit, 1), 100);
    }

    const revenueService = createRevenueService(supabase);
    const sales = await revenueService.getSales(userId, filters);

    return createApiResponse(sales);
  } catch (error) {
    console.error('[Sales] Error:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch sales', code: 'SALES_ERROR' },
      { status: 500 }
    );
  }
}
