/**
 * Request Password Reset API Route
 * Handles password reset email requests
 * Requirements: 21.2 (API endpoints for verification)
 * Validates: Requirements 9.1, 9.2, 9.3 (Password reset email with token)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordResetSchema } from '@/lib/validators/auth.schema';
import { handleApiError } from '@/lib/api/error-handler';
import { checkRateLimit, createRateLimitHeaders, createRateLimitErrorResponse } from '@/lib/middleware/rate-limit';
import { tokenService } from '@/lib/services/token.service';
import { EmailVerificationService } from '@/lib/services/email-verification.service';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (3 requests per hour per requirement 9.1)
    const rateLimitResult = checkRateLimit(request, 'requestPasswordReset');
    if (!rateLimitResult.allowed) {
      return createRateLimitErrorResponse(rateLimitResult);
    }

    const body = await request.json();
    
    // Validate input
    const validatedFields = requestPasswordResetSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'api.errors.validationFailed',
          code: 'VALIDATION_ERROR',
          details: validatedFields.error.issues,
        },
        { 
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { email } = validatedFields.data;

    // Find user by email
    const supabase = createAdminClient();
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', email)
      .single();

    // Always return success to prevent email enumeration (security best practice)
    // Even if user doesn't exist, we return success
    if (userError || !userData) {
      return NextResponse.json(
        {
          message: 'api.errors.passwordResetEmailSent',
          messageKey: 'api.errors.passwordResetEmailSent',
          success: true,
        },
        {
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Generate password reset token (requirement 9.2)
    // Token expires after 1 hour (requirement 9.3)
    const { token } = await tokenService.generate(userData.id, 'password_reset');

    // Get client IP for security tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0]?.trim() : request.headers.get('x-real-ip') || 'unknown';

    // Send password reset email
    const emailService = new EmailVerificationService(supabase);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const emailResult = await emailService.sendPasswordResetEmail({
      userId: userData.id,
      email: userData.email,
      name: userData.name || undefined,
      token,
      baseUrl,
      requestedFrom: clientIp,
    });

    if (!emailResult.success) {
      console.error('[RequestPasswordReset] Failed to send email:', emailResult.error);
      // Still return success to user to prevent email enumeration
      // But log the error for monitoring
      return NextResponse.json(
        {
          message: 'api.errors.passwordResetEmailSent',
          messageKey: 'api.errors.passwordResetEmailSent',
          success: true,
        },
        {
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Log successful request
    console.log('[RequestPasswordReset] Password reset email sent:', {
      userId: userData.id,
      email: userData.email,
      requestedFrom: clientIp,
      queueTime: emailResult.queueTime,
      provider: emailResult.provider,
    });

    return NextResponse.json(
      {
        message: 'api.errors.passwordResetEmailSent',
        messageKey: 'api.errors.passwordResetEmailSent',
        success: true,
      },
      {
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('[RequestPasswordReset] Unexpected error:', error);
    return handleApiError(error);
  }
}
