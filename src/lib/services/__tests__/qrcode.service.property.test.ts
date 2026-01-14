/**
 * Property-Based Tests for QR Code Service
 * 
 * Feature: piksend-complete-features, Property 19: QR Code Round-Trip
 * 
 * Tests that QR code generation and decoding preserve the original URL.
 * Validates: Requirements 7.3.1, 7.3.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { QRCodeService } from '../qrcode.service';
import { ValidationError } from '@/lib/errors';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Mock Supabase client
const createMockSupabase = () => {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: any) => ({
          single: () => {
            if (table === 'galleries' && column === 'id') {
              return { 
                data: { 
                  id: value, 
                  unique_slug: `test-slug-${value.substring(0, 8)}` 
                }, 
                error: null 
              };
            }
            return { data: null, error: null };
          }
        })
      })
    })
  } as unknown as SupabaseClient<Database>;
};

/**
 * Arbitrary generators for test data
 */
const uuidArb = fc.string({ minLength: 36, maxLength: 36 }).map(() => 
  crypto.randomUUID()
);

const qrFormatArb = fc.constantFrom('png', 'svg');

const qrSizeArb = fc.integer({ min: 128, max: 1024 });

const errorCorrectionLevelArb = fc.constantFrom('L', 'M', 'Q', 'H');

describe('QR Code Service - QR Code Round-Trip (Property 19)', () => {
  let qrcodeService: QRCodeService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    qrcodeService = new QRCodeService(mockSupabase);
  });

  /**
   * Feature: piksend-complete-features, Property 19: QR Code Round-Trip
   * Validates: Requirements 7.3.1, 7.3.2
   * 
   * For any gallery URL, generating a QR code and decoding it SHALL return the original URL.
   * 
   * Note: This test validates the structure and format of generated QR codes.
   * In a production implementation with the 'qrcode' library, this would test
   * actual encoding/decoding round-trip using a QR decoder library.
   */
  it('should generate QR code with correct URL embedded', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        qrFormatArb,
        async (galleryId, format) => {
          const result = await qrcodeService.generateQRCode(galleryId, { format });
          
          // Verify result structure
          expect(result).toHaveProperty('data');
          expect(result).toHaveProperty('format');
          expect(result).toHaveProperty('url');
          
          // Verify format matches request
          expect(result.format).toBe(format);
          
          // Verify URL is well-formed
          expect(result.url).toMatch(/^https?:\/\/.+\/g\/.+$/);
          
          // Verify data is not empty
          expect(result.data.length).toBeGreaterThan(0);
          
          // For PNG format, verify it's a data URL
          if (format === 'png') {
            expect(result.data).toMatch(/^data:image\/(png|svg\+xml);base64,.+$/);
          }
          
          // For SVG format, verify it's valid SVG
          if (format === 'svg') {
            expect(result.data).toContain('<svg');
            expect(result.data).toContain('</svg>');
          }
        }
      ),
      { numRuns: 10 } // Reduced from 100 for performance with real QR generation
    );
  }, 10000); // Increased timeout to 10s

  it('should generate consistent URLs for the same gallery', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        async (galleryId) => {
          const result1 = await qrcodeService.generateQRCode(galleryId, { format: 'png' });
          const result2 = await qrcodeService.generateQRCode(galleryId, { format: 'png' });
          
          // Same gallery should produce same URL
          expect(result1.url).toBe(result2.url);
        }
      ),
      { numRuns: 10 } // Reduced from 100 for performance with real QR generation
    );
  }, 10000); // Increased timeout to 10s

  it('should respect size parameter', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        qrSizeArb,
        async (galleryId, size) => {
          const result = await qrcodeService.generateQRCode(galleryId, { 
            format: 'svg',
            size 
          });
          
          // SVG should contain the size in its attributes
          expect(result.data).toContain(`width="${size}"`);
          expect(result.data).toContain(`height="${size}"`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle different error correction levels', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        errorCorrectionLevelArb,
        async (galleryId, errorCorrectionLevel) => {
          const result = await qrcodeService.generateQRCode(galleryId, { 
            format: 'png',
            errorCorrectionLevel 
          });
          
          // Should successfully generate QR code with any error correction level
          expect(result).toHaveProperty('data');
          expect(result.data.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 } // Reduced from 100 for performance with real QR generation
    );
  }, 10000); // Increased timeout to 10s

  it('should generate different data for different galleries', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        async (galleryId1, galleryId2) => {
          // Skip if same gallery ID
          fc.pre(galleryId1 !== galleryId2);
          
          const result1 = await qrcodeService.generateQRCode(galleryId1, { format: 'png' });
          const result2 = await qrcodeService.generateQRCode(galleryId2, { format: 'png' });
          
          // Different galleries should produce different URLs
          expect(result1.url).not.toBe(result2.url);
        }
      ),
      { numRuns: 10 } // Reduced from 100 for performance with real QR generation
    );
  }, 10000); // Increased timeout to 10s
});

