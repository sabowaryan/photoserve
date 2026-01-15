/**
 * ZIP Download Service
 * Handles ZIP file generation for gallery downloads with streaming support
 * 
 * @module lib/services/zip.service
 * Requirements: 4.2.1, 4.2.2, 4.2.3 - Bulk download ZIP functionality
 */
import JSZip from 'jszip';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { SubscriptionPlan } from '@/types';
import { AppError, NotFoundError } from '@/lib/errors';
import { hasFeatureAccess } from '@/config/plan-features';

/**
 * Image data for ZIP generation (subset of full Image type)
 */
interface ZipImageData {
  id: string;
  cloudinary_url: string;
  cloudinary_public_id: string | null;
  order_index: number | null;
  file_size_mb: number | null;
}

/**
 * ZIP generation options
 */
export interface ZipOptions {
  /** Compression level: STORE (no compression) or DEFLATE */
  compression: 'STORE' | 'DEFLATE';
  /** Compression level for DEFLATE (1-9) */
  compressionLevel?: number;
  /** Include metadata file with image info */
  includeMetadata?: boolean;
}

/**
 * ZIP generation result
 */
export interface ZipResult {
  /** The ZIP file as ArrayBuffer */
  buffer: ArrayBuffer;
  /** The suggested filename for the ZIP */
  filename: string;
  /** Total size in bytes */
  size: number;
  /** Number of images included */
  imageCount: number;
  /** List of any failed downloads */
  failedImages: string[];
}

/**
 * Image download progress callback
 */
export type ProgressCallback = (current: number, total: number, imageName: string) => void;

/**
 * ZIP Service Interface
 */
export interface IZipService {
  generateGalleryZip(
    galleryId: string,
    options?: Partial<ZipOptions>
  ): Promise<ZipResult>;
  
  generateSelectionZip(
    galleryId: string,
    imageIds: string[],
    options?: Partial<ZipOptions>
  ): Promise<ZipResult>;
  
  canDownloadZip(plan: SubscriptionPlan): boolean;
  
  checkZipAccess(plan: SubscriptionPlan): void;
}

/**
 * Default ZIP options - STORE for no compression (preserves original quality)
 * Requirements: 4.2.3 - ZIP SHALL contain original quality images
 */
const DEFAULT_ZIP_OPTIONS: ZipOptions = {
  compression: 'STORE',
  includeMetadata: false,
};


/**
 * ZIP Service Implementation
 */
