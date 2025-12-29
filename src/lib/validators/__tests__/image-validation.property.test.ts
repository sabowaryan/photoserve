/**
 * Property-Based Tests for Image File Validation
 * 
 * Feature: nextjs-migration, Property 11: Image File Validation
 * Validates: Requirements 5.2
 * 
 * Tests that:
 * - For any file upload, the Image_Service SHALL validate both the MIME type header 
 *   AND the file's magic numbers, rejecting files where either check fails.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateImageFile,
  isAllowedMimeType,
  detectMimeTypeFromBuffer,
  ALLOWED_MIME_TYPES,
  type AllowedMimeType,
} from '../image.schema';

/**
 * Magic number signatures for generating valid image buffers
 */
const VALID_IMAGE_SIGNATURES: Record<AllowedMimeType, Buffer> = {
  'image/jpeg': Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]),
  'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  'image/gif': Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
  'image/webp': Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x00, 0x00, 0x00, 0x00, // file size placeholder
    0x57, 0x45, 0x42, 0x50, // WEBP
  ]),
  'image/tiff': Buffer.from([0x49, 0x49, 0x2A, 0x00]), // Little-endian TIFF
  'image/heic': Buffer.from([
    0x00, 0x00, 0x00, 0x18, // box size
    0x66, 0x74, 0x79, 0x70, // ftyp
    0x68, 0x65, 0x69, 0x63, // heic brand
  ]),
  'image/heif': Buffer.from([
    0x00, 0x00, 0x00, 0x18, // box size
    0x66, 0x74, 0x79, 0x70, // ftyp
    0x6D, 0x69, 0x66, 0x31, // mif1 brand
  ]),
};

/**
 * Invalid MIME types for testing rejection
 */
const INVALID_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/javascript',
  'text/html',
  'application/octet-stream',
  'video/mp4',
  'audio/mpeg',
  'application/zip',
];

/**
 * Generate a valid image buffer for a given MIME type
 */
function generateValidImageBuffer(mimeType: AllowedMimeType, extraBytes: number = 100): Buffer {
  const signature = VALID_IMAGE_SIGNATURES[mimeType];
  const padding = Buffer.alloc(extraBytes, 0x00);
  return Buffer.concat([signature, padding]);
}

/**
 * Generate random bytes that don't match any valid image signature
 */
const invalidMagicNumberArbitrary = fc.uint8Array({ minLength: 20, maxLength: 100 }).map(arr => {
  const buffer = Buffer.from(arr);
  // Ensure it doesn't accidentally match any valid signature
  // Set first bytes to values that don't match any image format
  buffer[0] = 0x00;
  buffer[1] = 0x01;
  buffer[2] = 0x02;
  buffer[3] = 0x03;
  return buffer;
});

