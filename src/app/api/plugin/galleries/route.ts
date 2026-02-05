/**
 * Plugin Gallery API Route
 * POST - Create a new gallery from Lightroom plugin
 * 
 * This endpoint allows the Lightroom plugin to create galleries using API key authentication.
 * It validates the API key, checks Pro plan status, and creates the gallery.
 * 
 * Requirements: Plugin integration for gallery creation
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key.service';
import { createGalleryService } from '@/lib/services/gallery.service';
import { createGallerySchema } from '@/lib/validators/gallery.schema';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
import { getCorsHeaders } from '@/lib/middleware/cors';
import { metricsService } from '@/lib/services/metrics.service';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/plugin/galleries
 * 
 * Create a new gallery from the Lightroom plugin
 * 
 * Headers:
 *   Authorization: Bearer pk_live_<token>
 * 
 * Body:
 *   {
 *     title: string (required)
 *     description?: string
 *     password?: string
 *     expires_at?: string (ISO 8601)
 *     allow_downloads?: boolean
 *     allow_comments?: boolean
 *     watermark_enabled?: boolean
 *   }
 * 
 * Responses:
 *   201 - Gallery created successfully
 *   400 - Invalid request body or missing Authorization header
 *   401 - Invalid or expired API key
 *   403 - Valid API key but user is not Pro
 *   500 - Internal server error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      // Add CORS headers to rate limit response
      const corsHeaders = getCorsHeaders(request);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        rateLimitResponse.headers.set(key, value);
      });
      
      // Track metrics
      metricsService.trackEndpointError('/api/plugin/galleries', true);
      
      return rateLimitResponse;
    }
    
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      metricsService.trackEndpointError('/api/plugin/galleries', true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Authorization header',
        },
        { status: 400 }
      );
    }
    
    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      metricsService.trackEndpointError('/api/plugin/galleries', true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Authorization header format. Expected: Bearer <token>',
        },
        { status: 400 }
      );
    }
    
    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      metricsService.trackEndpointError('/api/plugin/galleries', true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Empty token in Authorization header',
        },
        { status: 400 }
      );
    }
    
    // Validate API key and get user info
    const validationResult = await apiKeyService.validateAPIKey(token);
    
    // Check if API key is valid
    if (!validationResult.valid) {
      metricsService.trackEndpointError('/api/plugin/galleries', true);
      
      // Return 403 for non-Pro users
      if (validationResult.user && validationResult.user.planType !== 'pro') {
        return NextResponse.json(
          {
            success: false,
            error: 'Pro plan required',
          },
          { status: 403 }
        );
      }
      
      // Return 401 for invalid/expired keys
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error || 'Invalid or expired API key',
        },
        { status: 401 }
      );
    }
    
    // Ensure we have user info
    if (!validationResult.user) {
      metricsService.trackEndpointError('/api/plugin/galleries', true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'User information not available',
        },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createGallerySchema.parse(body);
    
    // Create gallery using admin client (since we're authenticated via API key, not session)
    const supabase = createAdminClient();
    const galleryService = createGalleryService(supabase);
    const gallery = await galleryService.create(validationResult.user.id, validatedData);
    
    // Track successful request
    const duration = Date.now() - startTime;
    metricsService.trackEndpointError('/api/plugin/galleries', false);
    
    // Log success
    console.log(`[Plugin Galleries] Gallery created: ${gallery.id} by user ${validationResult.user.id} in ${duration}ms`);
    
    return NextResponse.json(
      {
        success: true,
        gallery,
      },
      { 
        status: 201,
        headers: getCorsHeaders(request),
      }
    );
    
  } catch (error) {
    // Log error for debugging
    console.error('[Plugin Galleries] Error creating gallery:', error);
    
    // Track error
    metricsService.trackEndpointError('/api/plugin/galleries', true);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: error.message,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/plugin/galleries
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
