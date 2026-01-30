/**
 * Tests for PublicProfileService.deleteProfile()
 * 
 * Tests the profile deletion functionality including:
 * - Successful deletion
 * - Profile not found handling
 * - CASCADE deletion of analytics data (via database constraints)
 * - GDPR compliance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicProfileService } from '../public-profile.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

describe('PublicProfileService.deleteProfile', () => {
  let service: PublicProfileService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    } as any;

    service = new PublicProfileService(mockSupabase);
  });

  it('should delete profile successfully', async () => {
    const userId = 'user-123';
    const profileId = 'profile-456';

    // Mock findByUserId to return a profile
    const mockProfile = {
      id: profileId,
      user_id: userId,
      slug: 'john-doe',
      display_name: 'John Doe',
      is_enabled: true,
      views_count: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(service as any, 'profileRepo', 'get').mockReturnValue({
      findByUserId: vi.fn().mockResolvedValue(mockProfile),
      delete: vi.fn().mockResolvedValue(undefined),
    });

    // Execute
    await service.deleteProfile(userId);

    // Assert
    const profileRepo = (service as any).profileRepo;
    expect(profileRepo.findByUserId).toHaveBeenCalledWith(userId);
    expect(profileRepo.delete).toHaveBeenCalledWith(profileId);
  });

  it('should throw error if profile not found', async () => {
    const userId = 'user-123';

    // Mock findByUserId to return null
    vi.spyOn(service as any, 'profileRepo', 'get').mockReturnValue({
      findByUserId: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    });

    // Execute and assert
    await expect(service.deleteProfile(userId)).rejects.toThrow('Profile not found');

    // Assert delete was not called
    const profileRepo = (service as any).profileRepo;
    expect(profileRepo.delete).not.toHaveBeenCalled();
  });

  it('should respect GDPR by deleting all data via CASCADE', async () => {
    // This test verifies that the delete operation is called correctly.
    // The actual CASCADE deletion is handled by the database constraint
    // defined in the migration: ON DELETE CASCADE
    
    const userId = 'user-123';
    const profileId = 'profile-456';

    const mockProfile = {
      id: profileId,
      user_id: userId,
      slug: 'john-doe',
      display_name: 'John Doe',
      is_enabled: true,
      views_count: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(service as any, 'profileRepo', 'get').mockReturnValue({
      findByUserId: vi.fn().mockResolvedValue(mockProfile),
      delete: vi.fn().mockResolvedValue(undefined),
    });

    // Execute
    await service.deleteProfile(userId);

    // Assert that delete was called with the profile ID
    // The database CASCADE constraint will automatically delete:
    // - All profile_views records (via foreign key ON DELETE CASCADE)
    const profileRepo = (service as any).profileRepo;
    expect(profileRepo.delete).toHaveBeenCalledWith(profileId);
  });

  it('should handle database errors during deletion', async () => {
    const userId = 'user-123';
    const profileId = 'profile-456';

    const mockProfile = {
      id: profileId,
      user_id: userId,
      slug: 'john-doe',
      display_name: 'John Doe',
      is_enabled: true,
      views_count: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mock delete to throw an error
    vi.spyOn(service as any, 'profileRepo', 'get').mockReturnValue({
      findByUserId: vi.fn().mockResolvedValue(mockProfile),
      delete: vi.fn().mockRejectedValue(new Error('Database error')),
    });

    // Execute and assert
    await expect(service.deleteProfile(userId)).rejects.toThrow('Database error');
  });
});
