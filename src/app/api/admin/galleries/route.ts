/**
 * Admin Galleries List API Route
 * GET - List galleries with pagination and filtering
 * 
 * @module app/api/admin/galleries/route
 * Requirements: 4.1, 4.2
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin.service';
import type { GalleryFilters } from '@/types/admin';

/**
 * GET /api/admin/galleries
 * List all galleries with pagination and filtering
 * 
 * Query Parameters:
 * - search: Search by title or slug
 * - status: Filter by status (active, expired, inactive)
 * - userId: Filter by owner user ID
 * - dateFrom: Filter by creation date (from)
 * - dateTo: Filter by creation date (to)
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
    const filters: GalleryFilters = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as 'active' | 'expired' | 'inactive') || undefined,
      userId: searchParams.get('userId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100),
    };

    const result = await adminService.listGalleries(filters);

    return createApiResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
