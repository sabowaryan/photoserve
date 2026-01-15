/**
 * Analytics Service
 * Business logic for gallery analytics and tracking
 * 
 * @module lib/services/analytics.service
 * Requirements: 3.3.1, 3.3.2, 3.3.3, 3.3.4
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, GalleryAnalyticsInsert } from '@/lib/supabase/types';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { createEventsService } from './events.service';

export interface ViewMetadata {
  ip?: string;
  userAgent?: string;
  countryCode?: string;
  visitorId?: string; // Fingerprint ID from Phase 2
}

export interface GalleryStats {
  totalViews: number;
  uniqueVisitors: number;
  viewsByCountry: Record<string, number>;
  viewsByDate: { date: string; count: number }[];
  ctaClicks: number;
  favoritesCount: number;
  commentsCount: number;
  // Phase 3: Event tracking stats
  eventStats?: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    mostViewedImages: Array<{ imageId: string; views: number }>;
    downloadStats: {
      total: number;
      single: number;
      all: number;
      selection: number;
      favorites: number;
    };
    favoriteStats: {
      added: number;
      removed: number;
      net: number;
    };
    ctaClicks: number;
    slideshowStats: {
      starts: number;
      avgDuration: number;
    };
    sessionStats: {
      avgDuration: number;
      avgEventsPerSession: number;
    };
  };
}

export interface IAnalyticsService {
  trackView(galleryId: string, metadata: ViewMetadata): Promise<void>;
  getGalleryStats(galleryId: string): Promise<GalleryStats>;
  trackCTAClick(galleryId: string): Promise<void>;
}

export class AnalyticsService implements IAnalyticsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Track a gallery view with visitor metadata
   * 
   * Requirement 3.3.1: THE System SHALL track gallery view count
   * Requirement 3.3.2: THE System SHALL track first view timestamp
   * Requirement 3.3.3: THE System SHALL track visitor country (via IP geolocation)
   * Phase 2: Track unique visitors via fingerprinting
   */
  async trackView(galleryId: string, metadata: ViewMetadata): Promise<void> {
    // Validate inputs
    if (!galleryId) {
      throw new ValidationError('Gallery ID is required');
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

    // Insert analytics record
    const analyticsData: GalleryAnalyticsInsert = {
      gallery_id: galleryId,
      visitor_ip: metadata.ip || null,
      country_code: metadata.countryCode || null,
      user_agent: metadata.userAgent || null,
      visitor_id: metadata.visitorId || null, // NEW: Fingerprint ID
    };

    const { error: insertError } = await this.supabase
      .from('gallery_analytics')
      .insert(analyticsData);

    if (insertError) {
      throw insertError;
    }

    // Update gallery views count
    const { error: updateError } = await this.supabase
      .from('galleries')
      .update({ 
        views_count: await this.getViewCount(galleryId)
      })
      .eq('id', galleryId);

    if (updateError) {
      // Log error but don't throw - analytics tracking shouldn't break gallery viewing
      console.error('Failed to update gallery views count:', updateError);
    }
  }

  /**
   * Get comprehensive analytics for a gallery
   * 
   * Requirement 3.3.4: THE Dashboard SHALL display analytics per gallery
   */
  async getGalleryStats(galleryId: string): Promise<GalleryStats> {
    // Validate input
    if (!galleryId) {
      throw new ValidationError('Gallery ID is required');
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

    // Get all analytics data for the gallery
    const { data: analytics, error: analyticsError } = await this.supabase
      .from('gallery_analytics')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('viewed_at', { ascending: false });

    if (analyticsError) {
      throw analyticsError;
    }

    const analyticsData = analytics || [];

    // Calculate total views
    const totalViews = analyticsData.length;

    // Calculate unique visitors
    // Priority: visitor_id (fingerprint) > visitor_ip (fallback)
    const uniqueIdentifiers = new Set(
      analyticsData.map(a => a.visitor_id || a.visitor_ip).filter(Boolean)
    );
    const uniqueVisitors = uniqueIdentifiers.size;

    // Calculate views by country
    const viewsByCountry: Record<string, number> = {};
    analyticsData.forEach(a => {
      if (a.country_code) {
        viewsByCountry[a.country_code] = (viewsByCountry[a.country_code] || 0) + 1;
      }
    });

    // Calculate views by date (last 30 days)
    const viewsByDate: { date: string; count: number }[] = [];
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const dateGroups: Record<string, number> = {};
    analyticsData
      .filter(a => a.viewed_at && new Date(a.viewed_at) >= last30Days)
      .forEach(a => {
        if (a.viewed_at) {
          const date = new Date(a.viewed_at).toISOString().split('T')[0] as string;
          dateGroups[date] = (dateGroups[date] || 0) + 1;
        }
      });

    // Fill in missing dates with 0 views
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] as string;
      viewsByDate.push({
        date: dateStr,
        count: dateGroups[dateStr] || 0
      });
    }

    // Get favorites count
    const { count: favoritesCount } = await this.supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', galleryId);

    // Get comments count for all images in this gallery
    const { data: images } = await this.supabase
      .from('images')
      .select('id')
      .eq('gallery_id', galleryId);

    const imageIds = (images || []).map(img => img.id);
    let commentsCount = 0;
    
    if (imageIds.length > 0) {
      const { count } = await this.supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('image_id', imageIds);
      commentsCount = count || 0;
    }

    // Phase 3: Get event statistics
    let eventStats = undefined;
    try {
      const eventsService = createEventsService(this.supabase);
      eventStats = await eventsService.getEventStats(galleryId);
    } catch (error) {
      // Log error but don't fail - events table might not exist yet
      console.error('Failed to get event stats:', error);
    }

    return {
      totalViews,
      uniqueVisitors,
      viewsByCountry,
      viewsByDate,
      ctaClicks: eventStats?.ctaClicks || 0,
      favoritesCount: favoritesCount || 0,
      commentsCount,
      eventStats,
    };
  }

  /**
   * Track CTA button click
   * 
   * Requirement 3.4.4: THE System SHALL track CTA click count
   */
  async trackCTAClick(galleryId: string): Promise<void> {
    // Validate input
    if (!galleryId) {
      throw new ValidationError('Gallery ID is required');
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

    // For now, we'll track CTA clicks as special analytics entries
    // In the future, this could be a separate table
    const analyticsData: GalleryAnalyticsInsert = {
      gallery_id: galleryId,
      visitor_ip: null,
      country_code: null,
      user_agent: 'CTA_CLICK', // Special marker for CTA clicks
    };

    const { error: insertError } = await this.supabase
      .from('gallery_analytics')
      .insert(analyticsData);

    if (insertError) {
      throw insertError;
    }
  }

  /**
   * Helper method to get current view count for a gallery
   */
  private async getViewCount(galleryId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('gallery_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', galleryId);

    if (error) {
      console.error('Failed to get view count:', error);
      return 0;
    }

    return count || 0;
  }
}

/**
 * Factory function to create an AnalyticsService instance
 */
export function createAnalyticsService(
  supabase: SupabaseClient<Database>
): IAnalyticsService {
  return new AnalyticsService(supabase);
}