/**
 * Admin Plugin Upload API Route
 * POST - Upload plugin file to Cloudinary (admin only)
 * 
 * @module app/api/admin/plugin/upload/route
 * Requirements: 4.1, 10.2, 10.3, 10.4
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { cloudinary } from '@/lib/cloudinary/client';
import { z } from 'zod';

/**
 * Maximum file size for plugin uploads (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Allowed file extension for plugin files
 */
const ALLOWED_EXTENSION = '.lrplugin';

/**
 * Validation schema for file upload
 */
const uploadValidationSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number()
    .positive('File size must be positive')
    .max(MAX_FILE_SIZE, `File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  fileExtension: z.string()
    .refine(
      (ext) => ext.toLowerCase() === ALLOWED_EXTENSION,
      `File must have ${ALLOWED_EXTENSION} extension`
    ),
});

/**
 * Upload a file buffer to Cloudinary as a raw file
 * 
 * @param buffer - The file buffer
 * @param _fileName - Original file name
 * @returns Upload result with URL and file size
 */
async function uploadPluginFile(
  buffer: Buffer,
  _fileName: string
): Promise<{ url: string; fileSize: number }> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'piksend/plugins',
      resource_type: 'raw' as const, // Upload as raw file, not image
      public_id: `lightroom-plugin-${Date.now()}`, // Unique ID with timestamp
      use_filename: false, // Don't use original filename
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('[PluginUpload] Cloudinary upload error:', error);
          reject(new Error('Failed to upload file to Cloudinary'));
        } else if (result) {
          resolve({
            url: result.secure_url,
            fileSize: result.bytes,
          });
        } else {
          reject(new Error('Upload failed: no result returned'));
        }
      }
    ).end(buffer);
  });
}

/**
 * POST /api/admin/plugin/upload
 * Upload a plugin file to Cloudinary (admin only)
 * 
 * Accepts multipart/form-data with a file field
 * 
 * Returns:
 * - url: Cloudinary URL of the uploaded file
 * - fileSize: Size of the file in bytes
 * 
 * Requirements:
 * - 4.1: Admin can upload plugin files
 * - 10.2: Provide file upload interface
 * - 10.3: Validate file is .lrplugin extension
 * - 10.4: Upload to Cloudinary and return URL
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return createApiResponse(
        { error: authResult.error },
        authResult.status
      );
    }

    // Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return createApiResponse(
        { error: 'No file provided' },
        400
      );
    }

    // Extract file information
    const fileName = file.name;
    const fileSize = file.size;
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    // Validate file
    const validation = uploadValidationSchema.safeParse({
      fileName,
      fileSize,
      fileExtension,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return createApiResponse(
        { error: firstError?.message || 'Invalid file' },
        400
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await uploadPluginFile(buffer, fileName);

    return createApiResponse({
      url: uploadResult.url,
      fileSize: uploadResult.fileSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
