/**
 * Unit Tests for PublicProfileService
 * 
 * Tests specific examples and edge cases for the service.
 * Validates Requirements 1.1, 1.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicProfileService } from '../public-profile.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Mock repositories
const mockProfileRepo = {
  findBySlug: vi.fn(),
  findByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  incrementViewsCount: vi.fn(),
};

const mockUserProfileRepo = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  incrementStorage: vi.fn(),
  decrementStorage: vi.fn(),
};

const mockGalleryRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findBySlug: vi.fn(),
  findByUserId: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  countByUserId: vi.fn(),
  incrementViewCount: vi.fn(),
  generateUniqueSlug: vi.fn(),
};

// Mock Supabase client
const mockSupabase = {} as SupabaseClient<Database>;

describe('PublicProfileService - Unit Tests', () => {
  let service: PublicProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PublicProfileService(mockSupabase);
    
    // Inject mocked repositories
    (service as any).profileRepo = mockProfileRepo;
    (service as any).userProfileRepo = mockUserProfileRepo;
    (service as any).galleryRepo = mockGalleryRepo;
  });

  describe('upsertProfile - Pro Plan Restriction (Requirement 1.1)', () => {
    it('should reject profile creation for non-Pro users', async () => {
      // Mock user with free plan
      mockUserProfileRepo.findById.mockResolvedValue({
        id: 'user-123',
        subscription_plan: 'free',
      });

      const profileData = {
        slug: 'john-doe',
        displayName: 'John Doe',
        isEnabled: true,
      };

      await expect(
        service.upsertProfile('user-123', profileData)
      ).rejects.toThrow('Cette fonctionnalité est réservée aux utilisateurs Pro');

      // Should not attempt to create profile
      expect(mockProfileRepo.create).not.toHaveBeenCalled();
      expect(mockProfileRepo.update).not.toHaveBeenCalled();
    });

    it('should reject profile creation for premium users', async () => {
      // Mock user with premium plan (not Pro)
      mockUserProfileRepo.findById.mockResolvedValue({
        id: 'user-123',
        subscription_plan: 'premium',
      });

      const profileData = {
        slug: 'john-doe',
        displayName: 'John Doe',
        isEnabled: true,
      };

      await expect(
        service.upsertProfile('user-123', profileData)
      ).rejects.toThrow('Cette fonctionnalité est réservée aux utilisateurs Pro');
    });

    it('should allow profile creation for Pro users', async () => {
      // Mock user with Pro plan
      mockUserProfileRepo.findById.mockResolvedValue({
        id: 'user-123',
        subscription_plan: 'pro',
      });

      // Mock no existing profile
      mockProfileRepo.findBySlug.mockResolvedValue(null);
      mockProfileRepo.findByUserId.mockResolvedValue(null);

      // Mock successful creation
      const createdProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        slug: 'john-doe',
        display_name: 'John Doe',
        is_enabled: true,
        views_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProfileRepo.create.mockResolvedValue(createdProfile);

      const profileData = {
        slug: 'john-doe',
        displayName: 'John Doe',
        isEnabled: true,
      };

      const result = await service.upsertProfile('user-123', profileData);

      expect(result).toBeDefined();
      expect(result.slug).toBe('john-doe');
      expect(mockProfileRepo.create).toHaveBeenCalled();
    });

    it('should reject when user does not exist', async () => {
      // Mock user not found
      mockUserProfileRepo.findById.mockResolvedValue(null);

      const profileData = {
        slug: 'john-doe',
        displayName: 'John Doe',
        isEnabled: true,
      };

      await expect(
        service.upsertProfile('non-existent-user', profileData)
      ).rejects.toThrow('Cette fonctionnalité est réservée aux utilisateurs Pro');
    });
  });

  describe('upsertProfile - Slug Uniqueness (Requirement 1.3)', () => {
    beforeEach(() => {
      // Mock Pro user for all tests in this suite
      mockUserProfileRepo.findById.mockResolvedValue({
        id: 'user-123',
        subscription_plan: 'pro',
      });
    });

    it('should reject slug already taken by another user', async () => {
      // Mock existing profile with different user
      mockProfileRepo.findBySlug.mockResolvedValue({
        id: 'profile-456',
        user_id: 'other-user',
        slug: 'john-doe',
      });

      const profileData = {
        slug: 'john-doe',
        displayName: 'John Doe',
        isEnabled: true,
      };

      await expect(
        service.upsertProfile('user-123', profileData)
      ).rejects.toThrow('Ce slug est déjà utilisé');

      expect(mockProfileRepo.create).not.toHaveBeenCalled();
    });

    it('should allow slug if it belongs to current user', async () => {
      // Mock existing profile with same user
      mockProfileRepo.findBySlug.mockResolvedValue({
        id: 'profile-123',
        user_id: 'user-123',
        slug: 'john-doe',
      });

      // Mock existing user profile
      mockProfileRepo.findByUserId.mockResolvedValue({
        id: 'profile-123',
        user_id: 'user-123',
        slug: 'john-doe',
      });

      // Mock successful update
      const updatedProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        slug: 'john-doe',
        display_name: 'John Doe Updated',
        is_enabled: true,
        views_count: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProfileRepo.update.mockResolvedValue(updatedProfile);

      const profileData = {
        slug: 'john-doe',
        displayName: 'John Doe Updated',
        isEnabled: true,
      };

      const result = await service.upsertProfile('user-123', profileData);

      expect(result).toBeDefined();
      expect(result.displayName).toBe('John Doe Updated');
      expect(mockProfileRepo.update).toHaveBeenCalled();
    });

    it('should allow new unique slug', async () => {
      // Mock no existing profile with this slug
      mockProfileRepo.findBySlug.mockResolvedValue(null);
      mockProfileRepo.findByUserId.mockResolvedValue(null);

      // Mock successful creation
      const createdProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        slug: 'unique-slug',
        display_name: 'John Doe',
        is_enabled: true,
        views_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProfileRepo.create.mockResolvedValue(createdProfile);

      const profileData = {
        slug: 'unique-slug',
        displayName: 'John Doe',
        isEnabled: true,
      };

      const result = await service.upsertProfile('user-123', profileData);

      expect(result).toBeDefined();
      expect(result.slug).toBe('unique-slug');
      expect(mockProfileRepo.create).toHaveBeenCalled();
    });
  });

  describe('checkSlugAvailability (Requirement 1.5)', () => {
    it('should return unavailable for reserved slugs', async () => {
      const result = await service.checkSlugAvailability('admin');

      expect(result.available).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toHaveLength(4);
      expect(mockProfileRepo.findBySlug).not.toHaveBeenCalled();
    });

    it('should return available for non-existent slug', async () => {
      mockProfileRepo.findBySlug.mockResolvedValue(null);

      const result = await service.checkSlugAvailability('unique-slug');

      expect(result.available).toBe(true);
      expect(result.suggestions).toBeUndefined();
    });

    it('should return unavailable for taken slug', async () => {
      mockProfileRepo.findBySlug.mockResolvedValue({
        id: 'profile-123',
        user_id: 'other-user',
        slug: 'taken-slug',
      });

      const result = await service.checkSlugAvailability('taken-slug');

      expect(result.available).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toHaveLength(4);
    });

    it('should return available if slug belongs to current user', async () => {
      mockProfileRepo.findBySlug.mockResolvedValue({
        id: 'profile-123',
        user_id: 'user-123',
        slug: 'my-slug',
      });

      const result = await service.checkSlugAvailability('my-slug', 'user-123');

      expect(result.available).toBe(true);
      expect(result.suggestions).toBeUndefined();
    });
  });

  describe('generateSlugSuggestions (Requirement 1.5)', () => {
    it('should generate 4 suggestions', () => {
      const suggestions = service.generateSlugSuggestions('john-doe');

      expect(suggestions).toHaveLength(4);
    });

    it('should include numeric suffixes', () => {
      const suggestions = service.generateSlugSuggestions('john-doe');

      expect(suggestions).toContain('john-doe-1');
      expect(suggestions).toContain('john-doe-2');
      expect(suggestions).toContain('john-doe-3');
    });

    it('should include year suffix', () => {
      const suggestions = service.generateSlugSuggestions('john-doe');
      const currentYear = new Date().getFullYear();

      expect(suggestions).toContain(`john-doe-${currentYear}`);
    });

    it('should normalize base slug before generating suggestions', () => {
      const suggestions = service.generateSlugSuggestions('John Doe');

      // Should normalize to lowercase and replace spaces
      expect(suggestions[0]).toBe('john-doe-1');
      expect(suggestions[1]).toBe('john-doe-2');
      expect(suggestions[2]).toBe('john-doe-3');
    });

    it('should handle slugs with special characters', () => {
      const suggestions = service.generateSlugSuggestions('Jean-François');

      // Should normalize accents
      expect(suggestions[0]).toBe('jean-francois-1');
    });
  });

  describe('getProfileBySlug - Pro Plan Verification (Requirement 1.1)', () => {
    it('should return null if user is not Pro', async () => {
      // Mock profile exists and is enabled
      mockProfileRepo.findBySlug.mockResolvedValue({
        id: 'profile-123',
        user_id: 'user-123',
        slug: 'john-doe',
        is_enabled: true,
      });

      // Mock user with free plan
      mockUserProfileRepo.findById.mockResolvedValue({
        id: 'user-123',
        subscription_plan: 'free',
      });

      const result = await service.getProfileBySlug('john-doe');

      expect(result).toBeNull();
    });

    it('should return null if profile is disabled', async () => {
      // Mock profile exists but is disabled
      mockProfileRepo.findBySlug.mockResolvedValue({
        id: 'profile-123',
        user_id: 'user-123',
        slug: 'john-doe',
        is_enabled: false,
      });

      const result = await service.getProfileBySlug('john-doe');

      expect(result).toBeNull();
      // Should not check user plan if profile is disabled
      expect(mockUserProfileRepo.findById).not.toHaveBeenCalled();
    });

    it('should return null if profile does not exist', async () => {
      mockProfileRepo.findBySlug.mockResolvedValue(null);

      const result = await service.getProfileBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty slug in checkSlugAvailability', async () => {
      mockProfileRepo.findBySlug.mockResolvedValue(null);

      const result = await service.checkSlugAvailability('');

      // Empty slug should be available (will be rejected by validation)
      expect(result.available).toBe(true);
    });

    it('should handle very long slugs in suggestions', () => {
      const longSlug = 'a'.repeat(95); // Close to 100 char limit
      const suggestions = service.generateSlugSuggestions(longSlug);

      // All suggestions should be valid (≤ 100 chars)
      suggestions.forEach((suggestion) => {
        expect(suggestion.length).toBeLessThanOrEqual(100);
      });
    });

    it('should handle slugs with multiple consecutive spaces', () => {
      const suggestions = service.generateSlugSuggestions('john    doe');

      // Should normalize to single hyphen
      expect(suggestions[0]).toBe('john-doe-1');
    });

    it('should handle slugs with leading/trailing spaces', () => {
      const suggestions = service.generateSlugSuggestions('  john-doe  ');

      // Should trim spaces
      expect(suggestions[0]).toBe('john-doe-1');
    });
  });

  describe('filterPublicGalleries (Requirements 3.1, 3.2, 3.3, 3.4, 3.5)', () => {
    it('should filter out inactive galleries', async () => {
      const galleries = [
        {
          id: 'gallery-1',
          user_id: 'user-123',
          title: 'Active Gallery',
          unique_slug: 'active-gallery',
          is_active: true,
          expires_at: null,
          created_at: new Date().toISOString(),
          images: [],
        },
        {
          id: 'gallery-2',
          user_id: 'user-123',
          title: 'Inactive Gallery',
          unique_slug: 'inactive-gallery',
          is_active: false,
          expires_at: null,
          created_at: new Date().toISOString(),
          images: [],
        },
      ];

      mockGalleryRepo.findByUserId.mockResolvedValue(galleries);

      const result = await service.filterPublicGalleries('user-123');

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Active Gallery');
    });

    it('should filter out expired galleries', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const galleries = [
        {
          id: 'gallery-1',
          user_id: 'user-123',
          title: 'Valid Gallery',
          unique_slug: 'valid-gallery',
          is_active: true,
          expires_at: tomorrow.toISOString(),
          created_at: new Date().toISOString(),
          images: [],
        },
        {
          id: 'gallery-2',
          user_id: 'user-123',
          title: 'Expired Gallery',
          unique_slug: 'expired-gallery',
          is_active: true,
          expires_at: yesterday.toISOString(),
          created_at: new Date().toISOString(),
          images: [],
        },
      ];

      mockGalleryRepo.findByUserId.mockResolvedValue(galleries);

      const result = await service.filterPublicGalleries('user-123');

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Valid Gallery');
    });

    it('should include galleries with null expires_at', async () => {
      const galleries = [
        {
          id: 'gallery-1',
          user_id: 'user-123',
          title: 'Never Expires',
          unique_slug: 'never-expires',
          is_active: true,
          expires_at: null,
          created_at: new Date().toISOString(),
          images: [],
        },
      ];

      mockGalleryRepo.findByUserId.mockResolvedValue(galleries);

      const result = await service.filterPublicGalleries('user-123');

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Never Expires');
    });

    it('should filter out hidden galleries', async () => {
      const galleries = [
        {
          id: 'gallery-1',
          user_id: 'user-123',
          title: 'Visible Gallery',
          unique_slug: 'visible-gallery',
          is_active: true,
          expires_at: null,
          created_at: new Date().toISOString(),
          images: [],
        },
        {
          id: 'gallery-2',
          user_id: 'user-123',
          title: 'Hidden Gallery',
          unique_slug: 'hidden-gallery',
          is_active: true,
          expires_at: null,
          created_at: new Date().toISOString(),
          images: [],
        },
      ];

      mockGalleryRepo.findByUserId.mockResolvedValue(galleries);

      const result = await service.filterPublicGalleries('user-123', ['gallery-2']);

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Visible Gallery');
    });

    it('should set isNew to true for galleries created less than 7 days ago', async () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const galleries = [
        {
          id: 'gallery-1',
          user_id: 'user-123',
          title: 'New Gallery',
          unique_slug: 'new-gallery',
          is_active: true,
          expires_at: null,
          created_at: fiveDaysAgo.toISOString(),
          images: [],
        },
      ];

      mockGalleryRepo.findByUserId.mockResolvedValue(galleries);

      const result = await service.filterPublicGalleries('user-123');

      expect(result).toHaveLength(1);
      expect(result[0]?.isNew).toBe(true);
    });

    it('should set isNew to false for galleries created more than 7 days ago', async () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const galleries = [
        {
          id: 'gallery-1',
          user_id: 'user-123',
          title: 'Old Gallery',
          unique_slug: 'old-gallery',
          is_active: true,
          expires_at: null,
          created_at: tenDaysAgo.toISOString(),
          images: [],
        },
      ];

      mockGalleryRepo.findByUserId.mockResolvedValue(galleries);

      const result = await service.filterPublicGalleries('user-123');

      expect(result).toHaveLength(1);
      expect(result[0]?.isNew).toBe(false);
    });

    it('should apply all filters together', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const galleries = [
        {
          id: 'gallery-1',
          user_id: 'user-123',
          title: 'Valid Gallery',
          unique_slug: 'valid-gallery',
          is_active: true,
          expires_at: tomorrow.toISOString(),
          created_at: fiveDaysAgo.toISOString(),
          images: [{ id: 'img-1', cloudinary_url: 'http://example.com/img1.jpg', order_index: 0 }],
        },
        {
          id: 'gallery-2',
          user_id: 'user-123',
          title: 'Inactive Gallery',
          unique_slug: 'inactive-gallery',
          is_active: false,
          expires_at: null,
          created_at: new Date().toISOString(),
          images: [],
        },
        {
          id: 'gallery-3',
          user_id: 'user-123',
          title: 'Expired Gallery',
          unique_slug: 'expired-gallery',
          is_active: true,
          expires_at: yesterday.toISOString(),
          created_at: new Date().toISOString(),
          images: [],
        },
        {
          id: 'gallery-4',
          user_id: 'user-123',
          title: 'Hidden Gallery',
          unique_slug: 'hidden-gallery',
          is_active: true,
          expires_at: null,
          created_at: new Date().toISOString(),
          images: [],
        },
      ];

      mockGalleryRepo.findByUserId.mockResolvedValue(galleries);

      const result = await service.filterPublicGalleries('user-123', ['gallery-4']);

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Valid Gallery');
      expect(result[0]?.isNew).toBe(true);
      expect(result[0]?.coverImageUrl).toBe('http://example.com/img1.jpg');
      expect(result[0]?.imageCount).toBe(1);
    });
  });
});
