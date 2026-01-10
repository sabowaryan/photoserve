/**
 * Admin Dashboard API Route
 * GET - Get dashboard statistics
 * 
 * @module app/api/admin/dashboard/route
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin.service';

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics for admin users
 * 
 * Returns:
 * - totalUsers: Total number of registered users
 * - totalGalleries: Total number of galleries
 * - activeGalleries: Number of active galleries
 * - totalStorageUsedMb: Total storage used across all users
 * - planDistribution: Distribution of subscription plans
 * - recentSignups: Number of recent signups
 * - recentGalleries: Number of recent gallery creations
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return createApiResponse(
        { error: authResult.error },
        authResult.status
      );
    }

    const supabase = createAdminClient();
    const adminService = createAdminService(supabase);
    
    const stats = await adminService.getDashboardStats();

    return createApiResponse({ stats });
  } catch (error) {
    return handleApiError(error);
  }
}
