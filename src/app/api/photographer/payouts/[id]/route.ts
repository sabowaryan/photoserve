/**
 * Payout Details API Route
 * Returns details for a specific payout
 * 
 * @module app/api/photographer/payouts/[id]/route
 * Requirements: 
 * - 5.2: Payout History (detailed view with breakdown)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createPayoutService } from '@/lib/services/payout.service';
import { createApiResponse, ApiErrorResponse } from '@/lib/api/error-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/photographer/payouts/[id]
 * Get details for a specific payout including related sales breakdown
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { supabase, userId } = await requireSupabaseClient();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Invalid payout ID format', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const payoutService = createPayoutService(supabase);
    const payout = await payoutService.getPayoutDetails(id);

    if (!payout) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Payout not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify ownership - ensure the payout belongs to this photographer
    if (payout.photographerId !== userId) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Payout not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return createApiResponse(payout);
  } catch (error) {
    console.error('[PayoutDetails] Error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch payout details', code: 'PAYOUT_ERROR' },
      { status: 500 }
    );
  }
}
