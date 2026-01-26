/**
 * Sale Details API Route
 * Returns details for a specific sale
 * 
 * @module app/api/photographer/sales/[id]/route
 * Requirements: 5.2 - API Routes - Revenue
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createRevenueService } from '@/lib/services/revenue.service';
import { createApiResponse, ApiErrorResponse } from '@/lib/api/error-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/photographer/sales/[id]
 * Get details for a specific sale
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();

    const revenueService = createRevenueService(supabase);
    const sale = await revenueService.getSaleDetails(id);

    if (!sale) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Sale not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify ownership by checking if the sale belongs to this photographer
    const { data: purchase } = await supabase
      .from('gallery_purchases')
      .select('photographer_id')
      .eq('id', id)
      .single();

    if (purchase?.photographer_id !== userId) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Sale not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return createApiResponse(sale);
  } catch (error) {
    console.error('[SaleDetails] Error:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch sale details', code: 'SALE_ERROR' },
      { status: 500 }
    );
  }
}
