/**
 * Guest Gallery API Routes
 * POST - Create a new guest gallery
 * GET - List galleries for a guest session
 * 
 * @module app/api/guest/galleries/route
 * Requirements: 1.2, 1.4
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { createAdminClient } from '@/lib/supabase/server';
import { createGuestGalleryService } from '@/lib/services/guest-gallery.service';
import { getTokenFromCookies, isValidUUID } from '@/lib/guest';
import { ValidationError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Schema for creating a guest gallery
 */
const createGuestGallerySchema = z.object({
  title: z
    .string()
    .min(1, 'Gallery title is required')
    .max(100, 'Gallery title cannot exceed 100 characters'),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(50, 'Password cannot exceed 50 characters')
    .optional(),
});

/**
 * POST /api/guest/galleries
 * Create a new guest gallery
 * 
 * Request body:
 * - title: string (required) - Gallery title
 * - password: string (optional) - Gallery password
 * 
 * Headers:
 * - Cookie: piksend_guest_token (required)
 * 
 * Response:
 * - 201: { gallery: Gallery }
 * - 400: { error: string } - Validation error
 * - 401: { error: string } - No guest session
 */
export async function POST(request: NextRequest) {
  try {
    // Get guest session token from cookies
    const cookieHeader = request.headers.get('cookie');
    const guestToken = getTokenFromCookies(cookieHeader);

    if (!guestToken || !isValidUUID(guestToken)) {
      throw new ValidationError('Guest session required. Please create a session first.');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createGuestGallerySchema.parse(body);

    // Create guest gallery service with admin client (bypasses RLS for guest operations)
    const supabase = createAdminClient();
    const guestGalleryService = createGuestGalleryService(supabase);

    // Create the gallery
    const gallery = await guestGalleryService.create({
      title: validatedData.title,
      guestSessionId: guestToken,
      password: validatedData.password,
    });

    return createApiResponse({ gallery }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/guest/galleries
 * List all galleries for the current guest session
 * 
 * Headers:
 * - Cookie: piksend_guest_token (required) OR
 * - x-guest-token: string (required)
 * 
 * Response:
 * - 200: { galleries: Gallery[] }
 * - 401: { error: string } - No guest session
 */
export async function GET(request: NextRequest) {
  try {
    // Get guest session token from cookies or header
    const cookieHeader = request.headers.get('cookie');
    const headerToken = request.headers.get('x-guest-token');
    const guestToken = headerToken || getTokenFromCookies(cookieHeader);

    if (!guestToken || !isValidUUID(guestToken)) {
      // Return empty array instead of error for better UX
      return createApiResponse({ galleries: [] });
    }

    // Create guest gallery service with admin client
    const supabase = createAdminClient();
    
    // Fetch galleries with image count and thumbnail
    const { data: galleries, error } = await supabase
      .from('galleries')
      .select(`
        id,
        title,
        unique_slug,
        expires_at,
        views_count,
        is_unlocked,
        payment_type,
        images:images(id, cloudinary_url)
      `)
      .eq('guest_session_id', guestToken)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform data to include image count and thumbnail
    const transformedGalleries = (galleries || []).map(gallery => ({
      id: gallery.id,
      title: gallery.title,
      unique_slug: gallery.unique_slug,
      expires_at: gallery.expires_at,
      views_count: gallery.views_count ?? 0,
      image_count: gallery.images?.length ?? 0,
      is_unlocked: gallery.is_unlocked ?? false,
      payment_type: gallery.payment_type ?? 'free',
      thumbnail_url: gallery.images?.[0]?.cloudinary_url ?? null,
    }));

    return createApiResponse({ galleries: transformedGalleries });
  } catch (error) {
    return handleApiError(error);
  }
}
