/**
 * Integration tests for sitemap generation
 * Validates: Requirements 8.9, 8.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MetadataRoute } from 'next';

// Mock the dependencies
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/utils/seo.utils', () => ({
  SEOGenerator: {
    generateSitemapEntry: vi.fn(),
  },
}));

describe('Sitemap Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include public profiles in sitemap', async () => {
    const { createAdminClient } = await import('@/lib/supabase/server');
    const { SEOGenerator } = await import('@/lib/utils/seo.utils');
    
    // Mock Supabase response
    const mockProfiles = [
      { slug: 'john-doe', updated_at: '2024-01-15T10:00:00Z' },
      { slug: 'jane-smith', updated_at: '2024-01-20T15:30:00Z' },
    ];
    
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
    
    // Mock SEOGenerator responses
    vi.mocked(SEOGenerator.generateSitemapEntry)
      .mockReturnValueOnce({
        url: 'https://piksend.com/p/john-doe',
        lastmod: '2024-01-15T10:00:00.000Z',
        changefreq: 'weekly',
        priority: 0.8,
      })
      .mockReturnValueOnce({
        url: 'https://piksend.com/p/jane-smith',
        lastmod: '2024-01-20T15:30:00.000Z',
        changefreq: 'weekly',
        priority: 0.8,
      });
    
    // Import and call sitemap function
    const sitemap = (await import('../sitemap')).default;
    const result = await sitemap();
    
    // Verify Supabase was called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith('public_profiles');
    expect(mockSupabase.select).toHaveBeenCalledWith('slug, updated_at');
    expect(mockSupabase.eq).toHaveBeenCalledWith('is_enabled', true);
    
    // Verify SEOGenerator was called for each profile
    expect(SEOGenerator.generateSitemapEntry).toHaveBeenCalledTimes(2);
    
    // Verify result includes public profiles
    const profileUrls = result
      .filter((entry) => entry.url.includes('/p/'))
      .map((entry) => entry.url);
    
    expect(profileUrls).toContain('https://piksend.com/p/john-doe');
    expect(profileUrls).toContain('https://piksend.com/p/jane-smith');
  });

  it('should set correct priority for public profiles', async () => {
    const { createAdminClient } = await import('@/lib/supabase/server');
    const { SEOGenerator } = await import('@/lib/utils/seo.utils');
    
    const mockProfiles = [
      { slug: 'photographer', updated_at: '2024-01-15T10:00:00Z' },
    ];
    
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
    
    vi.mocked(SEOGenerator.generateSitemapEntry).mockReturnValue({
      url: 'https://piksend.com/p/photographer',
      lastmod: '2024-01-15T10:00:00.000Z',
      changefreq: 'weekly',
      priority: 0.8,
    });
    
    const sitemap = (await import('../sitemap')).default;
    const result = await sitemap();
    
    const profileEntry = result.find((entry) => entry.url.includes('/p/photographer'));
    
    expect(profileEntry).toBeDefined();
    expect(profileEntry?.priority).toBe(0.8);
  });

  it('should set weekly change frequency for public profiles', async () => {
    const { createAdminClient } = await import('@/lib/supabase/server');
    const { SEOGenerator } = await import('@/lib/utils/seo.utils');
    
    const mockProfiles = [
      { slug: 'photographer', updated_at: '2024-01-15T10:00:00Z' },
    ];
    
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
    
    vi.mocked(SEOGenerator.generateSitemapEntry).mockReturnValue({
      url: 'https://piksend.com/p/photographer',
      lastmod: '2024-01-15T10:00:00.000Z',
      changefreq: 'weekly',
      priority: 0.8,
    });
    
    const sitemap = (await import('../sitemap')).default;
    const result = await sitemap();
    
    const profileEntry = result.find((entry) => entry.url.includes('/p/photographer'));
    
    expect(profileEntry).toBeDefined();
    expect(profileEntry?.changeFrequency).toBe('weekly');
  });

  it('should use updated_at for lastModified', async () => {
    const { createAdminClient } = await import('@/lib/supabase/server');
    const { SEOGenerator } = await import('@/lib/utils/seo.utils');
    
    const updatedDate = '2024-01-15T10:00:00Z';
    const mockProfiles = [
      { slug: 'photographer', updated_at: updatedDate },
    ];
    
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
    
    vi.mocked(SEOGenerator.generateSitemapEntry).mockReturnValue({
      url: 'https://piksend.com/p/photographer',
      lastmod: updatedDate,
      changefreq: 'weekly',
      priority: 0.8,
    });
    
    const sitemap = (await import('../sitemap')).default;
    const result = await sitemap();
    
    const profileEntry = result.find((entry) => entry.url.includes('/p/photographer'));
    
    expect(profileEntry).toBeDefined();
    expect(profileEntry?.lastModified).toEqual(new Date(updatedDate));
  });

  it('should handle database errors gracefully', async () => {
    const { createAdminClient } = await import('@/lib/supabase/server');
    
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      }),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
    
    const sitemap = (await import('../sitemap')).default;
    const result = await sitemap();
    
    // Should still return static pages even if profiles fail
    expect(result.length).toBeGreaterThan(0);
    
    // Should not include any profile pages
    const profileUrls = result.filter((entry) => entry.url.includes('/p/'));
    expect(profileUrls).toHaveLength(0);
  });

  it('should only include enabled profiles', async () => {
    const { createAdminClient } = await import('@/lib/supabase/server');
    
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);
    
    const sitemap = (await import('../sitemap')).default;
    await sitemap();
    
    // Verify that we filter by is_enabled = true
    expect(mockSupabase.eq).toHaveBeenCalledWith('is_enabled', true);
  });
});
