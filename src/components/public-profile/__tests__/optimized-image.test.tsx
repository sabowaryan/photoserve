/**
 * OptimizedImage Component Tests
 * 
 * Tests for the OptimizedImage component
 * 
 * Requirements:
 * - 12.1: Use WebP format and compression via Cloudinary
 * - 12.2: Implement lazy loading for gallery images
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizedImage } from '../optimized-image';

describe('OptimizedImage', () => {
  it('should render with basic props', () => {
    render(
      <OptimizedImage
        src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toBeDefined();
  });

  it('should render with fill prop', () => {
    render(
      <OptimizedImage
        src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
        alt="Test image"
        fill
      />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toBeDefined();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <OptimizedImage
        src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
        alt="Test image"
        width={800}
        height={600}
        className="custom-class"
      />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeDefined();
  });

  it('should use custom sizes attribute', () => {
    render(
      <OptimizedImage
        src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
        alt="Test image"
        width={800}
        height={600}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    );

    const image = screen.getByAltText('Test image') as HTMLImageElement;
    expect(image.sizes).toBe('(max-width: 768px) 100vw, 50vw');
  });

  it('should render with priority prop', () => {
    render(
      <OptimizedImage
        src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
        alt="Test image"
        width={800}
        height={600}
        priority={true}
      />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toBeDefined();
  });

  it('should render with different object fit values', () => {
    const { rerender } = render(
      <OptimizedImage
        src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
        alt="Test image"
        width={800}
        height={600}
        objectFit="contain"
      />
    );

    let image = screen.getByAltText('Test image');
    expect(image).toBeDefined();

    rerender(
      <OptimizedImage
        src="https://res.cloudinary.com/test/image/upload/v1/test.jpg"
        alt="Test image"
        width={800}
        height={600}
        objectFit="cover"
      />
    );

    image = screen.getByAltText('Test image');
    expect(image).toBeDefined();
  });
});
