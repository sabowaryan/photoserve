/**
 * Unit Tests for Public Profile Repository
 * 
 * Tests the CRUD operations and error handling for public profiles
 * Validates: Requirements 1.2, 1.3
 */

import { describe, it, expect, vi } from 'vitest'
import { PublicProfileRepository } from '../public-profile.repository'
import { NotFoundError } from '@/lib/errors'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type PublicProfileRow = Database['public']['Tables']['public_profiles']['Row']
type PublicProfileInsert = Database['public']['Tables']['public_profiles']['Insert']

/**
 * Creates a mock Supabase client for testing
 */
function createMockSupabaseClient() {
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()

  const client = {
    from: mockFrom,
  } as unknown as SupabaseClient<Database>

  return {
    client,
    mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
    },
  }
}

/**
 * Helper to create a sample public profile
 */
function createSampleProfile(overrides?: Partial<PublicProfileRow>): PublicProfileRow {
  return {
    id: 'profile-123',
    user_id: 'user-123',
    slug: 'john-doe',
    display_name: 'John Doe',
    is_enabled: true,
    tagline: 'Professional Photographer',
    bio: 'Capturing moments that matter',
    location: 'Paris, France',
    avatar_url: 'https://example.com/avatar.jpg',
    cover_image_url: 'https://example.com/cover.jpg',
    specialties: ['Wedding', 'Portrait'],
    years_of_experience: 10,
    awards: ['Best Photographer 2023'],
    public_email: 'john@example.com',
    phone: '+33123456789',
    website: 'https://johndoe.com',
    address: '123 Main St, Paris',
    social_links: {
      instagram: 'https://instagram.com/johndoe',
      facebook: 'https://facebook.com/johndoe',
    },
    cta_button: {
      text: 'Book Now',
      url: 'https://johndoe.com/book',
      style: 'primary',
    },
    testimonials: [],
    featured_galleries: [],
    hidden_galleries: [],
    meta_title: 'John Doe - Professional Photographer',
    meta_description: 'Capturing moments that matter',
    meta_keywords: ['photographer', 'wedding', 'portrait'],
    views_count: 0,
    last_viewed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('PublicProfileRepository', () => {
  describe('findBySlug', () => {
    it('should return a profile when found', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const sampleProfile = createSampleProfile()

      mocks.from.mockReturnValue({
        select: mocks.select.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: sampleProfile,
              error: null,
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.findBySlug('john-doe')

      expect(result).toEqual(sampleProfile)
      expect(mocks.from).toHaveBeenCalledWith('public_profiles')
      expect(mocks.select).toHaveBeenCalledWith('*')
      expect(mocks.eq).toHaveBeenCalledWith('slug', 'john-doe')
    })

    it('should return null when profile not found', async () => {
      const { client, mocks } = createMockSupabaseClient()

      mocks.from.mockReturnValue({
        select: mocks.select.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.findBySlug('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for database errors', async () => {
      const { client, mocks } = createMockSupabaseClient()

      mocks.from.mockReturnValue({
        select: mocks.select.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      await expect(repository.findBySlug('john-doe')).rejects.toThrow()
    })
  })

  describe('findByUserId', () => {
    it('should return a profile when found', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const sampleProfile = createSampleProfile()

      mocks.from.mockReturnValue({
        select: mocks.select.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: sampleProfile,
              error: null,
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.findByUserId('user-123')

      expect(result).toEqual(sampleProfile)
      expect(mocks.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should return null when profile not found', async () => {
      const { client, mocks } = createMockSupabaseClient()

      mocks.from.mockReturnValue({
        select: mocks.select.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.findByUserId('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new profile successfully', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const newProfile: PublicProfileInsert = {
        user_id: 'user-123',
        slug: 'john-doe',
        display_name: 'John Doe',
      }
      const createdProfile = createSampleProfile()

      mocks.from.mockReturnValue({
        insert: mocks.insert.mockReturnValue({
          select: mocks.select.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: createdProfile,
              error: null,
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.create(newProfile)

      expect(result).toEqual(createdProfile)
      expect(mocks.from).toHaveBeenCalledWith('public_profiles')
      expect(mocks.insert).toHaveBeenCalledWith(newProfile)
    })

    it('should throw error when slug is already taken', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const newProfile: PublicProfileInsert = {
        user_id: 'user-123',
        slug: 'john-doe',
        display_name: 'John Doe',
      }

      mocks.from.mockReturnValue({
        insert: mocks.insert.mockReturnValue({
          select: mocks.select.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint "unique_slug"',
              },
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      await expect(repository.create(newProfile)).rejects.toThrow('Ce slug est déjà utilisé')
    })

    it('should throw error when user already has a profile', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const newProfile: PublicProfileInsert = {
        user_id: 'user-123',
        slug: 'john-doe',
        display_name: 'John Doe',
      }

      mocks.from.mockReturnValue({
        insert: mocks.insert.mockReturnValue({
          select: mocks.select.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint "unique_user_id"',
              },
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      await expect(repository.create(newProfile)).rejects.toThrow(
        'Un profil public existe déjà pour cet utilisateur'
      )
    })
  })

  describe('update', () => {
    it('should update a profile successfully', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const updatedProfile = createSampleProfile({ tagline: 'Updated Tagline' })

      mocks.from.mockReturnValue({
        update: mocks.update.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            select: mocks.select.mockReturnValue({
              single: mocks.single.mockResolvedValue({
                data: updatedProfile,
                error: null,
              }),
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.update('profile-123', { tagline: 'Updated Tagline' })

      expect(result).toEqual(updatedProfile)
      expect(mocks.update).toHaveBeenCalled()
      expect(mocks.eq).toHaveBeenCalledWith('id', 'profile-123')
    })

    it('should throw NotFoundError when profile does not exist', async () => {
      const { client, mocks } = createMockSupabaseClient()

      mocks.from.mockReturnValue({
        update: mocks.update.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            select: mocks.select.mockReturnValue({
              single: mocks.single.mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      await expect(repository.update('non-existent', { tagline: 'New' })).rejects.toThrow(
        NotFoundError
      )
    })

    it('should throw error when updating to an existing slug', async () => {
      const { client, mocks } = createMockSupabaseClient()

      mocks.from.mockReturnValue({
        update: mocks.update.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            select: mocks.select.mockReturnValue({
              single: mocks.single.mockResolvedValue({
                data: null,
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint "unique_slug"',
                },
              }),
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      await expect(repository.update('profile-123', { slug: 'taken-slug' })).rejects.toThrow(
        'Ce slug est déjà utilisé'
      )
    })
  })

  describe('delete', () => {
    it('should delete a profile successfully', async () => {
      const { client, mocks } = createMockSupabaseClient()

      mocks.from.mockReturnValue({
        delete: mocks.delete.mockReturnValue({
          eq: mocks.eq.mockResolvedValue({
            error: null,
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      await expect(repository.delete('profile-123')).resolves.not.toThrow()

      expect(mocks.from).toHaveBeenCalledWith('public_profiles')
      expect(mocks.delete).toHaveBeenCalled()
      expect(mocks.eq).toHaveBeenCalledWith('id', 'profile-123')
    })

    it('should throw NotFoundError when profile does not exist', async () => {
      const { client, mocks } = createMockSupabaseClient()

      mocks.from.mockReturnValue({
        delete: mocks.delete.mockReturnValue({
          eq: mocks.eq.mockResolvedValue({
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      await expect(repository.delete('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('incrementViewsCount', () => {
    it('should increment views count successfully', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const profile = createSampleProfile({ views_count: 5 })

      // Create a proper mock chain for both select and update
      const selectChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: profile,
              error: null,
            }),
          }),
        }),
      }

      const updateChain = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }

      // Mock from to return different chains on consecutive calls
      mocks.from
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(updateChain)

      const repository = new PublicProfileRepository(client)
      await expect(repository.incrementViewsCount('profile-123')).resolves.not.toThrow()

      expect(mocks.from).toHaveBeenCalledWith('public_profiles')
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          views_count: 6,
        })
      )
    })

    it('should update last_viewed_at when incrementing views', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const profile = createSampleProfile({ views_count: 10 })

      const selectChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: profile,
              error: null,
            }),
          }),
        }),
      }

      const updateChain = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }

      mocks.from
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(updateChain)

      const repository = new PublicProfileRepository(client)
      await repository.incrementViewsCount('profile-123')

      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          views_count: 11,
          last_viewed_at: expect.any(String),
        })
      )
    })

    it('should throw NotFoundError when profile does not exist', async () => {
      const { client, mocks } = createMockSupabaseClient()

      mocks.from.mockReturnValue({
        select: mocks.select.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      await expect(repository.incrementViewsCount('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('Edge Cases and Data Validation', () => {
    it('should handle profiles with minimal required fields', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const minimalProfile: PublicProfileInsert = {
        user_id: 'user-456',
        slug: 'minimal-profile',
        display_name: 'Minimal User',
      }
      const createdProfile = createSampleProfile({
        id: 'profile-456',
        user_id: 'user-456',
        slug: 'minimal-profile',
        display_name: 'Minimal User',
        tagline: null,
        bio: null,
        location: null,
        avatar_url: null,
        cover_image_url: null,
        specialties: null,
        years_of_experience: null,
        awards: null,
        public_email: null,
        phone: null,
        website: null,
        address: null,
        social_links: null,
        cta_button: null,
        meta_title: null,
        meta_description: null,
        meta_keywords: null,
      })

      mocks.from.mockReturnValue({
        insert: mocks.insert.mockReturnValue({
          select: mocks.select.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: createdProfile,
              error: null,
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.create(minimalProfile)

      expect(result).toEqual(createdProfile)
      expect(result.slug).toBe('minimal-profile')
      expect(result.display_name).toBe('Minimal User')
    })

    it('should handle profiles with all optional fields populated', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const fullProfile = createSampleProfile()

      mocks.from.mockReturnValue({
        insert: mocks.insert.mockReturnValue({
          select: mocks.select.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: fullProfile,
              error: null,
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.create({
        user_id: fullProfile.user_id,
        slug: fullProfile.slug,
        display_name: fullProfile.display_name,
        tagline: fullProfile.tagline,
        bio: fullProfile.bio,
        location: fullProfile.location,
        avatar_url: fullProfile.avatar_url,
        cover_image_url: fullProfile.cover_image_url,
        specialties: fullProfile.specialties,
        years_of_experience: fullProfile.years_of_experience,
        awards: fullProfile.awards,
        public_email: fullProfile.public_email,
        phone: fullProfile.phone,
        website: fullProfile.website,
        address: fullProfile.address,
        social_links: fullProfile.social_links,
        cta_button: fullProfile.cta_button,
        meta_title: fullProfile.meta_title,
        meta_description: fullProfile.meta_description,
        meta_keywords: fullProfile.meta_keywords,
      })

      expect(result).toEqual(fullProfile)
      expect(result.specialties).toHaveLength(2)
      expect(result.awards).toHaveLength(1)
      expect(result.social_links).toHaveProperty('instagram')
      expect(result.cta_button).toHaveProperty('text', 'Book Now')
    })

    it('should handle update with partial data', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const updatedProfile = createSampleProfile({
        tagline: 'New Tagline',
        bio: 'Updated bio',
      })

      mocks.from.mockReturnValue({
        update: mocks.update.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            select: mocks.select.mockReturnValue({
              single: mocks.single.mockResolvedValue({
                data: updatedProfile,
                error: null,
              }),
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.update('profile-123', {
        tagline: 'New Tagline',
        bio: 'Updated bio',
      })

      expect(result.tagline).toBe('New Tagline')
      expect(result.bio).toBe('Updated bio')
    })

    it('should handle profiles with empty arrays for specialties and awards', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const profileWithEmptyArrays = createSampleProfile({
        specialties: [],
        awards: [],
        featured_galleries: [],
        hidden_galleries: [],
      })

      mocks.from.mockReturnValue({
        select: mocks.select.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: profileWithEmptyArrays,
              error: null,
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.findBySlug('john-doe')

      expect(result?.specialties).toEqual([])
      expect(result?.awards).toEqual([])
      expect(result?.featured_galleries).toEqual([])
      expect(result?.hidden_galleries).toEqual([])
    })

    it('should handle database constraint errors gracefully', async () => {
      const { client, mocks } = createMockSupabaseClient()

      mocks.from.mockReturnValue({
        insert: mocks.insert.mockReturnValue({
          select: mocks.select.mockReturnValue({
            single: mocks.single.mockResolvedValue({
              data: null,
              error: {
                code: '23514',
                message: 'check constraint violation',
              },
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      await expect(
        repository.create({
          user_id: 'user-123',
          slug: 'test',
          display_name: 'Test',
        })
      ).rejects.toThrow()
    })

    it('should preserve updated_at timestamp on update', async () => {
      const { client, mocks } = createMockSupabaseClient()
      const beforeUpdate = new Date('2024-01-01T00:00:00Z')
      const updatedProfile = createSampleProfile({
        updated_at: new Date().toISOString(),
      })

      mocks.from.mockReturnValue({
        update: mocks.update.mockReturnValue({
          eq: mocks.eq.mockReturnValue({
            select: mocks.select.mockReturnValue({
              single: mocks.single.mockResolvedValue({
                data: updatedProfile,
                error: null,
              }),
            }),
          }),
        }),
      })

      const repository = new PublicProfileRepository(client)
      const result = await repository.update('profile-123', { tagline: 'Updated' })

      // Verify that updated_at was set to a recent timestamp
      const updatedAt = new Date(result.updated_at)
      expect(updatedAt.getTime()).toBeGreaterThan(beforeUpdate.getTime())
    })
  })
})