describe('Image Validation - File Validation (Property 11)', () => {
  /**
   * Feature: nextjs-migration, Property 11: Image File Validation
   * Validates: Requirements 5.2
   * 
   * For any file upload, the Image_Service SHALL validate both the MIME type header 
   * AND the file's magic numbers, rejecting files where either check fails.
   */

  describe('Valid MIME type AND valid magic numbers → Accept', () => {
    it('should accept files with matching MIME type and magic numbers', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALLOWED_MIME_TYPES),
          fc.integer({ min: 50, max: 500 }),
          (mimeType, extraBytes) => {
            const buffer = generateValidImageBuffer(mimeType, extraBytes);
            const result = validateImageFile(buffer, mimeType);
            
            expect(result.valid).toBe(true);
            expect(result.mimeType).toBe(mimeType);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid MIME type → Reject (regardless of magic numbers)', () => {
    it('should reject files with invalid MIME type even if magic numbers are valid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...INVALID_MIME_TYPES),
          fc.constantFrom(...ALLOWED_MIME_TYPES),
          fc.integer({ min: 50, max: 200 }),
          (invalidMimeType, validImageType, extraBytes) => {
            // Create a buffer with valid image magic numbers
            const buffer = generateValidImageBuffer(validImageType, extraBytes);
            
            // But declare an invalid MIME type
            const result = validateImageFile(buffer, invalidMimeType);
            
            // Should be rejected because declared MIME type is not allowed
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('Invalid MIME type');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid magic numbers → Reject (regardless of MIME type)', () => {
    it('should reject files with invalid magic numbers even if MIME type is valid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALLOWED_MIME_TYPES),
          invalidMagicNumberArbitrary,
          (validMimeType, invalidBuffer) => {
            // Declare a valid MIME type but provide invalid magic numbers
            const result = validateImageFile(invalidBuffer, validMimeType);
            
            // Should be rejected because magic numbers don't match
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('MIME type mismatch → Reject', () => {
    it('should reject files where declared MIME type differs from detected type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALLOWED_MIME_TYPES),
          fc.constantFrom(...ALLOWED_MIME_TYPES),
          fc.integer({ min: 50, max: 200 }),
          (declaredMimeType, actualMimeType, extraBytes) => {
            // Precondition: MIME types must be different
            fc.pre(declaredMimeType !== actualMimeType);
            
            // Create buffer with one type's magic numbers
            const buffer = generateValidImageBuffer(actualMimeType, extraBytes);
            
            // But declare a different MIME type
            const result = validateImageFile(buffer, declaredMimeType);
            
            // Should be rejected due to mismatch
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('mismatch');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isAllowedMimeType helper', () => {
    it('should return true for all allowed MIME types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALLOWED_MIME_TYPES),
          (mimeType) => {
            expect(isAllowedMimeType(mimeType)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for invalid MIME types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...INVALID_MIME_TYPES),
          (mimeType) => {
            expect(isAllowedMimeType(mimeType)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for arbitrary strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (randomString) => {
            // Skip if it happens to be a valid MIME type
            fc.pre(!ALLOWED_MIME_TYPES.includes(randomString as AllowedMimeType));
            
            expect(isAllowedMimeType(randomString)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('detectMimeTypeFromBuffer helper', () => {
    it('should correctly detect MIME type from valid image buffers', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALLOWED_MIME_TYPES),
          fc.integer({ min: 50, max: 500 }),
          (mimeType, extraBytes) => {
            const buffer = generateValidImageBuffer(mimeType, extraBytes);
            const detected = detectMimeTypeFromBuffer(buffer);
            
            expect(detected).toBe(mimeType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for buffers with invalid magic numbers', () => {
      fc.assert(
        fc.property(
          invalidMagicNumberArbitrary,
          (invalidBuffer) => {
            const detected = detectMimeTypeFromBuffer(invalidBuffer);
            expect(detected).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for empty or too-short buffers', () => {
      fc.assert(
        fc.property(
          fc.uint8Array({ minLength: 0, maxLength: 3 }),
          (shortArray) => {
            const buffer = Buffer.from(shortArray);
            const detected = detectMimeTypeFromBuffer(buffer);
            expect(detected).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Both checks must pass (AND logic)', () => {
    it('should only accept when BOTH MIME type is valid AND magic numbers match', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // valid MIME type?
          fc.boolean(), // valid magic numbers?
          fc.constantFrom(...ALLOWED_MIME_TYPES),
          fc.integer({ min: 50, max: 200 }),
          (useValidMimeType, useValidMagicNumbers, validMimeType, extraBytes) => {
            // Determine what MIME type to declare
            const declaredMimeType = useValidMimeType 
              ? validMimeType 
              : 'application/pdf';
            
            // Determine what buffer to use
            const buffer = useValidMagicNumbers
              ? generateValidImageBuffer(validMimeType, extraBytes)
              : Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
            
            const result = validateImageFile(buffer, declaredMimeType);
            
            // Only valid if BOTH conditions are true AND they match
            const shouldBeValid = useValidMimeType && useValidMagicNumbers;
            
            if (shouldBeValid) {
              expect(result.valid).toBe(true);
            } else {
              expect(result.valid).toBe(false);
              expect(result.error).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
