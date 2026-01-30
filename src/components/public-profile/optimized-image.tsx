/**
 * Optimized Image Component
 * 
 * Wrapper around Next.js Image component with Cloudinary optimization
 * 
 * Requirements:
 * - 12.1: Use WebP format and compression via Cloudinary
 * - 12.2: Implement lazy loading for gallery images
 * - Use next/image for automatic optimization
 * - Define appropriate image sizes (srcset)
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
}

/**
 * OptimizedImage Component
 * 
 * Uses Next.js Image component with:
 * - Automatic WebP conversion (Requirement 12.1)
 * - Lazy loading by default (Requirement 12.2)
 * - Responsive srcset generation
 * - Loading placeholder
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  objectFit = 'cover',
  onLoad,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Default sizes for responsive images (Requirement 12.1)
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  if (hasError) {
    return (
      <div 
        className={`bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${className}`}
        aria-label="Image non disponible"
      >
        <svg
          className="w-12 h-12 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder (Requirement 12.2) */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" aria-hidden="true" />
      )}
      
      {/* Next.js Image with automatic optimization (Requirement 12.1, 12.2) */}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={defaultSizes}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${objectFit === 'cover' ? 'object-cover' : objectFit === 'contain' ? 'object-contain' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'} // Lazy loading by default (Requirement 12.2)
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
      />
    </div>
  );
}
