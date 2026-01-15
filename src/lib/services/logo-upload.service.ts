/**
 * Logo Upload Service
 * Business logic for custom logo upload and management
 * 
 * @module lib/services/logo-upload.service
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.9
 */
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import type { CloudinaryUploadResult } from '@/lib/cloudinary';

/**
 * Validation result for image files
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Logo upload result
 */
export interface LogoUploadResult {
  url: string;
  publicId: string;
}

/**
 * Logo Upload Service Interface
 */
export interface ILogoUploadService {
  /**
   * Upload logo to Cloudinary
   * @param file - Image file
   * @param userId - Photographer user ID
   * @returns Cloudinary URL and public ID
   */
  uploadLogo(file: File, userId: string): Promise<LogoUploadResult>;

  /**
   * Validate image file
   * @param file - Image file
   * @returns Validation result
   */
  validateImage(file: File): ValidationResult;

  /**
   * Delete logo from Cloudinary
   * @param publicId - Cloudinary public ID
   */
  deleteLogo(publicId: string): Promise<void>;
}

/**
 * Logo Upload Service Implementation
 * Handles custom logo upload, validation, and deletion
 */
export class LogoUploadService implements ILogoUploadService {
  // Accepted image formats (Requirement 5.1)
  private readonly ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  
  // Maximum file size: 2MB (Requirement 5.2)
  private readonly MAX_FILE_SIZE_MB = 2;
  private readonly MAX_FILE_SIZE_BYTES = this.MAX_FILE_SIZE_MB * 1024 * 1024;

  /**
   * Validate image file type and size
   * Requirements: 5.1, 5.2
   * 
   * @param file - Image file to validate
   * @returns Validation result with error message if invalid
   */
  validateImage(file: File): ValidationResult {
    // Validate file type (Requirement 5.1)
    if (!this.ACCEPTED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Accepted formats: PNG, JPG, JPEG, WebP. Received: ${file.type}`,
      };
    }

    // Validate file size (Requirement 5.2)
    if (file.size > this.MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE_MB}MB limit. File size: ${fileSizeMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Upload logo to Cloudinary with transformations
   * Requirements: 5.3, 5.4, 5.5, 5.9
   * 
   * @param file - Image file to upload
   * @param userId - Photographer user ID for folder organization
   * @returns Logo upload result with URL and public ID
   * @throws Error if validation fails or upload fails
   */
  async uploadLogo(file: File, userId: string): Promise<LogoUploadResult> {
    // Validate image before upload (Requirements 5.1, 5.2)
    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary with transformations (Requirements 5.3, 5.4, 5.9)
      // Store in user-specific folder for organization
      const folder = `photoserve/${userId}/logos`;
      
      const result: CloudinaryUploadResult = await uploadImage(buffer, {
        folder,
      });

      // Return URL and public ID for storage (Requirement 5.4)
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      // Handle upload errors (Requirement 5.5)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload logo: ${errorMessage}`);
    }
  }

  /**
   * Delete logo from Cloudinary
   * Requirement: 5.10
   * 
   * @param publicId - Cloudinary public ID of the logo to delete
   * @throws Error if deletion fails
   */
  async deleteLogo(publicId: string): Promise<void> {
    try {
      await deleteImage(publicId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete logo: ${errorMessage}`);
    }
  }
}

/**
 * Factory function to create a LogoUploadService instance
 */
export function createLogoUploadService(): ILogoUploadService {
  return new LogoUploadService();
}
