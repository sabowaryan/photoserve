/**
 * Guest Gallery Detail API Route
 * GET - Get a specific guest gallery by slug
 * 
 * @module app/api/guest/galleries/[slug]/route
 * Requirements: 1.4
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { createAdminClient } from '@/lib/supabase/server';
import { createGuestGalleryService } from '@/lib/services/guest-gallery.service';
import { getTokenFromCookies, isValidUUID } from '@/lib/guest';
import { ValidationError, NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/guest/galleries/[slug]
 * Get a specific guest gallery by slug
 * 
 * URL params:
 * - slug: string (required) - Gallery unique slug
 * 
 * Headers:
 * - Cookie: piksend_guest_token (required)
 * 
 * Response:
 * - 200: { gallery: Gallery, images: Image[] }
 * - 400: { error: string } - Validation error
 * - 401: { error: string } - No guest session
 * - 404: { error: string } - Gallery not found
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    if (!slug) {
      throw new ValidationError('Gallery slug is required');
    }

    // Get guest session token from cookies
    const cookieHeader = request.headers.get('cookie');
    const guestToken = getTokenFromCookies(cookieHeader);

    if (!guestToken || !isValidUUID(guestToken)) {
      throw new ValidationError('Guest session required. Please create a session first.');
    }

    // Create guest gallery service with admin client
    const supabase = createAdminClient();
    const guestGalleryService = createGuestGalleryService(supabase);

    // Get the gallery with images
    const result = await guestGalleryService.getBySlug(slug, guestToken);

    if (!result) {
      throw new NotFoundError('Gallery');
    }

    return createApiResponse({
      gallery: result.gallery,
      images: result.images,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
