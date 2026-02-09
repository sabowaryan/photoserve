/**
 * Signup API Route
 * Handles user registration and triggers welcome emails
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 4.3 (Rate limiting)
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { signUpSchema } from '@/lib/validators/auth.schema';
import { handleApiError } from '@/lib/api/error-handler';
import { EmailTriggersService } from '@/lib/services/email-triggers.service';
import { checkRateLimit, createRateLimitHeaders, createRateLimitErrorResponse } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = checkRateLimit(request, 'signup');
    if (!rateLimitResult.allowed) {
      return createRateLimitErrorResponse(rateLimitResult);
    }

    const body = await request.json();
    
    // Validate input
    const validatedFields = signUpSchema.safeParse(body);
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

    // Create user
    const result = await authService.signUp(validatedFields.data);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'api.errors.registrationFailed',
          code: 'REGISTRATION_FAILED',
        },
        { 
          status: 400,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Send verification email
    // This runs asynchronously and doesn't block the response
    if (result.user?.id) {
      try {
        // Use admin client since user is not yet authenticated
        const { createAdminClient } = await import('@/lib/supabase/server');
        const supabase = createAdminClient();
        
        // Import email verification service and token service
        const { EmailVerificationService } = await import('@/lib/services/email-verification.service');
        const { tokenService } = await import('@/lib/services/token.service');
        
        // Generate verification token
        const tokenResult = await tokenService.generate(result.user.id, 'verification');
        
        // Send verification email
        const emailService = new EmailVerificationService(supabase);
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        
        await emailService.sendVerificationEmail({
          userId: result.user.id,
          email: result.user.email,
          name: result.user.name || undefined,
          token: tokenResult.token,
          baseUrl,
        });
        
        console.log('[Signup] Verification email sent to:', result.user.email);
      } catch (emailError) {
        // Log error but don't fail the signup
        console.error('Failed to send verification email:', emailError);
      }
    }

    return NextResponse.json(
      {
        message: 'api.errors.accountCreatedSuccess',
        messageKey: 'api.errors.accountCreatedSuccess',
        user: {
          id: result.user!.id,
          email: result.user!.email,
          name: result.user!.name,
        },
      },
      { 
        status: 201,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
