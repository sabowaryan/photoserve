/**
 * Stripe Checkout API Route
 * POST - Create a Stripe Checkout session for subscription
 * 
 * @module app/api/stripe/checkout/route
 * Requirements: 6.1, 6.7, 9.1 - Stripe Checkout integration
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { getSession } from '@/lib/auth';
import { createPaymentService } from '@/lib/services/payment.service';
import { createCheckoutSchema } from '@/lib/validators/payment.schema';
import { AuthenticationError } from '@/lib/errors';

/**
 * POST /api/stripe/checkout
 * Create a Stripe Checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSession();
    if (!session?.user?.id || !session?.user?.email) {
      throw new AuthenticationError();
    }

    const { supabase } = await requireSupabaseClient();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCheckoutSchema.parse(body);

    // Build success and cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || '';
    const successUrl = `${origin}/settings?success=true`;
    const cancelUrl = `${origin}/settings?canceled=true`;

    // Create checkout session
    const paymentService = createPaymentService(supabase);
    const checkoutUrl = await paymentService.createCheckoutSession(
      session.user.id,
      session.user.email,
      validatedData.plan,
      validatedData.interval,
      successUrl,
      cancelUrl
    );

    return createApiResponse({ url: checkoutUrl });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
