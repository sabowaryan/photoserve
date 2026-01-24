/**
 * Public Profile API Route
 * Handles creation and update of public photographer profiles
 * 
 * PUT /api/public-profile - Create or update a public profile
 * 
 * Requirements:
 * - 1.1: Only Pro users can create/update profiles
 * - 1.3: Enforce unique slugs
 * - Validation with Zod schema
 * - Proper error handling
 */

import { NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { handleApiError } from '@/lib/api/error-handler';
import { PublicProfileSchema } from '@/types/public-profile';
import { createPublicProfileService } from '@/lib/services/public-profile.service';

/**
 * PUT /api/public-profile
 * Create or update the authenticated user's public profile
 * 
 * Body: PublicProfileInput (validated with Zod)
 * 
 * Returns:
 * - 200: Profile created/updated successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 403: User is not Pro
 * - 409: Slug already taken
 * - 500: Server error
 */
export async function PUT(request: Request) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = PublicProfileSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'api.errors.validationFailed',
          code: 'VALIDATION_ERROR',
          details: validatedData.error.issues,
        },
        { status: 400 }
      );
    }

    // Create service and upsert profile
    const service = createPublicProfileService(supabase);

    try {
      const profile = await service.upsertProfile(userId, validatedData.data);

      return NextResponse.json(
        {
          data: profile,
          message: 'Profil public mis à jour avec succès',
        },
        { status: 200 }
      );
    } catch (error) {
      // Handle specific business logic errors
      if (error instanceof Error) {
        if (error.message.includes('réservée aux utilisateurs Pro')) {
          return NextResponse.json(
            {
              error: 'api.errors.proRequired',
              code: 'PRO_REQUIRED',
              message: 'Cette fonctionnalité est réservée aux utilisateurs Pro',
            },
            { status: 403 }
          );
        }

        if (error.message.includes('slug est déjà utilisé')) {
          // Generate suggestions for alternative slugs
          const suggestions = service.generateSlugSuggestions(validatedData.data.slug);
          return NextResponse.json(
            {
              error: 'api.errors.slugTaken',
              code: 'SLUG_TAKEN',
              message: 'Ce slug est déjà utilisé',
              suggestions,
            },
            { status: 409 }
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
