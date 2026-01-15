/**
 * Logo Upload Service Tests
 * Unit tests for logo upload, validation, and deletion
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.9
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoUploadService } from '../logo-upload.service';
import * as cloudinary from '@/lib/cloudinary';

// Mock the cloudinary module
vi.mock('@/lib/cloudinary', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

describe('LogoUploadService', () => {
  let service: LogoUploadService;

  beforeEach(() => {
    service = new LogoUploadService();
    vi.clearAllMocks();
  });

  describe('validateImage', () => {
    it('should accept valid PNG file under 2MB', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });

      const result = service.validateImage(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid JPEG file under 2MB', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.jpeg', {
        type: 'image/jpeg',
      });

      const result = service.validateImage(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid JPG file under 2MB', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.jpg', {
        type: 'image/jpg',
      });

      const result = service.validateImage(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid WebP file under 2MB', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.webp', {
        type: 'image/webp',
      });

      const result = service.validateImage(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file with invalid type', () => {
      const file = new File([new ArrayBuffer(1024)], 'document.pdf', {
        type: 'application/pdf',
      });

      const result = service.validateImage(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
      expect(result.error).toContain('PNG, JPG, JPEG, WebP');
    });

    it('should reject file exceeding 2MB size limit', () => {
      // Create a file larger than 2MB (2.5MB)
      const file = new File([new ArrayBuffer(2.5 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });

      const result = service.validateImage(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds 2MB limit');
      expect(result.error).toContain('2.50MB');
    });

    it('should accept file exactly at 2MB limit', () => {
      // Create a file exactly 2MB
      const file = new File([new ArrayBuffer(2 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });

      const result = service.validateImage(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('uploadLogo', () => {
    it('should successfully upload valid logo', async () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      const userId = 'user-123';

      const mockCloudinaryResult = {
        public_id: 'photoserve/user-123/logos/abc123',
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1/photoserve/user-123/logos/abc123.png',
        bytes: 1024 * 1024,
        width: 500,
        height: 500,
        format: 'png',
      };

      vi.mocked(cloudinary.uploadImage).mockResolvedValue(mockCloudinaryResult);

      const result = await service.uploadLogo(file, userId);

      expect(result.url).toBe(mockCloudinaryResult.secure_url);
      expect(result.publicId).toBe(mockCloudinaryResult.public_id);
      expect(cloudinary.uploadImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        { folder: 'photoserve/user-123/logos' }
      );
    });

    it('should throw error for invalid file type', async () => {
      const file = new File([new ArrayBuffer(1024)], 'document.pdf', {
        type: 'application/pdf',
      });
      const userId = 'user-123';

      await expect(service.uploadLogo(file, userId)).rejects.toThrow(
        'Invalid file type'
      );
      expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    });

    it('should throw error for file exceeding size limit', async () => {
      const file = new File([new ArrayBuffer(3 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      const userId = 'user-123';

      await expect(service.uploadLogo(file, userId)).rejects.toThrow(
        'File size exceeds 2MB limit'
      );
      expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    });

    it('should throw error when Cloudinary upload fails', async () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      const userId = 'user-123';

      vi.mocked(cloudinary.uploadImage).mockRejectedValue(
        new Error('Cloudinary API error')
      );

      await expect(service.uploadLogo(file, userId)).rejects.toThrow(
        'Failed to upload logo: Cloudinary API error'
      );
    });

    it('should organize logos in user-specific folder', async () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      const userId = 'user-456';

      const mockCloudinaryResult = {
        public_id: 'photoserve/user-456/logos/xyz789',
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1/photoserve/user-456/logos/xyz789.png',
        bytes: 1024 * 1024,
        width: 500,
        height: 500,
        format: 'png',
      };

      vi.mocked(cloudinary.uploadImage).mockResolvedValue(mockCloudinaryResult);

      await service.uploadLogo(file, userId);

      expect(cloudinary.uploadImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        { folder: 'photoserve/user-456/logos' }
      );
    });
  });

  describe('deleteLogo', () => {
    it('should successfully delete logo from Cloudinary', async () => {
      const publicId = 'photoserve/user-123/logos/abc123';

      vi.mocked(cloudinary.deleteImage).mockResolvedValue(undefined);

      await service.deleteLogo(publicId);

      expect(cloudinary.deleteImage).toHaveBeenCalledWith(publicId);
    });

    it('should throw error when Cloudinary deletion fails', async () => {
      const publicId = 'photoserve/user-123/logos/abc123';

      vi.mocked(cloudinary.deleteImage).mockRejectedValue(
        new Error('Cloudinary API error')
      );

      await expect(service.deleteLogo(publicId)).rejects.toThrow(
        'Failed to delete logo: Cloudinary API error'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty file', async () => {
      const file = new File([], 'empty.png', {
        type: 'image/png',
      });
      const userId = 'user-123';

      const mockCloudinaryResult = {
        public_id: 'photoserve/user-123/logos/empty',
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1/photoserve/user-123/logos/empty.png',
        bytes: 0,
        width: 0,
        height: 0,
        format: 'png',
      };

      vi.mocked(cloudinary.uploadImage).mockResolvedValue(mockCloudinaryResult);

      const result = await service.uploadLogo(file, userId);
      expect(result.url).toBe(mockCloudinaryResult.secure_url);
    });

    it('should handle file at exact 2MB boundary', () => {
      const file = new File([new ArrayBuffer(2 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });

      const result = service.validateImage(file);
      expect(result.valid).toBe(true);
    });

    it('should handle file just over 2MB boundary', () => {
      const file = new File([new ArrayBuffer(2 * 1024 * 1024 + 1)], 'logo.png', {
        type: 'image/png',
      });

      const result = service.validateImage(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds 2MB limit');
    });
  });
});
