/**
 * Cloudinary Client Configuration
 * Provides upload, delete, and URL generation functions
 * 
 * @module lib/cloudinary/client
 * Requirements: 5.1
 */
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Result of a Cloudinary upload operation
 */
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
}

/**
 * Options for image upload
 */
export interface UploadOptions {
  folder?: string;
  publicId?: string;
}

/**
 * Upload an image buffer to Cloudinary
 * 
 * @param buffer - The image file buffer
 * @param options - Upload options (folder, publicId)
 * @returns Promise with upload result
 */
export async function uploadImage(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const { folder = 'photoserve', publicId } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: 'image',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        } else {
          reject(new Error('Upload failed: no result returned'));
        }
      }
    ).end(buffer);
  });
}

/**
 * Delete an image from Cloudinary
 * 
 * @param publicId - The public ID of the image to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Generate an optimized URL for an image
 * Uses WebP format with auto quality for best performance
 * Implements compression and WebP format (Requirement 12.1)
 * 
 * @param publicId - The public ID of the image
 * @param options - Optional transformation options
 * @returns Optimized image URL
 */
export function generateOptimizedUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
  }
): string {
  return cloudinary.url(publicId, {
    fetch_format: 'webp', // Force WebP format for better compression (Requirement 12.1)
    quality: 'auto:good', // Automatic quality optimization
    secure: true,
    ...options,
  });
}

/**
 * Generate a thumbnail URL for an image
 * Creates a 400x400 cropped thumbnail with WebP format
 * Implements compression and WebP format (Requirement 12.1)
 * 
 * @param publicId - The public ID of the image
 * @returns Thumbnail image URL
 */
export function generateThumbnailUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    width: 400,
    height: 400,
    crop: 'fill',
    fetch_format: 'webp', // Force WebP format (Requirement 12.1)
    quality: 'auto:good',
    secure: true,
  });
}

/**
 * Generate a display URL for an image
 * Creates a responsive image with max width of 1920px and WebP format
 * Implements compression and WebP format (Requirement 12.1)
 * 
 * @param publicId - The public ID of the image
 * @returns Display image URL
 */
export function generateDisplayUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    width: 1920,
    crop: 'limit',
    fetch_format: 'webp', // Force WebP format (Requirement 12.1)
    quality: 'auto:good',
    secure: true,
  });
}

/**
 * Generate responsive image URLs for srcset
 * Creates multiple sizes for responsive images (Requirement 12.1)
 * 
 * @param publicId - The public ID of the image
 * @param sizes - Array of widths to generate
 * @returns Object with srcset string and sizes
 */
export function generateResponsiveUrls(
  publicId: string,
  sizes: number[] = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
): {
  srcset: string;
  sizes: string;
} {
  const srcset = sizes
    .map((width) => {
      const url = cloudinary.url(publicId, {
        width,
        crop: 'limit',
        fetch_format: 'webp',
        quality: 'auto:good',
        secure: true,
      });
      return `${url} ${width}w`;
    })
    .join(', ');

  // Default sizes attribute for responsive images
  const sizesAttr = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return {
    srcset,
    sizes: sizesAttr,
  };
}

/**
 * Generate all URL variants for an image
 * Returns original, optimized, display, and thumbnail URLs
 * 
 * @param publicId - The public ID of the image
 * @param originalUrl - The original secure URL from upload
 * @returns Object with all URL variants
 */
export function generateAllUrls(publicId: string, originalUrl: string): {
  original: string;
  optimized: string;
  display: string;
  thumbnail: string;
} {
  return {
    original: originalUrl,
    optimized: generateOptimizedUrl(publicId),
    display: generateDisplayUrl(publicId),
    thumbnail: generateThumbnailUrl(publicId),
  };
}

// Export the configured cloudinary instance for advanced usage
export { cloudinary };
