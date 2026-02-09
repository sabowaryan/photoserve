/**
 * Email Template Detail API Route
 * 
 * GET /api/emails/templates/[id] - Get a specific template
 * PUT /api/emails/templates/[id] - Update a template
 * DELETE /api/emails/templates/[id] - Delete a template (soft delete)
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse, createNoContentResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createTemplateRepository } from '@/lib/repositories/template.repository';
import { updateTemplateSchema } from '@/lib/validators/email.schemas';
import { NotFoundError } from '@/lib/errors';

/**
 * GET /api/emails/templates/[id]
 * 
 * Get a specific email template by ID
 * 
 * Query parameters:
 * - version?: number (optional, get specific version)
 * 
 * Response:
 * - 200: { template: Template }
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: Template not found
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
export async function GET(
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
    
    // Get version from query params if provided
    const searchParams = request.nextUrl.searchParams;
    const versionParam = searchParams.get('version');
    const version = versionParam ? parseInt(versionParam, 10) : undefined;
    
    // Create template repository
    const supabase = createAdminClient();
    const templateRepo = createTemplateRepository(supabase);
    
    // Get template
    const template = await templateRepo.getTemplate(id, version);
    
    if (!template) {
      throw new NotFoundError('Email template');
    }
    
    return createApiResponse({ template });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/emails/templates/[id]
 * 
 * Update an email template (creates a new version)
 * 
 * Request body:
 * - name?: string
 * - subject?: string
 * - content?: any (JSON or HTML)
 * - variables?: string[]
 * 
 * Response:
 * - 200: { template: Template }
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: Template not found
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
export async function PUT(
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
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);
    
    // Create template repository
    const supabase = createAdminClient();
    const templateRepo = createTemplateRepository(supabase);
    
    // Update template (creates new version)
    const template = await templateRepo.updateTemplate(
      id,
      validatedData,
      authResult.userId
    );
    
    return createApiResponse({ template });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/emails/templates/[id]
 * 
 * Delete an email template (soft delete - marks as inactive)
 * 
 * Response:
 * - 204: No content (success)
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: Template not found
 * - 429: Rate limit exceeded
 * - 500: Internal server error
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
    
    // Create template repository
    const supabase = createAdminClient();
    const templateRepo = createTemplateRepository(supabase);
    
    // Delete template (soft delete)
    await templateRepo.deleteTemplate(id);
    
    return createNoContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
