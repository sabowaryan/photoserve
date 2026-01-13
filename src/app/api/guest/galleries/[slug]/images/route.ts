/**
 * Guest Gallery Image Upload API Route
 * POST - Upload images to a guest gallery
 * 
 * @module app/api/guest/galleries/[slug]/images/route
 * Requirements: 1.2, 1.5, 1.6, 1.7
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { createAdminClient } from '@/lib/supabase/server';
import { 
  createGuestGalleryService,
  GUEST_GALLERY_LIMITS,
} from '@/lib/services/guest-gallery.service';
import { createGalleryRepository } from '@/lib/repositories/gallery.repository';
import { getTokenFromCookies, isValidUUID } from '@/lib/guest';
import { ValidationError, NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/guest/galleries/[slug]/images
 * Upload an image to a guest gallery
 * 
 * URL params:
 * - slug: string (required) - Gallery unique slug
 * 
 * Headers:
 * - Cookie: piksend_guest_token (required)
 * 
 * Form data:
 * - file: File (required) - The image file to upload
 * - orderIndex: number (optional) - Order index for the image (default: 0)
 * 
 * Response:
 * - 201: { image: Image, urls: { original, optimized, display, thumbnail } }
 * - 400: { error: string } - Validation error (file type, size, count)
 * - 401: { error: string } - No guest session
 * - 404: { error: string } - Gallery not found
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const orderIndexStr = formData.get('orderIndex') as string | null;

    // Validate file is present (Requirement 1.5)
    if (!file) {
      throw new ValidationError('File is required');
    }

    // Parse order index
    const orderIndex = orderIndexStr ? parseInt(orderIndexStr, 10) : 0;
    if (isNaN(orderIndex) || orderIndex < 0) {
      throw new ValidationError('Order index must be a non-negative integer');
    }

    // Create services with admin client
    const supabase = createAdminClient();
    const galleryRepository = createGalleryRepository(supabase);
    const guestGalleryService = createGuestGalleryService(supabase);

    // Get gallery by slug to get the ID
    const gallery = await galleryRepository.findBySlug(slug);
    
    if (!gallery) {
      throw new NotFoundError('Gallery');
    }

    // Verify gallery belongs to guest session
    if (gallery.guest_session_id !== guestToken) {
      throw new NotFoundError('Gallery'); // Don't reveal existence
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the image (validation happens inside the service)
    const result = await guestGalleryService.uploadImage({
      buffer,
      mimeType: file.type,
      galleryId: gallery.id,
      guestSessionId: guestToken,
      orderIndex,
    });

    return createApiResponse({
      image: result.image,
      urls: result.urls,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/guest/galleries/[slug]/images
 * Get upload limits and current status for a guest gallery
 * 
 * Response:
 * - 200: { limits: GuestGalleryLimits, currentCount: number }
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

    // Create services with admin client
    const supabase = createAdminClient();
    const guestGalleryService = createGuestGalleryService(supabase);

    // Get the gallery with images to count
    const result = await guestGalleryService.getBySlug(slug, guestToken);

    if (!result) {
      throw new NotFoundError('Gallery');
    }

    return createApiResponse({
      limits: {
        maxFiles: GUEST_GALLERY_LIMITS.maxFiles,
        maxFileSizeMB: GUEST_GALLERY_LIMITS.maxFileSizeMB,
        allowedTypes: GUEST_GALLERY_LIMITS.allowedTypes,
      },
      currentCount: result.images.length,
      remainingSlots: GUEST_GALLERY_LIMITS.maxFiles - result.images.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
