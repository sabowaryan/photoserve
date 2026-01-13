/**
 * Gallery Migration Service
 * Handles migration of guest galleries to user accounts
 * 
 * @module lib/services/gallery-migration.service
 * Requirements: 8.4, 8.5, 8.8
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Gallery } from '@/lib/supabase/types';
import { 
  createGalleryRepository,
  type IGalleryRepository 
} from '@/lib/repositories/gallery.repository';
import { ValidationError } from '@/lib/errors';
import { isValidUUID } from '@/lib/guest/session';

/**
 * Result of a gallery migration operation
 */
export interface MigrationResult {
  migratedCount: number;
  galleries: Gallery[];
}

/**
 * Gallery Migration Service Interface
 */
export interface IGalleryMigrationService {
  migrateGuestGalleries(guestToken: string, userId: string): Promise<MigrationResult>;
  getGuestGalleries(guestToken: string): Promise<Gallery[]>;
}

/**
 * Gallery Migration Service
 * 
 * Migrates guest galleries to a user account when they sign up.
 * Preserves is_unlocked status and payment_type during migration.
 * 
 * Requirements:
 * - 8.4: Automatically migrate all Guest_Galleries to the new profile
 * - 8.5: Update gallery's user_id and clear guest_session_id
 * - 8.8: Preserve unlocked status after migration
 */
export class GalleryMigrationService implements IGalleryMigrationService {
  private galleryRepository: IGalleryRepository;

  constructor(
    private supabase: SupabaseClient<Database>,
    galleryRepo?: IGalleryRepository
  ) {
    this.galleryRepository = galleryRepo || createGalleryRepository(supabase);
  }

  /**
   * Get all galleries associated with a guest session token
   * 
   * @param guestToken - The guest session token
   * @returns Array of galleries belonging to the guest session
   */
  async getGuestGalleries(guestToken: string): Promise<Gallery[]> {
    if (!guestToken || !isValidUUID(guestToken)) {
      throw new ValidationError('Invalid guest session token');
    }

    const { data, error } = await this.supabase
      .from('galleries')
      .select('*')
      .eq('guest_session_id', guestToken)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Migrate all guest galleries to a user account
   * 
   * This method:
   * 1. Finds all galleries with the given guest_session_id
   * 2. Updates each gallery to set user_id and clear guest_session_id
   * 3. Sets converted_at timestamp for tracking
   * 4. Preserves is_unlocked and payment_type status
   * 
   * Requirements: 8.4, 8.5, 8.8
   * 
   * @param guestToken - The guest session token
   * @param userId - The user ID to migrate galleries to
   * @returns Migration result with count and migrated galleries
   */
  async migrateGuestGalleries(guestToken: string, userId: string): Promise<MigrationResult> {
    // Validate inputs
    if (!guestToken || !isValidUUID(guestToken)) {
      throw new ValidationError('Invalid guest session token');
    }

    if (!userId || !isValidUUID(userId)) {
      throw new ValidationError('Invalid user ID');
    }

    // Get all guest galleries for this session
    const guestGalleries = await this.getGuestGalleries(guestToken);

    if (guestGalleries.length === 0) {
      return {
        migratedCount: 0,
        galleries: [],
      };
    }

    const migratedGalleries: Gallery[] = [];
    const now = new Date().toISOString();

    // Migrate each gallery
    for (const gallery of guestGalleries) {
      try {
        // Update gallery to associate with user
        // Requirement 8.5: Update user_id and clear guest_session_id
        // Requirement 8.8: Preserve is_unlocked status (we don't modify it)
        const updatedGallery = await this.galleryRepository.update(gallery.id, {
          user_id: userId,
          guest_session_id: null,
          converted_at: now,
          // is_unlocked and payment_type are preserved (not modified)
        });

        migratedGalleries.push(updatedGallery);
      } catch (error) {
        // Log error but continue with other galleries
        console.error(`[GalleryMigrationService] Failed to migrate gallery ${gallery.id}:`, error);
      }
    }

    return {
      migratedCount: migratedGalleries.length,
      galleries: migratedGalleries,
    };
  }
}

/**
 * Factory function to create a GalleryMigrationService instance
 */
export function createGalleryMigrationService(
  supabase: SupabaseClient<Database>,
  galleryRepo?: IGalleryRepository
): IGalleryMigrationService {
  return new GalleryMigrationService(supabase, galleryRepo);
}
