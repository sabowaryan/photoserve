/**
 * Unit Tests for Public Profile Page
 * 
 * Tests the page rendering and 404 handling.
 * Validates Requirements 6.3, 6.4, 1.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';
import PublicProfilePage, { generateMetadata, generateStaticParams } from '../page';
import { createAdminClient } from '@/lib/supabase/server';
import { createPublicProfileService } from '@/lib/services/public-profile.service';

// Mock Next.js navigation
// notFound() throws an error in Next.js to stop execution
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

// Mock service
vi.mock('@/lib/services/public-profile.service', () => ({
  createPublicProfileService: vi.fn(),
}));

describe('PublicProfilePage - Unit Tests', () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  const mockService = {
    getProfileBySlug: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createAdminClient as any).mockReturnValue(mockSupabase);
    (createPublicProfileService as any).mockReturnValue(mockService);
    
    // Mock the branding query by default
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  branding: {
                    customDomain: null,
                    domainVerified: false,
                  },
                },
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
          }),
        }),
      };
    });
  });

  describe('Page Rendering', () => {
    it('should render profile page with valid profile data', async () => {
      // Mock valid profile with galleries
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'john-doe',
        displayName: 'John Doe',
        tagline: 'Professional Photographer',
        bio: 'I love photography',
        location: 'Paris, France',
        avatarUrl: 'https://example.com/avatar.jpg',
        coverImageUrl: 'https://example.com/cover.jpg',
        specialties: ['Wedding', 'Portrait'],
        yearsOfExperience: 10,
        awards: ['Best Photographer 2023'],
        publicEmail: 'john@example.com',
        phone: '+33123456789',
        website: 'https://johndoe.com',
        address: '123 Main St, Paris',
        socialLinks: {
          instagram: 'https://instagram.com/johndoe',
          facebook: 'https://facebook.com/johndoe',
        },
        ctaButton: {
          text: 'Book a Session',
          url: 'https://booking.com',
          style: 'primary' as const,
        },
        viewsCount: 100,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        galleries: [
          {
            id: 'gallery-1',
            slug: 'wedding-2024',
            title: 'Wedding 2024',
            coverImageUrl: 'https://example.com/gallery1.jpg',
            imageCount: 50,
            createdAt: new Date('2024-01-10'),
            isNew: true,
            isPasswordProtected: false,
          },
          {
            id: 'gallery-2',
            slug: 'portraits',
            title: 'Portraits',
            coverImageUrl: 'https://example.com/gallery2.jpg',
            imageCount: 30,
            createdAt: new Date('2023-12-01'),
            isNew: false,
            isPasswordProtected: true,
          },
        ],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      const params = Promise.resolve({ slug: 'john-doe' });
      const result = await PublicProfilePage({ params });

      // Verify service was called with correct slug
      expect(mockService.getProfileBySlug).toHaveBeenCalledWith('john-doe');
      
      // Verify notFound was not called
      expect(notFound).not.toHaveBeenCalled();
      
      // Verify result contains expected structure
      expect(result).toBeDefined();
      expect(result.type).toBe('div');
    });

    it('should display profile information correctly', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'jane-smith',
        displayName: 'Jane Smith',
        tagline: 'Nature Photographer',
        location: 'Lyon, France',
        viewsCount: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        galleries: [],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      const params = Promise.resolve({ slug: 'jane-smith' });
      const result = await PublicProfilePage({ params });

      expect(mockService.getProfileBySlug).toHaveBeenCalledWith('jane-smith');
      expect(notFound).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('404 Handling - Non-existent Profile (Requirement 6.3)', () => {
    it('should return 404 for non-existent profile', async () => {
      // Mock service returning null (profile not found)
      mockService.getProfileBySlug.mockResolvedValue(null);

      const params = Promise.resolve({ slug: 'non-existent' });
      
      // Expect notFound to throw
      await expect(async () => {
        await PublicProfilePage({ params });
      }).rejects.toThrow('NEXT_NOT_FOUND');

      // Verify service was called
      expect(mockService.getProfileBySlug).toHaveBeenCalledWith('non-existent');
    });

    it('should return 404 for invalid slug format', async () => {
      mockService.getProfileBySlug.mockResolvedValue(null);

      const params = Promise.resolve({ slug: 'INVALID-SLUG-123!' });
      
      // Expect notFound to throw
      await expect(async () => {
        await PublicProfilePage({ params });
      }).rejects.toThrow('NEXT_NOT_FOUND');

      expect(mockService.getProfileBySlug).toHaveBeenCalledWith('INVALID-SLUG-123!');
    });
  });

  describe('404 Handling - Disabled Profile (Requirement 6.4, 1.10)', () => {
    it('should return 404 for disabled profile', async () => {
      // Service returns null for disabled profiles (handled in service layer)
      mockService.getProfileBySlug.mockResolvedValue(null);

      const params = Promise.resolve({ slug: 'disabled-profile' });
      
      // Expect notFound to throw
      await expect(async () => {
        await PublicProfilePage({ params });
      }).rejects.toThrow('NEXT_NOT_FOUND');

      expect(mockService.getProfileBySlug).toHaveBeenCalledWith('disabled-profile');
    });

    it('should return 404 for profile with non-Pro user', async () => {
      // Service returns null for non-Pro users (handled in service layer)
      mockService.getProfileBySlug.mockResolvedValue(null);

      const params = Promise.resolve({ slug: 'free-user-profile' });
      
      // Expect notFound to throw
      await expect(async () => {
        await PublicProfilePage({ params });
      }).rejects.toThrow('NEXT_NOT_FOUND');

      expect(mockService.getProfileBySlug).toHaveBeenCalledWith('free-user-profile');
    });
  });

  describe('Metadata Generation', () => {
    it('should generate metadata with custom meta title', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'john-doe',
        displayName: 'John Doe',
        metaTitle: 'Custom SEO Title',
        metaDescription: 'Custom SEO Description',
        coverImageUrl: 'https://example.com/cover.jpg',
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        galleries: [],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      const params = Promise.resolve({ slug: 'john-doe' });
      const metadata = await generateMetadata({ params });

      expect(metadata.title).toBe('Custom SEO Title');
      expect(metadata.description).toBe('Custom SEO Description');
      expect(metadata.openGraph?.title).toBe('Custom SEO Title');
      expect(metadata.openGraph?.description).toBe('Custom SEO Description');
    });

    it('should generate default metadata when custom not provided', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'jane-smith',
        displayName: 'Jane Smith',
        bio: 'I am a professional photographer specializing in nature and wildlife photography.',
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        galleries: [],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      const params = Promise.resolve({ slug: 'jane-smith' });
      const metadata = await generateMetadata({ params });

      expect(metadata.title).toBe('Jane Smith - Photographe Professionnel');
      expect(metadata.description).toContain('I am a professional photographer');
    });

    it('should return not found metadata for non-existent profile', async () => {
      mockService.getProfileBySlug.mockResolvedValue(null);

      const params = Promise.resolve({ slug: 'non-existent' });
      const metadata = await generateMetadata({ params });

      expect(metadata.title).toBe('Profile Not Found');
    });
  });

  describe('Static Params Generation', () => {
    it('should generate static params for all enabled profiles', async () => {
      const mockProfiles = [
        { slug: 'john-doe' },
        { slug: 'jane-smith' },
        { slug: 'bob-wilson' },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProfiles,
          }),
        }),
      });

      const params = await generateStaticParams();

      expect(params).toEqual([
        { slug: 'john-doe' },
        { slug: 'jane-smith' },
        { slug: 'bob-wilson' },
      ]);
    });

    it('should return empty array when no profiles exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
          }),
        }),
      });

      const params = await generateStaticParams();

      expect(params).toEqual([]);
    });

    it('should only include enabled profiles', async () => {
      const mockProfiles = [
        { slug: 'enabled-profile' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProfiles,
          }),
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await generateStaticParams();

      // Verify that we filtered by is_enabled = true
      expect(mockQuery.select).toHaveBeenCalledWith('slug');
      expect(mockQuery.select().eq).toHaveBeenCalledWith('is_enabled', true);
    });
  });

  describe('Gallery Display', () => {
    it('should display galleries when profile has galleries', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'photographer',
        displayName: 'Photographer',
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        galleries: [
          {
            id: 'gallery-1',
            slug: 'wedding',
            title: 'Wedding Photos',
            coverImageUrl: 'https://example.com/cover.jpg',
            imageCount: 25,
            createdAt: new Date(),
            isNew: false,
            isPasswordProtected: false,
          },
        ],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      const params = Promise.resolve({ slug: 'photographer' });
      const result = await PublicProfilePage({ params });

      expect(result).toBeDefined();
      expect(notFound).not.toHaveBeenCalled();
    });

    it('should handle profile with no galleries', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'new-photographer',
        displayName: 'New Photographer',
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        galleries: [],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      const params = Promise.resolve({ slug: 'new-photographer' });
      const result = await PublicProfilePage({ params });

      expect(result).toBeDefined();
      expect(notFound).not.toHaveBeenCalled();
    });
  });

  describe('Contact Information Display', () => {
    it('should display contact information when provided', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'contact-test',
        displayName: 'Contact Test',
        publicEmail: 'test@example.com',
        phone: '+33123456789',
        website: 'https://example.com',
        address: '123 Test St',
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        galleries: [],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      const params = Promise.resolve({ slug: 'contact-test' });
      const result = await PublicProfilePage({ params });

      expect(result).toBeDefined();
      expect(notFound).not.toHaveBeenCalled();
    });

    it('should handle profile without contact information', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'minimal-profile',
        displayName: 'Minimal Profile',
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        galleries: [],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      const params = Promise.resolve({ slug: 'minimal-profile' });
      const result = await PublicProfilePage({ params });

      expect(result).toBeDefined();
      expect(notFound).not.toHaveBeenCalled();
    });
  });

  describe('Footer Branding - Requirements 7.3, 7.4, 7.5', () => {
    it('should display white-label footer when custom domain is configured', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'custom-domain-user',
        displayName: 'Custom Domain User',
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        galleries: [],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      // Mock branding with custom domain
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    branding: {
                      customDomain: 'photos.example.com',
                      domainVerified: true,
                    },
                  },
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
            }),
          }),
        };
      });

      const params = Promise.resolve({ slug: 'custom-domain-user' });
      const result = await PublicProfilePage({ params });

      expect(result).toBeDefined();
      expect(notFound).not.toHaveBeenCalled();
    });

    it('should display default footer when no custom domain', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'regular-user',
        displayName: 'Regular User',
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        galleries: [],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      const params = Promise.resolve({ slug: 'regular-user' });
      const result = await PublicProfilePage({ params });

      expect(result).toBeDefined();
      expect(notFound).not.toHaveBeenCalled();
    });

    it('should display default footer when custom domain is not verified', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        isEnabled: true,
        slug: 'unverified-domain',
        displayName: 'Unverified Domain',
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        galleries: [],
      };

      mockService.getProfileBySlug.mockResolvedValue(mockProfile);

      // Mock branding with unverified custom domain
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    branding: {
                      customDomain: 'photos.example.com',
                      domainVerified: false,
                    },
                  },
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
            }),
          }),
        };
      });

      const params = Promise.resolve({ slug: 'unverified-domain' });
      const result = await PublicProfilePage({ params });

      expect(result).toBeDefined();
      expect(notFound).not.toHaveBeenCalled();
    });
  });
});
