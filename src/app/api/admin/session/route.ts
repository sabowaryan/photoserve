/**
 * Admin Session API
 * 
 * Marks the admin session as logged after first access.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { encode } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token?.id || !token.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update the token with adminSessionLogged flag
    const updatedToken = {
      ...token,
      adminSessionLogged: true,
    };

    // Encode the new token
    const encodedToken = await encode({
      token: updatedToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    // Create response with updated cookie
    const response = NextResponse.json({ success: true });
    
    const cookieName = process.env.NODE_ENV === 'production'
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    response.cookies.set(cookieName, encodedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Failed to update admin session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
