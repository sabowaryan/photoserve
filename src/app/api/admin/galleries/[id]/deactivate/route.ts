/**
 * Admin Gallery Deactivate API Route
 * POST - Deactivate a gallery
 * 
 * @module app/api/admin/galleries/[id]/deactivate/route
 * Requirements: 4.4, 4.6
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin, getIpAddress } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin.service';
import { ValidationError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/galleries/[id]/deactivate
 * Deactivate a gallery and prevent public access
 * 
 * Body:
 * - reason: Reason for deactivation (required)
 */
export async function POST(
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
      throw new ValidationError('Deactivation reason is required');
    }

    const supabase = createAdminClient();
    const adminService = createAdminService(supabase);
    const ipAddress = getIpAddress(request);
    
    await adminService.deactivateGallery(
      authResult.userId,
      id,
      reason.trim(),
      ipAddress || undefined
    );

    return createApiResponse({ success: true, message: 'Gallery deactivated' });
  } catch (error) {
    return handleApiError(error);
  }
}