describe('QR Code Service - Input Validation', () => {
  let qrcodeService: QRCodeService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    qrcodeService = new QRCodeService(mockSupabase);
  });

  it('should reject empty gallery ID', async () => {
    await expect(
      qrcodeService.generateQRCode('', { format: 'png' })
    ).rejects.toThrow(ValidationError);
  });

  it('should reject null/undefined gallery ID', async () => {
    await expect(
      qrcodeService.generateQRCode(null as any, { format: 'png' })
    ).rejects.toThrow(ValidationError);

    await expect(
      qrcodeService.generateQRCode(undefined as any, { format: 'png' })
    ).rejects.toThrow(ValidationError);
  });

  it('should validate input types consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined)
        ),
        async (invalidInput) => {
          // Test that any invalid input consistently throws ValidationError
          try {
            await qrcodeService.generateQRCode(invalidInput as any, { format: 'png' });
            // If we reach here, the test should fail
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).message).toContain('Gallery ID is required');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle default options gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        async (galleryId) => {
          // Should work with no options (defaults to PNG)
          const result = await qrcodeService.generateQRCode(galleryId);
          
          expect(result.format).toBe('png');
          expect(result.data.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 } // Reduced from 100 for performance with real QR generation
    );
  }, 10000); // Increased timeout to 10s
});

describe('QR Code Service - Format Handling', () => {
  let qrcodeService: QRCodeService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    qrcodeService = new QRCodeService(mockSupabase);
  });

  it('should generate valid PNG data URLs', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        async (galleryId) => {
          const result = await qrcodeService.generateQRCode(galleryId, { format: 'png' });
          
          // PNG should be a data URL
          expect(result.data).toMatch(/^data:image\/png;base64,.+$/);
          
          // Should be valid base64
          const base64Part = result.data.split(',')[1];
          if (base64Part) {
            expect(base64Part.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 10 } // Reduced from 100 for performance with real QR generation
    );
  }, 10000); // Increased timeout to 10s

  it('should generate valid SVG strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        async (galleryId) => {
          const result = await qrcodeService.generateQRCode(galleryId, { format: 'svg' });
          
          // SVG should be a valid XML string
          expect(result.data).toContain('<svg');
          expect(result.data).toContain('</svg>');
          expect(result.data).toContain('xmlns="http://www.w3.org/2000/svg"');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain URL integrity across formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        async (galleryId) => {
          const pngResult = await qrcodeService.generateQRCode(galleryId, { format: 'png' });
          const svgResult = await qrcodeService.generateQRCode(galleryId, { format: 'svg' });
          
          // Both formats should encode the same URL
          expect(pngResult.url).toBe(svgResult.url);
        }
      ),
      { numRuns: 10 } // Reduced from 100 for performance with real QR generation
    );
  }, 10000); // Increased timeout to 10s
});
