/**
 * Guest Gallery Service
 * Business logic for guest gallery operations
 * 
 * @module lib/services/guest-gallery.service
 * Requirements: 1.2, 1.3, 1.5, 1.6, 1.7
 */
import bcrypt from 'bcryptjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Gallery, GalleryInsert, Image, ImageInsert } from '@/lib/supabase/types';
import { 
  createGalleryRepository,
  type IGalleryRepository 
} from '@/lib/repositories/gallery.repository';
import {
  createImageRepository,
  type IImageRepository,
} from '@/lib/repositories/image.repository';
import { 
  ValidationError, 
  NotFoundError, 
  ImageLimitError,
  FileSizeError,
  InvalidFileTypeError,
} from '@/lib/errors';
import { sanitizeTitle } from '@/lib/utils/sanitize';
import { isValidUUID } from '@/lib/guest/session';
import {
  uploadImage as cloudinaryUpload,
  generateAllUrls,
} from '@/lib/cloudinary';
import {
  validateImageFile,
  ALLOWED_MIME_TYPES,
  bytesToMb,
} from '@/lib/validators/image.schema';

// Guest gallery limits (Requirements: 1.5, 1.6, 1.7)
export const GUEST_GALLERY_LIMITS = {
  maxFiles: 10,
  maxFileSizeMB: 5,
  expirationHours: 24,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
};

const BCRYPT_ROUNDS = 10;

/**
 * Input for creating a guest gallery
 */
export interface CreateGuestGalleryInput {
  title: string;
  guestSessionId: string;
  password?: string;
}

/**
 * Input for uploading an image to a guest gallery
 */
export interface GuestImageUploadInput {
  buffer: Buffer;
  mimeType: string;
  galleryId: string;
  guestSessionId: string;
  orderIndex: number;
}

/**
 * Result of a guest image upload
 */
export interface GuestImageUploadResult {
  image: Image;
  urls: {
    original: string;
    optimized: string;
    display: string;
    thumbnail: string;
  };
}

/**
 * Guest gallery with images
 */
export interface GuestGalleryWithImages {
  gallery: Gallery;
  images: Image[];
}

/**
 * Guest Gallery Service Interface
 */
export interface IGuestGalleryService {
  create(input: CreateGuestGalleryInput): Promise<Gallery>;
  getBySession(guestSessionId: string): Promise<Gallery[]>;
  getBySlug(slug: string, guestSessionId: string): Promise<GuestGalleryWithImages | null>;
  uploadImage(input: GuestImageUploadInput): Promise<GuestImageUploadResult>;
  validateGuestUpload(buffer: Buffer, mimeType: string, galleryId: string): Promise<void>;
}


export class GuestGalleryService implements IGuestGalleryService {
  private galleryRepository: IGalleryRepository;
  private imageRepository: IImageRepository;

  constructor(
    private supabase: SupabaseClient<Database>,
    galleryRepo?: IGalleryRepository,
    imageRepo?: IImageRepository
  ) {
    this.galleryRepository = galleryRepo || createGalleryRepository(supabase);
    this.imageRepository = imageRepo || createImageRepository(supabase);
  }

