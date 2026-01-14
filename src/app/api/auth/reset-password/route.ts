/**
 * Reset Password API Route
 * Handles password reset with token
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { resetPasswordSchema } from '@/lib/validators/auth.schema';
import { handleApiError } from '@/lib/api/error-handler';

export async function POST(request: NextRequest) {
  try {
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
        { status: 400 }
      );
    }

    const { token, password } = validatedFields.data;

    // Reset password
    const result = await authService.resetPassword(token, password);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'api.errors.registrationFailed',
          code: 'RESET_FAILED',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'api.errors.passwordResetSuccess',
      messageKey: 'api.errors.passwordResetSuccess',
      success: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
