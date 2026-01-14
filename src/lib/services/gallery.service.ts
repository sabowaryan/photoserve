/**
 * Gallery Service
 * Business logic for gallery operations
 * 
 * @module lib/services/gallery.service
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7
 */
import bcrypt from 'bcryptjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Gallery, GalleryInsert } from '@/lib/supabase/types';
import { 
  createGalleryRepository,
  type IGalleryRepository 
} from '@/lib/repositories/gallery.repository';
import { 
  createProfileRepository,
  type IProfileRepository 
} from '@/lib/repositories/profile.repository';
import { 
  createGallerySchema, 
  updateGallerySchema,
  type CreateGalleryInput, 
  type UpdateGalleryInput 
} from '@/lib/validators/gallery.schema';
import { 
  ValidationError, 
  NotFoundError, 
  GalleryLimitError,
} from '@/lib/errors';
import { getPlanLimits, isValidExpirationDays } from '@/config/plans';
import { sanitizeTitle, sanitizePassword } from '@/lib/utils/sanitize';
import type { Gallery as DbGallery, Image as DbImage } from '@/lib/supabase/types';

// Local type for gallery access result using database types
export interface GalleryAccessResult {
  success: boolean;
  gallery?: DbGallery;
  images?: DbImage[];
  error?: string;
}

const BCRYPT_ROUNDS = 10;

export interface IGalleryService {
  create(userId: string, data: CreateGalleryInput): Promise<Gallery>;
  getById(id: string): Promise<Gallery | null>;
  getBySlug(slug: string): Promise<Gallery | null>;
  getByUserId(userId: string): Promise<Gallery[]>;
  update(id: string, userId: string, data: UpdateGalleryInput): Promise<Gallery>;
  delete(id: string, userId: string): Promise<void>;
  verifyPassword(slug: string, password: string): Promise<GalleryAccessResult>;
  incrementViewCount(id: string): Promise<void>;
}

export class GalleryService implements IGalleryService {
  private galleryRepository: IGalleryRepository;
  private profileRepository: IProfileRepository;

  constructor(
    private supabase: SupabaseClient<Database>,
    galleryRepo?: IGalleryRepository,
    profileRepo?: IProfileRepository
  ) {
    this.galleryRepository = galleryRepo || createGalleryRepository(supabase);
    this.profileRepository = profileRepo || createProfileRepository(supabase);
  }

  /**
   * Create a new gallery
   * - Validates input data
   * - Checks plan-based limits
   * - Generates unique slug
   * - Hashes password
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.5
   */
  async create(userId: string, data: CreateGalleryInput): Promise<Gallery> {
    // Validate input
    const validatedData = createGallerySchema.safeParse(data);
    if (!validatedData.success) {
      throw new ValidationError('Invalid gallery data', {
        errors: validatedData.error.issues,
      });
    }

    const { title, password, expirationDays } = validatedData.data;

    // Sanitize title and password
    const sanitizedTitle = sanitizeTitle(title);
    const sanitizedPassword = sanitizePassword(password);

    // Get user profile to check limits
    const profile = await this.profileRepository.findById(userId);
    if (!profile) {
      throw new NotFoundError('Profile');
    }

    const plan = profile.subscription_plan || 'free';
    const planLimits = getPlanLimits(plan);

    // Check gallery count limit (Requirement 4.5)
    const currentGalleryCount = await this.galleryRepository.countByUserId(userId);
    if (currentGalleryCount >= planLimits.max_galleries) {
      throw new GalleryLimitError(currentGalleryCount, planLimits.max_galleries);
    }

    // Validate expiration days against plan limits
    if (!isValidExpirationDays(expirationDays, plan)) {
      throw new ValidationError('Invalid expiration days for your plan', {
        maxDays: planLimits.max_expiration_days,
        requestedDays: expirationDays,
      });
    }

    // Generate unique slug (Requirement 4.2)
    const uniqueSlug = await this.galleryRepository.generateUniqueSlug();

    // Hash password (Requirement 4.3)
    const passwordHash = await bcrypt.hash(sanitizedPassword, BCRYPT_ROUNDS);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create gallery
    const galleryData: GalleryInsert = {
      user_id: userId,
      title: sanitizedTitle,
      unique_slug: uniqueSlug,
      password_hash: passwordHash,
      expiration_days: expirationDays,
      expires_at: expiresAt.toISOString(),
      is_active: true,
      views_count: 0,
    };

    return this.galleryRepository.create(galleryData);
  }

  /**
   * Get a gallery by ID
   */
  async getById(id: string): Promise<Gallery | null> {
    return this.galleryRepository.findById(id);
  }

  /**
   * Get a gallery by slug
   */
  async getBySlug(slug: string): Promise<Gallery | null> {
    return this.galleryRepository.findBySlug(slug);
  }

