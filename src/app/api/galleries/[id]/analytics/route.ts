/**
 * Analytics API Routes
 * POST - Track a gallery view
 * GET - Get gallery statistics
 * 
 * @module app/api/galleries/[id]/analytics/route
 * Requirements: 3.3.1, 3.3.4
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse, createNoContentResponse } from '@/lib/api/error-handler';
import { getSupabaseClient, requireSupabaseClient } from '@/lib/auth';
import { createAnalyticsService } from '@/lib/services/analytics.service';
import { geolocationService } from '@/lib/services/geolocation.service';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schemas
const galleryIdSchema = z.object({
  id: z.string().uuid('Invalid gallery ID format'),
});

const trackViewSchema = z.object({
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  countryCode: z.string().length(2).optional(),
  visitorId: z.string().optional(), // Fingerprint ID
});

/**
 * POST /api/galleries/[id]/analytics
 * Track a gallery view with visitor metadata
 * 
 * Body (optional):
 * - ip: string (optional) - Visitor IP address
 * - userAgent: string (optional) - Browser user agent
 * - countryCode: string (optional) - 2-letter country code
 * 
 * Returns: 204 No Content
 * 
 * Requirement 3.3.1: THE System SHALL track gallery view count
 * Requirement 3.3.2: THE System SHALL track first view timestamp
 * Requirement 3.3.3: THE System SHALL track visitor country (via IP geolocation)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase } = await getSupabaseClient();
    const { id: galleryId } = await params;

    // Validate gallery ID
    galleryIdSchema.parse({ id: galleryId });

    // Parse and validate request body (all fields optional)
    const body = await request.json().catch(() => ({}));
    const metadata = trackViewSchema.parse(body);

    // Extract IP from request headers if not provided
    const ip = metadata.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined;

    // Extract user agent if not provided
    const userAgent = metadata.userAgent || 
      request.headers.get('user-agent') || 
      undefined;

    // Get country code from IP if not provided
    let countryCode = metadata.countryCode;
    if (!countryCode && ip) {
      try {
        countryCode = await geolocationService.getCountryFromIP(ip) || undefined;
      } catch (error) {
        // Log error but don't fail the request
        console.error('Geolocation error:', error);
      }
    }

    const analyticsService = createAnalyticsService(supabase);
    await analyticsService.trackView(galleryId, {
      ip,
      userAgent,
      countryCode,
      visitorId: metadata.visitorId, // NEW: Fingerprint ID
    });

    return createNoContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/galleries/[id]/analytics
 * Get comprehensive analytics for a gallery
 * 
 * Requires authentication (photographer only)
 * 
 * Returns: { stats: GalleryStats }
 * 
 * Requirement 3.3.4: THE Dashboard SHALL display analytics per gallery
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    const { id: galleryId } = await params;

    // Validate gallery ID
    galleryIdSchema.parse({ id: galleryId });

    // Verify gallery ownership
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, user_id')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      return handleApiError(new Error('Gallery not found'));
    }

    if (gallery.user_id !== userId) {
      return handleApiError(new Error('Unauthorized'));
    }

    const analyticsService = createAnalyticsService(supabase);
    const stats = await analyticsService.getGalleryStats(galleryId);

    return createApiResponse({ stats });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(error);
    }
    return handleApiError(error);
  }
}
