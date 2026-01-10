/**
 * Admin Users List API Route
 * GET - List users with pagination and filtering
 * 
 * @module app/api/admin/users/route
 * Requirements: 3.1, 3.2
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin.service';
import type { UserFilters } from '@/types/admin';
import type { SubscriptionPlan } from '@/types/index';

/**
 * GET /api/admin/users
 * List all users with pagination and filtering
 * 
 * Query Parameters:
 * - search: Search by email or name
 * - plan: Filter by subscription plan (free, premium, pro)
 * - status: Filter by status (active, suspended)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
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
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: UserFilters = {
      search: searchParams.get('search') || undefined,
      plan: (searchParams.get('plan') as SubscriptionPlan) || undefined,
      status: (searchParams.get('status') as 'active' | 'suspended') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100),
    };

    const result = await adminService.listUsers(filters);

    return createApiResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
