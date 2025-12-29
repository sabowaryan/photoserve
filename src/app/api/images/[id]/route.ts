/**
 * Image API Routes (by ID)
 * GET - Get image details
 * DELETE - Delete an image
 * 
 * @module app/api/images/[id]/route
 * Requirements: 9.1 - API Routes for image delete
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse, createNoContentResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createImageService } from '@/lib/services/image.service';
import { createImageRepository } from '@/lib/repositories/image.repository';
import { AuthenticationError, NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/images/[id]
 * Get image details
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase } = await requireSupabaseClient();
    const { id } = await params;

    const imageRepository = createImageRepository(supabase);
    const image = await imageRepository.findById(id);

    if (!image) {
      throw new NotFoundError('Image');
    }

    return createApiResponse({ image });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/images/[id]
 * Delete an image
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    const { id } = await params;

    const imageService = createImageService(supabase);
    await imageService.delete(userId, id);

    return createNoContentResponse();
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
