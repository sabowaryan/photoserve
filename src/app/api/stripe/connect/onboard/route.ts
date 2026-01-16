/**
 * Stripe Connect Onboarding API Route
 * POST - Create Connect account and get onboarding link
 * 
 * @module app/api/stripe/connect/onboard/route
 * Requirements: 1.1 - Onboarding Stripe Connect
 */
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createStripeConnectService } from '@/lib/services/stripe-connect.service';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';

/**
 * POST /api/stripe/connect/onboard
 * Create a Stripe Connect account and generate onboarding link
 * 
 * Validates: Requirements 1.1 - Onboarding Stripe Connect
 * - User must be authenticated
 * - User must have Pro plan
 * - Creates Connect account if doesn't exist
 * - Returns onboarding link
 */
export async function POST() {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();

    // Verify Pro plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan, email, name')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    if (profile.subscription_plan !== 'pro') {
      throw new AuthorizationError('Pro plan required to use Stripe Connect');
    }

    // Create or get Connect account and onboarding link
    const stripeConnectService = createStripeConnectService(supabase);
    const result = await stripeConnectService.createConnectAccount(userId);

    return createApiResponse({
      accountId: result.accountId,
      onboardingUrl: result.onboardingLink,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