  /**
   * Create a new guest gallery
   * - Validates guest session token
   * - Generates unique slug
   * - Sets 24h expiration (Requirement 1.3)
   * 
   * Requirements: 1.2, 1.3
   */
  async create(input: CreateGuestGalleryInput): Promise<Gallery> {
    const { title, guestSessionId, password } = input;

    // Validate guest session token format
    if (!guestSessionId || !isValidUUID(guestSessionId)) {
      throw new ValidationError('Invalid guest session token');
    }

    // Validate title
    if (!title || title.trim().length === 0) {
      throw new ValidationError('Gallery title is required');
    }

    if (title.length > 100) {
      throw new ValidationError('Gallery title cannot exceed 100 characters');
    }

    // Sanitize title
    const sanitizedTitle = sanitizeTitle(title);

    // Generate unique slug (Requirement 1.2)
    const uniqueSlug = await this.galleryRepository.generateUniqueSlug();

    // Calculate expiration date - 24 hours from now (Requirement 1.3)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + GUEST_GALLERY_LIMITS.expirationHours * 60 * 60 * 1000);

    // Generate a default password if not provided
    // For guest galleries, password is optional - they are accessible via unique link
    // Use empty string for no password (database requires non-null)
    let passwordHash = '';
    if (password) {
      passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    // Create gallery with guest session
    const galleryData: GalleryInsert = {
      user_id: null, // Guest galleries have no user
      guest_session_id: guestSessionId,
      title: sanitizedTitle,
      unique_slug: uniqueSlug,
      password_hash: passwordHash, // empty string for guest galleries without password
      expiration_days: 1, // 24 hours = 1 day
      expires_at: expiresAt.toISOString(),
      is_active: true,
      views_count: 0,
      is_unlocked: false,
      payment_type: 'free',
    };

    return this.galleryRepository.create(galleryData);
  }

  /**
   * Get all galleries for a guest session
   * 
   * Requirements: 8.1
   */
  async getBySession(guestSessionId: string): Promise<Gallery[]> {
    if (!guestSessionId || !isValidUUID(guestSessionId)) {
      throw new ValidationError('Invalid guest session token');
    }

    const { data, error } = await this.supabase
      .from('galleries')
      .select('*')
      .eq('guest_session_id', guestSessionId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get a guest gallery by slug with images
   * Validates that the gallery belongs to the guest session
   * 
   * Requirements: 1.4
   */
  async getBySlug(slug: string, guestSessionId: string): Promise<GuestGalleryWithImages | null> {
    if (!slug) {
      throw new ValidationError('Gallery slug is required');
    }

    // Get gallery by slug
    const gallery = await this.galleryRepository.findBySlug(slug);
    
    if (!gallery) {
      return null;
    }

    // Verify this is a guest gallery belonging to the session
    if (gallery.guest_session_id !== guestSessionId) {
      // Don't reveal that the gallery exists
      return null;
    }

    // Get images for the gallery
    const images = await this.imageRepository.findByGalleryId(gallery.id);

    return {
      gallery,
      images,
    };
  }

  /**
   * Validate a guest upload before processing
   * - Validates file type (Requirement 1.7)
   * - Validates file size (Requirement 1.6)
   * - Validates image count (Requirement 1.5)
   * 
   * Requirements: 1.5, 1.6, 1.7
   */
  async validateGuestUpload(buffer: Buffer, mimeType: string, galleryId: string): Promise<void> {
    const fileSizeBytes = buffer.length;
    const fileSizeMB = bytesToMb(fileSizeBytes);

    // Validate file type (Requirement 1.7)
    const allowedTypes = GUEST_GALLERY_LIMITS.allowedTypes;
    if (!allowedTypes.includes(mimeType as typeof allowedTypes[number])) {
      throw new InvalidFileTypeError(mimeType, [...allowedTypes]);
    }

    // Validate magic numbers match declared MIME type
    const validation = validateImageFile(buffer, mimeType);
    if (!validation.valid) {
      throw new InvalidFileTypeError(mimeType, [...ALLOWED_MIME_TYPES]);
    }

    // Validate file size (Requirement 1.6)
    if (fileSizeMB > GUEST_GALLERY_LIMITS.maxFileSizeMB) {
      throw new FileSizeError(fileSizeMB, GUEST_GALLERY_LIMITS.maxFileSizeMB);
    }

    // Validate image count (Requirement 1.5)
    const currentImageCount = await this.imageRepository.countByGalleryId(galleryId);
    if (currentImageCount >= GUEST_GALLERY_LIMITS.maxFiles) {
      throw new ImageLimitError(currentImageCount, GUEST_GALLERY_LIMITS.maxFiles);
    }
  }

  /**
   * Upload an image to a guest gallery
   * - Validates ownership via guest session
   * - Validates file constraints
   * - Uploads to Cloudinary
   * - Creates database record
   * 
   * Requirements: 1.5, 1.6, 1.7
   */
  async uploadImage(input: GuestImageUploadInput): Promise<GuestImageUploadResult> {
    const { buffer, mimeType, galleryId, guestSessionId, orderIndex } = input;

    // Validate guest session
    if (!guestSessionId || !isValidUUID(guestSessionId)) {
      throw new ValidationError('Invalid guest session token');
    }

    // Get gallery to verify ownership
    const gallery = await this.galleryRepository.findById(galleryId);
    if (!gallery) {
      throw new NotFoundError('Gallery');
    }

    // Verify gallery belongs to guest session
    if (gallery.guest_session_id !== guestSessionId) {
      throw new NotFoundError('Gallery'); // Don't reveal existence
    }

    // Validate the upload
    await this.validateGuestUpload(buffer, mimeType, galleryId);

    // Upload to Cloudinary
    const folder = `photoserve/guest/${guestSessionId}/${galleryId}`;
    const cloudinaryResult = await cloudinaryUpload(buffer, { folder });

    // Generate all URL variants
    const urls = generateAllUrls(cloudinaryResult.public_id, cloudinaryResult.secure_url);

    // Create database record
    const fileSizeMB = bytesToMb(buffer.length);
    const imageData: ImageInsert = {
      gallery_id: galleryId,
      cloudinary_url: cloudinaryResult.secure_url,
      cloudinary_public_id: cloudinaryResult.public_id,
      file_size_mb: fileSizeMB,
      order_index: orderIndex,
    };

    const image = await this.imageRepository.create(imageData);

    return {
      image,
      urls,
    };
  }
}

/**
 * Factory function to create a GuestGalleryService instance
 */
export function createGuestGalleryService(
  supabase: SupabaseClient<Database>,
  galleryRepo?: IGalleryRepository,
  imageRepo?: IImageRepository
): IGuestGalleryService {
  return new GuestGalleryService(supabase, galleryRepo, imageRepo);
}
