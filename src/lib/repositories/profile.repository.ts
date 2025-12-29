/**
 * Profile Repository
 * Data access layer for user profiles
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Profile, ProfileInsert, ProfileUpdate } from '@/lib/supabase/types'
import { NotFoundError } from '@/lib/errors'

export interface IProfileRepository {
  findById(id: string): Promise<Profile | null>
  findByEmail(email: string): Promise<Profile | null>
  create(data: ProfileInsert): Promise<Profile>
  update(id: string, data: ProfileUpdate): Promise<Profile>
  incrementStorage(userId: string, sizeMb: number): Promise<void>
  decrementStorage(userId: string, sizeMb: number): Promise<void>
}

export class ProfileRepository implements IProfileRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Find a profile by user ID
   */
  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
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
   * Find a profile by email address
   */
  async findByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
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
   * Create a new profile
   */
  async create(data: ProfileInsert): Promise<Profile> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw error
    }

    return profile
  }

  /**
   * Update an existing profile
   */
  async update(id: string, data: ProfileUpdate): Promise<Profile> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Profile')
      }
      throw error
    }

    return profile
  }

  /**
   * Increment user storage usage
   * Uses the database function for atomic operation
   */
  async incrementStorage(userId: string, sizeMb: number): Promise<void> {
    const { error } = await this.supabase.rpc('increment_storage', {
      user_id: userId,
      size_mb: sizeMb,
    })

    if (error) {
      throw error
    }
  }

  /**
   * Decrement user storage usage
   * Uses the database function for atomic operation
   */
  async decrementStorage(userId: string, sizeMb: number): Promise<void> {
    const { error } = await this.supabase.rpc('decrement_storage', {
      user_id: userId,
      size_mb: sizeMb,
    })

    if (error) {
      throw error
    }
  }
}

/**
 * Factory function to create a ProfileRepository instance
 */
export function createProfileRepository(supabase: SupabaseClient<Database>): IProfileRepository {
  return new ProfileRepository(supabase)
}
