/**
 * Next.js Proxy (formerly Middleware)
 * Handles custom domain routing, authentication, and route protection
 * 
 * Requirements: 3.1-3.11 (Custom Domain Routing)
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getRouteProtectionAction, isAuthRoute } from '@/lib/middleware/route-protection';
import * as domainCache from '@/lib/cache/domain-cache';
import { createClient } from '@/lib/supabase/server';

// Primary domain configuration
const PRIMARY_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'piksend.com';

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const url = request.nextUrl.clone();

  // ============================================
  // Custom Domain Routing (Requirements 3.1-3.11)
  // ============================================
  
  // Extract hostname from request headers (Requirement 3.1)
  const hostname = request.headers.get('host') || '';
  const cleanHostname = hostname.split(':')[0] || ''; // Remove port if present
  
  // Check if this is the primary domain (Requirement 3.2)
  const isPrimaryDomain = cleanHostname === PRIMARY_DOMAIN || 
                          cleanHostname === `www.${PRIMARY_DOMAIN}` ||
                          cleanHostname === 'localhost' ||
                          cleanHostname.startsWith('localhost:');
  
  // If not primary domain, handle custom domain routing
  if (!isPrimaryDomain && cleanHostname) {
    try {
      // Create Supabase client for custom domain queries
      const supabase = await createClient();
      
      // Lookup photographer by custom domain with caching (Requirement 3.3)
      let photographerData = domainCache.get(cleanHostname);
      
      if (!photographerData) {
        // Cache miss - query database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, branding')
          .eq('branding->>customDomain', cleanHostname)
          .eq('branding->>domainVerified', 'true')
          .single();
        
        if (error || !profile) {
          // Domain not configured or not verified (Requirement 3.4)
          console.error('[Custom Domain] Domain not found or not verified:', {
            hostname: cleanHostname,
            error: error?.message,
            timestamp: new Date().toISOString(),
          });
          
          return new NextResponse(
            `<html>
              <head><title>Domain Not Found</title></head>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>404 - Domain Not Configured</h1>
                <p>This custom domain is not configured or verified.</p>
              </body>
            </html>`,
            { 
              status: 404,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
        
        // Cache the photographer data
        photographerData = {
          photographerId: profile.id,
          verified: true,
        };
        domainCache.set(cleanHostname, profile.id, true);
      }
      
      const photographerId = photographerData.photographerId;
      
      // Handle root custom domain request (Requirement 3.9)
      if (pathname === '/' || pathname === '') {
        // Get the public profile slug for this photographer
        const { data: publicProfile } = await supabase
          .from('public_profiles')
          .select('slug')
          .eq('user_id', photographerId)
          .eq('is_enabled', true)
          .single();
        
        if (!publicProfile) {
          console.error('[Custom Domain] No public profile found for photographer:', {
            hostname: cleanHostname,
            photographerId,
            timestamp: new Date().toISOString(),
          });
          
          return new NextResponse(
            `<html>
              <head><title>Profile Not Found</title></head>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>404 - Profile Not Found</h1>
                <p>This photographer's public profile is not available.</p>
              </body>
            </html>`,
            { 
              status: 404,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
        
        // Rewrite to the public profile page
        const profileUrl = url.clone();
        profileUrl.pathname = `/p/${publicProfile.slug}`;
        
        console.log(`[Custom Domain] Rewriting ${cleanHostname}/ to /p/${publicProfile.slug}`);
        
        return NextResponse.rewrite(profileUrl);
      }
      
      // Extract gallery slug from URL path (Requirement 3.5)
      // Support both /g/slug and /galerie/slug patterns
      const galleryMatch = pathname.match(/^\/(g|galerie)\/([a-zA-Z0-9_-]+)/);
      
      if (galleryMatch && galleryMatch[2]) {
        const gallerySlug = galleryMatch[2];
        
        // Verify gallery belongs to photographer (Requirement 3.6)
        const { data: gallery, error: galleryError } = await supabase
          .from('galleries')
          .select('id, user_id')
          .eq('unique_slug', gallerySlug)
          .single();
        
        if (galleryError || !gallery) {
          console.error('[Custom Domain] Gallery not found:', {
            hostname: cleanHostname,
            slug: gallerySlug,
            error: galleryError?.message,
            timestamp: new Date().toISOString(),
          });
          
          return new NextResponse(
            `<html>
              <head><title>Gallery Not Found</title></head>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>404 - Gallery Not Found</h1>
                <p>The requested gallery does not exist.</p>
              </body>
            </html>`,
            { 
              status: 404,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
        
        if (gallery.user_id !== photographerId) {
          console.error('[Custom Domain] Gallery ownership mismatch:', {
            hostname: cleanHostname,
            slug: gallerySlug,
            galleryUserId: gallery.user_id,
            photographerId,
            timestamp: new Date().toISOString(),
          });
          
          return new NextResponse(
            `<html>
              <head><title>Access Denied</title></head>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>403 - Access Denied</h1>
                <p>This gallery does not belong to this domain.</p>
              </body>
            </html>`,
            { 
              status: 403,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
        
        // Rewrite URL to internal route with custom domain query param (Requirements 3.7, 3.8)
        const rewriteUrl = url.clone();
        rewriteUrl.searchParams.set('customDomain', cleanHostname);
        return NextResponse.rewrite(rewriteUrl);
      }
      
      // If path doesn't match gallery pattern, return 404
      console.error('[Custom Domain] Invalid path for custom domain:', {
        hostname: cleanHostname,
        pathname,
        timestamp: new Date().toISOString(),
      });
      
      return new NextResponse(
        `<html>
          <head><title>Page Not Found</title></head>
          <body style="font-family: system-ui; padding: 2rem; text-align: center;">
            <h1>404 - Page Not Found</h1>
            <p>The requested page does not exist on this domain.</p>
          </body>
        </html>`,
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
      
    } catch (error) {
      // Error handling with context (Requirement 3.11)
      console.error('[Custom Domain] Middleware error:', {
        hostname: cleanHostname,
        pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      
      return new NextResponse(
        `<html>
          <head><title>Server Error</title></head>
          <body style="font-family: system-ui; padding: 2rem; text-align: center;">
            <h1>500 - Server Error</h1>
            <p>An error occurred while processing your request.</p>
          </body>
        </html>`,
        { 
          status: 500,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
  }

  // ============================================
  // Canonical URL Redirects (SEO)
  // ============================================
  
  // 1. Redirect www to non-www (canonical domain)
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.replace('www.', '');
    return NextResponse.redirect(url, 301);
  }

  // 2. Redirect http to https (force HTTPS)
  // Note: This is usually handled by the hosting provider (Vercel, Netlify)
  // but we add it here as a fallback
  if (url.protocol === 'http:' && process.env.NODE_ENV === 'production') {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  // ============================================
  // Authentication & Route Protection
  // ============================================

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
     * - _next/webpack-hmr (hot module replacement)
     * - favicon.ico (favicon file)
     * - public folder files (images, fonts, etc.)
     * - files with extensions (e.g., .png, .jpg, .css, .js)
     * 
     * This matcher is configured to support custom domain routing
     * while excluding internal Next.js routes and static assets.
     * 
     * Requirement 3.10: Exclude API routes, static files, Next.js internals
     */
    '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\..*).*)',
  ],
};
