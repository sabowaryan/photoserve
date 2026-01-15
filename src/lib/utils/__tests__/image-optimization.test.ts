/**
 * Unit Tests for Image Optimization Utilities
 * 
 * @module lib/utils/__tests__/image-optimization.test
 * Requirements: 5.9, 9.4
 */
import { describe, it, expect } from 'vitest';
import { optimizeCloudinaryUrl, optimizeLogoUrl } from '../image-optimization';

describe('Image Optimization Utilities', () => {
  describe('optimizeCloudinaryUrl', () => {
    it('should add optimization transformations to Cloudinary URL', () => {
      const originalUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const optimizedUrl = optimizeCloudinaryUrl(originalUrl);
      
      expect(optimizedUrl).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/sample.jpg');
    });

    it('should handle Cloudinary URLs with existing transformations', () => {
      const originalUrl = 'https://res.cloudinary.com/demo/image/upload/w_500,h_500/sample.jpg';
      const optimizedUrl = optimizeCloudinaryUrl(originalUrl);
      
      // Should add optimization transformations after /upload/
      expect(optimizedUrl).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/w_500,h_500/sample.jpg');
    });

    it('should handle Cloudinary URLs with folders', () => {
      const originalUrl = 'https://res.cloudinary.com/demo/image/upload/photoserve/user-123/logos/logo.png';
      const optimizedUrl = optimizeCloudinaryUrl(originalUrl);
      
      expect(optimizedUrl).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/photoserve/user-123/logos/logo.png');
    });

    it('should return original URL if not a Cloudinary URL', () => {
      const externalUrl = 'https://example.com/logo.png';
      const result = optimizeCloudinaryUrl(externalUrl);
      
      expect(result).toBe(externalUrl);
    });

    it('should return original URL if /upload/ is not found', () => {
      const malformedUrl = 'https://res.cloudinary.com/demo/image/sample.jpg';
      const result = optimizeCloudinaryUrl(malformedUrl);
      
      expect(result).toBe(malformedUrl);
    });

    it('should handle URLs with query parameters', () => {
      const urlWithParams = 'https://res.cloudinary.com/demo/image/upload/sample.jpg?version=123';
      const optimizedUrl = optimizeCloudinaryUrl(urlWithParams);
      
      expect(optimizedUrl).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/sample.jpg?version=123');
    });
  });

  describe('optimizeLogoUrl', () => {
    it('should optimize a valid Cloudinary logo URL', () => {
      const logoUrl = 'https://res.cloudinary.com/demo/image/upload/photoserve/user-123/logos/logo.png';
      const optimizedUrl = optimizeLogoUrl(logoUrl);
      
      expect(optimizedUrl).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/photoserve/user-123/logos/logo.png');
    });

    it('should return null for null input', () => {
      const result = optimizeLogoUrl(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = optimizeLogoUrl(undefined);
      expect(result).toBeNull();
    });

    it('should return original URL for non-Cloudinary URLs', () => {
      const externalUrl = 'https://example.com/logo.png';
      const result = optimizeLogoUrl(externalUrl);
      
      expect(result).toBe(externalUrl);
    });

    it('should handle empty string', () => {
      const result = optimizeLogoUrl('');
      expect(result).toBeNull();
    });
  });

  describe('WebP format optimization', () => {
    it('should include f_auto transformation for automatic format selection', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/logo.png';
      const optimized = optimizeCloudinaryUrl(url);
      
      // f_auto enables automatic format selection (WebP with fallback)
      expect(optimized).toContain('f_auto');
    });

    it('should include q_auto transformation for quality optimization', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/logo.png';
      const optimized = optimizeCloudinaryUrl(url);
      
      // q_auto enables automatic quality optimization
      expect(optimized).toContain('q_auto:good');
    });
  });

  describe('Edge cases', () => {
    it('should handle URLs with multiple /upload/ occurrences', () => {
      // Edge case: public_id contains "upload" in the name
      const url = 'https://res.cloudinary.com/demo/image/upload/folder/upload-image.jpg';
      const optimized = optimizeCloudinaryUrl(url);
      
      // Should only transform at the first /upload/
      expect(optimized).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/folder/upload-image.jpg');
    });

    it('should handle URLs with special characters in public_id', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/folder/logo%20with%20spaces.png';
      const optimized = optimizeCloudinaryUrl(url);
      
      expect(optimized).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/folder/logo%20with%20spaces.png');
    });

    it('should handle secure URLs (https)', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/logo.png';
      const optimized = optimizeCloudinaryUrl(url);
      
      expect(optimized).toContain('https://');
    });
  });
});

