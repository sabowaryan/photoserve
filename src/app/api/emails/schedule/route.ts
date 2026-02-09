/**
 * Email Schedule API Route
 * 
 * POST /api/emails/schedule - Schedule an email for future delivery
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
import { createAdminClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email.service';
import { createTemplateRenderer } from '@/lib/email/template-renderer';
import { scheduleEmailSchema } from '@/lib/validators/email.schemas';

/**
 * POST /api/emails/schedule
 * 
 * Schedule an email for future delivery
 * 
 * Request body:
 * - to: string (email address)
 * - subject: string
 * - html: string
 * - text?: string
 * - from?: string (email address)
 * - cc?: string[] (email addresses)
 * - bcc?: string[] (email addresses)
 * - templateId?: string (UUID)
 * - variables?: Record<string, any>
 * - priority?: 'high' | 'normal' | 'low'
 * - type: 'transactional' | 'marketing'
 * - scheduledAt: string (ISO 8601 datetime)
 * 
 * Response:
 * - 200: { id: string, success: true }
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
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
    const validatedData = scheduleEmailSchema.parse(body);
    
    // Validate scheduled time is in the future
    const scheduledAt = new Date(validatedData.scheduledAt);
    if (scheduledAt <= new Date()) {
      return createApiResponse(
        { error: 'Scheduled time must be in the future' },
        400
      );
    }
    
    // Create email service
    const supabase = createAdminClient();
    const emailService = new EmailService(supabase);
    
    // If templateId is provided, render the template
    let html = validatedData.html;
    let text = validatedData.text;
    let subject = validatedData.subject;
    
    if (validatedData.templateId && validatedData.variables) {
      const templateRenderer = createTemplateRenderer(supabase);
      const rendered = await templateRenderer.renderById(
        validatedData.templateId,
        validatedData.variables
      );
      
      html = rendered.html;
      text = rendered.text;
      subject = rendered.subject;
    }
    
    // Schedule email
    const result = await emailService.scheduleEmail({
      to: validatedData.to,
      subject,
      html,
      text,
      from: validatedData.from,
      cc: validatedData.cc,
      bcc: validatedData.bcc,
      templateId: validatedData.templateId,
      variables: validatedData.variables,
      priority: validatedData.priority,
      type: validatedData.type,
      scheduledAt,
    });
    
    if (!result.success) {
      return createApiResponse(
        { error: result.error || 'Failed to schedule email' },
        400
      );
    }
    
    return createApiResponse({
      id: result.id,
      success: true,
      scheduledAt: scheduledAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
