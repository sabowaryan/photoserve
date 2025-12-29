/**
 * Image Validation Schemas and Utilities
 * Provides MIME type and magic number validation for image files
 * 
 * @module lib/validators/image.schema
 * Requirements: 5.2
 */
import { z } from 'zod';
import { InvalidFileTypeError, FileSizeError } from '@/lib/errors';

/**
 * Allowed MIME types for image uploads
 * Includes professional photography formats (TIFF, HEIC/HEIF)
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'image/heic',
  'image/heif',
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

/**
 * Magic number signatures for image file types
 * These are the first bytes of valid image files
 */
export const IMAGE_MAGIC_NUMBERS: Record<AllowedMimeType, number[][]> = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG/JFIF
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
  ],
  'image/tiff': [
    [0x49, 0x49, 0x2A, 0x00], // TIFF little-endian (II)
    [0x4D, 0x4D, 0x00, 0x2A], // TIFF big-endian (MM)
  ],
  'image/heic': [
    [0x00, 0x00, 0x00], // HEIC starts with ftyp box (variable offset)
  ],
  'image/heif': [
    [0x00, 0x00, 0x00], // HEIF starts with ftyp box (variable offset)
  ],
};

/**
 * Zod schema for image upload request
 */
export const uploadImageSchema = z.object({
  galleryId: z.string().uuid('Invalid gallery ID'),
  orderIndex: z.number().int().min(0, 'Order index must be non-negative'),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;

/**
 * Result of image validation
 */
export interface ImageValidationResult {
  valid: boolean;
  mimeType?: AllowedMimeType;
  error?: string;
}

/**
 * Check if a MIME type is allowed
 * 
 * @param mimeType - The MIME type to check
 * @returns True if the MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

/**
 * Check if a buffer starts with the given magic number sequence
 * 
 * @param buffer - The file buffer to check
 * @param magicNumber - The expected magic number sequence
 * @returns True if the buffer starts with the magic number
 */
function bufferStartsWith(buffer: Buffer, magicNumber: number[]): boolean {
  if (buffer.length < magicNumber.length) {
    return false;
  }
  
  for (let i = 0; i < magicNumber.length; i++) {
    if (buffer[i] !== magicNumber[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Detect the actual MIME type from file magic numbers
 * 
 * @param buffer - The file buffer to analyze
 * @returns The detected MIME type or null if not recognized
 */
export function detectMimeTypeFromBuffer(buffer: Buffer): AllowedMimeType | null {
  // Special handling for WebP - need to check for WEBP signature after RIFF
  if (buffer.length >= 12) {
    const riffSignature = [0x52, 0x49, 0x46, 0x46];
    const webpSignature = [0x57, 0x45, 0x42, 0x50];
    
    if (bufferStartsWith(buffer, riffSignature)) {
      // Check for WEBP at offset 8
      const webpCheck = buffer.subarray(8, 12);
      if (webpCheck[0] === webpSignature[0] &&
          webpCheck[1] === webpSignature[1] &&
          webpCheck[2] === webpSignature[2] &&
          webpCheck[3] === webpSignature[3]) {
        return 'image/webp';
      }
    }
  }

  // Special handling for HEIC/HEIF - ISO Base Media File Format
  // These files have a "ftyp" box with brand identifiers
  if (buffer.length >= 12) {
    // ftyp box starts at offset 4
    const ftypSignature = [0x66, 0x74, 0x79, 0x70]; // "ftyp"
    if (buffer[4] === ftypSignature[0] &&
        buffer[5] === ftypSignature[1] &&
        buffer[6] === ftypSignature[2] &&
        buffer[7] === ftypSignature[3]) {
      // Check brand at offset 8
      const brand = buffer.subarray(8, 12).toString('ascii');
      // HEIC brands: heic, heix, hevc, hevx, heim, heis, hevm, hevs, mif1
      // HEIF brands: mif1, msf1, miaf
      const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs'];
      const heifBrands = ['mif1', 'msf1', 'miaf'];
      
      if (heicBrands.includes(brand)) {
        return 'image/heic';
      }
      if (heifBrands.includes(brand)) {
        return 'image/heif';
      }
    }
  }

  // Check TIFF format
  if (buffer.length >= 4) {
    // TIFF little-endian (II)
    if (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2A && buffer[3] === 0x00) {
      return 'image/tiff';
    }
    // TIFF big-endian (MM)
    if (buffer[0] === 0x4D && buffer[1] === 0x4D && buffer[2] === 0x00 && buffer[3] === 0x2A) {
      return 'image/tiff';
    }
  }

  // Check other formats
  for (const [mimeType, signatures] of Object.entries(IMAGE_MAGIC_NUMBERS)) {
    if (mimeType === 'image/webp' || mimeType === 'image/heic' || 
        mimeType === 'image/heif' || mimeType === 'image/tiff') continue; // Already handled above
    
    for (const signature of signatures) {
      if (bufferStartsWith(buffer, signature)) {
        return mimeType as AllowedMimeType;
      }
    }
  }
  
  return null;
}

/**
 * Validate an image file by checking both MIME type and magic numbers
 * 
 * @param buffer - The file buffer
 * @param declaredMimeType - The MIME type declared by the client
 * @returns Validation result with detected MIME type
 * 
 * Requirements: 5.2 - Validates both MIME type header AND magic numbers
 */
export function validateImageFile(
  buffer: Buffer,
  declaredMimeType: string
): ImageValidationResult {
  // Check if declared MIME type is allowed
  if (!isAllowedMimeType(declaredMimeType)) {
    return {
      valid: false,
      error: `Invalid MIME type: ${declaredMimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  // Detect actual MIME type from magic numbers
  const detectedMimeType = detectMimeTypeFromBuffer(buffer);
  
  if (!detectedMimeType) {
    return {
      valid: false,
      error: 'File content does not match any allowed image format',
    };
  }

  // Verify that declared MIME type matches detected MIME type
  if (declaredMimeType !== detectedMimeType) {
    return {
      valid: false,
      error: `MIME type mismatch: declared ${declaredMimeType}, detected ${detectedMimeType}`,
    };
  }

  return {
    valid: true,
    mimeType: detectedMimeType,
  };
}

/**
 * Validate image file size against plan limits
 * 
 * @param fileSizeBytes - The file size in bytes
 * @param maxSizeMb - The maximum allowed size in MB
 * @returns True if file size is within limits
 * 
 * Requirements: 5.3 - Enforces plan-based size limits
 */
export function validateFileSize(fileSizeBytes: number, maxSizeMb: number): boolean {
  const fileSizeMb = fileSizeBytes / (1024 * 1024);
  return fileSizeMb <= maxSizeMb;
}

/**
 * Convert bytes to megabytes
 * 
 * @param bytes - Size in bytes
 * @returns Size in megabytes
 */
export function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024);
}

/**
 * Comprehensive image validation that throws appropriate errors
 * 
 * @param buffer - The file buffer
 * @param declaredMimeType - The MIME type declared by the client
 * @param fileSizeBytes - The file size in bytes
 * @param maxSizeMb - The maximum allowed size in MB
 * @throws InvalidFileTypeError if MIME type or magic numbers are invalid
 * @throws FileSizeError if file exceeds size limit
 * @returns The validated MIME type
 */
export function validateImageOrThrow(
  buffer: Buffer,
  declaredMimeType: string,
  fileSizeBytes: number,
  maxSizeMb: number
): AllowedMimeType {
  // Validate file type
  const validation = validateImageFile(buffer, declaredMimeType);
  
  if (!validation.valid || !validation.mimeType) {
    throw new InvalidFileTypeError(declaredMimeType, [...ALLOWED_MIME_TYPES]);
  }

  // Validate file size
  if (!validateFileSize(fileSizeBytes, maxSizeMb)) {
    const fileSizeMb = bytesToMb(fileSizeBytes);
    throw new FileSizeError(fileSizeMb, maxSizeMb);
  }

  return validation.mimeType;
}
