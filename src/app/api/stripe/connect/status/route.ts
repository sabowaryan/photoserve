/**
 * Stripe Connect Account Status API Route
 * GET - Get Connect account status
 * 
 * @module app/api/stripe/connect/status/route
 * Requirements: 1.2 - Account Status & Verification
 */
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createStripeConnectService } from '@/lib/services/stripe-connect.service';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';

/**
 * GET /api/stripe/connect/status
 * Get the status of the user's Stripe Connect account
 * 
 * Validates: Requirements 1.2 - Account Status & Verification
 * - User must be authenticated
 * - User must have Pro plan
 * - Returns account status (verified, pending, action_required)
 * - Returns required actions if any
 */
export async function GET() {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();

    // Verify Pro plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    if (profile.subscription_plan !== 'pro') {
      throw new AuthorizationError('Pro plan required to use Stripe Connect');
    }

    // Get Connect account status
    const stripeConnectService = createStripeConnectService(supabase);
    
    // Check if account exists
    const { data: connectAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id')
      .eq('user_id', userId)
      .single();

    if (!connectAccount) {
      return createApiResponse({
        connected: false,
        status: 'not_connected',
        message: 'No Stripe Connect account found',
      });
    }

    // Get account status from Stripe
    const accountStatus = await stripeConnectService.getAccountStatus(connectAccount.stripe_account_id);

    return createApiResponse({
      connected: true,
      ...accountStatus,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
