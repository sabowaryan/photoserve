/**
 * Public Profile Service
 * Business logic for managing public photographer profiles
 * 
 * Implements requirements:
 * - 1.1: Restriction to Pro plan users
 * - 1.3: Unique slug enforcement
 * - 1.5: Slug availability checking with suggestions
 * - 3.8: Featured galleries sorting
 * - 3.9: Gallery sorting by date
 * - 14.2: Real-time slug availability checking
 * - 14.3: Slug suggestions when taken
 * - 14.4: Alternative slug generation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type {
  PublicProfile,
  PublicProfileWithGalleries,
  PublicProfileInput,
  PublicGallery,
} from '@/types/public-profile';
import type { Gallery } from '@/types';

/**
 * Gallery with images included (from join query)
 */
interface GalleryWithImages extends Gallery {
  images?: Array<{
    id: string;
    cloudinary_url: string;
    order_index: number | null;
  }>;
}
import {
  PublicProfileRepository,
  type IPublicProfileRepository,
} from '@/lib/repositories/public-profile.repository';
import {
  ProfileRepository,
  type IProfileRepository,
} from '@/lib/repositories/profile.repository';
import {
  GalleryRepository,
  type IGalleryRepository,
} from '@/lib/repositories/gallery.repository';
import { SlugUtils } from '@/lib/utils/slug.utils';
import { PublicProfileSchema } from '@/types/public-profile';

/**
 * Result of slug availability check
 */
export interface SlugAvailabilityResult {
  available: boolean;
  suggestions?: string[];
}

/**
 * Service interface for public profile operations
 */
export interface IPublicProfileService {
  getProfileBySlug(slug: string): Promise<PublicProfileWithGalleries | null>;
  getProfileBySlugForPreview(slug: string, userId: string): Promise<PublicProfileWithGalleries | null>;
  upsertProfile(userId: string, data: PublicProfileInput): Promise<PublicProfile>;
  checkSlugAvailability(slug: string, currentUserId?: string): Promise<SlugAvailabilityResult>;
  generateSlugSuggestions(baseSlug: string): string[];
  sortGalleries(galleries: PublicGallery[], featuredIds?: string[]): PublicGallery[];
  filterPublicGalleries(userId: string, hiddenGalleries?: string[]): Promise<PublicGallery[]>;
}

/**
 * Public Profile Service
 * 
 * Handles business logic for public photographer profiles including:
 * - Profile retrieval with Pro plan verification
 * - Profile creation/update with slug uniqueness
 * - Slug availability checking
 * - Gallery filtering and sorting
 */
