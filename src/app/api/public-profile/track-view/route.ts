/**
 * Public Profile Tracking API Route
 * Handles tracking of profile views, CTA clicks, and social link clicks
 * 
 * POST /api/public-profile/track-view - Track a profile view or interaction
 * 
 * Requirements:
 * - 9.1: Record visit in profile_views table
 * - 9.2: Record hashed IP, user agent, referrer, timestamp
 * - 9.5: Mark cta_clicked when visitor clicks CTA
 * - 9.6: Record social network name when visitor clicks social link
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api/error-handler';
import { createPublicProfileService } from '@/lib/services/public-profile.service';
import { z } from 'zod';

/**
 * Schema for tracking request body
 */
const TrackingSchema = z.object({
  profileSlug: z.string().min(1, 'Profile slug is required'),
  action: z.enum(['view', 'cta_click', 'social_click']),
  viewId: z.string().uuid().optional(), // Required for cta_click and social_click
  socialPlatform: z.string().optional(), // Required for social_click
});

/**
 * Extracts client IP address from request headers
 * Checks multiple headers in order of preference
 */
function getClientIp(request: Request): string {
  // Check x-forwarded-for header (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const firstIp = forwardedFor.split(',')[0];
    if (firstIp) {
      return firstIp.trim();
    }
  }

  // Check x-real-ip header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Check Vercel-specific header
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    const firstIp = vercelForwardedFor.split(',')[0];
    if (firstIp) {
      return firstIp.trim();
    }
  }

  // Check Cloudflare header
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback to localhost (for development)
  return '127.0.0.1';
}

/**
 * POST /api/public-profile/track-view
 * Track a profile view or interaction (CTA click, social link click)
 * 
 * Body:
 * - profileSlug: string - The slug of the profile being viewed
 * - action: 'view' | 'cta_click' | 'social_click' - The type of action
 * - viewId?: string - The ID of the view record (required for cta_click and social_click)
 * - socialPlatform?: string - The social platform name (required for social_click)
 * 
 * Returns:
 * - 200: Action tracked successfully
 * - 400: Validation error
 * - 404: Profile not found
 * - 500: Server error
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = TrackingSchema.safeParse(body);

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

    const { profileSlug, action, viewId, socialPlatform } = validatedData.data;

    // Additional validation based on action type
    if (action === 'cta_click' && !viewId) {
      return NextResponse.json(
        {
          error: 'api.errors.validationFailed',
          code: 'VALIDATION_ERROR',
          message: 'viewId is required for cta_click action',
        },
        { status: 400 }
      );
    }

    if (action === 'social_click' && (!viewId || !socialPlatform)) {
      return NextResponse.json(
        {
          error: 'api.errors.validationFailed',
          code: 'VALIDATION_ERROR',
          message: 'viewId and socialPlatform are required for social_click action',
        },
        { status: 400 }
      );
    }

    // Create Supabase client (no authentication required for public tracking)
    const supabase = await createClient();
    const service = createPublicProfileService(supabase);

    // Handle different action types
    if (action === 'view') {
      // Extract tracking data from request headers (Requirement 9.2)
      const ipAddress = getClientIp(request);
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      const referrer = request.headers.get('referer') || undefined;

      try {
        // Track the view (Requirements 9.1, 9.2)
        const newViewId = await service.trackView(profileSlug, {
          ipAddress,
          userAgent,
          referrer,
        });

        return NextResponse.json(
          {
            data: { viewId: newViewId },
            message: 'View tracked successfully',
          },
          { status: 200 }
        );
      } catch (error) {
        // Handle profile not found
        if (error instanceof Error && error.message.includes('not found')) {
          return NextResponse.json(
            {
              error: 'api.errors.notFound',
              code: 'PROFILE_NOT_FOUND',
              message: 'Profile not found',
            },
            { status: 404 }
          );
        }
        throw error;
      }
    } else if (action === 'cta_click') {
      // Track CTA click (Requirement 9.5)
      await service.trackCTAClick(viewId!);

      return NextResponse.json(
        {
          data: { success: true },
          message: 'CTA click tracked successfully',
        },
        { status: 200 }
      );
    } else if (action === 'social_click') {
      // Track social link click (Requirement 9.6)
      await service.trackSocialClick(viewId!, socialPlatform!);

      return NextResponse.json(
        {
          data: { success: true },
          message: 'Social click tracked successfully',
        },
        { status: 200 }
      );
    }

    // This should never be reached due to Zod validation
    return NextResponse.json(
      {
        error: 'api.errors.invalidAction',
        code: 'INVALID_ACTION',
        message: 'Invalid action type',
      },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
