/**
 * NextAuth.js API Route Handler
 * Handles all authentication requests
 * Requirements: 4.3 (Rate limiting on signin)
 */
import NextAuth from 'next-auth';
import { authOptions } from '@/config/auth.config';
import { checkRateLimit, createRateLimitErrorResponse } from '@/lib/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

const handler = NextAuth(authOptions);

// Wrap POST handler with rate limiting for signin
async function POST(request: NextRequest, context: { params: { nextauth: string[] } }) {
  // Check if this is a signin request (credentials provider)
  const url = new URL(request.url);
  const isSignin = url.pathname.includes('callback/credentials');
  
  if (isSignin) {
    // Apply rate limiting for signin attempts
    const rateLimitResult = checkRateLimit(request, 'signin');
    if (!rateLimitResult.allowed) {
      return createRateLimitErrorResponse(rateLimitResult);
    }
  }
  
  // @ts-ignore - NextAuth handler expects different signature
  return handler(request, context);
}

// Wrap GET handler to pass context properly
async function GET(request: NextRequest, context: { params: { nextauth: string[] } }) {
  // @ts-ignore - NextAuth handler expects different signature
  return handler(request, context);
}

export { GET, POST };
