/**
 * Gallery Access Hook
 * Checks if user has access to a monetized gallery
 * 
 * @module hooks/use-gallery-access
 * Requirements: 3.5 - Freemium Preview Mode
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * Monetization config interface
 */
export interface MonetizationConfig {
  isEnabled: boolean;
  priceCents: number;
  currency: string;
  previewMode: 'full_paywall' | 'freemium';
  watermarkEnabled: boolean;
  accessDurationDays?: number | null;
}

/**
 * Access status interface
 */
export interface AccessStatus {
  hasAccess: boolean;
  reason: 'free_gallery' | 'purchased' | 'no_purchase';
  expiresAt?: string | null;
}

/**
 * Gallery access state
 */
export interface GalleryAccessState {
  isLoading: boolean;
  isMonetized: boolean;
  hasAccess: boolean;
  monetization: MonetizationConfig | null;
  accessStatus: AccessStatus | null;
  error: string | null;
}

/**
 * Hook to check gallery monetization and access status
 * 
 * @param galleryId - The gallery ID
 * @param buyerEmail - Optional buyer email for access check
 * @returns Gallery access state
 */
export function useGalleryAccess(
  galleryId: string,
  buyerEmail?: string
): GalleryAccessState & { checkAccess: (email: string) => Promise<boolean> } {
  const [state, setState] = useState<GalleryAccessState>({
    isLoading: true,
    isMonetized: false,
    hasAccess: true, // Default to true (free gallery)
    monetization: null,
    accessStatus: null,
    error: null,
  });

  // Check monetization config
  useEffect(() => {
    const checkMonetization = async () => {
      try {
        const response = await fetch(`/api/galleries/${galleryId}/monetization`);
        
        if (response.status === 404) {
          // No monetization config - free gallery
          setState(prev => ({
            ...prev,
            isLoading: false,
            isMonetized: false,
            hasAccess: true,
            accessStatus: { hasAccess: true, reason: 'free_gallery' },
          }));
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch monetization config');
        }

        const monetization: MonetizationConfig = await response.json();

        if (!monetization.isEnabled) {
          // Monetization disabled - free gallery
          setState(prev => ({
            ...prev,
            isLoading: false,
            isMonetized: false,
            hasAccess: true,
            monetization,
            accessStatus: { hasAccess: true, reason: 'free_gallery' },
          }));
          return;
        }

        // Monetization is enabled - check access
        setState(prev => ({
          ...prev,
          isMonetized: true,
          monetization,
        }));

        // Check access if we have an identifier
        const identifier = buyerEmail || getSessionId();
        if (identifier) {
          const accessResponse = await fetch(
            `/api/galleries/${galleryId}/verify-access?${buyerEmail ? `email=${encodeURIComponent(buyerEmail)}` : `sessionId=${encodeURIComponent(identifier)}`}`
          );

          if (accessResponse.ok) {
            const accessStatus: AccessStatus = await accessResponse.json();
            setState(prev => ({
              ...prev,
              isLoading: false,
              hasAccess: accessStatus.hasAccess,
              accessStatus,
            }));
          } else {
            setState(prev => ({
              ...prev,
              isLoading: false,
              hasAccess: false,
              accessStatus: { hasAccess: false, reason: 'no_purchase' },
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            hasAccess: false,
            accessStatus: { hasAccess: false, reason: 'no_purchase' },
          }));
        }
      } catch (error) {
        console.error('[useGalleryAccess] Error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    };

    checkMonetization();
  }, [galleryId, buyerEmail]);

  // Manual access check function
  const checkAccess = useCallback(async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/galleries/${galleryId}/verify-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const accessStatus: AccessStatus = await response.json();
        setState(prev => ({
          ...prev,
          hasAccess: accessStatus.hasAccess,
          accessStatus,
        }));
        return accessStatus.hasAccess;
      }
      return false;
    } catch (error) {
      console.error('[useGalleryAccess] Check access error:', error);
      return false;
    }
  }, [galleryId]);

  return { ...state, checkAccess };
}

/**
 * Get or create session ID for guest purchases
 */
function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  
  const key = 'piksend_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}
