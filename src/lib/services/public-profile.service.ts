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
import {
  ProfileViewsRepository,
  type IProfileViewsRepository,
} from '@/lib/repositories/profile-views.repository';
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
  deleteProfile(userId: string): Promise<void>;
  checkSlugAvailability(slug: string, currentUserId?: string): Promise<SlugAvailabilityResult>;
  generateSlugSuggestions(baseSlug: string): string[];
  sortGalleries(galleries: PublicGallery[], featuredIds?: string[]): PublicGallery[];
  filterPublicGalleries(userId: string, hiddenGalleries?: string[]): Promise<PublicGallery[]>;
  trackView(profileSlug: string, viewData: { ipAddress: string; userAgent: string; referrer?: string }): Promise<string>;
  trackCTAClick(viewId: string): Promise<void>;
  trackSocialClick(viewId: string, platform: string): Promise<void>;
  getAnalytics(userId: string, startDate: Date, endDate: Date): Promise<import('@/types/public-profile').ProfileAnalytics>;
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
  private viewsRepo: IProfileViewsRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.profileRepo = new PublicProfileRepository(supabase);
    this.userProfileRepo = new ProfileRepository(supabase);
    this.galleryRepo = new GalleryRepository(supabase);
    this.viewsRepo = new ProfileViewsRepository(supabase);
  }

  /**
   * Retrieves a public profile by slug with its galleries
   * 
   * Validates:
   * - Profile exists and is enabled
   * - User has Pro plan
   * - Galleries are public (active, not expired, not hidden)
   * 
   * Optimized to minimize database queries (Requirement 12.5):
   * - Uses single query with joins where possible
   * - Fetches only necessary fields
   * - Leverages database indexes
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
    // Find the profile by slug (uses idx_public_profiles_slug index)
    const profileRow = await this.profileRepo.findBySlug(slug);

    // Return null if profile doesn't exist or is disabled
    if (!profileRow || !profileRow.is_enabled) {
      return null;
    }

    // Verify user has Pro plan (Requirement 1.1)
    // This query uses idx_profiles_pkey index
    const user = await this.userProfileRepo.findById(profileRow.user_id);
    if (!user || user.subscription_plan !== 'pro') {
      return null;
    }

    // Convert database row to PublicProfile
    const profile = this.mapRowToProfile(profileRow);

    // Fetch and filter public galleries
    // This is optimized to fetch galleries with images in a single query
    const galleries = await this.filterPublicGalleriesOptimized(
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
   * Deletes a user's public profile and all associated analytics data
   * 
   * This operation:
   * - Deletes the public profile record
   * - Cascades to delete all profile_views records (via database CASCADE constraint)
   * - Respects GDPR right to be forgotten (Requirement 13.5)
   * 
   * @param userId - The ID of the user whose profile to delete
   * @throws Error if profile not found
   * 
   * Requirements:
   * - 13.5: Delete profile and all analytics data, respect GDPR right to be forgotten
   * 
   * @example
   * await service.deleteProfile(userId);
   * // Profile and all analytics data are permanently deleted
   */
  async deleteProfile(userId: string): Promise<void> {
    // Find the user's profile
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Delete the profile (CASCADE will automatically delete all profile_views)
    // This respects GDPR right to be forgotten (Requirement 13.5)
    await this.profileRepo.delete(profile.id);
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
   * Optimized version of filterPublicGalleries that fetches only necessary data
   * 
   * Performance optimizations (Requirement 12.5):
   * - Fetches only required fields (id, unique_slug, title, created_at, is_active, expires_at, password_hash)
   * - Uses database-level filtering where possible
   * - Limits image data to just the first image for cover
   * - Leverages indexes on user_id, is_active, and expires_at
   * 
   * @param userId - The user ID to fetch galleries for
   * @param hiddenGalleries - Optional array of gallery IDs to exclude
   * @returns Array of public galleries with isNew property
   */
  private async filterPublicGalleriesOptimized(
    userId: string,
    hiddenGalleries?: string[]
  ): Promise<PublicGallery[]> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch galleries with optimized query
    // Uses idx_galleries_user_id and idx_galleries_active indexes
    const galleries = await this.galleryRepo.findPublicGalleriesOptimized(
      userId,
      hiddenGalleries || []
    ) as GalleryWithImages[];

    // Map to PublicGallery format
    return galleries.map((gallery) => this.mapGalleryToPublic(gallery, sevenDaysAgo));
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

  /**
   * Tracks a view of a public profile
   * 
   * Records the visit with hashed IP address for GDPR compliance (Requirement 13.4).
   * Increments the profile's views_count (Requirement 9.3).
   * 
   * @param profileSlug - The slug of the profile being viewed
   * @param viewData - View tracking data (IP address, user agent, referrer)
   * @returns The ID of the created view record
   * 
   * Requirements:
   * - 9.1: Record visit in profile_views table
   * - 9.2: Record hashed IP, user agent, referrer, timestamp
   * - 9.3: Increment views_count
   * - 13.4: Hash IP addresses with SHA-256 for GDPR compliance
   * 
   * @example
   * const viewId = await service.trackView('john-doe', {
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...',
   *   referrer: 'https://google.com'
   * });
   */
  async trackView(
    profileSlug: string,
    viewData: {
      ipAddress: string;
      userAgent: string;
      referrer?: string;
    }
  ): Promise<string> {
    // Find the profile by slug
    const profile = await this.profileRepo.findBySlug(profileSlug);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Hash the IP address for GDPR compliance (Requirement 13.4)
    const ipHash = await this.hashIpAddress(viewData.ipAddress);

    // Create the view record (Requirements 9.1, 9.2)
    const view = await this.viewsRepo.create({
      profile_id: profile.id,
      visitor_ip_hash: ipHash,
      user_agent: viewData.userAgent,
      referrer: viewData.referrer || null,
      viewed_at: new Date().toISOString(),
    });

    // Increment the profile's views count (Requirement 9.3)
    await this.profileRepo.incrementViewsCount(profile.id);

    return view.id;
  }

  /**
   * Tracks a click on the CTA button
   * 
   * Marks the cta_clicked field as true for the given view record.
   * 
   * @param viewId - The ID of the view record
   * 
   * Requirements:
   * - 9.5: Mark cta_clicked as true when visitor clicks CTA
   * 
   * @example
   * await service.trackCTAClick(viewId);
   */
  async trackCTAClick(viewId: string): Promise<void> {
    // Update the view record to mark CTA as clicked (Requirement 9.5)
    await this.viewsRepo.updateCTAClick(viewId, true);
  }

  /**
   * Tracks a click on a social media link
   * 
   * Adds the platform name to the social_links_clicked array for the given view record.
   * 
   * @param viewId - The ID of the view record
   * @param platform - The name of the social platform (e.g., 'instagram', 'facebook')
   * 
   * Requirements:
   * - 9.6: Record social network name in social_links_clicked when visitor clicks
   * 
   * @example
   * await service.trackSocialClick(viewId, 'instagram');
   */
  async trackSocialClick(viewId: string, platform: string): Promise<void> {
    // Add the social platform to the clicked array (Requirement 9.6)
    await this.viewsRepo.addSocialClick(viewId, platform);
  }

  /**
   * Retrieves analytics for a user's public profile
   * 
   * Returns comprehensive analytics including:
   * - Total views
   * - Views by period (daily breakdown)
   * - Top galleries viewed
   * - CTA click rate
   * - Average session duration
   * - Top referrers
   * 
   * @param userId - The ID of the user
   * @param startDate - Start of the analytics period
   * @param endDate - End of the analytics period
   * @returns Profile analytics data
   * @throws Error if profile not found
   * 
   * Requirements:
   * - 9.7: Allow photographer to view profile statistics in dashboard
   * - 9.8: Display metrics (total views, views by period, top galleries, CTA click rate)
   * 
   * @example
   * const analytics = await service.getAnalytics(
   *   userId,
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * );
   * console.log(`Total views: ${analytics.totalViews}`);
   */
  async getAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<import('@/types/public-profile').ProfileAnalytics> {
    // Find the user's profile
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get analytics from the repository (Requirements 9.7, 9.8)
    return await this.viewsRepo.getAnalytics(profile.id, startDate, endDate);
  }

  /**
   * Hashes an IP address using SHA-256
   * 
   * This ensures GDPR compliance by not storing raw IP addresses.
   * The hash is deterministic (same IP always produces same hash)
   * but irreversible (cannot recover original IP from hash).
   * 
   * @param ip - The IP address to hash
   * @returns The SHA-256 hash as a hex string (64 characters)
   * 
   * Requirements:
   * - 13.4: Hash IP addresses before storage for GDPR compliance
   * 
   * @example
   * const hash = await hashIpAddress('192.168.1.1');
   * // Returns: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646'
   */
  private async hashIpAddress(ip: string): Promise<string> {
    // Use Web Crypto API for SHA-256 hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
