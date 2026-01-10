/**
 * Admin User Detail API Route
 * GET - Get user details
 * PATCH - Update user (plan)
 * 
 * @module app/api/admin/users/[id]/route
 * Requirements: 3.3, 3.4, 3.7
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin, getIpAddress } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin.service';
import { ValidationError } from '@/lib/errors';
import type { SubscriptionPlan } from '@/types/index';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_PLANS: SubscriptionPlan[] = ['free', 'premium', 'pro'];

/**
 * GET /api/admin/users/[id]
 * Get detailed user information
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
    
    const user = await adminService.getUserDetails(id);

    return createApiResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user subscription plan
 * 
 * Body:
 * - plan: New subscription plan (free, premium, pro)
 */
export async function PATCH(
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
    const { plan } = body;

    // Validate plan
    if (!plan || !VALID_PLANS.includes(plan)) {
      throw new ValidationError('Invalid subscription plan');
    }

    const supabase = createAdminClient();
    const adminService = createAdminService(supabase);
    const ipAddress = getIpAddress(request);
    
    await adminService.updateUserPlan(
      authResult.userId,
      id,
      plan as SubscriptionPlan,
      ipAddress || undefined
    );

    return createApiResponse({ success: true, message: 'User plan updated' });
  } catch (error) {
    return handleApiError(error);
  }
}
