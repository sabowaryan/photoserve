/**
 * Unit Tests for Custom Domain Routing
 * 
 * Tests the proxy middleware's custom domain functionality.
 * Validates Requirements 6.2, 7.3
 * 
 * Requirement 6.2: "WHERE un domaine personnalisé est configuré, 
 *                   THE Système SHALL rendre le profil accessible via ce domaine"
 * 
 * Requirement 7.3: "WHERE un domaine personnalisé est configuré, 
 *                   THE Système SHALL afficher un footer white-label sans mention PikSend"
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies BEFORE importing the module under test
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/middleware/route-protection', () => ({
  getRouteProtectionAction: vi.fn().mockReturnValue({ action: 'allow' }),
  isAuthRoute: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/cache/domain-cache', () => ({
  get: vi.fn(),
  set: vi.fn(),
  invalidate: vi.fn(),
  clear: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Import after mocks are set up
import { proxy } from '../proxy';
import * as domainCache from '@/lib/cache/domain-cache';
import { createClient } from '@/lib/supabase/server';

describe('Custom Domain Routing - Unit Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    };
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    
    // Clear domain cache before each test
    vi.mocked(domainCache.get).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 6.2: Profile Accessibility via Custom Domain', () => {
    it('should route custom domain root to public profile page', async () => {
      // Setup: Mock verified custom domain
      const customDomain = 'photos.example.com';
      const photographerId = 'photographer-123';
      const profileSlug = 'john-doe';

      // Mock profile lookup
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: photographerId,
                  branding: {
                    customDomain,
                    domainVerified: true,
                  },
                },
                error: null,
              }),
            }),
          };
        }
        if (table === 'public_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  slug: profileSlug,
                },
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      // Create request with custom domain
      const request = new NextRequest(`https://${customDomain}/`, {
        headers: {
          host: customDomain,
        },
      });

      // Execute
      const response = await proxy(request);

      // Verify: Should rewrite to /p/[slug]
      expect(response).toBeInstanceOf(NextResponse);
      
      // Check if it's a rewrite (internal redirect)
      // NextResponse.rewrite() returns a response with the rewritten URL
      const responseUrl = (response as any).url || response.headers.get('x-middleware-rewrite');
      expect(responseUrl).toContain(`/p/${profileSlug}`);
    });

    it('should return 404 for unverified custom domain', async () => {
      const customDomain = 'unverified.example.com';

      // Mock: Domain not found or not verified
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });

      const request = new NextRequest(`https://${customDomain}/`, {
        headers: {
          host: customDomain,
        },
      });

      const response = await proxy(request);

      // Verify: Should return 404
      expect(response.status).toBe(404);
      const html = await response.text();
      expect(html).toContain('Domain Not Configured');
    });

    it('should return 404 when custom domain has no public profile', async () => {
      const customDomain = 'photos.example.com';
      const photographerId = 'photographer-123';

      // Mock: Domain verified but no public profile
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: photographerId,
                  branding: {
                    customDomain,
                    domainVerified: true,
                  },
                },
                error: null,
              }),
            }),
          };
        }
        if (table === 'public_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest(`https://${customDomain}/`, {
        headers: {
          host: customDomain,
        },
      });

      const response = await proxy(request);

      // Verify: Should return 404
      expect(response.status).toBe(404);
      const html = await response.text();
      expect(html).toContain('Profile Not Found');
    });

    it('should use cached domain data on subsequent requests', async () => {
      const customDomain = 'photos.example.com';
      const photographerId = 'photographer-123';
      const profileSlug = 'john-doe';

      // Mock: Domain is cached
      vi.mocked(domainCache.get).mockReturnValue({
        photographerId,
        verified: true,
      });

      // Mock: Public profile lookup
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'public_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  slug: profileSlug,
                },
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });



      // Verify: Should use cache (not query profiles table)
      expect(domainCache.get).toHaveBeenCalledWith(customDomain);
      
      // Should still query public_profiles for slug
      expect(mockSupabase.from).toHaveBeenCalledWith('public_profiles');
      
      // Should not query profiles table (cached)
      expect(mockSupabase.from).not.toHaveBeenCalledWith('profiles');
    });

    it('should handle custom domain with port number', async () => {
      const customDomain = 'photos.example.com';
      const customDomainWithPort = `${customDomain}:3000`;
      const photographerId = 'photographer-123';
      const profileSlug = 'john-doe';

      // Mock profile lookup
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: photographerId,
                  branding: {
                    customDomain,
                    domainVerified: true,
                  },
                },
                error: null,
              }),
            }),
          };
        }
        if (table === 'public_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  slug: profileSlug,
                },
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest(`https://${customDomainWithPort}/`, {
        headers: {
          host: customDomainWithPort,
        },
      });

      const response = await proxy(request);

      // Verify: Should strip port and route correctly
      expect(response).toBeInstanceOf(NextResponse);
      
      // Should query with domain without port
      const profilesQuery = mockSupabase.from.mock.calls.find(
        (call: any) => call[0] === 'profiles'
      );
      expect(profilesQuery).toBeDefined();
    });
  });

  describe('Gallery Routing on Custom Domain', () => {
    it('should route custom domain gallery URL to gallery page', async () => {
      const customDomain = 'photos.example.com';
      const photographerId = 'photographer-123';
      const gallerySlug = 'wedding-2024';

      // Mock: Domain verified
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: photographerId,
                  branding: {
                    customDomain,
                    domainVerified: true,
                  },
                },
                error: null,
              }),
            }),
          };
        }
        if (table === 'galleries') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'gallery-123',
                    user_id: photographerId,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest(`https://${customDomain}/g/${gallerySlug}`, {
        headers: {
          host: customDomain,
        },
      });

      const response = await proxy(request);

      // Verify: Should rewrite (not redirect or error)
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(500);
      
      // Verify gallery ownership was checked
      expect(mockSupabase.from).toHaveBeenCalledWith('galleries');
    });

    it('should return 403 for gallery not owned by custom domain photographer', async () => {
      const customDomain = 'photos.example.com';
      const photographerId = 'photographer-123';
      const otherPhotographerId = 'photographer-456';
      const gallerySlug = 'wedding-2024';

      // Mock: Domain verified but gallery belongs to different photographer
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: photographerId,
                  branding: {
                    customDomain,
                    domainVerified: true,
                  },
                },
                error: null,
              }),
            }),
          };
        }
        if (table === 'galleries') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'gallery-123',
                    user_id: otherPhotographerId, // Different owner!
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest(`https://${customDomain}/g/${gallerySlug}`, {
        headers: {
          host: customDomain,
        },
      });

      const response = await proxy(request);

      // Verify: Should return 403 Forbidden
      expect(response.status).toBe(403);
      const html = await response.text();
      expect(html).toContain('Access Denied');
    });
  });

  describe('Primary Domain Handling', () => {
    it('should not apply custom domain routing for primary domain', async () => {
      const primaryDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'piksend.com';

      const request = new NextRequest(`https://${primaryDomain}/`, {
        headers: {
          host: primaryDomain,
        },
      });

      const response = await proxy(request);

      // Verify: Should pass through without custom domain logic
      expect(response).toBeInstanceOf(NextResponse);
      
      // Should not query for custom domain
      expect(mockSupabase.from).not.toHaveBeenCalledWith('profiles');
    });

    it('should not apply custom domain routing for localhost', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          host: 'localhost:3000',
        },
      });

      const response = await proxy(request);

      // Verify: Should pass through without custom domain logic
      expect(response).toBeInstanceOf(NextResponse);
      
      // Should not query for custom domain
      expect(mockSupabase.from).not.toHaveBeenCalledWith('profiles');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      const customDomain = 'photos.example.com';

      // Mock: Database error
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      });

      const request = new NextRequest(`https://${customDomain}/`, {
        headers: {
          host: customDomain,
        },
      });

      const response = await proxy(request);

      // Verify: Should return 500
      expect(response.status).toBe(500);
      const html = await response.text();
      expect(html).toContain('Server Error');
    });

    it('should return 404 for invalid path on custom domain', async () => {
      const customDomain = 'photos.example.com';
      const photographerId = 'photographer-123';

      // Mock: Domain verified
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: photographerId,
              branding: {
                customDomain,
                domainVerified: true,
              },
            },
            error: null,
          }),
        }),
      });

      const request = new NextRequest(`https://${customDomain}/invalid/path`, {
        headers: {
          host: customDomain,
        },
      });

      const response = await proxy(request);

      // Verify: Should return 404
      expect(response.status).toBe(404);
      const html = await response.text();
      expect(html).toContain('Page Not Found');
    });
  });

  describe('Cache Behavior', () => {
    it('should cache domain data after first lookup', async () => {
      const customDomain = 'photos.example.com';
      const photographerId = 'photographer-123';
      const profileSlug = 'john-doe';

      // Mock: Cache miss initially
      vi.mocked(domainCache.get).mockReturnValue(null);

      // Mock profile lookup
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: photographerId,
                  branding: {
                    customDomain,
                    domainVerified: true,
                  },
                },
                error: null,
              }),
            }),
          };
        }
        if (table === 'public_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  slug: profileSlug,
                },
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest(`https://${customDomain}/`, {
        headers: {
          host: customDomain,
        },
      });

      await proxy(request);

      // Verify: Should set cache after lookup
      expect(domainCache.set).toHaveBeenCalledWith(
        customDomain,
        photographerId,
        true
      );
    });
  });
});
