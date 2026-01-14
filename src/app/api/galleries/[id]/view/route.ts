/**
 * Gallery View Count API Route
 * POST - Increment gallery view count
 * 
 * @module app/api/galleries/[id]/view/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/galleries/[id]/view
 * Increment view count for a gallery
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get current gallery
    const { data: gallery, error: fetchError } = await supabase
      .from('galleries')
      .select('id, views_count, is_active, expires_at')
      .eq('id', id)
      .single();

    if (fetchError || !gallery) {
      return NextResponse.json(
        { error: 'api.errors.galleryNotFound', code: 'GALLERY_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if gallery is active and not expired
    const isExpired = new Date(gallery.expires_at) < new Date();
    if (!gallery.is_active || isExpired) {
      return NextResponse.json(
        { error: 'api.errors.galleryNotAccessible', code: 'GALLERY_NOT_ACCESSIBLE' },
        { status: 403 }
      );
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('galleries')
      .update({ views_count: (gallery.views_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      console.error('Error incrementing view count:', updateError);
      return NextResponse.json(
        { error: 'api.errors.updateError', code: 'UPDATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      views_count: (gallery.views_count || 0) + 1 
    });
  } catch (error) {
    console.error('View count error:', error);
    return NextResponse.json(
      { error: 'api.errors.serverError', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
