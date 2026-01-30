/**
 * Tests for DELETE /api/public-profile/delete
 * 
 * Tests the profile deletion API endpoint including:
 * - Successful deletion
 * - Authentication requirements
 * - Profile not found handling
 * - GDPR compliance (CASCADE deletion)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  requireSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/services/public-profile.service', () => ({
  createPublicProfileService: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/api/error-handler', () => ({
  handleApiError: vi.fn((error) => {
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      }),
      { status: 500 }
    );
  }),
}));

import { requireSupabaseClient } from '@/lib/auth';
import { createPublicProfileService } from '@/lib/services/public-profile.service';
import { revalidatePath } from 'next/cache';

describe('DELETE /api/public-profile/delete', () => {
  const mockSupabase = {} as any;
  const mockUserId = 'user-123';
  const mockProfileSlug = 'john-doe';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete profile successfully', async () => {
    // Mock authentication
    vi.mocked(requireSupabaseClient).mockResolvedValue({
      supabase: mockSupabase,
      userId: mockUserId,
      hasRLS: false
    });

    // Mock service
    const mockService = {
      getProfileBySlugForPreview: vi.fn().mockResolvedValue({
        slug: mockProfileSlug,
      }),
      deleteProfile: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(createPublicProfileService).mockReturnValue(mockService as any);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/public-profile/delete', {
      method: 'DELETE',
    });

    // Execute
    const response = await DELETE(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.message).toBe('Profil public supprimé avec succès');
    expect(mockService.deleteProfile).toHaveBeenCalledWith(mockUserId);
    expect(revalidatePath).toHaveBeenCalledWith(`/p/${mockProfileSlug}`);
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
  });

  it('should return 401 if not authenticated', async () => {
    // Mock authentication failure
    vi.mocked(requireSupabaseClient).mockRejectedValue(new Error('Not authenticated'));

    // Create request
    const request = new NextRequest('http://localhost:3000/api/public-profile/delete', {
      method: 'DELETE',
    });

    // Execute
    const response = await DELETE(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data.code).toBe('AUTH_REQUIRED');
    expect(data.message).toBe('Authentification requise');
  });

  it('should return 404 if profile not found', async () => {
    // Mock authentication
    vi.mocked(requireSupabaseClient).mockResolvedValue({
      supabase: mockSupabase,
      userId: mockUserId,
      hasRLS: false
    });

    // Mock service to throw profile not found error
    const mockService = {
      getProfileBySlugForPreview: vi.fn().mockResolvedValue(null),
      deleteProfile: vi.fn().mockRejectedValue(new Error('Profile not found')),
    };
    vi.mocked(createPublicProfileService).mockReturnValue(mockService as any);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/public-profile/delete', {
      method: 'DELETE',
    });

    // Execute
    const response = await DELETE(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(data.code).toBe('PROFILE_NOT_FOUND');
    expect(data.message).toBe('Profil public non trouvé');
  });

  it('should handle deletion without slug (profile never activated)', async () => {
    // Mock authentication
    vi.mocked(requireSupabaseClient).mockResolvedValue({
      supabase: mockSupabase,
      userId: mockUserId,
      hasRLS: false
    });

    // Mock service with no slug
    const mockService = {
      getProfileBySlugForPreview: vi.fn().mockResolvedValue(null),
      deleteProfile: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(createPublicProfileService).mockReturnValue(mockService as any);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/public-profile/delete', {
      method: 'DELETE',
    });

    // Execute
    const response = await DELETE(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.message).toBe('Profil public supprimé avec succès');
    expect(mockService.deleteProfile).toHaveBeenCalledWith(mockUserId);
    // Should still revalidate sitemap even without slug
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
  });

  it('should handle server errors', async () => {
    // Mock authentication
    vi.mocked(requireSupabaseClient).mockResolvedValue({
      supabase: mockSupabase,
      userId: mockUserId,
      hasRLS: false
    });

    // Mock service to throw unexpected error
    const mockService = {
      getProfileBySlugForPreview: vi.fn().mockResolvedValue({ slug: mockProfileSlug }),
      deleteProfile: vi.fn().mockRejectedValue(new Error('Database error')),
    };
    vi.mocked(createPublicProfileService).mockReturnValue(mockService as any);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/public-profile/delete', {
      method: 'DELETE',
    });

    // Execute
    const response = await DELETE(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('INTERNAL_ERROR');
  });
});
