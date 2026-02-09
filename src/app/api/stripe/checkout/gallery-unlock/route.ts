/**
 * Stripe Gallery Unlock Checkout API Route
 * POST - Create a Stripe Checkout session for one-time gallery unlock payment ($2.99)
 * 
 * @module app/api/stripe/checkout/gallery-unlock/route
 * Requirements: 3.4, 4.1 - Gallery unlock payment for $2.99
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { getStripe } from '@/lib/stripe/client';
import { getSupabaseClient } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { getTokenFromCookies, isValidUUID } from '@/lib/guest/session';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Gallery unlock price in cents ($2.99)
 * Requirement 3.4, 4.1: One-time payment of $2.99
 */
export const GALLERY_UNLOCK_PRICE_CENTS = 299;

/**
 * Request validation schema
 */
const galleryUnlockSchema = z.object({
  galleryId: z.string().uuid('Invalid gallery ID format'),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
  guestToken: z.string().optional(),
});

/**
 * POST /api/stripe/checkout/gallery-unlock
 * Create a Stripe Checkout session for gallery unlock ($2.99 one-time payment)
 * 
 * Requirements: 3.4, 4.1
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = galleryUnlockSchema.parse(body);

    // Get guest token from cookie or request body
    const cookieToken = getTokenFromCookies(request.headers.get('cookie'));
    const guestToken = validatedData.guestToken || cookieToken;

    // Validate guest token if provided
    if (guestToken && !isValidUUID(guestToken)) {
      throw new ValidationError('Invalid guest session token');
    }

    // Get Supabase client (may be authenticated or anonymous)
    const { userId } = await getSupabaseClient();
    
    // Use admin client for database operations (bypasses RLS)
    const supabase = createAdminClient();

    // Verify gallery exists and belongs to guest session (if guest)
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, title, guest_session_id, user_id, is_unlocked, unique_slug')
      .eq('id', validatedData.galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Check if gallery is already unlocked
    if (gallery.is_unlocked) {
      throw new ValidationError('Gallery is already unlocked');
    }

    // Verify ownership: either guest session matches or user is authenticated
    if (gallery.guest_session_id) {
      // Guest gallery - verify guest token matches
      if (gallery.guest_session_id !== guestToken) {
        throw new NotFoundError('Gallery');
      }
    } else if (gallery.user_id) {
      // User gallery - verify user is authenticated and owns the gallery
      if (!userId || userId !== gallery.user_id) {
        throw new NotFoundError('Gallery');
      }
    } else {
      // Gallery has neither guest_session_id nor user_id - invalid state
      throw new NotFoundError('Gallery');
    }

    // Get Stripe instance
    const stripe = getStripe();

    // Create Stripe Checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Gallery Unlock',
              description: `Unlock "${gallery.title}" - Remove watermarks, extend to 30 days`,
            },
            unit_amount: GALLERY_UNLOCK_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: validatedData.successUrl,
      cancel_url: validatedData.cancelUrl,
      metadata: {
        type: 'gallery_unlock',
        gallery_id: gallery.id,
        gallery_slug: gallery.unique_slug,
        guest_session_id: guestToken || '',
      },
      payment_intent_data: {
        metadata: {
          type: 'gallery_unlock',
          gallery_id: gallery.id,
          gallery_slug: gallery.unique_slug,
          guest_session_id: guestToken || '',
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
