/**
 * Gallery Purchase Status API Route
 * GET - Check purchase status for a gallery
 * 
 * @module app/api/galleries/[id]/purchase-status/route
 * Requirements: 3.3 - Verify purchase status
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { createGalleryPurchaseService } from '@/lib/services/gallery-purchase.service';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Route params interface
 */
interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Zod schema for gallery ID validation
 */
const galleryIdSchema = z.object({
  id: z.string().trim().uuid('Invalid gallery ID'),
});

/**
 * Zod schema for query params validation
 */
const querySchema = z.object({
  email: z.string().trim().email('Invalid email address').optional(),
  sessionId: z.string().trim().min(1).optional(),
}).refine(
  (data) => data.email || data.sessionId,
  { message: 'Either email or sessionId is required' }
);

/**
 * GET /api/galleries/[id]/purchase-status
 * Check if a buyer has purchased access to a gallery
 * 
 * Query params:
 * - email: Buyer's email address
 * - sessionId: Buyer's session ID (for guest purchases)
 * 
 * Requirements:
 * - At least one identifier (email or sessionId) required
 * - Returns purchase details if found
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing gallery ID
 * @returns Purchase status and details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: galleryId } = await params;

    // Validate gallery ID
    const galleryValidation = galleryIdSchema.safeParse({ id: galleryId });
    if (!galleryValidation.success) {
      throw new ValidationError('Invalid gallery ID', {
        errors: galleryValidation.error.flatten().fieldErrors,
      });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email') || undefined;
    const sessionId = searchParams.get('sessionId') || undefined;

    // Validate query params
    const queryValidation = querySchema.safeParse({ email, sessionId });
    if (!queryValidation.success) {
      throw new ValidationError('Invalid query parameters', {
        errors: queryValidation.error.flatten().fieldErrors,
      });
    }

    // Create Supabase client
    const supabase = await createClient();

    // Verify gallery exists
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Check purchase status
    const purchaseService = createGalleryPurchaseService(supabase);
    const identifier = email || sessionId!;
    const purchase = await purchaseService.getPurchase(galleryId, identifier);

    if (!purchase) {
      return createApiResponse({
        hasPurchased: false,
        purchase: null,
      });
    }

    return createApiResponse({
      hasPurchased: true,
      purchase: {
        id: purchase.id,
        status: purchase.status,
        amountCents: purchase.amountCents,
        currency: purchase.currency,
        purchasedAt: purchase.purchasedAt,
        accessGrantedAt: purchase.accessGrantedAt,
        accessExpiresAt: purchase.accessExpiresAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
