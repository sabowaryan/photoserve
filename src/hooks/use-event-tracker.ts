'use client';

/**
 * Event Tracker Hook
 * Provides functions to track user events in galleries
 * 
 * @module hooks/use-event-tracker
 * Requirements: Analytics Phase 3 - Event tracking
 */

import { useCallback } from 'react';
import type { EventType, EventData } from '@/lib/services/events.service';

interface UseEventTrackerOptions {
  galleryId: string;
  visitorId?: string | null;
}

interface EventTracker {
  trackEvent: (eventType: EventType, eventData?: EventData) => Promise<void>;
  trackLightboxOpen: (imageId: string, imageIndex: number) => Promise<void>;
  trackDownloadSingle: (imageId: string, quality?: string) => Promise<void>;
  trackDownloadAll: (imageCount: number) => Promise<void>;
  trackDownloadSelection: (imageIds: string[]) => Promise<void>;
  trackDownloadFavorites: (imageIds: string[]) => Promise<void>;
  trackFavoriteAdd: (imageId: string) => Promise<void>;
  trackFavoriteRemove: (imageId: string) => Promise<void>;
  trackCTAClick: (ctaType: string, ctaUrl?: string) => Promise<void>;
  trackSlideshowStart: (imageCount: number, interval: number) => Promise<void>;
  trackSlideshowEnd: (duration: number, imagesViewed: number) => Promise<void>;
  trackSessionStart: (referrer?: string, userAgent?: string) => Promise<void>;
  trackSessionEnd: (duration: number, eventsCount: number) => Promise<void>;
}

/**
 * Hook to track user events in a gallery
 * 
 * @param options - Tracker options (galleryId, visitorId)
 * @returns Event tracking functions
 */
export function useEventTracker(options: UseEventTrackerOptions): EventTracker {
  const { galleryId, visitorId } = options;

  /**
   * Generic event tracking function
   */
  const trackEvent = useCallback(
    async (eventType: EventType, eventData?: EventData) => {
      try {
        await fetch(`/api/galleries/${galleryId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId: visitorId || undefined,
            eventType,
            eventData,
          }),
        });
      } catch (error) {
        // Silently fail - event tracking shouldn't break user experience
        console.error('Event tracking error:', error);
      }
    },
    [galleryId, visitorId]
  );

  /**
   * Track lightbox open (photo clicked)
   */
  const trackLightboxOpen = useCallback(
    async (imageId: string, imageIndex: number) => {
      await trackEvent('lightbox_open', { imageId, imageIndex });
    },
    [trackEvent]
  );

  /**
   * Track single image download
   */
  const trackDownloadSingle = useCallback(
    async (imageId: string, quality: string = 'hd') => {
      await trackEvent('download_single', { imageId, quality });
    },
    [trackEvent]
  );

  /**
   * Track download all images
   */
  const trackDownloadAll = useCallback(
    async (imageCount: number) => {
      await trackEvent('download_all', { imageCount, format: 'zip' });
    },
    [trackEvent]
  );

  /**
   * Track download selection
   */
  const trackDownloadSelection = useCallback(
    async (imageIds: string[]) => {
      await trackEvent('download_selection', { 
        imageIds, 
        count: imageIds.length,
        format: 'zip',
      });
    },
    [trackEvent]
  );

  /**
   * Track download favorites
   */
  const trackDownloadFavorites = useCallback(
    async (imageIds: string[]) => {
      await trackEvent('download_favorites', { 
        imageIds, 
        count: imageIds.length,
        format: 'zip',
      });
    },
    [trackEvent]
  );

  /**
   * Track favorite add
   */
  const trackFavoriteAdd = useCallback(
    async (imageId: string) => {
      await trackEvent('favorite_add', { imageId });
    },
    [trackEvent]
  );

  /**
   * Track favorite remove
   */
  const trackFavoriteRemove = useCallback(
    async (imageId: string) => {
      await trackEvent('favorite_remove', { imageId });
    },
    [trackEvent]
  );

  /**
   * Track CTA click
   */
  const trackCTAClick = useCallback(
    async (ctaType: string, ctaUrl?: string) => {
      await trackEvent('cta_click', { ctaType, ctaUrl });
    },
    [trackEvent]
  );

  /**
   * Track slideshow start
   */
  const trackSlideshowStart = useCallback(
    async (imageCount: number, interval: number) => {
      await trackEvent('slideshow_start', { imageCount, interval });
    },
    [trackEvent]
  );

  /**
   * Track slideshow end
   */
  const trackSlideshowEnd = useCallback(
    async (duration: number, imagesViewed: number) => {
      await trackEvent('slideshow_end', { duration, imagesViewed });
    },
    [trackEvent]
  );

  /**
   * Track session start
   */
  const trackSessionStart = useCallback(
    async (referrer?: string, userAgent?: string) => {
      await trackEvent('session_start', { referrer, userAgent });
    },
    [trackEvent]
  );

  /**
   * Track session end
   */
  const trackSessionEnd = useCallback(
    async (duration: number, eventsCount: number) => {
      await trackEvent('session_end', { duration, eventsCount });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackLightboxOpen,
    trackDownloadSingle,
    trackDownloadAll,
    trackDownloadSelection,
    trackDownloadFavorites,
    trackFavoriteAdd,
    trackFavoriteRemove,
    trackCTAClick,
    trackSlideshowStart,
    trackSlideshowEnd,
    trackSessionStart,
    trackSessionEnd,
  };
}
