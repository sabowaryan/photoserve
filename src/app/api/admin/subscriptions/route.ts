/**
 * Admin Subscriptions List API Route
 * GET - List all active subscriptions
 * 
 * @module app/api/admin/subscriptions/route
 * Requirements: 6.1, 6.2
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin.service';

/**
 * GET /api/admin/subscriptions
 * List all active subscriptions with user details
 * 
 * Returns:
 * - Array of subscriptions with:
 *   - userId, userEmail, userName
 *   - plan, stripeSubscriptionId, stripeCustomerId
 *   - status, currentPeriodEnd, createdAt
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
    
    const subscriptions = await adminService.listSubscriptions();

    return createApiResponse({ subscriptions });
  } catch (error) {
    return handleApiError(error);
  }
}
