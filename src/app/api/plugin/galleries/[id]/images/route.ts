/**
 * Plugin Gallery Images API Route
 * POST - Upload images to a gallery from Lightroom plugin
 * 
 * This endpoint allows the Lightroom plugin to upload images to galleries using API key authentication.
 * 
 * Requirements: Plugin integration for image uploads
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key.service';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
import { getCorsHeaders } from '@/lib/middleware/cors';
import { metricsService } from '@/lib/services/metrics.service';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/plugin/galleries/[id]/images
 * 
 * Upload images to a gallery from the Lightroom plugin
 * 
 * Headers:
 *   Authorization: Bearer pk_live_<token>
 * 
 * Body:
 *   {
 *     images: Array<{
 *       cloudinary_public_id: string
 *       cloudinary_url: string
 *       title?: string
 *       description?: string
 *       width?: number
 *       height?: number
 *       format?: string
 *       size?: number
 *     }>
 *   }
 * 
 * Responses:
 *   201 - Images uploaded successfully
 *   400 - Invalid request body or missing Authorization header
 *   401 - Invalid or expired API key
 *   403 - Valid API key but user doesn't own the gallery
 *   404 - Gallery not found
 *   500 - Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: galleryId } = await params;
  
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      const corsHeaders = getCorsHeaders(request);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        rateLimitResponse.headers.set(key, value);
      });
      
      metricsService.trackEndpointError('/api/plugin/galleries/[id]/images', true);
      return rateLimitResponse;
    }
    
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      metricsService.trackEndpointError('/api/plugin/galleries/[id]/images', true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid Authorization header',
        },
        { status: 400 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // Validate API key and get user info
    const validationResult = await apiKeyService.validateAPIKey(token);
    
    if (!validationResult.valid || !validationResult.user) {
      metricsService.trackEndpointError('/api/plugin/galleries/[id]/images', true);
      
      if (validationResult.user && validationResult.user.planType !== 'pro') {
        return NextResponse.json(
          {
            success: false,
            error: 'Pro plan required',
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error || 'Invalid or expired API key',
        },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      metricsService.trackEndpointError('/api/plugin/galleries/[id]/images', true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Expected { images: Array }',
        },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = createAdminClient();
    
    // Verify gallery exists and user owns it
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, user_id')
      .eq('id', galleryId)
      .single();
    
    if (galleryError || !gallery) {
      metricsService.trackEndpointError('/api/plugin/galleries/[id]/images', true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Gallery not found',
        },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (gallery.user_id !== validationResult.user.id) {
      metricsService.trackEndpointError('/api/plugin/galleries/[id]/images', true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to upload images to this gallery',
        },
        { status: 403 }
      );
    }
    
    // Prepare images for insertion
    const imagesToInsert = body.images.map((img: any) => ({
      gallery_id: galleryId,
      cloudinary_public_id: img.cloudinary_public_id,
      cloudinary_url: img.cloudinary_url,
      title: img.title || null,
      description: img.description || null,
      width: img.width || null,
      height: img.height || null,
      format: img.format || null,
      size: img.size || null,
      order_index: 0, // Will be updated by the database trigger
    }));
    
    // Insert images
    const { data: insertedImages, error: insertError } = await supabase
      .from('images')
      .insert(imagesToInsert)
      .select();
    
    if (insertError) {
      console.error('[Plugin Gallery Images] Error inserting images:', insertError);
      metricsService.trackEndpointError('/api/plugin/galleries/[id]/images', true);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload images',
          details: insertError.message,
        },
        { status: 500 }
      );
    }
    
    // Track successful request
    const duration = Date.now() - startTime;
    metricsService.trackEndpointError('/api/plugin/galleries/[id]/images', false);
    
    console.log(`[Plugin Gallery Images] ${insertedImages?.length || 0} images uploaded to gallery ${galleryId} in ${duration}ms`);
    
    return NextResponse.json(
      {
        success: true,
        images: insertedImages,
        count: insertedImages?.length || 0,
      },
      { 
        status: 201,
        headers: getCorsHeaders(request),
      }
    );
    
  } catch (error) {
    console.error('[Plugin Gallery Images] Error uploading images:', error);
    metricsService.trackEndpointError('/api/plugin/galleries/[id]/images', true);
    
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
 * OPTIONS /api/plugin/galleries/[id]/images
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
