/**
 * Lead Capture API Routes
 * POST - Capture visitor email (lead magnet)
 * GET - Get list of captured leads for photographer
 * 
 * @module app/api/galleries/[id]/leads/route
 * Requirements: 7.2.1, 7.2.2, 7.2.3 - Lead magnet email capture
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { getSupabaseClient, requireSupabaseClient } from '@/lib/auth';
import { createLeadCaptureService } from '@/lib/services/lead-capture.service';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schemas
const galleryIdSchema = z.object({
  id: z.string().uuid('Invalid gallery ID format'),
});

const captureEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'GDPR consent is required',
  }),
});

/**
 * POST /api/galleries/[id]/leads
 * Capture visitor email before gallery access
 * 
 * Public endpoint (no authentication required)
 * 
 * Body:
 * - email: string (required) - Visitor email address
 * - gdprConsent: boolean (required) - Must be true
 * 
 * Returns: { lead: LeadCapture }
 * 
 * Requirement 7.2.1: THE System SHALL display email form before gallery access
 * Requirement 7.2.2: THE Email SHALL be validated and stored
 * Requirement 7.2.4: THE System SHALL comply with GDPR (consent checkbox)
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
    const { email, gdprConsent } = captureEmailSchema.parse(body);

    // Create lead capture service
    const leadCaptureService = createLeadCaptureService(supabase);

    // Capture email
    const lead = await leadCaptureService.captureEmail(
      galleryId,
      email,
      gdprConsent
    );

    return createApiResponse({ lead }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/galleries/[id]/leads
 * Get list of captured leads for a gallery
 * 
 * Requires authentication (photographer only)
 * 
 * Returns: { leads: LeadCapture[] }
 * 
 * Requirement 7.2.3: THE Photographer SHALL receive list of captured emails
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
      return handleApiError(new AppError('Gallery not found', 'NOT_FOUND', 404));
    }

    if (gallery.user_id !== userId) {
      return handleApiError(new AppError('Unauthorized', 'FORBIDDEN', 403));
    }

    // Get leads
    const leadCaptureService = createLeadCaptureService(supabase);
    const leads = await leadCaptureService.getLeads(galleryId);

    return createApiResponse({ leads });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AppError('Authentication required', 'UNAUTHORIZED', 401));
    }
    return handleApiError(error);
  }
}
