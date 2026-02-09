/**
 * Resend Verification Email API Route
 * Handles resending verification emails with rate limiting
 * Requirements: 21.2 (API endpoints for verification)
 * Validates: Requirements 7.2, 7.3, 7.5 (Token regeneration and rate limiting)
 */
import { NextRequest, NextResponse } from 'next/server';
import { resendVerificationSchema } from '@/lib/validators/auth.schema';
import { handleApiError } from '@/lib/api/error-handler';
import { checkRateLimit, createRateLimitHeaders, createRateLimitErrorResponse } from '@/lib/middleware/rate-limit';
import { tokenService } from '@/lib/services/token.service';
import { EmailVerificationService } from '@/lib/services/email-verification.service';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (3 resends per hour per requirement 7.5)
    const rateLimitResult = checkRateLimit(request, 'resendVerification');
    if (!rateLimitResult.allowed) {
      return createRateLimitErrorResponse(rateLimitResult);
    }

    const body = await request.json();
    
    // Validate input
    const validatedFields = resendVerificationSchema.safeParse(body);
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
      .select('id, email, name, email_verified')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      // Don't reveal if email exists (security best practice)
      // Always return success to prevent email enumeration
      return NextResponse.json(
        {
          message: 'api.errors.verificationEmailSent',
          messageKey: 'api.errors.verificationEmailSent',
          success: true,
        },
        {
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Check if user is already verified
    if (userData.email_verified) {
      return NextResponse.json(
        {
          error: 'api.errors.emailAlreadyVerified',
          code: 'EMAIL_ALREADY_VERIFIED',
        },
        { 
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Invalidate all previous verification tokens for this user (requirement 7.3)
    await tokenService.invalidateAllForUser(userData.id, 'verification');

    // Generate new verification token (requirement 7.2) with error handling
    let token: string;
    try {
      const result = await tokenService.generate(userData.id, 'verification');
      token = result.token;
    } catch (error: any) {
      console.error('[ResendVerification] Token generation failed:', error);
      
      // Return translation key for user-friendly error message
      const errorKey = error.message?.includes('timeout') || error.message?.includes('Network')
        ? 'errors.generic.networkError'
        : 'auth.errors.genericError';
      
      return NextResponse.json(
        {
          error: errorKey,
          code: 'TOKEN_GENERATION_FAILED',
        },
        { 
          status: 503, // Service Unavailable
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Send verification email
    const emailService = new EmailVerificationService(supabase);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const emailResult = await emailService.sendVerificationEmail({
      userId: userData.id,
      email: userData.email,
      name: userData.name || undefined,
      token,
      baseUrl,
    });

    if (!emailResult.success) {
      console.error('[ResendVerification] Failed to send email:', emailResult.error);
      return NextResponse.json(
        {
          error: 'api.errors.emailSendFailed',
          code: 'EMAIL_SEND_FAILED',
        },
        { 
          status: 500,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Log successful resend
    console.log('[ResendVerification] Verification email resent:', {
      userId: userData.id,
      email: userData.email,
      queueTime: emailResult.queueTime,
      provider: emailResult.provider,
    });

    return NextResponse.json(
      {
        message: 'api.errors.verificationEmailSent',
        messageKey: 'api.errors.verificationEmailSent',
        success: true,
      },
      {
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('[ResendVerification] Unexpected error:', error);
    return handleApiError(error);
  }
}
