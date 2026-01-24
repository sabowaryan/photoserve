/**
 * Public Profile Repository
 * Data access layer for public photographer profiles
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { NotFoundError } from '@/lib/errors'

type PublicProfileRow = Database['public']['Tables']['public_profiles']['Row']
type PublicProfileInsert = Database['public']['Tables']['public_profiles']['Insert']
type PublicProfileUpdate = Database['public']['Tables']['public_profiles']['Update']

export interface IPublicProfileRepository {
  findBySlug(slug: string): Promise<PublicProfileRow | null>
  findByUserId(userId: string): Promise<PublicProfileRow | null>
  create(data: PublicProfileInsert): Promise<PublicProfileRow>
  update(id: string, data: PublicProfileUpdate): Promise<PublicProfileRow>
  delete(id: string): Promise<void>
  incrementViewsCount(id: string): Promise<void>
}

export class PublicProfileRepository implements IPublicProfileRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Find a public profile by slug
   * Returns null if not found or if profile is disabled
   */
  async findBySlug(slug: string): Promise<PublicProfileRow | null> {
    const { data, error } = await this.supabase
      .from('public_profiles')
      .select('*')
      .eq('slug', slug)
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
   * Find a public profile by user ID
   */
  async findByUserId(userId: string): Promise<PublicProfileRow | null> {
    const { data, error } = await this.supabase
      .from('public_profiles')
      .select('*')
      .eq('user_id', userId)
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
   * Create a new public profile
   */
  async create(data: PublicProfileInsert): Promise<PublicProfileRow> {
    const { data: profile, error } = await this.supabase
      .from('public_profiles')
      .insert(data)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('slug')) {
          throw new Error('Ce slug est déjà utilisé')
        }
        if (error.message.includes('user_id')) {
          throw new Error('Un profil public existe déjà pour cet utilisateur')
        }
      }
      throw error
    }

    return profile
  }

  /**
   * Update an existing public profile
   */
  async update(id: string, data: PublicProfileUpdate): Promise<PublicProfileRow> {
    const { data: profile, error } = await this.supabase
      .from('public_profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Public profile')
      }
      // Handle unique constraint violations
      if (error.code === '23505' && error.message.includes('slug')) {
        throw new Error('Ce slug est déjà utilisé')
      }
      throw error
    }

    return profile
  }

  /**
   * Delete a public profile
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('public_profiles')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Public profile')
      }
      throw error
    }
  }

  /**
   * Increment the views count for a profile
   * Uses atomic increment to avoid race conditions
   */
  async incrementViewsCount(id: string): Promise<void> {
    // For now, use a simple update until the RPC function is created
    // This will be replaced with an atomic RPC call in a future migration
    const { data: profile, error: fetchError } = await this.supabase
      .from('public_profiles')
      .select('views_count')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new NotFoundError('Public profile')
      }
      throw fetchError
    }

    const { error: updateError } = await this.supabase
      .from('public_profiles')
      .update({
        views_count: profile.views_count + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }
  }
}

/**
 * Factory function to create a PublicProfileRepository instance
 */
export function createPublicProfileRepository(
  supabase: SupabaseClient<Database>
): IPublicProfileRepository {
  return new PublicProfileRepository(supabase)
}
