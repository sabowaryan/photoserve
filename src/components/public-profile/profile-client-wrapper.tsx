'use client';

/**
 * Profile Client Wrapper Component
 * Client-side wrapper that handles tracking and interactive features for public profile pages
 * 
 * Requirements:
 * - 9.1: Track profile views on page load
 * - 9.4: Track gallery clicks
 * - 9.5: Track CTA clicks
 * - 9.6: Track social link clicks
 * - 9.10: Allow visitors to refuse tracking via cookie consent banner
 * - 13.7: Respect Do Not Track
 * - 11.8: Support dark mode with automatic system preference detection
 * - 11.9: Allow manual toggle between light and dark mode
 * - 11.10: Persist theme preference in localStorage
 */

import { createContext, useContext } from 'react';
import { useProfileTracker } from '@/hooks/use-profile-tracker';
import { useProfileTheme } from '@/hooks/use-profile-theme';
import { CookieConsentBanner, type ConsentChoice } from '@/components/public-profile/cookie-consent-banner';
import { ThemeToggle } from '@/components/public-profile/theme-toggle';
import type { ReactNode } from 'react';
import '@/app/p/[slug]/profile-theme.css';

interface ProfileTrackingContext {
  trackCTAClick: () => Promise<void>;
  trackSocialClick: (platform: string) => Promise<void>;
  trackGalleryClick: (galleryId: string) => Promise<void>;
  isTrackingEnabled: boolean;
}

const ProfileTrackingContext = createContext<ProfileTrackingContext | null>(null);

/**
 * Hook to access profile tracking functions from child components
 */
export function useProfileTracking() {
  const context = useContext(ProfileTrackingContext);
  if (!context) {
    // Return no-op functions if context is not available
    return {
      trackCTAClick: async () => {},
      trackSocialClick: async () => {},
      trackGalleryClick: async () => {},
      isTrackingEnabled: false,
    };
  }
  return context;
}

interface ProfileClientWrapperProps {
  profileSlug: string;
  children: ReactNode;
}

/**
 * Wrapper component that provides tracking and theme functionality to the profile page
 * 
 * This component:
 * - Displays a GDPR-compliant cookie consent banner (Requirement 9.10)
 * - Automatically tracks the profile view on mount if consent is given (Requirement 9.1)
 * - Provides tracking context to child components
 * - Respects Do Not Track browser settings (Requirement 13.7)
 * - Implements dark mode with system preference detection (Requirements 11.8, 11.9, 11.10)
 */
export function ProfileClientWrapper({
  profileSlug,
  children,
}: ProfileClientWrapperProps) {
  // Initialize profile tracker
  // This will automatically track the view on mount if consent is given
  const { trackCTAClick, trackSocialClick, trackGalleryClick, isTrackingEnabled, trackView } = useProfileTracker({
    profileSlug,
    enabled: true,
  });

  // Initialize theme (Requirements 11.8, 11.9, 11.10)
  const { containerRef, toggleTheme, isDark } = useProfileTheme();

  // Handle consent changes
  const handleConsentChange = (consent: ConsentChoice) => {
    if (consent === 'accepted') {
      // Track the view immediately after consent is given
      trackView();
    }
  };

  return (
    <div ref={containerRef} className="profile-theme-container">
      <ProfileTrackingContext.Provider
        value={{
          trackCTAClick,
          trackSocialClick,
          trackGalleryClick,
          isTrackingEnabled,
        }}
      >
        {/* Theme toggle button - Fixed position (Requirement 11.9) */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
        
        {children}
      </ProfileTrackingContext.Provider>
      
      {/* Cookie consent banner */}
      <CookieConsentBanner onConsentChange={handleConsentChange} />
    </div>
  );
}
