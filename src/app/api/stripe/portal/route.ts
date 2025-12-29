/**
 * Stripe Customer Portal API Route
 * POST - Create a Stripe Customer Portal session
 * 
 * @module app/api/stripe/portal/route
 * Requirements: 6.5, 9.1 - Stripe Customer Portal integration
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { getSession } from '@/lib/auth';
import { createPaymentService } from '@/lib/services/payment.service';
import { createPortalSchema } from '@/lib/validators/payment.schema';
import { AuthenticationError, AppError } from '@/lib/errors';

/**
 * POST /api/stripe/portal
 * Create a Stripe Customer Portal session for subscription management
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSession();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    const { supabase } = await requireSupabaseClient();

    // Parse and validate request body (optional returnUrl)
    const body = await request.json().catch(() => ({}));
    const validatedData = createPortalSchema.parse(body);

    // Get user's Stripe customer ID from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      throw new AppError('Profile not found', 'PROFILE_NOT_FOUND', 404);
    }

    if (!profile.stripe_customer_id) {
      throw new AppError(
        'No subscription found. Please subscribe first.',
        'NO_SUBSCRIPTION',
        400
      );
    }

    // Build return URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || '';
    const returnUrl = validatedData.returnUrl || `${origin}/settings`;

    // Create portal session
    const paymentService = createPaymentService(supabase);
    const portalUrl = await paymentService.createPortalSession(
      profile.stripe_customer_id,
      returnUrl
    );

    return createApiResponse({ url: portalUrl });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
