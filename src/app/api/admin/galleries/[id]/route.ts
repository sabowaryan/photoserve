/**
 * Admin Gallery Detail API Route
 * GET - Get gallery details
 * DELETE - Delete gallery
 * 
 * @module app/api/admin/galleries/[id]/route
 * Requirements: 4.3, 4.5, 4.6
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse, createNoContentResponse } from '@/lib/api/error-handler';
import { requireAdmin, getIpAddress } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin.service';
import { ValidationError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/galleries/[id]
 * Get detailed gallery information including images and owner
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return createApiResponse(
        { error: authResult.error },
        authResult.status
      );
    }

    const { id } = await params;
    const supabase = createAdminClient();
    const adminService = createAdminService(supabase);
    
    const gallery = await adminService.getGalleryDetails(id);

    return createApiResponse({ gallery });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/galleries/[id]
 * Delete a gallery and its images, freeing storage
 * 
 * Body:
 * - reason: Reason for deletion (required)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return createApiResponse(
        { error: authResult.error },
        authResult.status
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new ValidationError('Deletion reason is required');
    }

    const supabase = createAdminClient();
    const adminService = createAdminService(supabase);
    const ipAddress = getIpAddress(request);
    
    await adminService.deleteGallery(
      authResult.userId,
      id,
      reason.trim(),
      ipAddress || undefined
    );

    return createNoContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
