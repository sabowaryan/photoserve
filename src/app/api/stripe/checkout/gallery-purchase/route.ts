/**
 * Gallery Purchase Checkout API Route
 * POST - Create Stripe Checkout session for gallery purchase
 * 
 * @module app/api/stripe/checkout/gallery-purchase/route
 * Requirements: 3.3 - Create Stripe Checkout session with destination charge
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { createGalleryPurchaseService } from '@/lib/services/gallery-purchase.service';
import { ValidationError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Zod schema for checkout request validation
 */
const checkoutSchema = z.object({
  galleryId: z.string().trim().uuid('Invalid gallery ID'),
  buyerEmail: z.string().trim().email('Invalid email address'),
  buyerSessionId: z.string().trim().optional(),
});

/**
 * POST /api/stripe/checkout/gallery-purchase
 * Create a Stripe Checkout session for purchasing gallery access
 * 
 * Requirements:
 * - Gallery must have monetization enabled
 * - Photographer must have Stripe Connect account
 * - Buyer must not already have access
 * - Creates destination charge with platform fee
 * 
 * @param request - Next.js request object
 * @returns Checkout session URL
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = checkoutSchema.safeParse(body);

    if (!validatedData.success) {
      throw new ValidationError('Invalid request data', {
        errors: validatedData.error.flatten().fieldErrors,
      });
    }

    const { galleryId, buyerEmail, buyerSessionId } = validatedData.data;

    // Create Supabase client (no auth required for buyers)
    const supabase = await createClient();

    // Create checkout session
    const purchaseService = createGalleryPurchaseService(supabase);
    const result = await purchaseService.createCheckoutSession(
      galleryId,
      buyerEmail,
      buyerSessionId
    );

    return createApiResponse({
      sessionId: result.sessionId,
      url: result.url,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
