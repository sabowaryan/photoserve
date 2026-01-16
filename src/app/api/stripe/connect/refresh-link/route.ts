/**
 * Stripe Connect Refresh Onboarding Link API Route
 * POST - Refresh onboarding link for incomplete accounts
 * 
 * @module app/api/stripe/connect/refresh-link/route
 * Requirements: 1.1 - Onboarding Stripe Connect
 */
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createStripeConnectService } from '@/lib/services/stripe-connect.service';
import { AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors';

/**
 * POST /api/stripe/connect/refresh-link
 * Refresh the onboarding link for an existing Connect account
 * 
 * Validates: Requirements 1.1 - Onboarding Stripe Connect
 * - User must be authenticated
 * - User must have Pro plan
 * - Connect account must exist
 * - Returns new onboarding link
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

    // Refresh onboarding link
    const stripeConnectService = createStripeConnectService(supabase);
    const onboardingUrl = await stripeConnectService.refreshOnboardingLink(
      connectAccount.stripe_account_id
    );

    return createApiResponse({
      accountId: connectAccount.stripe_account_id,
      onboardingUrl,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
