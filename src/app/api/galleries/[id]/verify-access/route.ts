/**
 * Gallery Access Verification API Route
 * GET - Verify if buyer has valid access to gallery
 * POST - Verify access with body (for more complex scenarios)
 * 
 * @module app/api/galleries/[id]/verify-access/route
 * Requirements: 3.3 - Verify gallery access with caching
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
 * Zod schema for query/body params validation
 */
const accessCheckSchema = z.object({
  email: z.string().trim().email('Invalid email address').optional(),
  sessionId: z.string().trim().min(1).optional(),
}).refine(
  (data) => data.email || data.sessionId,
  { message: 'Either email or sessionId is required' }
);

/**
 * GET /api/galleries/[id]/verify-access
 * Check if a buyer has valid access to a gallery
 * 
 * Query params:
 * - email: Buyer's email address
 * - sessionId: Buyer's session ID (for guest purchases)
 * 
 * Requirements:
 * - At least one identifier (email or sessionId) required
 * - Checks purchase status and access expiration
 * - Uses caching for performance
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing gallery ID
 * @returns Access status
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
    const queryValidation = accessCheckSchema.safeParse({ email, sessionId });
    if (!queryValidation.success) {
      throw new ValidationError('Invalid query parameters', {
        errors: queryValidation.error.flatten().fieldErrors,
      });
    }

    // Create Supabase client
    const supabase = await createClient();

    // Verify gallery exists and has monetization enabled
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, is_active')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Check monetization status
    const { data: monetization } = await supabase
      .from('gallery_monetization')
      .select('is_enabled')
      .eq('gallery_id', galleryId)
      .single();

    // If no monetization or not enabled, everyone has access
    if (!monetization || !monetization.is_enabled) {
      return createApiResponse({
        hasAccess: true,
        reason: 'free_gallery',
        expiresAt: null,
      });
    }

    // Check access
    const purchaseService = createGalleryPurchaseService(supabase);
    const identifier = email || sessionId!;
    const accessResult = await purchaseService.checkAccess(galleryId, identifier);

    return createApiResponse({
      hasAccess: accessResult.hasAccess,
      reason: accessResult.hasAccess ? 'purchased' : 'no_purchase',
      expiresAt: accessResult.expiresAt || null,
      purchase: accessResult.purchase ? {
        id: accessResult.purchase.id,
        purchasedAt: accessResult.purchase.purchasedAt,
        accessGrantedAt: accessResult.purchase.accessGrantedAt,
      } : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/galleries/[id]/verify-access
 * Verify access with request body (alternative to query params)
 * Useful for scenarios where email/sessionId shouldn't be in URL
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing gallery ID
 * @returns Access status
 */
export async function POST(
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

    // Parse and validate request body
    const body = await request.json();
    const bodyValidation = accessCheckSchema.safeParse(body);
    if (!bodyValidation.success) {
      throw new ValidationError('Invalid request data', {
        errors: bodyValidation.error.flatten().fieldErrors,
      });
    }

    const { email, sessionId } = bodyValidation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Verify gallery exists
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, is_active')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Check monetization status
    const { data: monetization } = await supabase
      .from('gallery_monetization')
      .select('is_enabled')
      .eq('gallery_id', galleryId)
      .single();

    // If no monetization or not enabled, everyone has access
    if (!monetization || !monetization.is_enabled) {
      return createApiResponse({
        hasAccess: true,
        reason: 'free_gallery',
        expiresAt: null,
      });
    }

    // Check access
    const purchaseService = createGalleryPurchaseService(supabase);
    const identifier = email || sessionId!;
    const accessResult = await purchaseService.checkAccess(galleryId, identifier);

    return createApiResponse({
      hasAccess: accessResult.hasAccess,
      reason: accessResult.hasAccess ? 'purchased' : 'no_purchase',
      expiresAt: accessResult.expiresAt || null,
      purchase: accessResult.purchase ? {
        id: accessResult.purchase.id,
        purchasedAt: accessResult.purchase.purchasedAt,
        accessGrantedAt: accessResult.purchase.accessGrantedAt,
      } : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
