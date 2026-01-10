/**
 * Admin Subscription Management API Route
 * PATCH - Manual upgrade user plan
 * DELETE - Cancel subscription
 * 
 * @module app/api/admin/subscriptions/[userId]/route
 * Requirements: 6.3, 6.4, 6.5
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin, getIpAddress } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin.service';
import { ValidationError } from '@/lib/errors';
import type { SubscriptionPlan } from '@/types/index';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

const VALID_PLANS: SubscriptionPlan[] = ['free', 'premium', 'pro'];

/**
 * PATCH /api/admin/subscriptions/[userId]
 * Manually upgrade a user's plan without requiring payment
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

    const { userId } = await params;
    const body = await request.json();
    const { plan } = body;

    // Validate plan
    if (!plan || !VALID_PLANS.includes(plan)) {
      throw new ValidationError('Invalid subscription plan');
    }

    const supabase = createAdminClient();
    const adminService = createAdminService(supabase);
    const ipAddress = getIpAddress(request);
    
    await adminService.manualUpgrade(
      authResult.userId,
      userId,
      plan as SubscriptionPlan,
      ipAddress || undefined
    );

    return createApiResponse({ success: true, message: 'Subscription upgraded' });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/subscriptions/[userId]
 * Cancel a user's subscription and schedule downgrade to free plan
 * 
 * Body:
 * - reason: Reason for cancellation (required)
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

    const { userId } = await params;
    const body = await request.json();
    const { reason } = body;

    // Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new ValidationError('Cancellation reason is required');
    }

    const supabase = createAdminClient();
    const adminService = createAdminService(supabase);
    const ipAddress = getIpAddress(request);
    
    await adminService.cancelSubscription(
      authResult.userId,
      userId,
      reason.trim(),
      ipAddress || undefined
    );

    return createApiResponse({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    return handleApiError(error);
  }
}