export class ZipService implements IZipService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Check if a user with given plan can download ZIP
   * Requirements: 4.2.5 - WHERE plan is Premium or Pro, THE Bulk_Download SHALL be available
   * 
   * @param plan - The user's subscription plan
   * @returns true if the user can download ZIP
   */
  canDownloadZip(plan: SubscriptionPlan): boolean {
    return hasFeatureAccess(plan, 'bulkDownload');
  }

  /**
   * Check ZIP access and throw error if not allowed
   * Requirements: 4.2.5 - Plan-based access control
   * 
   * @param plan - The user's subscription plan
   * @throws AppError if user doesn't have access
   */
  checkZipAccess(plan: SubscriptionPlan): void {
    if (!this.canDownloadZip(plan)) {
      throw new AppError(
        'Bulk download requires Premium or Pro plan',
        'PLAN_LIMIT_EXCEEDED',
        403,
        { feature: 'bulkDownload', requiredPlan: 'premium' }
      );
    }
  }

  /**
   * Generate a ZIP file containing all images from a gallery
   * Requirements: 4.2.1 - Gallery_Header SHALL include "Download All" button
   * Requirements: 4.2.2 - System SHALL generate ZIP file
   * Requirements: 4.2.3 - ZIP SHALL contain original quality images
   * 
   * @param galleryId - The gallery ID to download
   * @param options - ZIP generation options
   * @returns The ZIP result with buffer and metadata
   */
  async generateGalleryZip(
    galleryId: string,
    options: Partial<ZipOptions> = {}
  ): Promise<ZipResult> {
    const zipOptions = { ...DEFAULT_ZIP_OPTIONS, ...options };
    const failedImages: string[] = [];

    // Get gallery info
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('id, title, is_active, expires_at')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Check if gallery is active and not expired
    const isExpired = new Date(gallery.expires_at) < new Date();
    if (!gallery.is_active || isExpired) {
      throw new AppError('Gallery is not accessible', 'GALLERY_NOT_ACCESSIBLE', 403);
    }

    // Get all images for the gallery
    const { data: images, error: imagesError } = await this.supabase
      .from('images')
      .select('id, cloudinary_url, cloudinary_public_id, order_index, file_size_mb')
      .eq('gallery_id', galleryId)
      .order('order_index');

    if (imagesError) {
      throw new AppError('Error fetching images', 'ERROR_FETCHING_IMAGES', 500);
    }

    if (!images || images.length === 0) {
      throw new AppError('No images in gallery', 'NO_IMAGES_IN_GALLERY', 404);
    }

    // Create ZIP file
    const zip = new JSZip();
    const folderName = this.sanitizeFilename(gallery.title);
    const folder = zip.folder(folderName);

    if (!folder) {
      throw new AppError('Error creating archive', 'ERROR_CREATING_ARCHIVE', 500);
    }

    // Download and add each image to the ZIP
    await this.downloadImages(images, folder, failedImages);

    // Optionally add metadata file
    if (zipOptions.includeMetadata) {
      const metadata = this.generateMetadata(gallery, images, failedImages);
      folder.file('_metadata.json', JSON.stringify(metadata, null, 2));
    }

    // Generate ZIP buffer
    const compressionOptions = zipOptions.compression === 'DEFLATE'
      ? { compression: 'DEFLATE' as const, compressionOptions: { level: zipOptions.compressionLevel || 6 } }
      : { compression: 'STORE' as const };

    const zipBuffer = await zip.generateAsync({
      type: 'arraybuffer',
      ...compressionOptions,
    });

    const filename = `${folderName}.zip`;

    return {
      buffer: zipBuffer,
      filename,
      size: zipBuffer.byteLength,
      imageCount: images.length - failedImages.length,
      failedImages,
    };
  }

  /**
   * Generate a ZIP file containing selected images from a gallery
   * Requirements: 3.1 - Favorites System (also used for temporary selection)
   * 
   * @param galleryId - The gallery ID
   * @param imageIds - Array of image IDs to include
   * @param options - ZIP generation options
   * @returns The ZIP result with buffer and metadata
   */
  async generateSelectionZip(
    galleryId: string,
    imageIds: string[],
    options: Partial<ZipOptions> & { suffix?: string } = {}
  ): Promise<ZipResult> {
    const zipOptions = { ...DEFAULT_ZIP_OPTIONS, ...options };
    const failedImages: string[] = [];

    if (!imageIds || imageIds.length === 0) {
      throw new AppError('No images selected', 'NO_IMAGES_SELECTED', 400);
    }

    // Get gallery info
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('id, title, is_active, expires_at')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Check if gallery is active and not expired
    const isExpired = new Date(gallery.expires_at) < new Date();
    if (!gallery.is_active || isExpired) {
      throw new AppError('Gallery is not accessible', 'GALLERY_NOT_ACCESSIBLE', 403);
    }

    // Get selected images
    const { data: images, error: imagesError } = await this.supabase
      .from('images')
      .select('id, cloudinary_url, cloudinary_public_id, order_index, file_size_mb')
      .eq('gallery_id', galleryId)
      .in('id', imageIds)
      .order('order_index');

    if (imagesError) {
      throw new AppError('Error fetching images', 'ERROR_FETCHING_IMAGES', 500);
    }

    if (!images || images.length === 0) {
      throw new AppError('No images found', 'NO_IMAGES_FOUND', 404);
    }

    // Create ZIP file
    const zip = new JSZip();
    const folderName = this.sanitizeFilename(gallery.title);
    const folder = zip.folder(folderName);

    if (!folder) {
      throw new AppError('Error creating archive', 'ERROR_CREATING_ARCHIVE', 500);
    }

    // Download and add each image to the ZIP
    await this.downloadImages(images, folder, failedImages);

    // Optionally add metadata file
    if (zipOptions.includeMetadata) {
      const metadata = this.generateMetadata(gallery, images, failedImages);
      folder.file('_metadata.json', JSON.stringify(metadata, null, 2));
    }

    // Generate ZIP buffer
    const compressionOptions = zipOptions.compression === 'DEFLATE'
      ? { compression: 'DEFLATE' as const, compressionOptions: { level: zipOptions.compressionLevel || 6 } }
      : { compression: 'STORE' as const };

    const zipBuffer = await zip.generateAsync({
      type: 'arraybuffer',
      ...compressionOptions,
    });

    const suffix = options.suffix || 'selection';
    const filename = `${folderName}_${suffix}.zip`;

    return {
      buffer: zipBuffer,
      filename,
      size: zipBuffer.byteLength,
      imageCount: images.length - failedImages.length,
      failedImages,
    };
  }

  /**
   * Download images and add them to the ZIP folder
   * Uses parallel downloads with concurrency limit
   */
  private async downloadImages(
    images: ZipImageData[],
    folder: JSZip,
    failedImages: string[]
  ): Promise<void> {
    const CONCURRENCY_LIMIT = 5;
    
    // Process images in batches for better performance
    for (let i = 0; i < images.length; i += CONCURRENCY_LIMIT) {
      const batch = images.slice(i, i + CONCURRENCY_LIMIT);
      
      await Promise.all(
        batch.map(async (image, batchIndex) => {
          const globalIndex = i + batchIndex;
          try {
            const response = await fetch(image.cloudinary_url);
            if (!response.ok) {
              console.error(`Failed to fetch image: ${image.cloudinary_url}`);
              failedImages.push(image.id);
              return;
            }

            const arrayBuffer = await response.arrayBuffer();
            const extension = this.getExtensionFromUrl(image.cloudinary_url);
            const filename = `photo_${String(globalIndex + 1).padStart(3, '0')}${extension}`;
            
            folder.file(filename, arrayBuffer);
          } catch (error) {
            console.error(`Error downloading image ${image.id}:`, error);
            failedImages.push(image.id);
          }
        })
      );
    }
  }

  /**
   * Generate metadata JSON for the ZIP
   */
  private generateMetadata(
    gallery: { id: string; title: string },
    images: ZipImageData[],
    failedImages: string[]
  ): object {
    return {
      galleryId: gallery.id,
      galleryTitle: gallery.title,
      exportedAt: new Date().toISOString(),
      totalImages: images.length,
      successfulDownloads: images.length - failedImages.length,
      failedDownloads: failedImages.length,
      images: images.map((img, index) => ({
        index: index + 1,
        id: img.id,
        filename: `photo_${String(index + 1).padStart(3, '0')}${this.getExtensionFromUrl(img.cloudinary_url)}`,
        sizeMb: img.file_size_mb,
        failed: failedImages.includes(img.id),
      })),
    };
  }

  /**
   * Sanitize filename for ZIP
   */
  private sanitizeFilename(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .slice(0, 50) || 'gallery'; // Limit length, fallback to 'gallery'
  }

  /**
   * Get file extension from URL
   */
  private getExtensionFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|tiff|raw)$/i);
      return match && match[1] ? `.${match[1].toLowerCase()}` : '.jpg';
    } catch {
      return '.jpg';
    }
  }
}

/**
 * Factory function to create a ZipService instance
 */
export function createZipService(
  supabase: SupabaseClient<Database>
): ZipService {
  return new ZipService(supabase);
}
