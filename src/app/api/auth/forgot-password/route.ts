/**
 * Forgot Password API Route
 * Handles password reset email requests
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { forgotPasswordSchema } from '@/lib/validators/auth.schema';
import { handleApiError } from '@/lib/api/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedFields = forgotPasswordSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'api.errors.validationFailed',
          code: 'VALIDATION_ERROR',
          details: validatedFields.error.issues,
        },
        { status: 400 }
      );
    }

    const { email } = validatedFields.data;

    // Request password reset
    await authService.resetPasswordRequest(email);

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'api.errors.passwordResetEmailSent',
      messageKey: 'api.errors.passwordResetEmailSent',
      success: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
