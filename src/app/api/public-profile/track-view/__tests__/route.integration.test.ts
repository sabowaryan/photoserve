/**
 * Integration Tests for Public Profile Tracking API Route
 * Tests tracking of profile views, CTA clicks, and social link clicks
 * 
 * @module app/api/public-profile/track-view/__tests__/route.integration.test
 * Requirements: 9.1, 9.2, 9.5, 9.6
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/public-profile.service', () => ({
  createPublicProfileService: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createPublicProfileService } from '@/lib/services/public-profile.service';

describe('Public Profile Tracking API Route - Integration Tests', () => {
  const mockProfileSlug = 'john-doe';
  const mockViewId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
  const mockReferrer = 'https://google.com';

  let mockSupabase: any;
  let mockService: any;

  /**
   * Helper to create mock request with headers
   */
  function createMockRequest(
    body: object,
    headers: Record<string, string> = {}
  ): NextRequest {
    return new NextRequest('http://localhost:3000/api/public-profile/track-view', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'user-agent': mockUserAgent,
        'referer': mockReferrer,
        'x-forwarded-for': mockIpAddress,
        ...headers,
      },
    });
  }

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
    };

    // Mock service
    mockService = {
      trackView: vi.fn(),
      trackCTAClick: vi.fn(),
      trackSocialClick: vi.fn(),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createPublicProfileService).mockReturnValue(mockService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/public-profile/track-view - View Tracking', () => {
    it('should track a profile view successfully (Requirement 9.1, 9.2)', async () => {
      mockService.trackView.mockResolvedValue(mockViewId);

      const payload = {
        profileSlug: mockProfileSlug,
        action: 'view',
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.viewId).toBe(mockViewId);
      expect(mockService.trackView).toHaveBeenCalledWith(
        mockProfileSlug,
        expect.objectContaining({
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
          referrer: mockReferrer,
        })
      );
    });

    it('should extract IP from x-forwarded-for header', async () => {
      mockService.trackView.mockResolvedValue(mockViewId);

      const payload = {
        profileSlug: mockProfileSlug,
        action: 'view',
      };

      const request = createMockRequest(payload, {
        'x-forwarded-for': '203.0.113.1, 198.51.100.1',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.trackView).toHaveBeenCalledWith(
        mockProfileSlug,
        expect.objectContaining({
          ipAddress: '203.0.113.1', // First IP in the list
        })
      );
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is absent', async () => {
      mockService.trackView.mockResolvedValue(mockViewId);

      const payload = {
        profileSlug: mockProfileSlug,
        action: 'view',
      };

      const request = createMockRequest(payload, {
        'x-forwarded-for': '', // Empty
        'x-real-ip': '203.0.113.1',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.trackView).toHaveBeenCalledWith(
        mockProfileSlug,
        expect.objectContaining({
          ipAddress: '203.0.113.1',
        })
      );
    });

    it('should use fallback IP when no headers are present', async () => {
      mockService.trackView.mockResolvedValue(mockViewId);

      const payload = {
        profileSlug: mockProfileSlug,
        action: 'view',
      };

      const request = createMockRequest(payload, {
        'x-forwarded-for': '',
        'x-real-ip': '',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.trackView).toHaveBeenCalledWith(
        mockProfileSlug,
        expect.objectContaining({
          ipAddress: '127.0.0.1', // Fallback
        })
      );
    });

    it('should handle missing referrer gracefully', async () => {
      mockService.trackView.mockResolvedValue(mockViewId);

      const payload = {
        profileSlug: mockProfileSlug,
        action: 'view',
      };

      const request = createMockRequest(payload, {
        'referer': '', // No referrer
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.trackView).toHaveBeenCalledWith(
        mockProfileSlug,
        expect.objectContaining({
          referrer: undefined,
        })
      );
    });

    it('should return 404 when profile is not found', async () => {
      mockService.trackView.mockRejectedValue(new Error('Profile not found'));

      const payload = {
        profileSlug: 'non-existent',
        action: 'view',
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('PROFILE_NOT_FOUND');
    });
  });

  describe('POST /api/public-profile/track-view - CTA Click Tracking', () => {
    it('should track a CTA click successfully (Requirement 9.5)', async () => {
      mockService.trackCTAClick.mockResolvedValue(undefined);

      const payload = {
        profileSlug: mockProfileSlug,
        action: 'cta_click',
        viewId: mockViewId,
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.success).toBe(true);
      expect(mockService.trackCTAClick).toHaveBeenCalledWith(mockViewId);
    });

    it('should return 400 when viewId is missing for cta_click', async () => {
      const payload = {
        profileSlug: mockProfileSlug,
        action: 'cta_click',
        // viewId is missing
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('viewId is required');
    });

    it('should return 400 when viewId is not a valid UUID', async () => {
      const payload = {
        profileSlug: mockProfileSlug,
        action: 'cta_click',
        viewId: 'invalid-uuid',
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/public-profile/track-view - Social Click Tracking', () => {
    it('should track a social link click successfully (Requirement 9.6)', async () => {
      mockService.trackSocialClick.mockResolvedValue(undefined);

      const payload = {
        profileSlug: mockProfileSlug,
        action: 'social_click',
        viewId: mockViewId,
        socialPlatform: 'instagram',
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.success).toBe(true);
      expect(mockService.trackSocialClick).toHaveBeenCalledWith(
        mockViewId,
        'instagram'
      );
    });

    it('should track different social platforms', async () => {
      mockService.trackSocialClick.mockResolvedValue(undefined);

      const platforms = ['facebook', 'twitter', 'linkedin', 'pinterest', 'tiktok'];

      for (const platform of platforms) {
        const payload = {
          profileSlug: mockProfileSlug,
          action: 'social_click',
          viewId: mockViewId,
          socialPlatform: platform,
        };

        const request = createMockRequest(payload);
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockService.trackSocialClick).toHaveBeenCalledWith(
          mockViewId,
          platform
        );
      }
    });

    it('should return 400 when viewId is missing for social_click', async () => {
      const payload = {
        profileSlug: mockProfileSlug,
        action: 'social_click',
        socialPlatform: 'instagram',
        // viewId is missing
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('viewId');
    });

    it('should return 400 when socialPlatform is missing for social_click', async () => {
      const payload = {
        profileSlug: mockProfileSlug,
        action: 'social_click',
        viewId: mockViewId,
        // socialPlatform is missing
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      // Check that the error message mentions the requirement
      if (data.message) {
        expect(data.message).toContain('socialPlatform');
      }
    });
  });

  describe('POST /api/public-profile/track-view - Validation', () => {
    it('should return 400 for missing profileSlug', async () => {
      const payload = {
        action: 'view',
        // profileSlug is missing
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty profileSlug', async () => {
      const payload = {
        profileSlug: '',
        action: 'view',
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid action type', async () => {
      const payload = {
        profileSlug: mockProfileSlug,
        action: 'invalid_action',
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing action', async () => {
      const payload = {
        profileSlug: mockProfileSlug,
        // action is missing
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/public-profile/track-view - Cloudflare and Vercel Headers', () => {
    it('should extract IP from cf-connecting-ip header (Cloudflare)', async () => {
      mockService.trackView.mockResolvedValue(mockViewId);

      const payload = {
        profileSlug: mockProfileSlug,
        action: 'view',
      };

      const request = createMockRequest(payload, {
        'x-forwarded-for': '',
        'x-real-ip': '',
        'cf-connecting-ip': '203.0.113.1',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.trackView).toHaveBeenCalledWith(
        mockProfileSlug,
        expect.objectContaining({
          ipAddress: '203.0.113.1',
        })
      );
    });

    it('should extract IP from x-vercel-forwarded-for header (Vercel)', async () => {
      mockService.trackView.mockResolvedValue(mockViewId);

      const payload = {
        profileSlug: mockProfileSlug,
        action: 'view',
      };

      const request = createMockRequest(payload, {
        'x-forwarded-for': '',
        'x-real-ip': '',
        'x-vercel-forwarded-for': '203.0.113.1, 198.51.100.1',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.trackView).toHaveBeenCalledWith(
        mockProfileSlug,
        expect.objectContaining({
          ipAddress: '203.0.113.1', // First IP in the list
        })
      );
    });

    it('should prioritize x-forwarded-for over other headers', async () => {
      mockService.trackView.mockResolvedValue(mockViewId);

      const payload = {
        profileSlug: mockProfileSlug,
        action: 'view',
      };

      const request = createMockRequest(payload, {
        'x-forwarded-for': '203.0.113.1',
        'x-real-ip': '198.51.100.1',
        'cf-connecting-ip': '192.0.2.1',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.trackView).toHaveBeenCalledWith(
        mockProfileSlug,
        expect.objectContaining({
          ipAddress: '203.0.113.1', // x-forwarded-for takes priority
        })
      );
    });
  });
});
