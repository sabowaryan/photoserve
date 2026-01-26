/**
 * Unit Tests for useProfileTracker Hook
 * 
 * Tests the profile tracking hook functionality
 * 
 * Requirements:
 * - 9.1: Track profile views on page load
 * - 9.5: Track CTA clicks
 * - 9.6: Track social link clicks
 * - 13.7: Respect Do Not Track
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useProfileTracker } from '../use-profile-tracker';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useProfileTracker', () => {
  const mockProfileSlug = 'john-doe';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Set consent to accepted by default for tests
    localStorageMock.setItem('piksend-tracking-consent', 'accepted');
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { viewId: 'test-view-id' } }),
    });
  });

  afterEach(() => {
    // Reset navigator.doNotTrack
    Object.defineProperty(navigator, 'doNotTrack', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    localStorageMock.clear();
  });

  describe('View Tracking (Requirement 9.1)', () => {
    it('should automatically track view on mount', async () => {
      renderHook(() => useProfileTracker({ profileSlug: mockProfileSlug }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/public-profile/track-view',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileSlug: mockProfileSlug,
              action: 'view',
            }),
          })
        );
      });
    });

    it('should set viewId after successful tracking', async () => {
      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      await waitFor(() => {
        expect(result.current.viewId).toBe('test-view-id');
      });
    });

    it('should only track view once', async () => {
      const { rerender } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Rerender should not trigger another tracking call
      rerender();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle tracking errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Profile view tracking error:',
          expect.any(Error)
        );
      });

      expect(result.current.viewId).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('CTA Click Tracking (Requirement 9.5)', () => {
    it('should track CTA click with viewId', async () => {
      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      // Wait for initial view tracking
      await waitFor(() => {
        expect(result.current.viewId).toBe('test-view-id');
      });

      // Clear previous calls
      (global.fetch as any).mockClear();

      // Track CTA click
      await result.current.trackCTAClick();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/public-profile/track-view',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            profileSlug: mockProfileSlug,
            action: 'cta_click',
            viewId: 'test-view-id',
          }),
        })
      );
    });

    it('should not track CTA click if viewId is not available', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      });

      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      // Clear previous calls
      (global.fetch as any).mockClear();

      // Try to track CTA click without viewId
      await result.current.trackCTAClick();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Social Click Tracking (Requirement 9.6)', () => {
    it('should track social link click with platform name', async () => {
      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      // Wait for initial view tracking
      await waitFor(() => {
        expect(result.current.viewId).toBe('test-view-id');
      });

      // Clear previous calls
      (global.fetch as any).mockClear();

      // Track social click
      await result.current.trackSocialClick('instagram');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/public-profile/track-view',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            profileSlug: mockProfileSlug,
            action: 'social_click',
            viewId: 'test-view-id',
            socialPlatform: 'instagram',
          }),
        })
      );
    });

    it('should not track social click if viewId is not available', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      });

      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      // Clear previous calls
      (global.fetch as any).mockClear();

      // Try to track social click without viewId
      await result.current.trackSocialClick('facebook');

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Do Not Track (Requirement 13.7)', () => {
    it('should respect Do Not Track when set to "1"', async () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      expect(result.current.isTrackingEnabled).toBe(false);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('should respect Do Not Track when set to "yes"', async () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: 'yes',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      expect(result.current.isTrackingEnabled).toBe(false);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('should track when Do Not Track is not set', async () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      expect(result.current.isTrackingEnabled).toBe(true);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should track when Do Not Track is set to "0"', async () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '0',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug })
      );

      expect(result.current.isTrackingEnabled).toBe(true);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Disabled Tracking', () => {
    it('should not track when enabled is false', async () => {
      const { result } = renderHook(() =>
        useProfileTracker({ profileSlug: mockProfileSlug, enabled: false })
      );

      expect(result.current.isTrackingEnabled).toBe(false);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });
  });
});
