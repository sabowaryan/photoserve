/**
 * Guest Session API Endpoint
 * 
 * POST /api/guest/session - Create or retrieve a guest session
 * 
 * This endpoint manages guest sessions for visitors who want to create
 * galleries without an account. It creates a new session or returns
 * an existing valid session.
 * 
 * Requirements: 8.1, 8.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error-handler';
import {
  createServerSession,
  createSessionCookie,
  getTokenFromCookies,
  isValidUUID,
  isSessionExpired,
  createClearSessionCookie,
} from '@/lib/guest';

/**
 * POST /api/guest/session
 * 
 * Creates a new guest session or returns an existing valid one.
 * Sets an HTTP-only cookie with the session token.
 * 
 * Response:
 * - 200: { session: { token, createdAt, expiresAt } }
 * - 500: { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Check for existing session in cookies
    const cookieHeader = request.headers.get('cookie');
    const existingToken = getTokenFromCookies(cookieHeader);

    // If we have a valid token, check if it's still valid
    if (existingToken && isValidUUID(existingToken)) {
      // Try to find existing session data from request body
      const body = await request.json().catch(() => ({}));
      const clientSession = body.session;

      if (clientSession && 
          clientSession.token === existingToken && 
          !isSessionExpired(clientSession.expiresAt)) {
        // Return existing session
        const response = NextResponse.json({
          session: clientSession,
          isNew: false,
        });

        // Refresh the cookie
        response.headers.set(
          'Set-Cookie',
          createSessionCookie(clientSession.token, new Date(clientSession.expiresAt))
        );

        return response;
      }
    }

    // Create a new session
    const newSession = createServerSession();

    // Create response with session data
    const response = NextResponse.json({
      session: newSession,
      isNew: true,
    });

    // Set HTTP-only cookie
    response.headers.set(
      'Set-Cookie',
      createSessionCookie(newSession.token, new Date(newSession.expiresAt))
    );

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/guest/session
 * 
 * Retrieves the current guest session from cookies.
 * 
 * Response:
 * - 200: { session: { token, createdAt, expiresAt } | null }
 */
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookies(cookieHeader);

    if (!token) {
      return NextResponse.json({ session: null });
    }

    // We can only return the token from the cookie
    // The full session data should be stored client-side
    return NextResponse.json({
      token,
      hasSession: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/guest/session
 * 
 * Clears the guest session cookie.
 * 
 * Response:
 * - 200: { success: true }
 */
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear the cookie
    response.headers.set('Set-Cookie', createClearSessionCookie());

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
