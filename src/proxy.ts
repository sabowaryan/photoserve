/**
 * Next.js Proxy (formerly Middleware)
 * Handles authentication and route protection
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getRouteProtectionAction, isAuthRoute } from '@/lib/middleware/route-protection';

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Handle callback URL for authenticated users on auth routes
  if (isAuthRoute(pathname) && isAuthenticated) {
    const callbackUrl = searchParams.get('callbackUrl');
    const destination = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Get the route protection action
  const result = getRouteProtectionAction(pathname, isAuthenticated);

  if (result.action === 'redirect') {
    const url = new URL(result.destination, request.url);
    if (result.includeCallbackUrl) {
      url.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|g/).*)',
  ],
};
