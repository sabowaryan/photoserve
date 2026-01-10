/**
 * Admin User Suspend API Route
 * POST - Suspend a user account
 * 
 * @module app/api/admin/users/[id]/suspend/route
 * Requirements: 3.5, 3.7
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
 * POST /api/admin/users/[id]/suspend
 * Suspend a user account and deactivate their galleries
 * 
 * Body:
 * - reason: Reason for suspension (required)
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
      throw new ValidationError('Suspension reason is required');
    }

    const supabase = createAdminClient();
    const adminService = createAdminService(supabase);
    const ipAddress = getIpAddress(request);
    
    await adminService.suspendUser(
      authResult.userId,
      id,
      reason.trim(),
      ipAddress || undefined
    );

    return createApiResponse({ success: true, message: 'User suspended' });
  } catch (error) {
    return handleApiError(error);
  }
}
