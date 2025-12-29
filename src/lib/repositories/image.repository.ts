/**
 * Image Repository
 * Data access layer for images
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Image, ImageInsert } from '@/lib/supabase/types'
import { NotFoundError } from '@/lib/errors'

export interface IImageRepository {
  create(data: ImageInsert): Promise<Image>
  findById(id: string): Promise<Image | null>
  findByGalleryId(galleryId: string): Promise<Image[]>
  delete(id: string): Promise<void>
  updateOrder(id: string, orderIndex: number): Promise<Image>
  countByGalleryId(galleryId: string): Promise<number>
}

export class ImageRepository implements IImageRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new image record
   */
  async create(data: ImageInsert): Promise<Image> {
    const { data: image, error } = await this.supabase
      .from('images')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw error
    }

    return image
  }

  /**
   * Find an image by ID
   */
  async findById(id: string): Promise<Image | null> {
    const { data, error } = await this.supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  }

  /**
   * Find all images for a gallery, ordered by order_index
   */
  async findByGalleryId(galleryId: string): Promise<Image[]> {
    const { data, error } = await this.supabase
      .from('images')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('order_index', { ascending: true })

    if (error) {
      throw error
    }

    return data || []
  }

  /**
   * Delete an image by ID
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('images')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  }

  /**
   * Update the order index of an image
   */
  async updateOrder(id: string, orderIndex: number): Promise<Image> {
    const { data: image, error } = await this.supabase
      .from('images')
      .update({ order_index: orderIndex })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Image')
      }
      throw error
    }

    return image
  }

  /**
   * Count images in a gallery
   */
  async countByGalleryId(galleryId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', galleryId)

    if (error) {
      throw error
    }

    return count || 0
  }
}

/**
 * Factory function to create an ImageRepository instance
 */
export function createImageRepository(supabase: SupabaseClient<Database>): IImageRepository {
  return new ImageRepository(supabase)
}
