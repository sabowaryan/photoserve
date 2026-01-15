/**
 * Image Optimization Utilities
 * Provides functions to optimize image URLs for web delivery
 * 
 * @module lib/utils/image-optimization
 * Requirements: 5.9, 9.4
 */

/**
 * Optimize a Cloudinary URL for web delivery
 * Adds automatic format selection (WebP with fallback) and quality optimization
 * 
 * Requirement 5.9: Optimize image for web (WebP format)
 * Requirement 9.4: Use lazy loading (handled by Next.js Image component)
 * 
 * @param url - Original Cloudinary URL
 * @returns Optimized URL with WebP format and quality settings
 */
export function optimizeCloudinaryUrl(url: string): string {
  // Check if it's a Cloudinary URL
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{public_id}
  // We need to inject transformations after /upload/
  
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) {
    return url;
  }

  // Split URL at /upload/
  const beforeUpload = url.substring(0, uploadIndex + 8); // Include '/upload/'
  const afterUpload = url.substring(uploadIndex + 8);

  // Add optimization transformations:
  // - f_auto: Automatic format selection (WebP with fallback)
  // - q_auto: Automatic quality optimization
  const transformations = 'f_auto,q_auto:good';

  // Reconstruct URL with transformations
  return `${beforeUpload}${transformations}/${afterUpload}`;
}

/**
 * Optimize a logo URL for display
 * Applies Cloudinary optimizations if it's a Cloudinary URL
 * 
 * @param logoUrl - Original logo URL (can be Cloudinary or external)
 * @returns Optimized logo URL
 */
export function optimizeLogoUrl(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) {
    return null;
  }

  return optimizeCloudinaryUrl(logoUrl);
}
