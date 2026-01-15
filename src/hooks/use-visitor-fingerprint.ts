'use client';

/**
 * Visitor Fingerprint Hook
 * Generates a unique visitor ID using browser fingerprinting
 * 
 * @module hooks/use-visitor-fingerprint
 * Requirements: Analytics Phase 2 - Unique visitor tracking
 */

import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Hook to get or generate a unique visitor ID
 * 
 * Uses FingerprintJS to generate a stable visitor ID based on:
 * - Browser characteristics
 * - Device properties
 * - Canvas fingerprinting
 * - Audio fingerprinting
 * - WebGL fingerprinting
 * 
 * The ID is stable across sessions and survives:
 * - Cookie clearing
 * - Private browsing (to some extent)
 * - Browser restarts
 * 
 * @returns visitorId - Unique visitor identifier (or null if loading)
 */
export function useVisitorFingerprint(): string | null {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function generateFingerprint() {
      try {
        // Check if we already have a cached visitor ID
        const cached = sessionStorage.getItem('piksend_visitor_id');
        if (cached && mounted) {
          setVisitorId(cached);
          return;
        }

        // Load FingerprintJS
        const fp = await FingerprintJS.load();

        // Get the visitor identifier
        const result = await fp.get();
        const id = result.visitorId;

        if (mounted) {
          // Cache in sessionStorage for performance
          sessionStorage.setItem('piksend_visitor_id', id);
          setVisitorId(id);
        }
      } catch (error) {
        console.error('Fingerprint generation error:', error);
        
        // Fallback: Generate a random UUID
        if (mounted) {
          const fallbackId = crypto.randomUUID();
          sessionStorage.setItem('piksend_visitor_id', fallbackId);
          setVisitorId(fallbackId);
        }
      }
    }

    generateFingerprint();

    return () => {
      mounted = false;
    };
  }, []);

  return visitorId;
}

/**
 * Get visitor ID synchronously (if already generated)
 * 
 * @returns visitorId or null if not yet generated
 */
export function getVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('piksend_visitor_id');
}

/**
 * Clear cached visitor ID (for testing)
 */
export function clearVisitorId(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('piksend_visitor_id');
}
