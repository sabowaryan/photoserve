/**
 * Face Detection API
 * Endpoint for detecting faces in an image
 * 
 * @module api/ai/detect-faces
 * Requirements: 10.1.1
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAIService } from '@/lib/services';
import { ValidationError } from '@/lib/errors';

/**
 * POST /api/ai/detect-faces
 * Detect faces in an image
 * 
 * Requirement 10.1.1: THE System SHALL detect faces in uploaded images
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { imageUrl } = body;

    // Validate input
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
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

    // Create AI service and detect faces
    const aiService = createAIService(supabase);
    const faces = await aiService.detectFaces(imageUrl);

    return NextResponse.json({
      success: true,
      faceCount: faces.length,
      faces,
    });
  } catch (error) {
    console.error('Face detection error:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to detect faces' },
      { status: 500 }
    );
  }
}
