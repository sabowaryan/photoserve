/**
 * Image Service
 * Business logic for image operations
 * 
 * @module lib/services/image.service
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { Image } from '@/types';

type ImageInsert = Database['public']['Tables']['images']['Insert'];
import {
  createImageRepository,
  type IImageRepository,
} from '@/lib/repositories/image.repository';
import {
  createProfileRepository,
  type IProfileRepository,
} from '@/lib/repositories/profile.repository';
import {
  createGalleryRepository,
  type IGalleryRepository,
} from '@/lib/repositories/gallery.repository';
import {
  uploadImage as cloudinaryUpload,
  deleteImage as cloudinaryDelete,
  generateAllUrls,
} from '@/lib/cloudinary';
import {
  validateImageOrThrow,
  bytesToMb,
} from '@/lib/validators/image.schema';
import {
  NotFoundError,
  AuthorizationError,
  StorageLimitError,
  ImageLimitError,
} from '@/lib/errors';
import { getPlanLimits } from '@/config/plans';

/**
 * Result of an image upload operation
 */
export interface ImageUploadResult {
  image: Image;
  urls: {
    original: string;
    optimized: string;
    display: string;
    thumbnail: string;
  };
}

/**
 * Input for image upload
 */
export interface UploadImageInput {
  buffer: Buffer;
  mimeType: string;
  galleryId: string;
  orderIndex: number;
}

/**
 * Image Service Interface
 */
export interface IImageService {
  upload(userId: string, input: UploadImageInput): Promise<ImageUploadResult>;
  delete(userId: string, imageId: string): Promise<void>;
  getByGalleryId(galleryId: string): Promise<Image[]>;
}

export class ImageService implements IImageService {
  private imageRepository: IImageRepository;
  private profileRepository: IProfileRepository;
  private galleryRepository: IGalleryRepository;

  constructor(
    supabase: SupabaseClient<Database>,
    imageRepo?: IImageRepository,
    profileRepo?: IProfileRepository,
    galleryRepo?: IGalleryRepository
  ) {
    this.imageRepository = imageRepo || createImageRepository(supabase);
    this.profileRepository = profileRepo || createProfileRepository(supabase);
    this.galleryRepository = galleryRepo || createGalleryRepository(supabase);
  }

  /**
   * Upload an image to a gallery
   * - Validates file type and magic numbers
   * - Validates file size against plan limits
   * - Checks storage limits
   * - Checks image count limits per gallery
   * - Uploads to Cloudinary
   * - Creates database record
   * - Updates user storage usage
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  async upload(userId: string, input: UploadImageInput): Promise<ImageUploadResult> {
    const { buffer, mimeType, galleryId, orderIndex } = input;
    const fileSizeBytes = buffer.length;
    const fileSizeMb = bytesToMb(fileSizeBytes);

    // Get user profile to check limits
    const profile = await this.profileRepository.findById(userId);
    if (!profile) {
      throw new NotFoundError('Profile');
    }

    // Get gallery to verify ownership
    const gallery = await this.galleryRepository.findById(galleryId);
    if (!gallery) {
      throw new NotFoundError('Gallery');
    }

    // Verify gallery ownership
    if (gallery.user_id !== userId) {
      throw new AuthorizationError('You do not own this gallery');
    }

    const plan = profile.subscription_plan || 'free';
    const planLimits = getPlanLimits(plan);

    // Validate file type and magic numbers (Requirement 5.2)
    validateImageOrThrow(buffer, mimeType, fileSizeBytes, planLimits.max_image_size_mb);

    // Check storage limit (Requirement 5.4)
    // Always use plan limits from config, not DB values
    const currentStorageMb = profile.storage_used_mb || 0;
    const storageLimitMb = planLimits.storage_limit_mb;
    
    if (currentStorageMb + fileSizeMb > storageLimitMb) {
      throw new StorageLimitError(currentStorageMb, storageLimitMb);
    }

    // Check image count limit per gallery
    const currentImageCount = await this.imageRepository.countByGalleryId(galleryId);
    const maxImagesPerGallery = planLimits.max_images_per_gallery;
    
    if (currentImageCount >= maxImagesPerGallery) {
      throw new ImageLimitError(currentImageCount, maxImagesPerGallery);
    }

    // Upload to Cloudinary (Requirement 5.1)
    const folder = `photoserve/${userId}/${galleryId}`;
    const cloudinaryResult = await cloudinaryUpload(buffer, { folder });

    // Generate all URL variants (Requirement 5.5)
    const urls = generateAllUrls(cloudinaryResult.public_id, cloudinaryResult.secure_url);

    // Create database record
    const imageData: ImageInsert = {
      gallery_id: galleryId,
      cloudinary_url: cloudinaryResult.secure_url,
      cloudinary_public_id: cloudinaryResult.public_id,
      file_size_mb: fileSizeMb,
      order_index: orderIndex,
    };

    const image = await this.imageRepository.create(imageData);

    // Update user storage usage (Requirement 5.4)
    await this.profileRepository.incrementStorage(userId, fileSizeMb);

    return {
      image,
      urls,
    };
  }

  /**
   * Delete an image
   * - Verifies ownership through gallery
   * - Deletes from Cloudinary
   * - Deletes database record
   * - Updates user storage usage
   * 
   * Requirements: 5.6, 5.7
   */
  async delete(userId: string, imageId: string): Promise<void> {
    // Get image to verify it exists
    const image = await this.imageRepository.findById(imageId);
    if (!image) {
      throw new NotFoundError('Image');
    }

    // Get gallery to verify ownership
    const gallery = await this.galleryRepository.findById(image.gallery_id);
    if (!gallery) {
      throw new NotFoundError('Gallery');
    }

    // Verify gallery ownership
    if (gallery.user_id !== userId) {
      throw new AuthorizationError('You do not own this image');
    }

    // Delete from Cloudinary (Requirement 5.6)
    if (image.cloudinary_public_id) {
      await cloudinaryDelete(image.cloudinary_public_id);
    }

    // Delete database record (Requirement 5.6)
    await this.imageRepository.delete(imageId);

    // Update user storage usage (Requirement 5.7)
    const fileSizeMb = image.file_size_mb || 0;
    if (fileSizeMb > 0) {
      await this.profileRepository.decrementStorage(userId, fileSizeMb);
    }
  }

  /**
   * Get all images for a gallery
   */
  async getByGalleryId(galleryId: string): Promise<Image[]> {
    return this.imageRepository.findByGalleryId(galleryId);
  }
}

/**
 * Factory function to create an ImageService instance
 */
export function createImageService(
  supabase: SupabaseClient<Database>,
  imageRepo?: IImageRepository,
  profileRepo?: IProfileRepository,
  galleryRepo?: IGalleryRepository
): IImageService {
  return new ImageService(supabase, imageRepo, profileRepo, galleryRepo);
}
