/**
 * Events Service
 * Business logic for tracking user interactions and events
 * 
 * @module lib/services/events.service
 * Requirements: Analytics Phase 3 - Event tracking
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { ValidationError } from '@/lib/errors';

export type EventType =
  | 'lightbox_open'
  | 'download_single'
  | 'download_all'
  | 'download_selection'
  | 'download_favorites'
  | 'favorite_add'
  | 'favorite_remove'
  | 'comment_add'
  | 'cta_click'
  | 'slideshow_start'
  | 'slideshow_end'
  | 'session_start'
  | 'session_end';

export interface EventData {
  imageId?: string;
  imageIndex?: number;
  imageIds?: string[];
  count?: number;
  quality?: string;
  format?: string;
  duration?: number;
  imagesViewed?: number;
  interval?: number;
  ctaType?: string;
  ctaUrl?: string;
  referrer?: string;
  userAgent?: string;
  eventsCount?: number;
  [key: string]: unknown;
}

export interface TrackEventInput {
  galleryId: string;
  visitorId?: string;
  visitorIp?: string;
  eventType: EventType;
  eventData?: EventData;
}

export interface EventStats {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
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
}

export interface IEventsService {
  trackEvent(input: TrackEventInput): Promise<void>;
  getEventStats(galleryId: string, dateFrom?: Date, dateTo?: Date): Promise<EventStats>;
  getMostViewedImages(galleryId: string, limit?: number): Promise<Array<{ imageId: string; views: number }>>;
}

export class EventsService implements IEventsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Track a user event
   * 
   * @param input - Event tracking input
   */
  async trackEvent(input: TrackEventInput): Promise<void> {
    const { galleryId, visitorId, visitorIp, eventType, eventData } = input;

    // Validate inputs
    if (!galleryId) {
      throw new ValidationError('Gallery ID is required');
    }

    if (!eventType) {
      throw new ValidationError('Event type is required');
    }

    // Insert event record
    const { error } = await this.supabase
      .from('gallery_events')
      .insert({
        gallery_id: galleryId,
        visitor_id: visitorId || null,
        visitor_ip: visitorIp || null,
        event_type: eventType,
        event_data: (eventData as any) || null,
      });

    if (error) {
      console.error('Failed to track event:', error);
      // Don't throw - event tracking shouldn't break user experience
    }
  }

  /**
   * Get comprehensive event statistics for a gallery
   * 
   * @param galleryId - Gallery ID
   * @param dateFrom - Start date (optional)
   * @param dateTo - End date (optional)
   */
  async getEventStats(
    galleryId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<EventStats> {
    // Build query
    let query = this.supabase
      .from('gallery_events')
      .select('*')
      .eq('gallery_id', galleryId);

    if (dateFrom) {
      query = query.gte('created_at', dateFrom.toISOString());
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo.toISOString());
    }

    const { data: events, error } = await query;

    if (error) {
      throw error;
    }

    const eventsData = events || [];

    // Calculate total events
    const totalEvents = eventsData.length;

    // Calculate events by type
    const eventsByType: Record<string, number> = {};
    eventsData.forEach(event => {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
    });

    // Calculate most viewed images (lightbox opens)
    const imageViews: Record<string, number> = {};
    eventsData
      .filter(e => e.event_type === 'lightbox_open' && e.event_data)
      .forEach(e => {
        const data = e.event_data as any;
        if (data?.imageId) {
          const imageId = data.imageId as string;
          imageViews[imageId] = (imageViews[imageId] || 0) + 1;
        }
      });

    const mostViewedImages = Object.entries(imageViews)
      .map(([imageId, views]) => ({ imageId, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Calculate download stats
    const downloadStats = {
      total: (eventsByType.download_single || 0) +
             (eventsByType.download_all || 0) +
             (eventsByType.download_selection || 0) +
             (eventsByType.download_favorites || 0),
      single: eventsByType.download_single || 0,
      all: eventsByType.download_all || 0,
      selection: eventsByType.download_selection || 0,
      favorites: eventsByType.download_favorites || 0,
    };

    // Calculate favorite stats
    const favoriteStats = {
      added: eventsByType.favorite_add || 0,
      removed: eventsByType.favorite_remove || 0,
      net: (eventsByType.favorite_add || 0) - (eventsByType.favorite_remove || 0),
    };

    // Calculate CTA clicks
    const ctaClicks = eventsByType.cta_click || 0;

    // Calculate slideshow stats
    const slideshowEnds = eventsData.filter(e => e.event_type === 'slideshow_end');
    const totalSlideshowDuration = slideshowEnds.reduce(
      (sum, e) => {
        const data = e.event_data as any;
        return sum + (data?.duration || 0);
      },
      0
    );
    const slideshowStats = {
      starts: eventsByType.slideshow_start || 0,
      avgDuration: slideshowEnds.length > 0 ? totalSlideshowDuration / slideshowEnds.length : 0,
    };

    // Calculate session stats
    const sessionEnds = eventsData.filter(e => e.event_type === 'session_end');
    const totalSessionDuration = sessionEnds.reduce(
      (sum, e) => {
        const data = e.event_data as any;
        return sum + (data?.duration || 0);
      },
      0
    );
    const totalSessionEvents = sessionEnds.reduce(
      (sum, e) => {
        const data = e.event_data as any;
        return sum + (data?.eventsCount || 0);
      },
      0
    );
    const sessionStats = {
      avgDuration: sessionEnds.length > 0 ? totalSessionDuration / sessionEnds.length : 0,
      avgEventsPerSession: sessionEnds.length > 0 ? totalSessionEvents / sessionEnds.length : 0,
    };

    return {
      totalEvents,
      eventsByType: eventsByType as Record<EventType, number>,
      mostViewedImages,
      downloadStats,
      favoriteStats,
      ctaClicks,
      slideshowStats,
      sessionStats,
    };
  }

  /**
   * Get most viewed images in a gallery
   * 
   * @param galleryId - Gallery ID
   * @param limit - Number of results (default: 10)
   */
  async getMostViewedImages(
    galleryId: string,
    limit: number = 10
  ): Promise<Array<{ imageId: string; views: number }>> {
    const { data: events, error } = await this.supabase
      .from('gallery_events')
      .select('event_data')
      .eq('gallery_id', galleryId)
      .eq('event_type', 'lightbox_open');

    if (error) {
      throw error;
    }

    const imageViews: Record<string, number> = {};
    (events || [])
      .filter(e => e.event_data)
      .forEach(e => {
        const data = e.event_data as any;
        if (data?.imageId) {
          const imageId = data.imageId as string;
          imageViews[imageId] = (imageViews[imageId] || 0) + 1;
        }
      });

    return Object.entries(imageViews)
      .map(([imageId, views]) => ({ imageId, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }
}

/**
 * Factory function to create an EventsService instance
 */
export function createEventsService(
  supabase: SupabaseClient<Database>
): IEventsService {
  return new EventsService(supabase);
}
