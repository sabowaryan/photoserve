/**
 * Signup API Route
 * Handles user registration
 */
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { signUpSchema } from '@/lib/validators/auth.schema';
import { handleApiError } from '@/lib/api/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedFields = signUpSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validatedFields.error.issues,
        },
        { status: 400 }
      );
    }

    // Create user
    const result = await authService.signUp(validatedFields.data);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Registration failed',
          code: 'REGISTRATION_FAILED',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Compte créé avec succès',
        user: {
          id: result.user!.id,
          email: result.user!.email,
          name: result.user!.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
