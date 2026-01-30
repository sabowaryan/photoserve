/**
 * Cache Invalidation Tests for Public Profile API
 * 
 * Tests that cache invalidation works correctly when profiles are updated.
 * 
 * Requirements:
 * - 12.6: Implement cache invalidation when profile is updated
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from '../route';
import * as auth from '@/lib/auth';
import * as publicProfileService from '@/lib/services/public-profile.service';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/services/public-profile.service', () => ({
  createPublicProfileService: vi.fn(),
}));

vi.mock('@/lib/api/error-handler', () => ({
  handleApiError: vi.fn((error) => {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }),
}));

describe('Public Profile API - Cache Invalidation', () => {
  const mockUserId = 'user-123';
  const mockSupabase = {
    from: vi.fn(),
  };

  const mockService = {
    upsertProfile: vi.fn(),
    generateSlugSuggestions: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(auth.requireSupabaseClient).mockResolvedValue({
      supabase: mockSupabase as any,
      userId: mockUserId,
      hasRLS: false,
    });

    vi.mocked(publicProfileService.createPublicProfileService).mockReturnValue(mockService as any);
  });

  describe('Cache Invalidation on Profile Update', () => {
    it('should invalidate profile page cache when profile is updated', async () => {
      // Arrange
      const profileData = {
        slug: 'john-doe',
        displayName: 'John Doe',
        isEnabled: true,
      };

      mockService.upsertProfile.mockResolvedValue({
        id: 'profile-123',
        userId: mockUserId,
        ...profileData,
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/public-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      // Act
      await PUT(request);

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/p/john-doe');
    });

    it('should invalidate sitemap cache when profile is updated', async () => {
      // Arrange
      const profileData = {
        slug: 'jane-smith',
        displayName: 'Jane Smith',
        isEnabled: true,
      };

      mockService.upsertProfile.mockResolvedValue({
        id: 'profile-456',
        userId: mockUserId,
        ...profileData,
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/public-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      // Act
      await PUT(request);

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
    });

    it('should invalidate cache when profile is disabled', async () => {
      // Arrange
      const profileData = {
        slug: 'disabled-profile',
        displayName: 'Disabled Profile',
        isEnabled: false, // Disabling the profile
      };

      mockService.upsertProfile.mockResolvedValue({
        id: 'profile-789',
        userId: mockUserId,
        ...profileData,
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/public-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      // Act
      await PUT(request);

      // Assert
      // Cache should be invalidated even when disabling
      expect(revalidatePath).toHaveBeenCalledWith('/p/disabled-profile');
      expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
    });

    it('should invalidate cache when slug is changed', async () => {
      // Arrange
      const profileData = {
        slug: 'new-slug',
        displayName: 'Changed Slug',
        isEnabled: true,
      };

      mockService.upsertProfile.mockResolvedValue({
        id: 'profile-999',
        userId: mockUserId,
        ...profileData,
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/public-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      // Act
      await PUT(request);

      // Assert
      // New slug path should be invalidated
      expect(revalidatePath).toHaveBeenCalledWith('/p/new-slug');
      // Sitemap should be invalidated to reflect the change
      expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
    });

    it('should not invalidate cache if profile update fails', async () => {
      // Arrange
      const profileData = {
        slug: 'failing-profile',
        displayName: 'Failing Profile',
        isEnabled: true,
      };

      mockService.upsertProfile.mockRejectedValue(
        new Error('Database error')
      );

      const request = new Request('http://localhost:3000/api/public-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      // Act
      await PUT(request);

      // Assert
      // Cache should NOT be invalidated if update fails
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should not invalidate cache if validation fails', async () => {
      // Arrange
      const invalidData = {
        slug: 'INVALID-SLUG', // Invalid: contains uppercase
        displayName: 'Invalid',
        isEnabled: true,
      };

      const request = new Request('http://localhost:3000/api/public-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      // Act
      await PUT(request);

      // Assert
      // Cache should NOT be invalidated if validation fails
      expect(revalidatePath).not.toHaveBeenCalled();
      // Service should not be called
      expect(mockService.upsertProfile).not.toHaveBeenCalled();
    });
  });

  describe('Cache Invalidation Timing', () => {
    it('should invalidate cache after successful database update', async () => {
      // Arrange
      const profileData = {
        slug: 'timing-test',
        displayName: 'Timing Test',
        isEnabled: true,
      };

      let updateCompleted = false;
      mockService.upsertProfile.mockImplementation(async () => {
        // Simulate database update
        await new Promise(resolve => setTimeout(resolve, 10));
        updateCompleted = true;
        return {
          id: 'profile-timing',
          userId: mockUserId,
          ...profileData,
          viewsCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const request = new Request('http://localhost:3000/api/public-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      // Act
      await PUT(request);

      // Assert
      // Update should be completed before cache invalidation
      expect(updateCompleted).toBe(true);
      expect(revalidatePath).toHaveBeenCalled();
    });
  });

  describe('Multiple Cache Paths', () => {
    it('should invalidate both profile and sitemap paths', async () => {
      // Arrange
      const profileData = {
        slug: 'multi-path',
        displayName: 'Multi Path',
        isEnabled: true,
      };

      mockService.upsertProfile.mockResolvedValue({
        id: 'profile-multi',
        userId: mockUserId,
        ...profileData,
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/public-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      // Act
      await PUT(request);

      // Assert
      expect(revalidatePath).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith('/p/multi-path');
      expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
    });
  });
});
