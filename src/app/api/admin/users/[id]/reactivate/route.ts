/**
 * Admin User Reactivate API Route
 * POST - Reactivate a suspended user account
 * 
 * @module app/api/admin/users/[id]/reactivate/route
 * Requirements: 3.6, 3.7
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin, getIpAddress } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/users/[id]/reactivate
 * Reactivate a suspended user account and restore their galleries
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
    const supabase = createAdminClient();
    const adminService = createAdminService(supabase);
    const ipAddress = getIpAddress(request);
    
    await adminService.reactivateUser(
      authResult.userId,
      id,
      ipAddress || undefined
    );

    return createApiResponse({ success: true, message: 'User reactivated' });
  } catch (error) {
    return handleApiError(error);
  }
}
