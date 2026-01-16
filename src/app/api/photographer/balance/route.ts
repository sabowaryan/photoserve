/**
 * Balance API Route
 * Returns the current balance for the authenticated photographer's Stripe Connect account
 * 
 * @module app/api/photographer/balance/route
 * Requirements: 
 * - 5.3: Balance Display (Available, Pending, Total)
 * - 5.1: Display next payout date
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPayoutService } from '@/lib/services/payout.service';
import { createApiResponse, ApiErrorResponse } from '@/lib/api/error-handler';

/**
 * Balance response with next payout date
 */
interface BalanceResponse {
  available: Array<{
    amount: number;
    currency: string;
    sourceTypes?: {
      card?: number;
      bank_account?: number;
    };
  }>;
  pending: Array<{
    amount: number;
    currency: string;
    sourceTypes?: {
      card?: number;
      bank_account?: number;
    };
  }>;
  instantAvailable?: Array<{
    amount: number;
    currency: string;
    sourceTypes?: {
      card?: number;
      bank_account?: number;
    };
  }>;
  totalAvailable: number;
  totalPending: number;
  currency: string;
  nextPayoutDate: string | null;
}

/**
 * GET /api/photographer/balance
 * Get current balance and next payout date for the authenticated photographer
 */
export async function GET() {
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

    // Get user's Stripe Connect account
    const { data: connectAccount, error: connectError } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id, charges_enabled, payouts_enabled')
      .eq('user_id', user.id)
      .single();

    if (connectError || !connectAccount) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Stripe Connect account not found. Please connect your Stripe account first.', code: 'CONNECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!connectAccount.charges_enabled) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Your Stripe account is not fully set up. Please complete your account verification.', code: 'ACCOUNT_NOT_VERIFIED' },
        { status: 403 }
      );
    }

    const payoutService = createPayoutService(supabase);
    
    // Get balance and next payout date in parallel
    const [balance, nextPayoutDate] = await Promise.all([
      payoutService.getBalance(connectAccount.stripe_account_id),
      payoutService.getNextPayoutDate(connectAccount.stripe_account_id),
    ]);

    const response: BalanceResponse = {
      ...balance,
      nextPayoutDate: nextPayoutDate ? nextPayoutDate.toISOString() : null,
    };

    return createApiResponse(response);
  } catch (error) {
    console.error('[Balance] Error:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch balance', code: 'BALANCE_ERROR' },
      { status: 500 }
    );
  }
}
