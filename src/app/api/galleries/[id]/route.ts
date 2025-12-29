/**
 * Gallery by ID API Routes
 * GET - Get gallery details
 * PUT - Update gallery
 * DELETE - Delete gallery
 * 
 * @module app/api/galleries/[id]/route
 * Requirements: 9.1 - API Routes for gallery CRUD
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse, createNoContentResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createGalleryService } from '@/lib/services/gallery.service';
import { updateGallerySchema, galleryIdSchema } from '@/lib/validators/gallery.schema';
import { AuthenticationError, NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/galleries/[id]
 * Get gallery details by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    const { id } = await params;

    // Validate ID
    galleryIdSchema.parse({ id });

    const galleryService = createGalleryService(supabase);
    const gallery = await galleryService.getById(id);

    if (!gallery) {
      throw new NotFoundError('Gallery');
    }

    // Verify ownership
    if (gallery.user_id !== userId) {
      throw new NotFoundError('Gallery');
    }

    // Get images for the gallery
    const { data: images } = await supabase
      .from('images')
      .select('*')
      .eq('gallery_id', id)
      .order('order_index', { ascending: true });

    return createApiResponse({ 
      gallery,
      images: images || [],
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}

/**
 * PUT /api/galleries/[id]
 * Update gallery by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    const { id } = await params;

    // Validate ID
    galleryIdSchema.parse({ id });

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateGallerySchema.parse(body);

    const galleryService = createGalleryService(supabase);
    const gallery = await galleryService.update(id, userId, validatedData);

    return createApiResponse({ gallery });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/galleries/[id]
 * Delete gallery by ID
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    const { id } = await params;

    // Validate ID
    galleryIdSchema.parse({ id });

    const galleryService = createGalleryService(supabase);
    await galleryService.delete(id, userId);

    return createNoContentResponse();
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
