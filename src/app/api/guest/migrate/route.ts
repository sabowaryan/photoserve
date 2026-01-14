/**
 * Guest Gallery Migration API Endpoint
 * 
 * POST /api/guest/migrate - Migrate guest galleries to user account
 * 
 * This endpoint is called after user account creation to migrate
 * any guest galleries associated with the guest session to the new user.
 * 
 * Requirements: 8.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createGalleryMigrationService } from '@/lib/services/gallery-migration.service';
import { getTokenFromCookies, createClearSessionCookie, isValidUUID } from '@/lib/guest';
import { ValidationError } from '@/lib/errors';

/**
 * POST /api/guest/migrate
 * 
 * Migrates all guest galleries to the authenticated user's account.
 * 
 * Request body:
 * - guestToken: string (optional, will use cookie if not provided)
 * 
 * Response:
 * - 200: { migratedCount: number, galleries: Gallery[] }
 * - 400: { error: string } - Invalid guest token
 * - 401: { error: string } - Not authenticated
 * - 500: { error: string } - Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();

    // Get guest token from request body or cookie
    let guestToken: string | null = null;

    // Try to get from request body first
    try {
      const body = await request.json();
      if (body.guestToken && isValidUUID(body.guestToken)) {
        guestToken = body.guestToken;
      }
    } catch {
      // No body or invalid JSON, continue to check cookie
    }

    // Fall back to cookie if not in body
    if (!guestToken) {
      const cookieHeader = request.headers.get('cookie');
      guestToken = getTokenFromCookies(cookieHeader);
    }

    // Validate guest token
    if (!guestToken) {
      // No guest session to migrate - this is not an error
      return NextResponse.json({
        migratedCount: 0,
        galleries: [],
        message: 'No guest session found',
      });
    }

    if (!isValidUUID(guestToken)) {
      throw new ValidationError('Invalid guest session token');
    }

    // Create migration service and perform migration
    const migrationService = createGalleryMigrationService(supabase);
    const result = await migrationService.migrateGuestGalleries(guestToken, userId);

    // Create response
    const response = NextResponse.json({
      migratedCount: result.migratedCount,
      galleries: result.galleries.map(g => ({
        id: g.id,
        title: g.title,
        unique_slug: g.unique_slug,
        is_unlocked: g.is_unlocked,
        payment_type: g.payment_type as 'free' | 'one_time' | 'subscription',
        expires_at: g.expires_at,
        created_at: g.created_at,
      })),
      message: result.migratedCount > 0 
        ? `Successfully migrated ${result.migratedCount} gallery(ies)` 
        : 'No galleries to migrate',
    });

    // Clear the guest session cookie after successful migration
    if (result.migratedCount > 0) {
      response.headers.set('Set-Cookie', createClearSessionCookie());
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
