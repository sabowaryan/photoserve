/**
 * Admin Plugin Versions API Route
 * GET - List all plugin versions (admin only)
 * POST - Create a new plugin version (admin only)
 * 
 * @module app/api/admin/plugin/versions/route
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.9, 4.10, 10.1, 10.5, 10.6, 10.7, 10.11
 */
import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { pluginVersionService } from '@/lib/services/plugin-version.service';
import { createPluginVersionSchema } from '@/lib/validators/plugin.schemas';
import { SecurityLogger, extractRequestMetadata } from '@/lib/utils/security-logger';

/**
 * GET /api/admin/plugin/versions
 * List all plugin versions (admin only)
 * 
 * Query Parameters:
 * - includeUnstable: boolean (default: true) - Whether to include unstable versions
 * 
 * Returns:
 * - versions: Array of PluginVersion objects
 * 
 * Requirements:
 * - 4.6: Return all versions with filtering by stability
 * - 4.9: Admin can view all versions including unstable
 * - 4.10: Display version details (number, release date, download count, stability)
 * - 10.1: Admin interface can list all plugin versions
 * - 10.7: Display download statistics for each version
 * - 10.11: Only accessible to admin users
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeUnstableParam = searchParams.get('includeUnstable');
    
    // Default to true for admin users (they can see all versions)
    const includeUnstable = includeUnstableParam !== 'false';
    
    // Get all versions from service
    const versions = await pluginVersionService.getAllVersions(includeUnstable);

    return createApiResponse({ versions });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/plugin/versions
 * Create a new plugin version (admin only)
 * 
 * Request Body:
 * - version: string (semantic version, e.g., "1.0.0")
 * - fileUrl: string (Cloudinary URL)
 * - fileSize: number (bytes)
 * - changelog: string (markdown)
 * - isStable: boolean (optional, default: false)
 * - minLightroomVersion: string (optional, default: "11.0")
 * 
 * Returns:
 * - version: PluginVersion object
 * 
 * Requirements:
 * - 4.2: Require semantic version number, file URL, file size, and changelog
 * - 4.3: Allow marking as stable or beta
 * - 4.4: Allow specifying minimum Lightroom version
 * - 4.5: Set release date to current timestamp
 * - 10.5: Provide form fields for version creation
 * - 10.6: Validate version number follows semantic versioning
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    
    if (!authResult.success) {
      return createApiResponse(
        { error: authResult.error },
        authResult.status
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate request body using Zod schema
    const validationResult = createPluginVersionSchema.safeParse(body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return createApiResponse(
        { 
          error: firstError?.message || 'Invalid request body',
          details: validationResult.error.issues,
        },
        400
      );
    }

    // Create version using service
    const version = await pluginVersionService.createVersion(validationResult.data);
    
    // Log admin action
    const requestMetadata = extractRequestMetadata(request);
    SecurityLogger.logAdminAction('version_created', authResult.userId!, {
      ...requestMetadata,
      details: {
        version: version.version,
        isStable: version.isStable,
      },
    });

    return createApiResponse({ version }, 201);
  } catch (error) {
    // Handle duplicate version error
    if (error instanceof Error && error.message.includes('already exists')) {
      return createApiResponse(
        { error: error.message },
        409 // Conflict
      );
    }
    
    return handleApiError(error);
  }
}
