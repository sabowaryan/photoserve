/**
 * Verify Email API Route
 * Handles email verification token validation
 * Requirements: 21.2 (API endpoints for verification)
 * Validates: Requirements 5.7 (Token validation and account verification)
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailSchema } from '@/lib/validators/auth.schema';
import { handleApiError } from '@/lib/api/error-handler';
import { checkRateLimit, createRateLimitHeaders, createRateLimitErrorResponse } from '@/lib/middleware/rate-limit';
import { tokenService } from '@/lib/services/token.service';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = checkRateLimit(request, 'verifyEmail');
    if (!rateLimitResult.allowed) {
      return createRateLimitErrorResponse(rateLimitResult);
    }

    const body = await request.json();
    
    // Validate input
    const validatedFields = verifyEmailSchema.safeParse(body);
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

    const { token } = validatedFields.data;

    // Validate token
    const validationResult = await tokenService.validate(token, 'verification');

    if (!validationResult.valid) {
      // Map token errors to user-friendly messages
      let errorMessage = 'api.errors.invalidToken';
      let statusCode = 400;

      switch (validationResult.error) {
        case 'TOKEN_EXPIRED':
          errorMessage = 'api.errors.tokenExpired';
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

    // Token is valid, mark user as verified
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    if (!validationResult.userId) {
      console.error('[VerifyEmail] No user ID in validation result');
      return NextResponse.json(
        {
          error: 'api.errors.verificationFailed',
          code: 'VERIFICATION_FAILED',
        },
        { 
          status: 500,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        email_verified_at: now,
        updated_at: now,
      })
      .eq('id', validationResult.userId);

    if (updateError) {
      console.error('[VerifyEmail] Failed to update profile:', updateError);
      return NextResponse.json(
        {
          error: 'api.errors.verificationFailed',
          code: 'VERIFICATION_FAILED',
        },
        { 
          status: 500,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Log successful verification
    console.log('[VerifyEmail] User verified successfully:', {
      userId: validationResult.userId,
      timestamp: now,
    });

    return NextResponse.json(
      {
        message: 'api.errors.emailVerifiedSuccess',
        messageKey: 'api.errors.emailVerifiedSuccess',
        success: true,
      },
      {
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('[VerifyEmail] Unexpected error:', error);
    return handleApiError(error);
  }
}
