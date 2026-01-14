/**
 * Favorites Service
 * Business logic for favorites/proofing operations
 * 
 * @module lib/services/favorites.service
 * Requirements: 3.1.1, 3.1.2, 3.1.3, 3.1.4
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { NotFoundError, ValidationError } from '@/lib/errors';

export interface FavoriteExport {
  galleryId: string;
  galleryTitle: string;
  favorites: Array<{
    imageId: string;
    imageUrl: string;
    createdAt: string;
  }>;
  totalCount: number;
  exportedAt: string;
}

export interface IFavoritesService {
  toggleFavorite(galleryId: string, imageId: string, sessionId: string): Promise<boolean>;
  getFavorites(galleryId: string, sessionId: string): Promise<string[]>;
  exportFavorites(galleryId: string): Promise<FavoriteExport>;
}

export class FavoritesService implements IFavoritesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Toggle favorite status for an image
   * Returns true if favorite was added, false if removed
   * 
   * Requirement 3.1.2: WHEN clicking the heart, THE System SHALL toggle favorite status
   */
  async toggleFavorite(
    galleryId: string,
    imageId: string,
    sessionId: string
  ): Promise<boolean> {
    // Validate inputs
    if (!galleryId || !imageId || !sessionId) {
      throw new ValidationError('Gallery ID, Image ID, and Session ID are required');
    }

    // Verify gallery exists
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('id')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Verify image exists and belongs to gallery
    const { data: image, error: imageError } = await this.supabase
      .from('images')
      .select('id')
      .eq('id', imageId)
      .eq('gallery_id', galleryId)
      .single();

    if (imageError || !image) {
      throw new NotFoundError('Image');
    }

    // Check if favorite already exists
    const { data: existingFavorite } = await this.supabase
      .from('favorites')
      .select('id')
      .eq('gallery_id', galleryId)
      .eq('image_id', imageId)
      .eq('session_id', sessionId)
      .single();

    if (existingFavorite) {
      // Remove favorite
      const { error: deleteError } = await this.supabase
        .from('favorites')
        .delete()
        .eq('id', existingFavorite.id);

      if (deleteError) {
        throw deleteError;
      }

      return false; // Favorite removed
    } else {
      // Add favorite
      const { error: insertError } = await this.supabase
        .from('favorites')
        .insert({
          gallery_id: galleryId,
          image_id: imageId,
          session_id: sessionId,
        });

      if (insertError) {
        throw insertError;
      }

      return true; // Favorite added
    }
  }

  /**
   * Get all favorite image IDs for a session in a gallery
   * 
   * Requirement 3.1.3: THE Favorites_Count SHALL be displayed in gallery header
   */
  async getFavorites(galleryId: string, sessionId: string): Promise<string[]> {
    // Validate inputs
    if (!galleryId || !sessionId) {
      throw new ValidationError('Gallery ID and Session ID are required');
    }

    const { data, error } = await this.supabase
      .from('favorites')
      .select('image_id')
      .eq('gallery_id', galleryId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map((fav) => fav.image_id);
  }

  /**
   * Export all favorites for a gallery (for photographer)
   * Returns detailed information about favorited images
   * 
   * Requirement 3.1.4: THE Photographer SHALL receive email with favorites list
   */
  async exportFavorites(galleryId: string): Promise<FavoriteExport> {
    // Validate input
    if (!galleryId) {
      throw new ValidationError('Gallery ID is required');
    }

    // Get gallery info
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('id, title')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Get all favorites for this gallery
    const { data: favorites, error: favoritesError } = await this.supabase
      .from('favorites')
      .select('image_id, created_at')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: true });

    if (favoritesError) {
      throw favoritesError;
    }

    // Get image URLs for the favorites
    const imageIds = (favorites || []).map((f) => f.image_id);
    const { data: images } = await this.supabase
      .from('images')
      .select('id, cloudinary_url')
      .in('id', imageIds.length > 0 ? imageIds : ['']);

    const imageMap = new Map((images || []).map((img) => [img.id, img.cloudinary_url]));

    // Transform data for export
    const favoritesData = (favorites || []).map((fav) => ({
      imageId: fav.image_id,
      imageUrl: imageMap.get(fav.image_id) || '',
      createdAt: fav.created_at || new Date().toISOString(),
    }));

    return {
      galleryId: gallery.id,
      galleryTitle: gallery.title,
      favorites: favoritesData,
      totalCount: favoritesData.length,
      exportedAt: new Date().toISOString(),
    };
  }
}

/**
 * Factory function to create a FavoritesService instance
 */
export function createFavoritesService(
  supabase: SupabaseClient<Database>
): IFavoritesService {
  return new FavoritesService(supabase);
}
