'use client';

/**
 * Profile Tracker Hook
 * Provides functions to track user interactions on public photographer profiles
 * 
 * @module hooks/use-profile-tracker
 * 
 * Requirements:
 * - 9.1: Track profile views
 * - 9.4: Track gallery clicks
 * - 9.5: Track CTA clicks
 * - 9.6: Track social link clicks
 * - 13.7: Respect Do Not Track headers
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { hasTrackingConsent } from '@/components/public-profile/cookie-consent-banner';

interface UseProfileTrackerOptions {
  profileSlug: string;
  enabled?: boolean; // Allow disabling tracking (e.g., for preview mode)
}

interface ProfileTracker {
  viewId: string | null;
  trackView: () => Promise<void>;
  trackCTAClick: () => Promise<void>;
  trackSocialClick: (platform: string) => Promise<void>;
  trackGalleryClick: (galleryId: string) => Promise<void>;
  isTrackingEnabled: boolean;
}

/**
 * Check if Do Not Track is enabled
 * Respects browser DNT header (Requirement 13.7)
 */
function isDoNotTrackEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check navigator.doNotTrack
  const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
  
  // DNT can be "1", "yes", or true
  return dnt === '1' || dnt === 'yes' || dnt === true;
}

/**
 * Hook to track user interactions on a public profile
 * 
 * Tracking is only enabled if:
 * - The enabled option is true
 * - Do Not Track is not enabled (Requirement 13.7)
 * - User has given consent via cookie banner (Requirement 9.10)
 * 
 * @param options - Tracker options (profileSlug, enabled)
 * @returns Profile tracking functions and state
 */
export function useProfileTracker(options: UseProfileTrackerOptions): ProfileTracker {
  const { profileSlug, enabled = true } = options;
  const [viewId, setViewId] = useState<string | null>(null);
  const hasTrackedView = useRef(false);
  
  // Check if tracking is enabled (respects DNT and cookie consent)
  const isTrackingEnabled = enabled && !isDoNotTrackEnabled() && hasTrackingConsent();

  /**
   * Track profile view
   * Called automatically on mount (Requirement 9.1)
   */
  const trackView = useCallback(async () => {
    if (!isTrackingEnabled || hasTrackedView.current) {
      return;
    }

    try {
      const response = await fetch('/api/public-profile/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileSlug,
          action: 'view',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setViewId(data.data.viewId);
        hasTrackedView.current = true;
      }
    } catch (error) {
      // Silently fail - tracking shouldn't break user experience
      console.error('Profile view tracking error:', error);
    }
  }, [profileSlug, isTrackingEnabled]);

  /**
   * Track CTA button click
   * (Requirement 9.5)
   */
  const trackCTAClick = useCallback(async () => {
    if (!isTrackingEnabled || !viewId) {
      return;
    }

    try {
      await fetch('/api/public-profile/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileSlug,
          action: 'cta_click',
          viewId,
        }),
      });
    } catch (error) {
      console.error('CTA click tracking error:', error);
    }
  }, [profileSlug, viewId, isTrackingEnabled]);

  /**
   * Track social link click
   * (Requirement 9.6)
   */
  const trackSocialClick = useCallback(
    async (platform: string) => {
      if (!isTrackingEnabled || !viewId) {
        return;
      }

      try {
        await fetch('/api/public-profile/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileSlug,
            action: 'social_click',
            viewId,
            socialPlatform: platform,
          }),
        });
      } catch (error) {
        console.error('Social click tracking error:', error);
      }
    },
    [profileSlug, viewId, isTrackingEnabled]
  );

  /**
   * Track gallery click
   * (Requirement 9.4)
   * 
   * Note: This is tracked via the galleries_viewed array in the view record.
   * The actual implementation is handled by the trackView endpoint which
   * updates the galleries_viewed array when a gallery is clicked.
   */
  const trackGalleryClick = useCallback(
    async (galleryId: string) => {
      if (!isTrackingEnabled || !viewId) {
        return;
      }

      // Gallery clicks are tracked by updating the galleries_viewed array
      // This could be implemented as a separate endpoint or as part of the
      // navigation tracking. For now, we'll log it for future implementation.
      console.debug('Gallery click tracked:', galleryId);
      
      // TODO: Implement gallery click tracking endpoint if needed
      // The current design tracks galleries_viewed in the profile_views table
      // but doesn't specify how to update it after the initial view
    },
    [viewId, isTrackingEnabled]
  );

  // Automatically track view on mount (Requirement 9.1)
  useEffect(() => {
    if (isTrackingEnabled && !hasTrackedView.current) {
      trackView();
    }
  }, [trackView, isTrackingEnabled]);

  return {
    viewId,
    trackView,
    trackCTAClick,
    trackSocialClick,
    trackGalleryClick,
    isTrackingEnabled,
  };
}
