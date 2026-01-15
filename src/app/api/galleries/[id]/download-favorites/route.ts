import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createZipService } from '@/lib/services/zip.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { imageIds } = await request.json();
    const { id: galleryId } = await params;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'Image IDs are required' },
        { status: 400 }
      );
    }

    // Create ZIP service with admin client
    const zipService = createZipService(supabase);

    // Generate ZIP file with favorited images
    const zipResult = await zipService.generateSelectionZip(galleryId, imageIds, {
      compression: 'STORE',
      suffix: 'favoris',
    });

    // Return ZIP as response
    return new NextResponse(zipResult.buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipResult.filename}"`,
        'Content-Length': zipResult.size.toString(),
        'X-Image-Count': zipResult.imageCount.toString(),
        'X-Failed-Images': zipResult.failedImages.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download favorites error:', error);
    return NextResponse.json(
      { error: 'Failed to create download' },
      { status: 500 }
    );
  }
}
