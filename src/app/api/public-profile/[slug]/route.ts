/**
 * Public Profile by Slug API Route
 * Retrieves a public profile by its unique slug
 * 
 * GET /api/public-profile/[slug] - Get profile by slug
 * 
 * Requirements:
 * - 6.1: Profile accessible via /p/[slug]
 * - 6.3: Return 404 for non-existent slugs
 * - 6.4: Return 404 for disabled profiles
 * - 1.1: Only Pro users' profiles are accessible
 */

import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error-handler';
import { createPublicProfileService } from '@/lib/services/public-profile.service';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/public-profile/[slug]
 * Retrieve a public profile by its slug
 * 
 * This endpoint is public (no authentication required)
 * 
 * Params:
 * - slug: The unique slug of the profile
 * 
 * Returns:
 * - 200: Profile found and returned with galleries
 * - 404: Profile not found, disabled, or user is not Pro
 * - 500: Server error
 */
export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // Use admin client for public access (no authentication required)
    const supabase = createAdminClient();
    const service = createPublicProfileService(supabase);

    // Get the slug from params
    const { slug } = params;

    // Validate slug format
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        {
          error: 'api.errors.invalidSlug',
          code: 'INVALID_SLUG',
          message: 'Le slug fourni est invalide',
        },
        { status: 400 }
      );
    }

    // Retrieve profile with galleries
    const profile = await service.getProfileBySlug(slug);

    // Return 404 if profile not found, disabled, or user is not Pro
    if (!profile) {
      return NextResponse.json(
        {
          error: 'api.errors.profileNotFound',
          code: 'PROFILE_NOT_FOUND',
          message: 'Profil non trouvé',
        },
        { status: 404 }
      );
    }

    // Return profile with galleries
    return NextResponse.json(
      {
        data: profile,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
