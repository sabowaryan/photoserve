/**
 * Gallery API Routes
 * GET - List user galleries
 * POST - Create new gallery
 * 
 * @module app/api/galleries/route
 * Requirements: 9.1 - API Routes for gallery CRUD
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createGalleryService } from '@/lib/services/gallery.service';
import { createGallerySchema } from '@/lib/validators/gallery.schema';
import { AuthenticationError } from '@/lib/errors';

/**
 * GET /api/galleries
 * List all galleries for the authenticated user
 */
export async function GET() {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    const galleryService = createGalleryService(supabase);
    const galleries = await galleryService.getByUserId(userId);

    return createApiResponse({ galleries });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}

/**
 * POST /api/galleries
 * Create a new gallery
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createGallerySchema.parse(body);

    const galleryService = createGalleryService(supabase);
    const gallery = await galleryService.create(userId, validatedData);

    return createApiResponse({ gallery }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
