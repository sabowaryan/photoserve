/**
 * Stripe Connect Disconnect API Route
 * POST - Disconnect Stripe Connect account
 * 
 * @module app/api/stripe/connect/disconnect/route
 * Requirements: 1.1 - Onboarding Stripe Connect (disconnect functionality)
 */
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createStripeConnectService } from '@/lib/services/stripe-connect.service';
import { AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors';

/**
 * POST /api/stripe/connect/disconnect
 * Disconnect the user's Stripe Connect account
 * 
 * Validates: Requirements 1.1 - Onboarding Stripe Connect
 * - User must be authenticated
 * - User must have Pro plan
 * - Connect account must exist
 * - Removes Connect account from database
 */
export async function POST() {
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

    // Check if Connect account exists
    const { data: connectAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id')
      .eq('user_id', userId)
      .single();

    if (!connectAccount) {
      throw new NotFoundError('Stripe Connect account');
    }

    // Disconnect account
    const stripeConnectService = createStripeConnectService(supabase);
    await stripeConnectService.disconnectAccount(userId);

    return createApiResponse({
      success: true,
      message: 'Stripe Connect account disconnected successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
