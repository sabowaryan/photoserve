/**
 * QR Code API Route
 * GET - Generate and return QR code for gallery
 * 
 * @module app/api/galleries/[id]/qrcode/route
 * Requirements: 7.3.1, 7.3.3 - QR code generation
 */
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createQRCodeService } from '@/lib/services/qrcode.service';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schemas
const galleryIdSchema = z.object({
  id: z.string().uuid('Invalid gallery ID format'),
});

const qrCodeQuerySchema = z.object({
  format: z.enum(['png', 'svg']).optional().default('png'),
  size: z.coerce.number().min(128).max(2048).optional().default(512),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional().default('M'),
  logoUrl: z.string().url().optional(),
});

/**
 * GET /api/galleries/[id]/qrcode
 * Generate QR code for gallery
 * 
 * Requires authentication (photographer only)
 * 
 * Query parameters:
 * - format: 'png' | 'svg' (default: 'png')
 * - size: number (128-2048, default: 512)
 * - errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' (default: 'M')
 * - logoUrl: string (optional) - URL of logo to overlay
 * 
 * Returns:
 * - PNG: Binary image data with Content-Type: image/png
 * - SVG: SVG string with Content-Type: image/svg+xml
 * 
 * Requirement 7.3.1: THE Dashboard SHALL generate QR_Code for each gallery
 * Requirement 7.3.3: THE QR_Code SHALL be downloadable as PNG/SVG
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    const { id: galleryId } = await params;

    // Validate gallery ID
    galleryIdSchema.parse({ id: galleryId });

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = qrCodeQuerySchema.parse({
      format: searchParams.get('format'),
      size: searchParams.get('size'),
      errorCorrectionLevel: searchParams.get('errorCorrectionLevel'),
      logoUrl: searchParams.get('logoUrl'),
    });

    // Verify gallery ownership
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, user_id, title')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      return handleApiError(new AppError('Gallery not found', 'NOT_FOUND', 404));
    }

    if (gallery.user_id !== userId) {
      return handleApiError(new AppError('Unauthorized', 'FORBIDDEN', 403));
    }

    // Generate QR code
    const qrCodeService = createQRCodeService(supabase);
    const qrCodeResult = await qrCodeService.generateQRCode(galleryId, {
      format: queryParams.format,
      size: queryParams.size,
      errorCorrectionLevel: queryParams.errorCorrectionLevel,
      logoUrl: queryParams.logoUrl,
    });

    // Return QR code based on format
    if (qrCodeResult.format === 'svg') {
      // Return SVG as text
      return new NextResponse(qrCodeResult.data, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `inline; filename="${gallery.title}-qrcode.svg"`,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    } else {
      // Return PNG as binary (convert base64 data URL to buffer)
      const base64Data = qrCodeResult.data.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="${gallery.title}-qrcode.png"`,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AppError('Authentication required', 'UNAUTHORIZED', 401));
    }
    return handleApiError(error);
  }
}
