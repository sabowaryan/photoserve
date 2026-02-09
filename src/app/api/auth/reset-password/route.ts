/**
 * Reset Password API Route
 * Handles password reset with token validation
 * Requirements: 21.2 (API endpoints for verification)
 * Validates: Requirements 9.6, 9.8, 9.9 (Token validation, invalidation, and notification)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/validators/auth.schema';
import { handleApiError } from '@/lib/api/error-handler';
import { checkRateLimit, createRateLimitHeaders, createRateLimitErrorResponse } from '@/lib/middleware/rate-limit';
import { tokenService } from '@/lib/services/token.service';
import { EmailVerificationService } from '@/lib/services/email-verification.service';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = checkRateLimit(request, 'resetPassword');
    if (!rateLimitResult.allowed) {
      return createRateLimitErrorResponse(rateLimitResult);
    }

    const body = await request.json();
    
    // Validate input
    const validatedFields = resetPasswordSchema.safeParse(body);
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

    const { token, password } = validatedFields.data;

    // Validate reset token (requirement 9.6)
    const validationResult = await tokenService.validate(token, 'password_reset');

    if (!validationResult.valid) {
      // Map token errors to user-friendly messages
      let errorMessage = 'api.errors.invalidToken';
      let statusCode = 400;

      switch (validationResult.error) {
        case 'TOKEN_EXPIRED':
          errorMessage = 'api.errors.resetTokenExpired';
          break;
        case 'TOKEN_USED':
          errorMessage = 'api.errors.tokenAlreadyUsed';
          break;
        case 'TOKEN_NOT_FOUND':
          errorMessage = 'api.errors.tokenNotFound';
          break;
        case 'TOKEN_INVALID':
          errorMessage = 'api.errors.invalidToken';
          break;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          code: validationResult.error,
          message: validationResult.errorMessage,
        },
        { 
          status: statusCode,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    if (!validationResult.userId) {
      console.error('[ResetPassword] No user ID in validation result');
      return NextResponse.json(
        {
          error: 'api.errors.passwordResetFailed',
          code: 'PASSWORD_RESET_FAILED',
        },
        { 
          status: 500,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Token is valid, update password using Supabase Auth
    const supabase = createAdminClient();
    
    // Get user details before password change
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', validationResult.userId)
      .single();

    if (userError || !userData) {
      console.error('[ResetPassword] User not found:', userError);
      return NextResponse.json(
        {
          error: 'api.errors.userNotFound',
          code: 'USER_NOT_FOUND',
        },
        { 
          status: 404,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      validationResult.userId,
      { password }
    );

    if (updateError) {
      console.error('[ResetPassword] Failed to update password:', updateError);
      return NextResponse.json(
        {
          error: 'api.errors.passwordResetFailed',
          code: 'PASSWORD_RESET_FAILED',
        },
        { 
          status: 500,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Invalidate all password reset tokens for this user (requirement 9.8)
    await tokenService.invalidateAllForUser(validationResult.userId, 'password_reset');

    // Get client IP for security tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0]?.trim() : request.headers.get('x-real-ip') || 'unknown';

    // Send password changed notification email (requirement 9.9)
    const emailService = new EmailVerificationService(supabase);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Don't await this - send asynchronously
    emailService.sendPasswordChangedEmail({
      userId: userData.id,
      email: userData.email,
      name: userData.name || undefined,
      changedAt: new Date(),
      changedFrom: clientIp,
      baseUrl,
    }).catch(error => {
      // Log error but don't fail the password reset
      console.error('[ResetPassword] Failed to send notification email:', error);
    });

    // Log successful password reset
    console.log('[ResetPassword] Password reset successfully:', {
      userId: validationResult.userId,
      email: userData.email,
      changedFrom: clientIp,
    });

    return NextResponse.json(
      {
        message: 'api.errors.passwordResetSuccess',
        messageKey: 'api.errors.passwordResetSuccess',
        success: true,
      },
      {
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('[ResetPassword] Unexpected error:', error);
    return handleApiError(error);
  }
}
