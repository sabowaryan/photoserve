/**
 * Stripe Connect Dashboard Link API Route
 * POST - Get Stripe Dashboard login link
 * 
 * @module app/api/stripe/connect/dashboard-link/route
 * Requirements: 1.2 - Account Status & Verification (access Stripe Dashboard)
 */
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createStripeConnectService } from '@/lib/services/stripe-connect.service';
import { AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors';

/**
 * POST /api/stripe/connect/dashboard-link
 * Generate a login link to the Stripe Dashboard for the connected account
 * 
 * Validates: Requirements 1.2 - Account Status & Verification
 * - User must be authenticated
 * - User must have Pro plan
 * - Connect account must exist
 * - Returns dashboard login link
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

    // Create dashboard link
    const stripeConnectService = createStripeConnectService(supabase);
    const dashboardUrl = await stripeConnectService.createDashboardLink(connectAccount.stripe_account_id);

    return createApiResponse({
      url: dashboardUrl,
      accountId: connectAccount.stripe_account_id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
