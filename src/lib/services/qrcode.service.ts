/**
 * QR Code Service
 * Business logic for generating QR codes for galleries
 * 
 * @module lib/services/qrcode.service
 * Requirements: 7.3.1, 7.3.2, 7.3.3, 7.3.4
 */
import QRCode from 'qrcode';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { NotFoundError, ValidationError } from '@/lib/errors';

export interface QRCodeOptions {
  format: 'png' | 'svg';
  size?: number;
  logoUrl?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface QRCodeResult {
  data: string; // Base64 for PNG, SVG string for SVG
  format: 'png' | 'svg';
  url: string;
}

export interface IQRCodeService {
  generateQRCode(galleryId: string, options?: QRCodeOptions): Promise<QRCodeResult>;
}

export class QRCodeService implements IQRCodeService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Generate QR code for a gallery
   * 
   * Requirement 7.3.1: THE Dashboard SHALL generate QR_Code for each gallery
   * Requirement 7.3.2: THE QR_Code SHALL link to gallery URL
   * Requirement 7.3.3: THE QR_Code SHALL be downloadable as PNG/SVG
   * Requirement 7.3.4: THE QR_Code SHALL include optional logo overlay
   */
  async generateQRCode(
    galleryId: string,
    options: QRCodeOptions = { format: 'png' }
  ): Promise<QRCodeResult> {
    // Validate input
    if (!galleryId) {
      throw new ValidationError('Gallery ID is required');
    }

    // Verify gallery exists and get slug
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('id, unique_slug')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Construct gallery URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const galleryUrl = `${baseUrl}/g/${gallery.unique_slug}`;

    // Generate QR code based on format
    const format = options.format || 'png';
    const size = options.size || 512;
    const errorCorrectionLevel = options.errorCorrectionLevel || 'M';

    try {
      let qrData: string;

      if (format === 'svg') {
        // Generate SVG QR code
        qrData = await this.generateSVGQRCode(galleryUrl, {
          width: size,
          errorCorrectionLevel,
          logoUrl: options.logoUrl,
        });
      } else {
        // Generate PNG QR code
        qrData = await this.generatePNGQRCode(galleryUrl, {
          width: size,
          errorCorrectionLevel,
          logoUrl: options.logoUrl,
        });
      }

      return {
        data: qrData,
        format,
        url: galleryUrl,
      };
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate PNG QR code as base64 data URL
   */
  private async generatePNGQRCode(
    url: string,
    options: {
      width: number;
      errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
      logoUrl?: string;
    }
  ): Promise<string> {
    try {
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: options.width,
        errorCorrectionLevel: options.errorCorrectionLevel,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // TODO: If logoUrl is provided, composite the logo onto the QR code
      // This would require additional image processing with canvas or sharp
      // For now, return the QR code without logo overlay
      if (options.logoUrl) {
        // Future enhancement: Load logo and composite it in the center
        // using canvas or sharp library
      }

      return qrDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate PNG QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate SVG QR code as string
   */
  private async generateSVGQRCode(
    url: string,
    options: {
      width: number;
      errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
      logoUrl?: string;
    }
  ): Promise<string> {
    try {
      // Generate QR code as SVG string
      const svgString = await QRCode.toString(url, {
        type: 'svg',
        width: options.width,
        errorCorrectionLevel: options.errorCorrectionLevel,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // TODO: If logoUrl is provided, embed it in the SVG
      // This would require SVG manipulation to add an image element
      // in the center of the QR code
      if (options.logoUrl) {
        // Future enhancement: Embed logo as SVG image element
      }

      return svgString;
    } catch (error) {
      throw new Error(`Failed to generate SVG QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Factory function to create a QRCodeService instance
 */
export function createQRCodeService(
  supabase: SupabaseClient<Database>
): IQRCodeService {
  return new QRCodeService(supabase);
}
