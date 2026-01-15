/**
 * Generate Caption API
 * Endpoint for generating AI captions/alt-text for images
 * 
 * @module api/ai/generate-caption
 * Requirements: 10.2.1, 10.2.2
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAIService } from '@/lib/services';
import { ValidationError, NotFoundError } from '@/lib/errors';

/**
 * POST /api/ai/generate-caption
 * Generate caption/alt-text for an image
 * 
 * Requirement 10.2.1: THE System SHALL generate alt-text for each image via AI
 * Requirement 10.2.2: THE Alt_Text SHALL describe image content accurately
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // @ts-ignore - galleries is joined
    if (image.galleries?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Create AI service and generate caption
    const aiService = createAIService(supabase);
    const caption = await aiService.generateCaption(imageUrl);

    // Update image with generated caption
    const { error: updateError } = await supabase
      .from('images')
      .update({ alt_text: caption })
      .eq('id', imageId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      caption,
    });
  } catch (error) {
    console.error('Caption generation error:', error);

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
      { error: 'Failed to generate caption' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/generate-caption
 * Update caption/alt-text for an image
 * 
 * Requirement 10.2.3: THE Photographer SHALL be able to edit generated text
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { imageId, altText } = body;

    // Validate inputs
    if (!imageId || !altText) {
      return NextResponse.json(
        { error: 'Image ID and alt text are required' },
        { status: 400 }
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // @ts-ignore - galleries is joined
    if (image.galleries?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Update image with new alt text
    const { error: updateError } = await supabase
      .from('images')
      .update({ alt_text: altText })
      .eq('id', imageId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      altText,
    });
  } catch (error) {
    console.error('Alt text update error:', error);

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
      { error: 'Failed to update alt text' },
      { status: 500 }
    );
  }
}
