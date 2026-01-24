/**
 * API Route: Upload Media for Public Profile
 * Handles avatar and cover image uploads to Cloudinary
 * 
 * Requirements: 10.9, 10.10
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary/client';
import { AuthenticationError, ValidationError } from '@/lib/errors';

// File validation constants
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/**
 * POST /api/public-profile/upload-media
 * Upload avatar or cover image to Cloudinary
 * 
 * Requirements: 10.9, 10.10
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await requireSupabaseClient();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    // Validate file presence
    if (!file) {
      throw new ValidationError('Aucun fichier fourni', { field: 'file' });
    }

    // Validate type
    if (!type || !['avatar', 'cover'].includes(type)) {
      throw new ValidationError('Type invalide. Doit être "avatar" ou "cover"', { field: 'type' });
    }

    // Validate file type
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      throw new ValidationError(
        `Format invalide. Formats acceptés : PNG, JPG, JPEG, WebP. Reçu : ${file.type}`,
        { field: 'file', receivedType: file.type }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new ValidationError(
        `Le fichier dépasse ${MAX_FILE_SIZE_MB}MB. Taille : ${fileSizeMB}MB`,
        { field: 'file', fileSize: fileSizeMB }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary with appropriate folder
    const folder = `photoserve/${userId}/public-profile/${type}`;
    
    const result = await uploadImage(buffer, {
      folder,
    });

    // Return the secure URL
    return createApiResponse(
      { 
        url: result.secure_url,
        publicId: result.public_id,
      },
      200
    );

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    return handleApiError(error);
  }
}
