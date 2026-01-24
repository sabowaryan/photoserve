/**
 * Profile Views Repository
 * Data access layer for profile view tracking and analytics
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { ProfileAnalytics } from '@/types/public-profile'
import { NotFoundError } from '@/lib/errors'

type ProfileViewRow = Database['public']['Tables']['profile_views']['Row']
type ProfileViewInsert = Database['public']['Tables']['profile_views']['Insert']

export interface IProfileViewsRepository {
  create(data: ProfileViewInsert): Promise<ProfileViewRow>
  updateCTAClick(viewId: string, clicked: boolean): Promise<void>
  addSocialClick(viewId: string, platform: string): Promise<void>
  findByProfileAndDateRange(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProfileViewRow[]>
  getAnalytics(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProfileAnalytics>
}

export class ProfileViewsRepository implements IProfileViewsRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new profile view record
   */
  async create(data: ProfileViewInsert): Promise<ProfileViewRow> {
    const { data: view, error } = await this.supabase
      .from('profile_views')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw error
    }

    return view
  }

  /**
   * Update the CTA clicked status for a view
   */
  async updateCTAClick(viewId: string, clicked: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('profile_views')
      .update({ cta_clicked: clicked })
      .eq('id', viewId)

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Profile view')
      }
      throw error
    }
  }

  /**
   * Add a social link click to a view record
   */
  async addSocialClick(viewId: string, platform: string): Promise<void> {
    // First, get the current social_links_clicked array
    const { data: view, error: fetchError } = await this.supabase
      .from('profile_views')
      .select('social_links_clicked')
      .eq('id', viewId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new NotFoundError('Profile view')
      }
      throw fetchError
    }

    // Add the new platform to the array
    const currentClicks = view.social_links_clicked || []
    const updatedClicks = [...currentClicks, platform]

    // Update the record
    const { error: updateError } = await this.supabase
      .from('profile_views')
      .update({ social_links_clicked: updatedClicks })
      .eq('id', viewId)

    if (updateError) {
      throw updateError
    }
  }

  /**
   * Find all views for a profile within a date range
   */
  async findByProfileAndDateRange(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProfileViewRow[]> {
    const { data, error } = await this.supabase
      .from('profile_views')
      .select('*')
      .eq('profile_id', profileId)
      .gte('viewed_at', startDate.toISOString())
      .lte('viewed_at', endDate.toISOString())
      .order('viewed_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  }

  /**
   * Get analytics for a profile within a date range
   */
  async getAnalytics(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProfileAnalytics> {
    // Fetch all views for the period
    const views = await this.findByProfileAndDateRange(profileId, startDate, endDate)

    // Calculate total views
    const totalViews = views.length

    // Calculate CTA click rate
    const ctaClicks = views.filter((v) => v.cta_clicked).length
    const ctaClickRate = totalViews > 0 ? (ctaClicks / totalViews) * 100 : 0

    // Calculate average session duration
    const totalDuration = views.reduce((sum, v) => sum + (v.session_duration || 0), 0)
    const averageSessionDuration = totalViews > 0 ? Math.round(totalDuration / totalViews) : 0

    // Group views by date
    const viewsByPeriod = this.groupViewsByDate(views)

    // Calculate top galleries
    const topGalleries = await this.calculateTopGalleries(views)

    // Calculate top referrers
    const topReferrers = this.calculateTopReferrers(views)

    return {
      totalViews,
      viewsByPeriod,
      topGalleries,
      ctaClickRate,
      averageSessionDuration,
      topReferrers,
    }
  }

  /**
   * Group views by date
   */
  private groupViewsByDate(views: ProfileViewRow[]): { date: string; views: number }[] {
    const grouped = new Map<string, number>()

    views.forEach((view) => {
      const date = view.viewed_at.split('T')[0] ?? view.viewed_at // Extract date part (YYYY-MM-DD)
      grouped.set(date, (grouped.get(date) || 0) + 1)
    })

    return Array.from(grouped.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Calculate top galleries from views
   */
  private async calculateTopGalleries(
    views: ProfileViewRow[]
  ): Promise<{ galleryId: string; galleryTitle: string; views: number }[]> {
    const galleryViews = new Map<string, number>()

    // Count views per gallery
    views.forEach((view) => {
      const galleriesViewed = view.galleries_viewed || []
      galleriesViewed.forEach((galleryId) => {
        galleryViews.set(galleryId, (galleryViews.get(galleryId) || 0) + 1)
      })
    })

    // Get gallery titles
    const galleryIds = Array.from(galleryViews.keys())
    if (galleryIds.length === 0) {
      return []
    }

    const { data: galleries, error } = await this.supabase
      .from('galleries')
      .select('id, title')
      .in('id', galleryIds)

    if (error) {
      throw error
    }

    // Map gallery IDs to titles and sort by view count
    return Array.from(galleryViews.entries())
      .map(([galleryId, views]) => {
        const gallery = galleries?.find((g) => g.id === galleryId)
        return {
          galleryId,
          galleryTitle: gallery?.title ?? 'Unknown',
          views,
        }
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
  }

  /**
   * Calculate top referrers from views
   */
  private calculateTopReferrers(
    views: ProfileViewRow[]
  ): { referrer: string; count: number }[] {
    const referrers = new Map<string, number>()

    views.forEach((view) => {
      if (view.referrer) {
        const domain = this.extractDomain(view.referrer)
        referrers.set(domain, (referrers.get(domain) || 0) + 1)
      }
    })

    return Array.from(referrers.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url)
      return parsed.hostname
    } catch {
      return 'Direct'
    }
  }
}

/**
 * Factory function to create a ProfileViewsRepository instance
 */
export function createProfileViewsRepository(
  supabase: SupabaseClient<Database>
): IProfileViewsRepository {
  return new ProfileViewsRepository(supabase)
}
