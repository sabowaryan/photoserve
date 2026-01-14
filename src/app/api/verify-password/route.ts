/**
 * Verify Password API Route
 * POST - Verify gallery password with rate limiting
 * 
 * @module app/api/verify-password/route
 * Requirements: 4.7 - Server-side password verification
 * Requirements: 4.8 - Rate limiting (5 attempts per 15 minutes)
 * Requirements: 9.1 - API Routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { createAdminClient } from '@/lib/supabase/server';
import { createGalleryService } from '@/lib/services/gallery.service';
import { createRateLimiterService } from '@/lib/services/rate-limiter.service';
import { verifyPasswordSchema } from '@/lib/validators/gallery.schema';

/**
 * Get client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const firstIp = forwardedFor.split(',')[0];
    return firstIp?.trim() || '127.0.0.1';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (this shouldn't happen in production)
  return '127.0.0.1';
}

/**
 * POST /api/verify-password
 * Verify gallery password with rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { slug, password } = verifyPasswordSchema.parse(body);

    // Get client IP for rate limiting
    const clientIp = getClientIp(request);

    // Use admin client for public gallery access
    const supabase = createAdminClient();

    // Check rate limit (Requirement 4.8)
    const rateLimiter = createRateLimiterService(supabase);
    const rateLimitKey = rateLimiter.generateKey(clientIp, slug);
    const rateLimitResult = await rateLimiter.checkRateLimit(rateLimitKey);

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'api.errors.tooManyAttempts',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            retryAfterSeconds: rateLimitResult.retryAfterSeconds,
          },
        },
        { status: 429 }
      );

      // Add Retry-After header (Requirement 4.9)
      response.headers.set('Retry-After', String(rateLimitResult.retryAfterSeconds));
      return response;
    }

    // Verify password (Requirement 4.7)
    const galleryService = createGalleryService(supabase);
    const result = await galleryService.verifyPassword(slug, password);

    if (!result.success) {
      // Return error with remaining attempts info
      return NextResponse.json(
        {
          error: result.error,
          code: 'INVALID_PASSWORD',
          details: {
            remainingAttempts: rateLimitResult.remainingAttempts,
          },
        },
        { status: 401 }
      );
    }

    // Success - reset rate limit
    await rateLimiter.resetRateLimit(rateLimitKey);

    // Return gallery data without exposing password hash
    const { gallery, images } = result;
    const safeGallery = gallery ? {
      id: gallery.id,
      title: gallery.title,
      unique_slug: gallery.unique_slug,
      expiration_days: gallery.expiration_days,
      expires_at: gallery.expires_at,
      views_count: gallery.views_count,
      is_active: gallery.is_active,
      created_at: gallery.created_at,
    } : null;

    return createApiResponse({
      success: true,
      gallery: safeGallery,
      images,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