export class PublicProfileService implements IPublicProfileService {
  private profileRepo: IPublicProfileRepository;
  private userProfileRepo: IProfileRepository;
  private galleryRepo: IGalleryRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.profileRepo = new PublicProfileRepository(supabase);
    this.userProfileRepo = new ProfileRepository(supabase);
    this.galleryRepo = new GalleryRepository(supabase);
  }

  /**
   * Retrieves a public profile by slug with its galleries
   * 
   * Validates:
   * - Profile exists and is enabled
   * - User has Pro plan
   * - Galleries are public (active, not expired, not hidden)
   * 
   * @param slug - The unique slug of the profile
   * @returns The profile with galleries, or null if not found/invalid
   * 
   * @example
   * const profile = await service.getProfileBySlug('john-doe');
   * if (profile) {
   *   console.log(profile.displayName, profile.galleries.length);
   * }
   */
  async getProfileBySlug(slug: string): Promise<PublicProfileWithGalleries | null> {
    // Find the profile by slug
    const profileRow = await this.profileRepo.findBySlug(slug);

    // Return null if profile doesn't exist or is disabled
    if (!profileRow || !profileRow.is_enabled) {
      return null;
    }

    // Verify user has Pro plan (Requirement 1.1)
    const user = await this.userProfileRepo.findById(profileRow.user_id);
    if (!user || user.subscription_plan !== 'pro') {
      return null;
    }

    // Convert database row to PublicProfile
    const profile = this.mapRowToProfile(profileRow);

    // Fetch and filter public galleries
    const galleries = await this.filterPublicGalleries(
      profileRow.user_id,
      profile.hiddenGalleries
    );

    // Sort galleries: featured first, then by date (Requirements 3.8, 3.9)
    const sortedGalleries = this.sortGalleries(galleries, profile.featuredGalleries);

    return {
      ...profile,
      galleries: sortedGalleries,
    };
  }

  /**
   * Retrieves a public profile by slug for preview (ignores enabled status)
   * 
   * Used for preview mode where the profile owner wants to see their profile
   * before publishing. Does not check if profile is enabled.
   * 
   * Validates:
   * - Profile exists
   * - Profile belongs to the requesting user
   * - User has Pro plan
   * - Galleries are public (active, not expired, not hidden)
   * 
   * @param slug - The unique slug of the profile
   * @param userId - The ID of the user requesting the preview
   * @returns The profile with galleries, or null if not found/invalid
   * 
   * @example
   * const profile = await service.getProfileBySlugForPreview('john-doe', userId);
   * if (profile) {
   *   console.log('Preview:', profile.displayName);
   * }
   */
  async getProfileBySlugForPreview(
    slug: string,
    userId: string
  ): Promise<PublicProfileWithGalleries | null> {
    // Find the profile by slug
    const profileRow = await this.profileRepo.findBySlug(slug);

    // Return null if profile doesn't exist
    if (!profileRow) {
      return null;
    }

    // Verify the profile belongs to the requesting user
    if (profileRow.user_id !== userId) {
      return null;
    }

    // Verify user has Pro plan (Requirement 1.1)
    const user = await this.userProfileRepo.findById(profileRow.user_id);
    if (!user || user.subscription_plan !== 'pro') {
      return null;
    }

    // Convert database row to PublicProfile
    const profile = this.mapRowToProfile(profileRow);

    // Fetch and filter public galleries
    const galleries = await this.filterPublicGalleries(
      profileRow.user_id,
      profile.hiddenGalleries
    );

    // Sort galleries: featured first, then by date (Requirements 3.8, 3.9)
    const sortedGalleries = this.sortGalleries(galleries, profile.featuredGalleries);

    return {
      ...profile,
      galleries: sortedGalleries,
    };
  }

  /**
   * Creates or updates a public profile
   * 
   * Validates:
   * - User has Pro plan
   * - Slug is unique (or belongs to current user)
   * - Data passes schema validation
   * 
   * @param userId - The ID of the user
   * @param data - The profile data to create/update
   * @returns The created or updated profile
   * @throws Error if user is not Pro or slug is taken
   * 
   * @example
   * const profile = await service.upsertProfile(userId, {
   *   slug: 'john-doe',
   *   displayName: 'John Doe',
   *   isEnabled: true,
   * });
   */
  async upsertProfile(
    userId: string,
    data: PublicProfileInput
  ): Promise<PublicProfile> {
    // Validate data with Zod schema
    const validated = PublicProfileSchema.parse(data);

    // Verify user has Pro plan (Requirement 1.1)
    const user = await this.userProfileRepo.findById(userId);
    if (!user || user.subscription_plan !== 'pro') {
      throw new Error('Cette fonctionnalité est réservée aux utilisateurs Pro');
    }

    // Check slug uniqueness (Requirement 1.3)
    const existingProfile = await this.profileRepo.findBySlug(validated.slug);
    if (existingProfile && existingProfile.user_id !== userId) {
      throw new Error('Ce slug est déjà utilisé');
    }

    // Check if user already has a profile
    const userProfile = await this.profileRepo.findByUserId(userId);

    let profileRow;
    if (userProfile) {
      // Update existing profile
      profileRow = await this.profileRepo.update(userProfile.id, {
        ...this.mapInputToRow(validated),
        user_id: userId,
      });
    } else {
      // Create new profile
      profileRow = await this.profileRepo.create({
        ...this.mapInputToRow(validated),
        user_id: userId,
      });
    }

    return this.mapRowToProfile(profileRow);
  }

  /**
   * Checks if a slug is available
   * 
   * Returns availability status and suggestions if taken.
   * A slug is available if:
   * - It doesn't exist in the database
   * - It belongs to the current user
   * - It's not in the reserved list
   * 
   * @param slug - The slug to check
   * @param currentUserId - Optional current user ID (slug is available if it's theirs)
   * @returns Availability result with suggestions if unavailable
   * 
   * @example
   * const result = await service.checkSlugAvailability('john-doe');
   * if (!result.available) {
   *   console.log('Try:', result.suggestions);
   * }
   */
  async checkSlugAvailability(
    slug: string,
    currentUserId?: string
  ): Promise<SlugAvailabilityResult> {
    // Check if slug is reserved (Requirement 14.5)
    if (SlugUtils.isReserved(slug)) {
      return {
        available: false,
        suggestions: this.generateSlugSuggestions(slug),
      };
    }

    // Check if slug exists in database
    const existing = await this.profileRepo.findBySlug(slug);

    // Available if doesn't exist or belongs to current user
    if (!existing || existing.user_id === currentUserId) {
      return { available: true };
    }

    // Slug is taken, provide suggestions (Requirements 14.3, 14.4)
    return {
      available: false,
      suggestions: this.generateSlugSuggestions(slug),
    };
  }

  /**
   * Generates alternative slug suggestions
   * 
   * Creates 4 suggestions:
   * - 3 with numeric suffixes (1, 2, 3)
   * - 1 with current year
   * 
   * @param baseSlug - The base slug to generate suggestions from
   * @returns Array of 4 suggested slugs
   * 
   * @example
   * const suggestions = service.generateSlugSuggestions('john-doe');
   * // ['john-doe-1', 'john-doe-2', 'john-doe-3', 'john-doe-2024']
   */
  generateSlugSuggestions(baseSlug: string): string[] {
    return SlugUtils.generateUnique(baseSlug);
  }

  /**
   * Sorts galleries with featured first, then by date descending
   * 
   * Sorting rules (Requirements 3.8, 3.9):
   * 1. Featured galleries appear first
   * 2. Within each group (featured/non-featured), sort by creation date descending
   * 
   * @param galleries - The galleries to sort
   * @param featuredIds - Optional array of featured gallery IDs
   * @returns Sorted array of galleries (new array, original not modified)
   * 
   * @example
   * const sorted = service.sortGalleries(galleries, ['id1', 'id2']);
   * // Featured galleries first, then others, all by date desc
   */
  sortGalleries(
    galleries: PublicGallery[],
    featuredIds?: string[]
  ): PublicGallery[] {
    // Create a copy to avoid modifying the original array
    return [...galleries].sort((a, b) => {
      const aFeatured = featuredIds?.includes(a.id) ?? false;
      const bFeatured = featuredIds?.includes(b.id) ?? false;

      // Featured galleries come first
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;

      // Within same group, sort by date descending (newest first)
      // Handle invalid dates by treating them as oldest
      const aTime = isNaN(a.createdAt.getTime()) ? 0 : a.createdAt.getTime();
      const bTime = isNaN(b.createdAt.getTime()) ? 0 : b.createdAt.getTime();
      
      return bTime - aTime;
    });
  }

  /**
   * Filters and returns public galleries for a user
   * 
   * Public galleries must meet all of the following criteria (Requirements 3.1, 3.2, 3.3, 3.4):
   * - Active (is_active = true)
   * - Not expired (expires_at > now or null)
   * - Not hidden (not in hiddenGalleries array)
   * 
   * Additionally adds the isNew property (Requirement 3.5):
   * - isNew = true if created < 7 days ago
   * 
   * @param userId - The user ID to fetch galleries for
   * @param hiddenGalleries - Optional array of gallery IDs to exclude
   * @returns Array of public galleries with isNew property
   * 
   * @example
   * const galleries = await service.filterPublicGalleries(userId, ['hidden-id-1']);
   * galleries.forEach(g => {
   *   console.log(g.title, g.isNew ? '(NEW)' : '');
   * });
   */
  async filterPublicGalleries(
    userId: string,
    hiddenGalleries?: string[]
  ): Promise<PublicGallery[]> {
    // Fetch all galleries for the user
    const galleries = await this.galleryRepo.findByUserId(userId) as GalleryWithImages[];

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter and map to PublicGallery
    return galleries
      .filter((gallery) => {
        // Must be active (Requirement 3.2)
        if (!gallery.is_active) return false;

        // Must not be expired (Requirement 3.3)
        if (gallery.expires_at) {
          const expiresAt = new Date(gallery.expires_at);
          if (expiresAt <= now) return false;
        }

        // Must not be hidden (Requirement 3.4)
        if (hiddenGalleries?.includes(gallery.id)) return false;

        return true;
      })
      .map((gallery) => this.mapGalleryToPublic(gallery, sevenDaysAgo));
  }

  /**
   * Maps a Gallery to PublicGallery
   */
  private mapGalleryToPublic(gallery: GalleryWithImages, sevenDaysAgo: Date): PublicGallery {
    const createdAt = new Date(gallery.created_at || Date.now());
    const isNew = createdAt > sevenDaysAgo; // Requirement 3.5

    // Get cover image from first image if available
    const coverImageUrl =
      gallery.images && gallery.images.length > 0 && gallery.images[0]
        ? gallery.images[0].cloudinary_url
        : '';

    return {
      id: gallery.id,
      slug: gallery.unique_slug,
      title: gallery.title,
      coverImageUrl,
      imageCount: gallery.images?.length || 0,
      createdAt,
      isNew,
      isPasswordProtected: !!gallery.password_hash,
    };
  }

  /**
   * Maps database row to PublicProfile
   */
  private mapRowToProfile(
    row: Database['public']['Tables']['public_profiles']['Row']
  ): PublicProfile {
    return {
      id: row.id,
      userId: row.user_id,
      isEnabled: row.is_enabled,
      slug: row.slug,
      displayName: row.display_name,
      tagline: row.tagline || undefined,
      bio: row.bio || undefined,
      location: row.location || undefined,
      avatarUrl: row.avatar_url || undefined,
      coverImageUrl: row.cover_image_url || undefined,
      specialties: row.specialties || undefined,
      yearsOfExperience: row.years_of_experience || undefined,
      awards: row.awards || undefined,
      publicEmail: row.public_email || undefined,
      phone: row.phone || undefined,
      website: row.website || undefined,
      address: row.address || undefined,
      socialLinks: (row.social_links as any) || undefined,
      ctaButton: (row.cta_button as any) || undefined,
      testimonials: (row.testimonials as any) || undefined,
      featuredGalleries: row.featured_galleries || undefined,
      hiddenGalleries: row.hidden_galleries || undefined,
      metaTitle: row.meta_title || undefined,
      metaDescription: row.meta_description || undefined,
      metaKeywords: row.meta_keywords || undefined,
      viewsCount: row.views_count,
      lastViewedAt: row.last_viewed_at ? new Date(row.last_viewed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Maps PublicProfileInput to database row format
   */
  private mapInputToRow(
    input: PublicProfileInput
  ): Omit<Database['public']['Tables']['public_profiles']['Insert'], 'user_id'> {
    return {
      is_enabled: input.isEnabled,
      slug: input.slug,
      display_name: input.displayName,
      tagline: input.tagline || null,
      bio: input.bio || null,
      location: input.location || null,
      avatar_url: input.avatarUrl || null,
      cover_image_url: input.coverImageUrl || null,
      specialties: input.specialties || null,
      years_of_experience: input.yearsOfExperience || null,
      awards: input.awards || null,
      public_email: input.publicEmail || null,
      phone: input.phone || null,
      website: input.website || null,
      address: input.address || null,
      social_links: (input.socialLinks as any) || null,
      cta_button: (input.ctaButton as any) || null,
      testimonials: (input.testimonials as any) || null,
      featured_galleries: input.featuredGalleries || null,
      hidden_galleries: input.hiddenGalleries || null,
      meta_title: input.metaTitle || null,
      meta_description: input.metaDescription || null,
      meta_keywords: input.metaKeywords || null,
    };
  }
}

/**
 * Factory function to create a PublicProfileService instance
 * 
 * @param supabase - Supabase client instance
 * @returns PublicProfileService instance
 * 
 * @example
 * const service = createPublicProfileService(supabase);
 * const profile = await service.getProfileBySlug('john-doe');
 */
export function createPublicProfileService(
  supabase: SupabaseClient<Database>
): IPublicProfileService {
  return new PublicProfileService(supabase);
}
