/**
 * Admin Plugin Version Detail API Route
 * PATCH - Update a plugin version (admin only)
 * DELETE - Delete a plugin version (admin only)
 * 
 * @module app/api/admin/plugin/versions/[id]/route
 * Requirements: 10.1, 10.7, 10.10
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Update version validation schema
 */
const updateVersionSchema = z.object({
  isStable: z.boolean().optional(),
  changelog: z.string().optional(),
  minLightroomVersion: z.string().regex(/^\d+\.\d+$/).optional(),
});

/**
 * PATCH /api/admin/plugin/versions/[id]
 * Update a plugin version (admin only)
 * 
 * Request Body:
 * - isStable: boolean (optional)
 * - changelog: string (optional)
 * - minLightroomVersion: string (optional)
 * 
 * Returns:
 * - version: Updated PluginVersion object
 * 
 * Requirements:
 * - 10.1: Admin can update version properties
 * - 10.7: Admin can mark versions as stable/unstable
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const validationResult = updateVersionSchema.safeParse(body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return createApiResponse(
        { error: firstError?.message || 'Invalid request body' },
        400
      );
    }

    // Create Supabase admin client
    const supabase = await createAdminClient();

    // Update version
    const { data: version, error: updateError } = await supabase
      .from('plugin_versions')
      .update({
        is_stable: validationResult.data.isStable,
        changelog: validationResult.data.changelog,
        min_lightroom_version: validationResult.data.minLightroomVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[PluginVersion] Update error:', updateError);
      
      if (updateError.code === 'PGRST116') {
        return createApiResponse(
          { error: 'Version not found' },
          404
        );
      }
      
      throw new Error('Failed to update version');
    }

    return createApiResponse({ version });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/plugin/versions/[id]
 * Delete a plugin version (admin only)
 * 
 * Returns:
 * - success: boolean
 * 
 * Requirements:
 * - 10.1: Admin can delete versions
 * - 10.10: Provide delete action for versions
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Create Supabase admin client
    const supabase = await createAdminClient();

    // Delete version
    const { error: deleteError } = await supabase
      .from('plugin_versions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[PluginVersion] Delete error:', deleteError);
      
      if (deleteError.code === 'PGRST116') {
        return createApiResponse(
          { error: 'Version not found' },
          404
        );
      }
      
      throw new Error('Failed to delete version');
    }

    return createApiResponse({ success: true }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
