/**
 * Integration Tests for Public Profile API Routes
 * Tests PUT, GET, and check-slug routes with authentication, authorization, and validation
 * 
 * @module app/api/public-profile/__tests__/route.integration.test
 * Requirements: 1.1, 1.3, 6.1, 14.1
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from '../route';
import { GET as GET_BY_SLUG } from '../[slug]/route';
import { GET as CHECK_SLUG } from '../check-slug/route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  requireSupabaseClient: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/services/public-profile.service', () => ({
  createPublicProfileService: vi.fn(),
}));

import { requireSupabaseClient, getSupabaseClient } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createPublicProfileService } from '@/lib/services/public-profile.service';

describe('Public Profile API Routes - Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockProfileId = 'profile-456';
  const mockSlug = 'john-doe';

  const mockProfile = {
    id: mockProfileId,
    userId: mockUserId,
    isEnabled: true,
    slug: mockSlug,
    displayName: 'John Doe',
    tagline: 'Professional Photographer',
    bio: 'Capturing moments',
    location: 'Paris, France',
    viewsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProfileWithGalleries = {
    ...mockProfile,
    galleries: [
      {
        id: 'gallery-1',
        slug: 'wedding-2024',
        title: 'Wedding 2024',
        coverImageUrl: 'https://example.com/cover.jpg',
        imageCount: 25,
        createdAt: new Date(),
        isNew: true,
        isPasswordProtected: false,
      },
    ],
  };

  let mockSupabase: any;
  let mockService: any;

  /**
   * Helper to create mock request
   */
  function createMockRequest(body?: object, method: string = 'PUT'): NextRequest {
    return new NextRequest('http://localhost:3000/api/public-profile', {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Helper to create route params for slug route
   */
  function createSlugParams(slug: string = mockSlug) {
    return { params: { slug } };
  }

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
    };

    // Mock service
    mockService = {
      upsertProfile: vi.fn(),
      getProfileBySlug: vi.fn(),
      checkSlugAvailability: vi.fn(),
      generateSlugSuggestions: vi.fn(),
    };

    vi.mocked(requireSupabaseClient).mockResolvedValue({
      supabase: mockSupabase,
      hasRLS: true,
      userId: mockUserId,
    });

    vi.mocked(getSupabaseClient).mockResolvedValue({
      supabase: mockSupabase,
      hasRLS: false,
      userId: mockUserId,
    });

    vi.mocked(createAdminClient).mockReturnValue(mockSupabase);
    vi.mocked(createPublicProfileService).mockReturnValue(mockService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PUT /api/public-profile', () => {
    const validPayload = {
      isEnabled: true,
      slug: mockSlug,
      displayName: 'John Doe',
      tagline: 'Professional Photographer',
      bio: 'Capturing moments',
    };

    it('should create/update profile for authenticated Pro user', async () => {
      mockService.upsertProfile.mockResolvedValue(mockProfile);

      const request = createMockRequest(validPayload);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.slug).toBe(mockSlug);
      expect(data.data.displayName).toBe('John Doe');
      expect(mockService.upsertProfile).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          slug: mockSlug,
          displayName: 'John Doe',
        })
      );
    });

    it('should reject unauthenticated requests with 401', async () => {
      vi.mocked(requireSupabaseClient).mockRejectedValueOnce(
        new Error('Authentication required')
      );

      const request = createMockRequest(validPayload);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should reject non-Pro users with 403', async () => {
      mockService.upsertProfile.mockRejectedValueOnce(
        new Error('Cette fonctionnalité est réservée aux utilisateurs Pro')
      );

      const request = createMockRequest(validPayload);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('PRO_REQUIRED');
    });

    it('should reject duplicate slug with 409 and suggestions', async () => {
      mockService.upsertProfile.mockRejectedValueOnce(
        new Error('Ce slug est déjà utilisé')
      );
      mockService.generateSlugSuggestions.mockReturnValue([
        'john-doe-1',
        'john-doe-2',
        'john-doe-3',
        'john-doe-2024',
      ]);

      const request = createMockRequest(validPayload);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.code).toBe('SLUG_TAKEN');
      expect(data.suggestions).toHaveLength(4);
      expect(data.suggestions).toContain('john-doe-1');
    });

    it('should reject invalid data with 400', async () => {
      const invalidPayload = {
        isEnabled: true,
        slug: 'INVALID SLUG!', // Invalid characters
        displayName: 'John Doe',
      };

      const request = createMockRequest(invalidPayload);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
    });

    it('should reject reserved slug with 400', async () => {
      const reservedPayload = {
        isEnabled: true,
        slug: 'admin', // Reserved slug
        displayName: 'John Doe',
      };

      const request = createMockRequest(reservedPayload);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject slug exceeding max length with 400', async () => {
      const longSlugPayload = {
        isEnabled: true,
        slug: 'a'.repeat(101), // Exceeds 100 character limit
        displayName: 'John Doe',
      };

      const request = createMockRequest(longSlugPayload);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/public-profile/[slug]', () => {
    it('should return profile with galleries for valid slug', async () => {
      mockService.getProfileBySlug.mockResolvedValue(mockProfileWithGalleries);

      const request = createMockRequest(undefined, 'GET');
      const response = await GET_BY_SLUG(request, createSlugParams());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.slug).toBe(mockSlug);
      expect(data.data.galleries).toHaveLength(1);
      expect(mockService.getProfileBySlug).toHaveBeenCalledWith(mockSlug);
    });

    it('should return 404 for non-existent slug', async () => {
      mockService.getProfileBySlug.mockResolvedValue(null);

      const request = createMockRequest(undefined, 'GET');
      const response = await GET_BY_SLUG(request, createSlugParams('non-existent'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should return 404 for disabled profile', async () => {
      mockService.getProfileBySlug.mockResolvedValue(null);

      const request = createMockRequest(undefined, 'GET');
      const response = await GET_BY_SLUG(request, createSlugParams());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should return 400 for invalid slug format', async () => {
      const request = createMockRequest(undefined, 'GET');
      const response = await GET_BY_SLUG(request, createSlugParams(''));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_SLUG');
    });
  });

  describe('GET /api/public-profile/check-slug', () => {
    it('should return available=true for available slug', async () => {
      mockService.checkSlugAvailability.mockResolvedValue({
        available: true,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/check-slug?slug=available-slug'
      );
      const response = await CHECK_SLUG(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.available).toBe(true);
      expect(data.data.suggestions).toBeUndefined();
    });

    it('should return available=false with suggestions for taken slug', async () => {
      mockService.checkSlugAvailability.mockResolvedValue({
        available: false,
        suggestions: ['john-doe-1', 'john-doe-2', 'john-doe-3', 'john-doe-2024'],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/check-slug?slug=john-doe'
      );
      const response = await CHECK_SLUG(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.available).toBe(false);
      expect(data.data.suggestions).toHaveLength(4);
    });

    it('should return 400 for missing slug parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/check-slug'
      );
      const response = await CHECK_SLUG(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('MISSING_SLUG');
    });

    it('should return 400 for empty slug', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public-profile/check-slug?slug='
      );
      const response = await CHECK_SLUG(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('MISSING_SLUG');
    });

    it('should return 400 for slug exceeding max length', async () => {
      const longSlug = 'a'.repeat(101);
      const request = new NextRequest(
        `http://localhost:3000/api/public-profile/check-slug?slug=${longSlug}`
      );
      const response = await CHECK_SLUG(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_SLUG_LENGTH');
    });
  });
});
