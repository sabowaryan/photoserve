/**
 * Slug Availability Check API Route
 * Checks if a slug is available for use
 * 
 * GET /api/public-profile/check-slug?slug=xxx - Check slug availability
 * 
 * Requirements:
 * - 14.1: Real-time slug availability checking
 * - 14.2: Return availability status
 * - 14.3: Provide suggestions if slug is taken
 * - 14.4: Generate alternative slugs
 * - 14.5: Reject reserved slugs
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/auth';
import { handleApiError } from '@/lib/api/error-handler';
import { createPublicProfileService } from '@/lib/services/public-profile.service';

/**
 * GET /api/public-profile/check-slug
 * Check if a slug is available for use
 * 
 * Query params:
 * - slug: The slug to check (required)
 * 
 * Returns:
 * - 200: Availability result with optional suggestions
 * - 400: Missing or invalid slug parameter
 * - 500: Server error
 * 
 * Response format:
 * {
 *   available: boolean,
 *   suggestions?: string[] // Only if unavailable
 * }
 */
export async function GET(request: Request) {
  try {
    // Get Supabase client (works for both authenticated and anonymous users)
    const { supabase, userId } = await getSupabaseClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    // Validate slug parameter
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        {
          error: 'api.errors.missingSlug',
          code: 'MISSING_SLUG',
          message: 'Le paramètre slug est requis',
        },
        { status: 400 }
      );
    }

    // Validate slug format (basic check)
    if (slug.length === 0 || slug.length > 100) {
      return NextResponse.json(
        {
          error: 'api.errors.invalidSlugLength',
          code: 'INVALID_SLUG_LENGTH',
          message: 'Le slug doit contenir entre 1 et 100 caractères',
        },
        { status: 400 }
      );
    }

    // Check slug availability
    const service = createPublicProfileService(supabase);
    const result = await service.checkSlugAvailability(slug, userId || undefined);

    return NextResponse.json(
      {
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
