/**
 * Gallery Download API Route
 * GET - Download all gallery images as ZIP
 * 
 * @module app/api/galleries/[id]/download/route
 */
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/galleries/[id]/download
 * Download all images from a gallery as a ZIP file
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get gallery info
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, title, is_active, expires_at')
      .eq('id', id)
      .single();

    if (galleryError || !gallery) {
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

    // Get all images for the gallery
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('id, cloudinary_url, cloudinary_public_id, order_index')
      .eq('gallery_id', id)
      .order('order_index');

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      return NextResponse.json(
        { error: 'api.errors.errorFetchingImages', code: 'ERROR_FETCHING_IMAGES' },
        { status: 500 }
      );
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'api.errors.noImagesInGallery', code: 'NO_IMAGES_IN_GALLERY' },
        { status: 404 }
      );
    }

    // Create ZIP file
    const zip = new JSZip();
    const folder = zip.folder(sanitizeFilename(gallery.title));

    if (!folder) {
      return NextResponse.json(
        { error: 'api.errors.errorCreatingArchive', code: 'ERROR_CREATING_ARCHIVE' },
        { status: 500 }
      );
    }

    // Download and add each image to the ZIP
    const downloadPromises = images.map(async (image, index) => {
      try {
        const response = await fetch(image.cloudinary_url);
        if (!response.ok) {
          console.error(`Failed to fetch image: ${image.cloudinary_url}`);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const extension = getExtensionFromUrl(image.cloudinary_url);
        const filename = `photo_${String(index + 1).padStart(3, '0')}${extension}`;
        
        folder.file(filename, arrayBuffer);
      } catch (error) {
        console.error(`Error downloading image ${image.id}:`, error);
      }
    });

    await Promise.all(downloadPromises);

    // Generate ZIP buffer (STORE = no compression, preserves original quality)
    const zipBuffer = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'STORE', // No compression - images are already compressed
    });

    // Create response with ZIP file
    const zipFilename = `${sanitizeFilename(gallery.title)}.zip`;
    
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': String(zipBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'api.errors.errorDownloading', code: 'ERROR_DOWNLOADING' },
      { status: 500 }
    );
  }
}

/**
 * Sanitize filename for ZIP
 */
function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .slice(0, 50); // Limit length
}

/**
 * Get file extension from URL
 */
function getExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i);
    return match && match[1] ? `.${match[1].toLowerCase()}` : '.jpg';
  } catch {
    return '.jpg';
  }
}
