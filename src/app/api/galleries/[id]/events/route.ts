/**
 * Gallery Events API Route
 * POST - Track a user event
 * GET - Get event statistics
 * 
 * @module app/api/galleries/[id]/events/route
 * Requirements: Analytics Phase 3 - Event tracking
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse, createNoContentResponse } from '@/lib/api/error-handler';
import { getSupabaseClient, requireSupabaseClient } from '@/lib/auth';
import { createEventsService, type EventType, type EventData } from '@/lib/services/events.service';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schemas
const galleryIdSchema = z.object({
  id: z.string().uuid('Invalid gallery ID format'),
});

const trackEventSchema = z.object({
  visitorId: z.string().optional(),
  visitorIp: z.string().optional(),
  eventType: z.string(),
  eventData: z.any().optional(),
});

/**
 * POST /api/galleries/[id]/events
 * Track a user event
 * 
 * Body:
 * - visitorId: string (optional) - Visitor fingerprint ID
 * - visitorIp: string (optional) - Visitor IP address
 * - eventType: EventType (required) - Type of event
 * - eventData: object (optional) - Additional event data
 * 
 * Returns: 204 No Content
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

    // Parse and validate request body
    const body = await request.json();
    const { visitorId, visitorIp, eventType, eventData } = trackEventSchema.parse(body);

    // Extract IP from headers if not provided
    const ip = visitorIp || 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined;

    const eventsService = createEventsService(supabase);
    await eventsService.trackEvent({
      galleryId,
      visitorId,
      visitorIp: ip,
      eventType: eventType as EventType,
      eventData: eventData as EventData,
    });

    return createNoContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/galleries/[id]/events
 * Get event statistics for a gallery
 * 
 * Requires authentication (photographer only)
 * 
 * Query params:
 * - dateFrom: ISO date string (optional)
 * - dateTo: ISO date string (optional)
 * 
 * Returns: { stats: EventStats }
 */
export async function GET(
  request: NextRequest,
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom') 
      ? new Date(searchParams.get('dateFrom')!) 
      : undefined;
    const dateTo = searchParams.get('dateTo') 
      ? new Date(searchParams.get('dateTo')!) 
      : undefined;

    const eventsService = createEventsService(supabase);
    const stats = await eventsService.getEventStats(galleryId, dateFrom, dateTo);

    return createApiResponse({ stats });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(error);
    }
    return handleApiError(error);
  }
}
