/**
 * Email Templates API Route
 * 
 * GET /api/emails/templates - List email templates
 * POST /api/emails/templates - Create a new email template
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
import { createAdminClient } from '@/lib/supabase/server';
import { createTemplateRepository } from '@/lib/repositories/template.repository';
import {
  listTemplatesSchema,
  createTemplateSchema,
} from '@/lib/validators/email.schemas';

/**
 * GET /api/emails/templates
 * 
 * List email templates with optional filters
 * 
 * Query parameters:
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 * - type?: 'transactional' | 'marketing'
 * - source?: 'react-email' | 'custom'
 * - status?: 'active' | 'inactive'
 * - search?: string
 * 
 * Response:
 * - 200: { templates: Template[], total: number, page: number, limit: number }
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 429: Rate limit exceeded
 * - 500: Internal server error
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
    
    // Apply rate limiting (100 requests per minute)
    const rateLimitResponse = rateLimitMiddleware(request, {
      requestsPerMinute: 100,
      burstLimit: 10,
    });
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    };
    
    const validatedQuery = listTemplatesSchema.parse(queryParams);
    
    // Create template repository
    const supabase = createAdminClient();
    const templateRepo = createTemplateRepository(supabase);
    
    // List templates with filters
    const templates = await templateRepo.listTemplates({
      type: validatedQuery.type ?? undefined,
      source: validatedQuery.source ?? undefined,
      status: validatedQuery.status ?? undefined,
      search: validatedQuery.search ?? undefined,
    });
    
    // Apply pagination
    const total = templates.length;
    const start = (validatedQuery.page - 1) * validatedQuery.limit;
    const end = start + validatedQuery.limit;
    const paginatedTemplates = templates.slice(start, end);
    
    return createApiResponse({
      templates: paginatedTemplates,
      total,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      totalPages: Math.ceil(total / validatedQuery.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/emails/templates
 * 
 * Create a new email template
 * 
 * Request body:
 * - name: string
 * - slug: string (lowercase, alphanumeric with hyphens)
 * - type: 'transactional' | 'marketing'
 * - source: 'react-email' | 'custom'
 * - subject: string
 * - content: any (JSON or HTML)
 * - variables?: string[]
 * 
 * Response:
 * - 201: { template: Template }
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 409: Template with slug already exists
 * - 429: Rate limit exceeded
 * - 500: Internal server error
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
    
    // Apply rate limiting (100 requests per minute)
    const rateLimitResponse = rateLimitMiddleware(request, {
      requestsPerMinute: 100,
      burstLimit: 10,
    });
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);
    
    // Create template repository
    const supabase = createAdminClient();
    const templateRepo = createTemplateRepository(supabase);
    
    // Create template
    const template = await templateRepo.createTemplate(
      {
        name: validatedData.name,
        slug: validatedData.slug,
        type: validatedData.type,
        source: validatedData.source,
        subject: validatedData.subject,
        content: validatedData.content,
        variables: validatedData.variables,
        is_active: true,
      },
      authResult.userId
    );
    
    return createApiResponse({ template }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