  /**
   * Get all galleries for a user
   */
  async getByUserId(userId: string): Promise<Gallery[]> {
    return this.galleryRepository.findByUserId(userId);
  }

  /**
   * Update an existing gallery
   * - Validates input data
   * - Validates ownership
   * - Hashes new password if provided
   * - Recalculates expiration if days changed
   */
  async update(id: string, userId: string, data: UpdateGalleryInput): Promise<Gallery> {
    // Validate input
    const validatedData = updateGallerySchema.safeParse(data);
    if (!validatedData.success) {
      throw new ValidationError('Invalid gallery data', {
        errors: validatedData.error.issues,
      });
    }

    // Get existing gallery
    const existingGallery = await this.galleryRepository.findById(id);
    if (!existingGallery) {
      throw new NotFoundError('Gallery');
    }

    // Verify ownership
    if (existingGallery.user_id !== userId) {
      throw new NotFoundError('Gallery'); // Don't reveal existence
    }

    const { title, password, expirationDays, settings } = validatedData.data;

    // Build update object
    const updateData: Partial<Gallery> = {};

    if (title !== undefined) {
      updateData.title = sanitizeTitle(title);
    }

    if (password !== undefined) {
      const sanitizedPassword = sanitizePassword(password);
      updateData.password_hash = await bcrypt.hash(sanitizedPassword, BCRYPT_ROUNDS);
    }

    if (expirationDays !== undefined) {
      // Get user profile to validate expiration days
      const profile = await this.profileRepository.findById(userId);
      if (!profile) {
        throw new NotFoundError('Profile');
      }

      const plan = profile.subscription_plan || 'free';
      if (!isValidExpirationDays(expirationDays, plan)) {
        const planLimits = getPlanLimits(plan);
        throw new ValidationError('Invalid expiration days for your plan', {
          maxDays: planLimits.max_expiration_days,
          requestedDays: expirationDays,
        });
      }

      updateData.expiration_days = expirationDays;
      
      // Recalculate expiration date from creation date
      const createdAt = new Date(existingGallery.created_at || new Date());
      const expiresAt = new Date(createdAt);
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      updateData.expires_at = expiresAt.toISOString();
    }
    
    if (settings !== undefined) {
      updateData.settings = settings as any;
    }

    return this.galleryRepository.update(id, updateData);
  }

  /**
   * Delete a gallery
   * - Validates ownership
   */
  async delete(id: string, userId: string): Promise<void> {
    // Get existing gallery
    const existingGallery = await this.galleryRepository.findById(id);
    if (!existingGallery) {
      throw new NotFoundError('Gallery');
    }

    // Verify ownership
    if (existingGallery.user_id !== userId) {
      throw new NotFoundError('Gallery'); // Don't reveal existence
    }

    await this.galleryRepository.delete(id);
  }

  /**
   * Verify gallery password and return gallery with images
   * - Checks if gallery exists and is active
   * - Verifies password using bcrypt
   * - Increments view count on success
   * 
   * Requirements: 4.6, 4.7
   */
  async verifyPassword(slug: string, password: string): Promise<GalleryAccessResult> {
    // Get gallery by slug
    const gallery = await this.galleryRepository.findBySlug(slug);
    if (!gallery) {
      return {
        success: false,
        error: 'Galerie non trouvée',
      };
    }

    // Check if gallery is active
    if (!gallery.is_active) {
      return {
        success: false,
        error: 'Cette galerie n\'est plus active',
      };
    }

    // Check if gallery has expired
    const now = new Date();
    const expiresAt = new Date(gallery.expires_at);
    if (now > expiresAt) {
      return {
        success: false,
        error: 'Cette galerie a expiré',
      };
    }

    // Verify password (Requirement 4.7 - server-side bcrypt verification)
    const isValidPassword = await bcrypt.compare(password, gallery.password_hash);
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Mot de passe incorrect',
      };
    }

    // Note: View count is incremented client-side after successful access
    // This allows tracking views for galleries with or without password

    // Get images for the gallery
    const { data: images } = await this.supabase
      .from('images')
      .select('*')
      .eq('gallery_id', gallery.id)
      .order('order_index', { ascending: true });

    return {
      success: true,
      gallery,
      images: images || [],
    };
  }

  /**
   * Increment the view count for a gallery
   * Requirement: 4.6
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.galleryRepository.incrementViewCount(id);
  }
}

/**
 * Factory function to create a GalleryService instance
 */
export function createGalleryService(
  supabase: SupabaseClient<Database>,
  galleryRepo?: IGalleryRepository,
  profileRepo?: IProfileRepository
): IGalleryService {
  return new GalleryService(supabase, galleryRepo, profileRepo);
}
