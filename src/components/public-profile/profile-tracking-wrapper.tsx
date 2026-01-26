'use client';

/**
 * Profile Tracking Wrapper Component
 * Client-side wrapper that handles tracking for public profile pages
 * 
 * Requirements:
 * - 9.1: Track profile views on page load
 * - 9.4: Track gallery clicks
 * - 9.5: Track CTA clicks
 * - 9.6: Track social link clicks
 * - 13.7: Respect Do Not Track
 */

import { useProfileTracker } from '@/hooks/use-profile-tracker';
import type { ReactNode } from 'react';

interface ProfileTrackingWrapperProps {
  profileSlug: string;
  children: (tracker: {
    trackCTAClick: () => Promise<void>;
    trackSocialClick: (platform: string) => Promise<void>;
    trackGalleryClick: (galleryId: string) => Promise<void>;
  }) => ReactNode;
}

/**
 * Wrapper component that provides tracking functionality to child components
 * 
 * This component:
 * - Automatically tracks the profile view on mount
 * - Provides tracking functions to children via render props
 * - Respects Do Not Track browser settings
 */
export function ProfileTrackingWrapper({
  profileSlug,
  children,
}: ProfileTrackingWrapperProps) {
  const { trackCTAClick, trackSocialClick, trackGalleryClick } = useProfileTracker({
    profileSlug,
    enabled: true,
  });

  return <>{children({ trackCTAClick, trackSocialClick, trackGalleryClick })}</>;
}
