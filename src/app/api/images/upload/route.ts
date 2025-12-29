/**
 * Image Upload API Route
 * POST - Upload an image to a gallery
 * 
 * @module app/api/images/upload/route
 * Requirements: 9.1 - API Routes for image upload
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createImageService } from '@/lib/services/image.service';
import { AuthenticationError, ValidationError } from '@/lib/errors';

/**
 * POST /api/images/upload
 * Upload an image to a gallery
 * 
 * Expects multipart/form-data with:
 * - file: The image file
 * - galleryId: The gallery ID to upload to
 * - orderIndex: The order index for the image (optional, defaults to 0)
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const galleryId = formData.get('galleryId') as string | null;
    const orderIndexStr = formData.get('orderIndex') as string | null;

    // Validate required fields
    if (!file) {
      throw new ValidationError('File is required');
    }

    if (!galleryId) {
      throw new ValidationError('Gallery ID is required');
    }

    // Parse order index
    const orderIndex = orderIndexStr ? parseInt(orderIndexStr, 10) : 0;
    if (isNaN(orderIndex) || orderIndex < 0) {
      throw new ValidationError('Order index must be a non-negative integer');
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create image service and upload
    const imageService = createImageService(supabase);
    const result = await imageService.upload(userId, {
      buffer,
      mimeType: file.type,
      galleryId,
      orderIndex,
    });

    return createApiResponse({
      image: result.image,
      urls: result.urls,
    }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
