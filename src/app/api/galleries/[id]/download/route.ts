/**
 * ZIP Download API Route
 * GET - Generate and download ZIP file of all gallery images
 * 
 * @module app/api/galleries/[id]/download/route
 * Requirements: 4.2.1, 4.2.5 - Bulk download with plan verification
 */
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createZipService } from '@/lib/services/zip.service';
import { z } from 'zod';
import { NotFoundError, AppError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema
const galleryIdSchema = z.object({
  id: z.string().uuid('Invalid gallery ID format'),
});

/**
 * GET /api/galleries/[id]/download
 * Generate and download ZIP file containing all gallery images
 * 
 * Requires authentication (photographer only)
 * Requires Premium or Pro plan
 * 
 * Returns: ZIP file as binary stream
 * 
 * Requirement 4.2.1: THE Gallery_Header SHALL include "Download All" button
 * Requirement 4.2.5: WHERE plan is Premium or Pro, THE Bulk_Download SHALL be available
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

    // Get gallery and verify ownership
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, user_id, title')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    if (gallery.user_id !== userId) {
      throw new AppError('Unauthorized', 'FORBIDDEN', 403);
    }

    // Get user's subscription plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    if (profileError || !profile || !profile.subscription_plan) {
      throw new AppError('User profile not found', 'NOT_FOUND', 404);
    }

    // Create ZIP service and check access
    const zipService = createZipService(supabase);
    
    // Requirement 4.2.5: Verify plan has bulk download access
    zipService.checkZipAccess(profile.subscription_plan);

    // Generate ZIP file
    const zipResult = await zipService.generateGalleryZip(galleryId, {
      compression: 'STORE', // No compression to preserve original quality
      includeMetadata: false,
    });

    // Return ZIP file as binary stream
    return new NextResponse(zipResult.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipResult.filename}"`,
        'Content-Length': zipResult.size.toString(),
        'X-Image-Count': zipResult.imageCount.toString(),
        'X-Failed-Images': zipResult.failedImages.length.toString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AppError('Authentication required', 'UNAUTHORIZED', 401));
    }
    return handleApiError(error);
  }
}
