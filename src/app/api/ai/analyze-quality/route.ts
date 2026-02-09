/**
 * Analyze Quality API
 * Endpoint for analyzing image quality for smart culling
 * 
 * @module api/ai/analyze-quality
 * Requirements: 10.3.1, 10.3.2, 10.3.3, 10.3.4
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createAIService } from '@/lib/services';
import { ValidationError, NotFoundError } from '@/lib/errors';

/**
 * POST /api/ai/analyze-quality
 * Analyze image quality for smart culling
 * 
 * Requirement 10.3.1: THE System SHALL detect blurry images
 * Requirement 10.3.2: THE System SHALL detect closed eyes
 * Requirement 10.3.3: THE System SHALL detect duplicate/similar images
 * Requirement 10.3.4: THE System SHALL suggest hiding flagged images
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated Supabase client (uses NextAuth session)
    const { supabase, userId } = await requireSupabaseClient();
    
    const body = await request.json();
    const { imageId, imageUrl } = body;

    // Validate inputs
    if (!imageId || !imageUrl) {
      return NextResponse.json(
        { error: 'Image ID and URL are required' },
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

    // Verify image exists and user has permission
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('id, gallery_id, galleries(user_id)')
      .eq('id', imageId)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Check if user owns the gallery
    // @ts-ignore - galleries is joined
    if (image.galleries?.user_id !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Create AI service and analyze quality
    const aiService = createAIService(supabase);
    const analysis = await aiService.analyzeQuality(imageUrl);

    // Update image with quality analysis
    const { error: updateError } = await supabase
      .from('images')
      .update({
        quality_score: analysis.overallScore,
        quality_flags: {
          isBlurry: analysis.isBlurry,
          hasClosedEyes: analysis.hasClosedEyes,
          isDuplicate: analysis.isDuplicate,
          duplicateOf: analysis.duplicateOf,
          analyzedAt: new Date().toISOString(),
        },
      })
      .eq('id', imageId);

    if (updateError) {
      throw updateError;
    }

    // Determine if image should be suggested for hiding
    const shouldHide = analysis.isBlurry || analysis.hasClosedEyes || analysis.overallScore < 50;

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        shouldHide,
        reason: shouldHide
          ? [
              analysis.isBlurry && 'Image is blurry',
              analysis.hasClosedEyes && 'Subject has closed eyes',
              analysis.overallScore < 50 && 'Low quality score',
            ].filter(Boolean).join(', ')
          : null,
      },
    });
  } catch (error) {
    console.error('Quality analysis error:', error);

    // requireSupabaseClient throws if not authenticated
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
      { error: 'Failed to analyze quality' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/analyze-quality/batch
 * Analyze quality for multiple images in a gallery
 */
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated Supabase client (uses NextAuth session)
    const { supabase, userId } = await requireSupabaseClient();
    
    const body = await request.json();
    const { galleryId } = body;

    // Validate input
    if (!galleryId) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
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

    // Verify gallery exists and user has permission
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, user_id')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    // Check if user owns the gallery
    if (gallery.user_id !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Get all images in the gallery
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('id, cloudinary_url')
      .eq('gallery_id', galleryId)
      .order('order_index');

    if (imagesError) {
      throw imagesError;
    }

    if (!images || images.length === 0) {
      return NextResponse.json({
        success: true,
        analyzed: 0,
        results: [],
      });
    }

    // Analyze each image
    const aiService = createAIService(supabase);
    const results = [];

    for (const image of images) {
      try {
        const analysis = await aiService.analyzeQuality(image.cloudinary_url);

        // Update image with quality analysis
        await supabase
          .from('images')
          .update({
            quality_score: analysis.overallScore,
            quality_flags: {
              isBlurry: analysis.isBlurry,
              hasClosedEyes: analysis.hasClosedEyes,
              isDuplicate: analysis.isDuplicate,
              duplicateOf: analysis.duplicateOf,
              analyzedAt: new Date().toISOString(),
            },
          })
          .eq('id', image.id);

        const shouldHide = analysis.isBlurry || analysis.hasClosedEyes || analysis.overallScore < 50;

        results.push({
          imageId: image.id,
          analysis: {
            ...analysis,
            shouldHide,
          },
        });
      } catch (error) {
        console.error(`Error analyzing image ${image.id}:`, error);
        results.push({
          imageId: image.id,
          error: 'Analysis failed',
        });
      }
    }

    // Count images suggested for hiding
    const suggestedToHide = results.filter(r => r.analysis?.shouldHide).length;

    return NextResponse.json({
      success: true,
      analyzed: results.length,
      suggestedToHide,
      results,
    });
  } catch (error) {
    console.error('Batch quality analysis error:', error);

    // requireSupabaseClient throws if not authenticated
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
      { error: 'Failed to analyze quality' },
      { status: 500 }
    );
  }
}
