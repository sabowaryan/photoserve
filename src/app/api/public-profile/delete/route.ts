/**
 * Public Profile Delete API Route
 * Handles deletion of public photographer profiles
 * 
 * DELETE /api/public-profile/delete - Delete the authenticated user's public profile
 * 
 * Requirements:
 * - 13.5: Delete profile and all analytics data (CASCADE)
 * - 13.5: Respect GDPR right to be forgotten
 * 
 * Security:
 * - Requires authentication
 * - Users can only delete their own profile
 * - Cascades to delete all associated analytics data
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireSupabaseClient } from '@/lib/auth';
import { handleApiError } from '@/lib/api/error-handler';
import { createPublicProfileService } from '@/lib/services/public-profile.service';

/**
 * DELETE /api/public-profile/delete
 * Delete the authenticated user's public profile
 * 
 * This operation:
 * - Deletes the public profile record
 * - Cascades to delete all profile_views records (via database CASCADE constraint)
 * - Respects GDPR right to be forgotten
 * 
 * Returns:
 * - 200: Profile deleted successfully
 * - 401: Not authenticated
 * - 404: Profile not found
 * - 500: Server error
 */
export async function DELETE(_request: Request) {
  try {
    // Require authentication
    let supabase, userId;
    try {
      const result = await requireSupabaseClient();
      supabase = result.supabase;
      userId = result.userId;
    } catch (error) {
      // Handle authentication errors
      return NextResponse.json(
        {
          error: 'api.errors.authRequired',
          code: 'AUTH_REQUIRED',
          message: 'Authentification requise',
        },
        { status: 401 }
      );
    }

    // Create service and delete profile
    const service = createPublicProfileService(supabase);

    try {
      // Get the profile slug before deletion for cache invalidation
      const profile = await service.getProfileBySlugForPreview('', userId);
      const profileSlug = profile?.slug;

      // Delete the profile (CASCADE will delete all analytics data)
      await service.deleteProfile(userId);

      // Invalidate the cache for this profile's page if it existed
      if (profileSlug) {
        revalidatePath(`/p/${profileSlug}`);
      }
      
      // Also revalidate the sitemap
      revalidatePath('/sitemap.xml');

      return NextResponse.json(
        {
          message: 'Profil public supprimé avec succès',
        },
        { status: 200 }
      );
    } catch (error) {
      // Handle specific business logic errors
      if (error instanceof Error) {
        if (error.message.includes('Profile not found')) {
          return NextResponse.json(
            {
              error: 'api.errors.profileNotFound',
              code: 'PROFILE_NOT_FOUND',
              message: 'Profil public non trouvé',
            },
            { status: 404 }
          );
        }
      }

      // Re-throw to be handled by generic error handler
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
