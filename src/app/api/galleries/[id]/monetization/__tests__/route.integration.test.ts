/**
 * Integration Tests for Gallery Monetization API Routes
 * Tests POST, GET, PUT, DELETE routes with authentication, authorization, and validation
 * 
 * @module app/api/galleries/[id]/monetization/__tests__/route.integration.test
 * Requirements: 2.3 - API Routes for gallery monetization
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET, PUT, DELETE } from '../route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  requireSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/services/gallery-monetization.service', () => ({
  createGalleryMonetizationService: vi.fn(),
}));

import { requireSupabaseClient } from '@/lib/auth';
import { createGalleryMonetizationService } from '@/lib/services/gallery-monetization.service';

describe('Gallery Monetization API Routes - Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockGalleryId = '550e8400-e29b-41d4-a716-446655440000';
  const mockConfig = {
    galleryId: mockGalleryId,
    isEnabled: true,
    priceCents: 2999,
    currency: 'usd',
    previewMode: 'full_paywall' as const,
    watermarkEnabled: true,
    accessDurationDays: null,
    stripePriceId: 'price_123',
    platformFeePercent: 10.0,
  };

  let mockSupabase: any;
  let mockMonetizationService: any;

  /**
   * Helper to create mock request
   */
  function createMockRequest(body?: object): NextRequest {
    return new NextRequest('http://localhost:3000/api/galleries/' + mockGalleryId + '/monetization', {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Helper to create route params
   */
  function createRouteParams(id: string = mockGalleryId) {
    return { params: Promise.resolve({ id }) };
  }

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Supabase client with chainable methods
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
    };

    // Mock monetization service
    mockMonetizationService = {
      enablePaywall: vi.fn(),
      updatePaywall: vi.fn(),
      disablePaywall: vi.fn(),
      getConfig: vi.fn(),
    };

    vi.mocked(requireSupabaseClient).mockResolvedValue({
      supabase: mockSupabase,
      hasRLS: true,
      userId: mockUserId,
    });

    vi.mocked(createGalleryMonetizationService).mockReturnValue(mockMonetizationService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/galleries/[id]/monetization', () => {
    const validPayload = {
      priceCents: 2999,
      currency: 'usd',
      previewMode: 'full_paywall',
      watermarkEnabled: true,
    };

    it('should create paywall config for Pro user who owns gallery', async () => {
      // Mock gallery ownership check
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        // Mock Pro plan check
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      mockMonetizationService.enablePaywall.mockResolvedValue(mockConfig);

      const request = createMockRequest(validPayload);
      const response = await POST(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.galleryId).toBe(mockGalleryId);
      expect(data.priceCents).toBe(2999);
      expect(data.isEnabled).toBe(true);
      expect(mockMonetizationService.enablePaywall).toHaveBeenCalledWith(
        mockGalleryId,
        expect.objectContaining({
          priceCents: 2999,
          currency: 'usd',
          previewMode: 'full_paywall',
          watermarkEnabled: true,
        })
      );
    });

    it('should reject unauthenticated requests with 401', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValueOnce(
        new Error('Authentication required')
      );

      const request = createMockRequest(validPayload);
      const response = await POST(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should reject non-owner with 404', async () => {
      // Mock gallery owned by different user
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: mockGalleryId, user_id: 'other-user', title: 'Test Gallery', is_public: true },
        error: null,
      });

      const request = createMockRequest(validPayload);
      const response = await POST(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should reject non-Pro users with 403', async () => {
      // Mock gallery ownership
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        // Mock non-Pro plan
        .mockResolvedValueOnce({
          data: { subscription_plan: 'premium' },
          error: null,
        });

      const request = createMockRequest(validPayload);
      const response = await POST(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('ACCESS_DENIED');
    });

    it('should reject invalid gallery ID with 400', async () => {
      const request = createMockRequest(validPayload);
      const response = await POST(request, createRouteParams('invalid-id'));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject price below minimum with 400', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      const request = createMockRequest({ ...validPayload, priceCents: 100 });
      const response = await POST(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject price above maximum with 400', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      const request = createMockRequest({ ...validPayload, priceCents: 60000 });
      const response = await POST(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid currency with 400', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      const request = createMockRequest({ ...validPayload, currency: 'gbp' });
      const response = await POST(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid preview mode with 400', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      const request = createMockRequest({ ...validPayload, previewMode: 'invalid' });
      const response = await POST(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/galleries/[id]/monetization', () => {
    it('should return config for gallery owner', async () => {
      // Mock gallery check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: mockGalleryId, user_id: mockUserId, is_public: true },
        error: null,
      });

      mockMonetizationService.getConfig.mockResolvedValue(mockConfig);

      const request = createMockRequest();
      const response = await GET(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.galleryId).toBe(mockGalleryId);
      expect(data.priceCents).toBe(2999);
      expect(data.isEnabled).toBe(true);
    });

    it('should return config for active gallery with enabled paywall', async () => {
      // Mock gallery owned by different user but active
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: mockGalleryId, user_id: 'other-user', is_active: true },
        error: null,
      });

      mockMonetizationService.getConfig.mockResolvedValue(mockConfig);

      const request = createMockRequest();
      const response = await GET(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.galleryId).toBe(mockGalleryId);
    });

    it('should reject non-owner for inactive gallery with 404', async () => {
      // Mock inactive gallery owned by different user
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: mockGalleryId, user_id: 'other-user', is_active: false },
        error: null,
      });

      mockMonetizationService.getConfig.mockResolvedValue({ ...mockConfig, isEnabled: false });

      const request = createMockRequest();
      const response = await GET(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should return 404 if config does not exist', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: mockGalleryId, user_id: mockUserId, is_active: true },
        error: null,
      });

      mockMonetizationService.getConfig.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should reject unauthenticated requests with 401', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValueOnce(
        new Error('Authentication required')
      );

      const request = createMockRequest();
      const response = await GET(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should return 404 for non-existent gallery', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const request = createMockRequest();
      const response = await GET(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/galleries/[id]/monetization', () => {
    const updatePayload = {
      priceCents: 3999,
      previewMode: 'freemium',
    };

    it('should update config for Pro user who owns gallery', async () => {
      // Mock gallery ownership
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        // Mock Pro plan
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      const updatedConfig = { ...mockConfig, priceCents: 3999, previewMode: 'freemium' as const };
      mockMonetizationService.updatePaywall.mockResolvedValue(updatedConfig);

      const request = createMockRequest(updatePayload);
      const response = await PUT(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.priceCents).toBe(3999);
      expect(data.previewMode).toBe('freemium');
      expect(mockMonetizationService.updatePaywall).toHaveBeenCalledWith(
        mockGalleryId,
        expect.objectContaining({
          priceCents: 3999,
          previewMode: 'freemium',
        })
      );
    });

    it('should reject unauthenticated requests with 401', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValueOnce(
        new Error('Authentication required')
      );

      const request = createMockRequest(updatePayload);
      const response = await PUT(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should reject non-owner with 404', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: mockGalleryId, user_id: 'other-user', title: 'Test Gallery', is_public: true },
        error: null,
      });

      const request = createMockRequest(updatePayload);
      const response = await PUT(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should reject non-Pro users with 403', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'free' },
          error: null,
        });

      const request = createMockRequest(updatePayload);
      const response = await PUT(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('ACCESS_DENIED');
    });

    it('should reject empty update payload with 400', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      const request = createMockRequest({});
      const response = await PUT(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should allow partial updates', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      const updatedConfig = { ...mockConfig, watermarkEnabled: false };
      mockMonetizationService.updatePaywall.mockResolvedValue(updatedConfig);

      const request = createMockRequest({ watermarkEnabled: false });
      const response = await PUT(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.watermarkEnabled).toBe(false);
    });

    it('should allow toggling isEnabled', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      const updatedConfig = { ...mockConfig, isEnabled: false };
      mockMonetizationService.updatePaywall.mockResolvedValue(updatedConfig);

      const request = createMockRequest({ isEnabled: false });
      const response = await PUT(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isEnabled).toBe(false);
    });
  });

  describe('DELETE /api/galleries/[id]/monetization', () => {
    it('should disable paywall for gallery owner', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
        error: null,
      });

      mockMonetizationService.disablePaywall.mockResolvedValue(undefined);

      const request = createMockRequest();
      const response = await DELETE(request, createRouteParams());

      expect(response.status).toBe(204);
      expect(mockMonetizationService.disablePaywall).toHaveBeenCalledWith(mockGalleryId);
    });

    it('should reject unauthenticated requests with 401', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValueOnce(
        new Error('Authentication required')
      );

      const request = createMockRequest();
      const response = await DELETE(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should reject non-owner with 404', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: mockGalleryId, user_id: 'other-user', title: 'Test Gallery', is_public: true },
        error: null,
      });

      const request = createMockRequest();
      const response = await DELETE(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should not require Pro plan for DELETE', async () => {
      // DELETE should work for any plan since it's disabling monetization
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
        error: null,
      });

      mockMonetizationService.disablePaywall.mockResolvedValue(undefined);

      const request = createMockRequest();
      const response = await DELETE(request, createRouteParams());

      expect(response.status).toBe(204);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection error' },
      });

      const request = createMockRequest({ priceCents: 2999 });
      const response = await POST(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should handle service errors gracefully', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      mockMonetizationService.enablePaywall.mockRejectedValue(
        new Error('Stripe API error')
      );

      const request = createMockRequest({ priceCents: 2999 });
      const response = await POST(request, createRouteParams());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Currency Support', () => {
    it.each(['usd', 'eur', 'cad'])('should accept %s currency', async (currency) => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      mockMonetizationService.enablePaywall.mockResolvedValue({ ...mockConfig, currency });

      const request = createMockRequest({ priceCents: 2999, currency });
      const response = await POST(request, createRouteParams());

      expect(response.status).toBe(201);
    });
  });

  describe('Preview Mode Support', () => {
    it.each(['full_paywall', 'freemium'])('should accept %s preview mode', async (previewMode) => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: mockGalleryId, user_id: mockUserId, title: 'Test Gallery', is_public: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { subscription_plan: 'pro' },
          error: null,
        });

      mockMonetizationService.enablePaywall.mockResolvedValue({ ...mockConfig, previewMode });

      const request = createMockRequest({ priceCents: 2999, previewMode });
      const response = await POST(request, createRouteParams());

      expect(response.status).toBe(201);
    });
  });
});
