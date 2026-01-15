/**
 * Unit Tests for Gallery Header Logo Display Logic
 * 
 * @module components/gallery-view/__tests__/gallery-header-logo.test
 * Requirements: 5.7, 5.8, 5.9, 9.4
 */
import { optimizeLogoUrl } from '@/lib/utils/image-optimization';
import { describe, expect, it } from 'vitest';

describe('GalleryHeader - Logo Display Logic', () => {
  describe('Requirement 5.7 & 5.8: Display custom logo with fallback', () => {
    it('should optimize custom logo URL when provided', () => {
      const customLogoUrl = 'https://res.cloudinary.com/demo/image/upload/photoserve/user-123/logos/logo.png';
      const optimized = optimizeLogoUrl(customLogoUrl);
      
      expect(optimized).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/photoserve/user-123/logos/logo.png');
    });

    it('should return null when no custom logo is provided (fallback to PikSend logo)', () => {
      expect(optimizeLogoUrl(null)).toBeNull();
      expect(optimizeLogoUrl(undefined)).toBeNull();
      expect(optimizeLogoUrl('')).toBeNull();
    });
  });

  describe('Requirement 5.9: Optimize image for web (WebP format)', () => {
    it('should add f_auto transformation for automatic format selection (WebP)', () => {
      const logoUrl = 'https://res.cloudinary.com/demo/image/upload/logo.png';
      const optimized = optimizeLogoUrl(logoUrl);
      
      expect(optimized).toContain('f_auto');
    });

    it('should add q_auto transformation for quality optimization', () => {
      const logoUrl = 'https://res.cloudinary.com/demo/image/upload/logo.png';
      const optimized = optimizeLogoUrl(logoUrl);
      
      expect(optimized).toContain('q_auto:good');
    });

    it('should handle non-Cloudinary URLs without modification', () => {
      const externalUrl = 'https://example.com/logo.png';
      const result = optimizeLogoUrl(externalUrl);
      
      expect(result).toBe(externalUrl);
    });
  });

  describe('Requirement 9.4: Lazy loading support', () => {
    it('should preserve URL structure for Next.js Image component lazy loading', () => {
      // Next.js Image component handles lazy loading automatically
      // We just need to ensure the URL is valid and optimized
      const logoUrl = 'https://res.cloudinary.com/demo/image/upload/photoserve/logos/logo.png';
      const optimized = optimizeLogoUrl(logoUrl);
      
      expect(optimized).toBeTruthy();
      expect(optimized).toContain('https://');
      expect(optimized).toContain('cloudinary.com');
    });
  });

  describe('Logo URL optimization edge cases', () => {
    it('should handle URLs with existing transformations', () => {
      const urlWithTransforms = 'https://res.cloudinary.com/demo/image/upload/w_500,h_500/logo.png';
      const optimized = optimizeLogoUrl(urlWithTransforms);
      
      // Should add optimization transformations after /upload/
      expect(optimized).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/w_500,h_500/logo.png');
    });

    it('should handle URLs with folders in public_id', () => {
      const urlWithFolders = 'https://res.cloudinary.com/demo/image/upload/photoserve/user-123/logos/logo.png';
      const optimized = optimizeLogoUrl(urlWithFolders);
      
      expect(optimized).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/photoserve/user-123/logos/logo.png');
    });

    it('should handle URLs with query parameters', () => {
      const urlWithParams = 'https://res.cloudinary.com/demo/image/upload/logo.png?version=123';
      const optimized = optimizeLogoUrl(urlWithParams);
      
      expect(optimized).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good/logo.png?version=123');
    });
  });

  describe('Integration with gallery header component', () => {
    it('should provide optimized URL for custom logo display', () => {
      // Simulating what happens in the GalleryHeader component
      const customLogo = 'https://res.cloudinary.com/demo/image/upload/photoserve/user-123/logos/logo.png';
      const optimizedLogoUrl = optimizeLogoUrl(customLogo);
      
      // The component uses this optimized URL with Next.js Image component
      expect(optimizedLogoUrl).toBeTruthy();
      expect(optimizedLogoUrl).toContain('f_auto,q_auto:good');
    });

    it('should provide null for fallback to PikSend logo', () => {
      // Simulating what happens when no custom logo is set
      const customLogo = null;
      const optimizedLogoUrl = optimizeLogoUrl(customLogo);
      
      // Component should display PikSend logo when optimizedLogoUrl is null
      expect(optimizedLogoUrl).toBeNull();
    });
  });
});
