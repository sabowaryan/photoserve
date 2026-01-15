/**
 * Face Match API
 * Endpoint for matching a selfie against faces in a gallery
 * 
 * @module api/ai/face-match
 * Requirements: 10.1.2, 10.1.3
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAIService } from '@/lib/services';
import { ValidationError, NotFoundError } from '@/lib/errors';

/**
 * POST /api/ai/face-match
 * Match a selfie against faces in a gallery
 * 
 * Requirement 10.1.2: THE Guest SHALL upload selfie to find matching photos
 * Requirement 10.1.3: THE System SHALL return photos containing matching face
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { selfieUrl, galleryId } = body;

    // Validate inputs
    if (!selfieUrl || !galleryId) {
      return NextResponse.json(
        { error: 'Selfie URL and gallery ID are required' },
        { status: 400 }
      );
    }

    // Check if AI features are enabled
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'ai_features_enabled')
      .single();

    if (!settings || settings.value !== true) {
      return NextResponse.json(
        { error: 'AI features are currently disabled' },
        { status: 503 }
      );
    }

    // Verify gallery exists and is accessible
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, is_active')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    if (!gallery.is_active) {
      return NextResponse.json(
        { error: 'Gallery is not active' },
        { status: 403 }
      );
    }

    // Create AI service and match faces
    const aiService = createAIService(supabase);
    const matchingImageIds = await aiService.matchFace(selfieUrl, galleryId);

    // Get full image details for matching images
    if (matchingImageIds.length > 0) {
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .in('id', matchingImageIds)
        .order('order_index');

      if (imagesError) {
        throw imagesError;
      }

      return NextResponse.json({
        success: true,
        matchCount: matchingImageIds.length,
        images: images || [],
      });
    }

    return NextResponse.json({
      success: true,
      matchCount: 0,
      images: [],
    });
  } catch (error) {
    console.error('Face match error:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to match faces' },
      { status: 500 }
    );
  }
}
