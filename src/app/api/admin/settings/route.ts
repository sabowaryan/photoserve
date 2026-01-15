/**
 * Admin Settings API Route
 * GET - Get admin settings
 * PUT - Update admin settings
 * 
 * @module app/api/admin/settings/route
 * Requirements: A.1.4, A.1.5
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Settings update schema
 */
const settingsSchema = z.object({
  stripe_enabled: z.boolean().optional(),
  ai_features_enabled: z.boolean().optional(),
});

/**
 * GET /api/admin/settings
 * Get current admin settings
 * 
 * Returns:
 * - stripe_enabled: Whether Stripe payments are enabled
 * - ai_features_enabled: Whether AI features are enabled
 * 
 * Requirements: A.1.4
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
    
    // Fetch settings from database
    const { data, error } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['stripe_enabled', 'ai_features_enabled']);

    if (error) {
      throw error;
    }

    // Convert array to object
    const settings: Record<string, boolean> = {};
    data?.forEach((setting) => {
      settings[setting.key] = setting.value === true || setting.value === 'true';
    });

    return createApiResponse({
      settings: {
        stripe_enabled: settings.stripe_enabled ?? true,
        ai_features_enabled: settings.ai_features_enabled ?? true,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/settings
 * Update admin settings
 * 
 * Body:
 * - stripe_enabled?: boolean - Enable/disable Stripe payments
 * - ai_features_enabled?: boolean - Enable/disable AI features
 * 
 * Requirements: A.1.5
 */
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return createApiResponse(
        { error: authResult.error },
        authResult.status
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validation = settingsSchema.safeParse(body);
    if (!validation.success) {
      return createApiResponse(
        { error: 'Invalid request body', details: validation.error.issues },
        400
      );
    }

    const settings = validation.data;
    const supabase = createAdminClient();
    const adminId = authResult.userId;

    // Update each setting that was provided
    if (settings.stripe_enabled !== undefined) {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          value: settings.stripe_enabled,
          updated_by: adminId,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'stripe_enabled');
      
      if (error) throw error;
    }

    if (settings.ai_features_enabled !== undefined) {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          value: settings.ai_features_enabled,
          updated_by: adminId,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'ai_features_enabled');
      
      if (error) throw error;
    }

    // Log the action in audit log using the service
    const auditLogService = await import('@/lib/services/audit-log.service').then(
      (m) => m.createAuditLogService(supabase)
    );
    
    await auditLogService.log(
      adminId,
      'settings_update',
      'system',
      null, // entity_id is null for global system settings
      {
        changed_settings: settings,
      },
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      null
    );

    return createApiResponse({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
