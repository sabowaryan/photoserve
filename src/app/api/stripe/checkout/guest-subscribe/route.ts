/**
 * Stripe Guest Subscription Checkout API Route
 * POST - Create a Stripe Checkout session for guest-to-subscriber flow ($9.99/month)
 * 
 * @module app/api/stripe/checkout/guest-subscribe/route
 * Requirements: 3.5, 5.1 - Guest subscription checkout for $9.99/month
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { getStripe, STRIPE_PRICES } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { getTokenFromCookies, isValidUUID } from '@/lib/guest/session';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Request validation schema
 */
const guestSubscribeSchema = z.object({
  galleryId: z.string().uuid('Invalid gallery ID format').optional(),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
  guestToken: z.string().optional(),
  plan: z.enum(['premium', 'pro']).default('premium'),
});

/**
 * POST /api/stripe/checkout/guest-subscribe
 * Create a Stripe Checkout session for guest subscription ($9.99/month)
 * 
 * This endpoint handles the guest-to-subscriber flow:
 * 1. Guest creates a gallery
 * 2. Guest chooses to subscribe
 * 3. After payment, guest creates an account
 * 4. Guest galleries are migrated to the new account
 * 
 * Requirements: 3.5, 5.1
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = guestSubscribeSchema.parse(body);

    // Get guest token from cookie or request body
    const cookieToken = getTokenFromCookies(request.headers.get('cookie'));
    const guestToken = validatedData.guestToken || cookieToken;

    // Validate guest token if provided
    if (guestToken && !isValidUUID(guestToken)) {
      throw new ValidationError('Invalid guest session token');
    }

    // Create Supabase client
    const supabase = await createClient();

    // If galleryId is provided, verify it exists and belongs to guest
    let gallerySlug: string | undefined;
    if (validatedData.galleryId) {
      const { data: gallery, error: galleryError } = await supabase
        .from('galleries')
        .select('id, unique_slug, guest_session_id')
        .eq('id', validatedData.galleryId)
        .single();

      if (galleryError || !gallery) {
        throw new NotFoundError('Gallery');
      }

      // Verify gallery belongs to guest session
      if (gallery.guest_session_id && gallery.guest_session_id !== guestToken) {
        throw new NotFoundError('Gallery');
      }

      gallerySlug = gallery.unique_slug;
    }

    // Get Stripe instance
    const stripe = getStripe();

    // Get the price ID for premium monthly subscription
    const priceId = STRIPE_PRICES[validatedData.plan].monthly;
    if (!priceId) {
      throw new ValidationError('Invalid subscription plan');
    }

    // Create Stripe Checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: validatedData.successUrl,
      cancel_url: validatedData.cancelUrl,
      metadata: {
        type: 'guest_subscription',
        guest_session_id: guestToken || '',
        gallery_id: validatedData.galleryId || '',
        gallery_slug: gallerySlug || '',
        plan: validatedData.plan,
      },
      subscription_data: {
        metadata: {
          type: 'guest_subscription',
          guest_session_id: guestToken || '',
          plan: validatedData.plan,
        },
      },
    });

    if (!session.url) {
      throw new ValidationError('Failed to create checkout session');
    }

    return createApiResponse({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
