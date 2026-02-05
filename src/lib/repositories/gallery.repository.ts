/**
 * Gallery Repository
 * Data access layer for galleries
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { Gallery } from '@/types'
import { NotFoundError } from '@/lib/errors'

// Types for inserting and updating galleries
type GalleryInsert = Database['public']['Tables']['galleries']['Insert'];
type GalleryUpdate = Database['public']['Tables']['galleries']['Update'];

export interface IGalleryRepository {
  create(data: GalleryInsert): Promise<Gallery>
  findById(id: string): Promise<Gallery | null>
  findBySlug(slug: string): Promise<Gallery | null>
  findByUserId(userId: string): Promise<Gallery[]>
  findPublicGalleriesOptimized(userId: string, hiddenIds: string[]): Promise<Gallery[]>
  update(id: string, data: GalleryUpdate): Promise<Gallery>
  delete(id: string): Promise<void>
  countByUserId(userId: string): Promise<number>
  incrementViewCount(id: string): Promise<void>
  generateUniqueSlug(): Promise<string>
}

export class GalleryRepository implements IGalleryRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new gallery
   */
  async create(data: GalleryInsert): Promise<Gallery> {
    const { data: gallery, error } = await this.supabase
      .from('galleries')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw error
    }

    return gallery as Gallery
  }

  /**
   * Find a gallery by ID
   */
  async findById(id: string): Promise<Gallery | null> {
    const { data, error } = await this.supabase
      .from('galleries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data as Gallery
  }

  /**
   * Find a gallery by unique slug
   */
  async findBySlug(slug: string): Promise<Gallery | null> {
    const { data, error } = await this.supabase
      .from('galleries')
      .select('*')
      .eq('unique_slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data as Gallery
  }

  /**
   * Find all galleries for a user with their images
   */
  async findByUserId(userId: string): Promise<Gallery[]> {
    const { data, error } = await this.supabase
      .from('galleries')
      .select(`
        *,
        images (
          id,
          cloudinary_url,
          order_index
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data || []) as Gallery[]
  }

  /**
   * Find public galleries for a user with optimized query
   * 
   * Performance optimizations:
   * - Filters at database level (is_active, expires_at)
   * - Fetches only first image for cover (limit 1)
   * - Excludes hidden galleries
   * - Uses indexes on user_id and is_active
   * 
   * @param userId - The user ID to fetch galleries for
   * @param hiddenIds - Array of gallery IDs to exclude
   * @returns Array of public galleries with minimal data
   */
  async findPublicGalleriesOptimized(userId: string, hiddenIds: string[]): Promise<Gallery[]> {
    const now = new Date().toISOString();
    
    // Build query with database-level filtering
    let query = this.supabase
      .from('galleries')
      .select(`
        id,
        unique_slug,
        title,
        created_at,
        is_active,
        expires_at,
        password_hash,
        images!inner (
          cloudinary_url
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filter out expired galleries
    query = query.or(`expires_at.is.null,expires_at.gt.${now}`);

    // Exclude hidden galleries if any
    if (hiddenIds.length > 0) {
      query = query.not('id', 'in', `(${hiddenIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []) as unknown as Gallery[];
  }

  /**
   * Update an existing gallery
   */
  async update(id: string, data: GalleryUpdate): Promise<Gallery> {
    const { data: gallery, error } = await this.supabase
      .from('galleries')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Gallery')
      }
      throw error
    }

    return gallery as Gallery
  }

  /**
   * Delete a gallery by ID
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('galleries')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  }

  /**
   * Count galleries for a user
   */
  async countByUserId(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('galleries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return count || 0
  }

  /**
   * Increment the view count for a gallery
   */
  async incrementViewCount(id: string): Promise<void> {
    const gallery = await this.findById(id)
    if (!gallery) {
      throw new NotFoundError('Gallery')
    }

    const { error } = await this.supabase
      .from('galleries')
      .update({ views_count: (gallery.views_count || 0) + 1 })
      .eq('id', id)

    if (error) {
      throw error
    }
  }

  /**
   * Generate a unique slug using the database function
   */
  async generateUniqueSlug(): Promise<string> {
    const { data, error } = await this.supabase.rpc('generate_unique_slug')

    if (error) {
      throw error
    }

    return data
  }
}

/**
 * Factory function to create a GalleryRepository instance
 */
export function createGalleryRepository(supabase: SupabaseClient<Database>): IGalleryRepository {
  return new GalleryRepository(supabase)
}
