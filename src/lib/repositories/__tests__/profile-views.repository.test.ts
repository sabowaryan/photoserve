/**
 * Unit Tests for Profile Views Repository
 * 
 * Tests the tracking and analytics operations for profile views
 * Validates: Requirements 9.1, 9.2, 9.4, 9.5, 9.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProfileViewsRepository } from '../profile-views.repository'
import { NotFoundError } from '@/lib/errors'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type ProfileViewRow = Database['public']['Tables']['profile_views']['Row']
type ProfileViewInsert = Database['public']['Tables']['profile_views']['Insert']

/**
 * Helper to create a sample profile view
 */
function createSampleView(overrides?: Partial<ProfileViewRow>): ProfileViewRow {
  return {
    id: 'view-123',
    profile_id: 'profile-123',
    visitor_ip_hash: 'abc123hash',
    user_agent: 'Mozilla/5.0',
    referrer: 'https://google.com',
    country: 'FR',
    city: 'Paris',
    galleries_viewed: ['gallery-1', 'gallery-2'],
    cta_clicked: false,
    social_links_clicked: [],
    viewed_at: '2024-01-15T10:00:00Z',
    session_duration: 120,
    ...overrides,
  }
}

describe('ProfileViewsRepository', () => {
  let mockSupabase: any
  let repository: ProfileViewsRepository

  beforeEach(() => {
    mockSupabase = {} as SupabaseClient<Database>
    repository = new ProfileViewsRepository(mockSupabase)
  })

  describe('create', () => {
    it('should create a new profile view successfully', async () => {
      const newView: ProfileViewInsert = {
        profile_id: 'profile-123',
        visitor_ip_hash: 'abc123hash',
        user_agent: 'Mozilla/5.0',
        referrer: 'https://google.com',
      }
      const createdView = createSampleView()

      mockSupabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdView,
              error: null,
            }),
          }),
        }),
      })

      const result = await repository.create(newView)

      expect(result).toEqual(createdView)
      expect(mockSupabase.from).toHaveBeenCalledWith('profile_views')
    })

    it('should throw error on database failure', async () => {
      const newView: ProfileViewInsert = {
        profile_id: 'profile-123',
        visitor_ip_hash: 'abc123hash',
      }

      mockSupabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            }),
          }),
        }),
      })

      await expect(repository.create(newView)).rejects.toThrow()
    })
  })

  describe('updateCTAClick', () => {
    it('should update CTA clicked status successfully', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      })

      await expect(repository.updateCTAClick('view-123', true)).resolves.not.toThrow()
      expect(mockSupabase.from).toHaveBeenCalledWith('profile_views')
    })

    it('should throw NotFoundError when view does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      })

      await expect(repository.updateCTAClick('non-existent', true)).rejects.toThrow(NotFoundError)
    })
  })

  describe('addSocialClick', () => {
    it('should add a social link click successfully', async () => {
      const existingView = createSampleView({ social_links_clicked: ['instagram'] })

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: existingView,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        })

      await repository.addSocialClick('view-123', 'facebook')
      expect(mockSupabase.from).toHaveBeenCalledTimes(2)
    })

    it('should handle empty social_links_clicked array', async () => {
      const existingView = createSampleView({ social_links_clicked: [] })

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: existingView,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        })

      await repository.addSocialClick('view-123', 'twitter')
      expect(mockSupabase.from).toHaveBeenCalledTimes(2)
    })

    it('should throw NotFoundError when view does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      })

      await expect(repository.addSocialClick('non-existent', 'instagram')).rejects.toThrow(
        NotFoundError
      )
    })
  })

  describe('findByProfileAndDateRange', () => {
    it('should return views within date range', async () => {
      const views = [
        createSampleView({ id: 'view-1', viewed_at: '2024-01-15T10:00:00Z' }),
        createSampleView({ id: 'view-2', viewed_at: '2024-01-16T10:00:00Z' }),
      ]

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: views,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      const startDate = new Date('2024-01-15T00:00:00Z')
      const endDate = new Date('2024-01-16T23:59:59Z')
      const result = await repository.findByProfileAndDateRange('profile-123', startDate, endDate)

      expect(result).toEqual(views)
      expect(mockSupabase.from).toHaveBeenCalledWith('profile_views')
    })

    it('should return empty array when no views found', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      const result = await repository.findByProfileAndDateRange(
        'profile-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      )

      expect(result).toEqual([])
    })

    it('should throw error on database failure', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'DB_ERROR', message: 'Database error' },
                }),
              }),
            }),
          }),
        }),
      })

      await expect(
        repository.findByProfileAndDateRange(
          'profile-123',
          new Date('2024-01-01'),
          new Date('2024-01-31')
        )
      ).rejects.toThrow()
    })
  })
})
