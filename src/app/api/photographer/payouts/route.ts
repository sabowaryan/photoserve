/**
 * Payouts API Route
 * Returns paginated payout list for the authenticated photographer
 * 
 * @module app/api/photographer/payouts/route
 * Requirements: 
 * - 5.1: Automatic Payouts (Stripe Connect)
 * - 5.2: Payout History
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createPayoutService, PayoutFilters, PayoutStatus } from '@/lib/services/payout.service';
import { createApiResponse, ApiErrorResponse } from '@/lib/api/error-handler';

const VALID_STATUSES: PayoutStatus[] = ['pending', 'in_transit', 'paid', 'failed', 'canceled'];

/**
 * GET /api/photographer/payouts
 * Get paginated payout list for the authenticated photographer
 * 
 * Query params:
 * - status: Filter by status (pending, in_transit, paid, failed, canceled) - can be comma-separated
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    // Check if user has a Stripe Connect account
    const { data: connectAccount, error: connectError } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id, charges_enabled, payouts_enabled')
      .eq('user_id', userId)
      .single();

    if (connectError || !connectAccount) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Stripe Connect account not found. Please connect your Stripe account first.', code: 'CONNECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!connectAccount.payouts_enabled) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Payouts are not enabled for your account. Please complete your Stripe account setup.', code: 'PAYOUTS_NOT_ENABLED' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    
    // Parse status filter (can be comma-separated)
    let statusFilter: PayoutStatus | PayoutStatus[] | undefined;
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const statuses = statusParam.split(',').map(s => s.trim()) as PayoutStatus[];
      // Validate all statuses
      const invalidStatuses = statuses.filter(s => !VALID_STATUSES.includes(s));
      if (invalidStatuses.length > 0) {
        return NextResponse.json<ApiErrorResponse>(
          { error: `Invalid status value(s): ${invalidStatuses.join(', ')}. Must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      statusFilter = statuses.length === 1 ? statuses[0] : statuses;
    }

    const filters: PayoutFilters = {
      status: statusFilter,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
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

    // Validate date formats
    if (filters.startDate && isNaN(Date.parse(filters.startDate))) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Invalid startDate format. Use ISO 8601 format (e.g., 2024-01-15)', code: 'INVALID_DATE' },
        { status: 400 }
      );
    }
    if (filters.endDate && isNaN(Date.parse(filters.endDate))) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Invalid endDate format. Use ISO 8601 format (e.g., 2024-01-15)', code: 'INVALID_DATE' },
        { status: 400 }
      );
    }

    const payoutService = createPayoutService(supabase);
    const payouts = await payoutService.getPayouts(userId, filters);

    return createApiResponse(payouts);
  } catch (error) {
    console.error('[Payouts] Error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch payouts', code: 'PAYOUTS_ERROR' },
      { status: 500 }
    );
  }
}
