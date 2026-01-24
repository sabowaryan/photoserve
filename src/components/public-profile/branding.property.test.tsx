/**
 * Property-Based Tests for Branding Application
 * 
 * Feature: public-photographer-profile
 * Property 19: Application conditionnelle du branding
 * 
 * For any profile:
 * - If custom logo is configured, it must be displayed
 * - If brand colors are configured, they must be applied
 * - If custom domain is configured, footer must be white-label
 * 
 * Validates: Requirements 7.1, 7.2, 7.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { ProfileHeader } from './profile-header';
import { ProfileContact } from './profile-contact';
import { ProfileFooter } from './profile-footer';
import type { BrandColors, CTAButton } from '@/types';

// Arbitraries for generating test data
const urlArb = fc.webUrl();

const hexColorArb = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  )
  .map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

const brandColorsArb: fc.Arbitrary<BrandColors> = fc.record({
  primary: hexColorArb,
  secondary: hexColorArb,
  accent: hexColorArb,
});

const ctaButtonArb: fc.Arbitrary<CTAButton> = fc.record({
  text: fc.string({ minLength: 1, maxLength: 50 }),
  url: urlArb,
  style: fc.constantFrom('primary' as const, 'secondary' as const),
});

describe('Property 19: Application conditionnelle du branding', () => {
  /**
   * Property: If custom logo is configured, it must be displayed
   * Validates: Requirement 7.1
   */
  it('should display custom logo when configured', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // displayName (non-empty)
        urlArb, // customLogo
        (displayName, customLogo) => {
          const { container } = render(
            <ProfileHeader
              displayName={displayName}
              customLogo={customLogo}
            />
          );

          // Logo must be present in the DOM
          const logoImg = container.querySelector('img[alt*="logo"]');
          expect(logoImg).toBeTruthy();
          
          // Logo src must match the provided URL
          expect(logoImg?.getAttribute('src')).toBe(customLogo);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: If custom logo is NOT configured, it must NOT be displayed
   * Validates: Requirement 7.1
   */
  it('should not display logo section when custom logo is not configured', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // displayName
        (displayName) => {
          const { container } = render(
            <ProfileHeader
              displayName={displayName}
              customLogo={undefined}
            />
          );

          // Logo must NOT be present in the DOM
          const logoImg = container.querySelector('img[alt*="logo"]');
          expect(logoImg).toBeFalsy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: If brand colors are configured, they must be applied to header
   * Validates: Requirement 7.2
   */
  it('should apply brand colors as CSS custom properties when configured', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // displayName
        brandColorsArb, // brandColors
        (displayName, brandColors) => {
          const { container } = render(
            <ProfileHeader
              displayName={displayName}
              brandColors={brandColors}
            />
          );

          // Brand colors must be applied as CSS custom properties
          const headerContainer = container.querySelector('.container');
          const style = headerContainer?.getAttribute('style');
          
          expect(style).toBeTruthy();
          expect(style).toContain(`--brand-primary: ${brandColors.primary}`);
          expect(style).toContain(`--brand-secondary: ${brandColors.secondary}`);
          expect(style).toContain(`--brand-accent: ${brandColors.accent}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: If brand colors are NOT configured, they must NOT be applied
   * Validates: Requirement 7.2
   */
  it('should not apply brand color styles when brand colors are not configured', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // displayName
        (displayName) => {
          const { container } = render(
            <ProfileHeader
              displayName={displayName}
              brandColors={undefined}
            />
          );

          // Brand colors must NOT be applied
          const headerContainer = container.querySelector('.container');
          const style = headerContainer?.getAttribute('style');
          
          expect(style).toBeFalsy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: If brand colors are configured, they must be applied to CTA button
   * Validates: Requirement 7.2
   */
  it('should apply brand colors to CTA button when configured', () => {
    fc.assert(
      fc.property(
        ctaButtonArb,
        brandColorsArb,
        (ctaButton, brandColors) => {
          const { container } = render(
            <ProfileContact
              ctaButton={ctaButton}
              brandColors={brandColors}
            />
          );

          // Find the button
          const button = container.querySelector('button');
          expect(button).toBeTruthy();
          
          // Button must have inline style with brand color
          const style = button?.getAttribute('style');
          expect(style).toBeTruthy();
          
          // Check that the appropriate brand color is applied based on button style
          if (ctaButton.style === 'primary') {
            // Convert hex to RGB for comparison
            const rgb = hexToRgb(brandColors.primary);
            expect(style).toContain(`background-color: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
          } else {
            const rgb = hexToRgb(brandColors.secondary);
            expect(style).toContain(`background-color: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: If brand colors are configured, they must be applied to links
   * Validates: Requirement 7.2
   */
  it('should apply brand colors to links when configured', () => {
    fc.assert(
      fc.property(
        urlArb, // website
        brandColorsArb,
        (website, brandColors) => {
          const { container } = render(
            <ProfileContact
              website={website}
              brandColors={brandColors}
            />
          );

          // Find the website link
          const link = container.querySelector('a[href]');
          expect(link).toBeTruthy();
          
          // Link must have inline style with accent color
          const style = link?.getAttribute('style');
          expect(style).toBeTruthy();
          
          const rgb = hexToRgb(brandColors.accent);
          expect(style).toContain(`color: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: If custom domain is configured, footer must be white-label
   * Validates: Requirement 7.3
   */
  it('should display white-label footer when custom domain is configured', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // photographerName
        (photographerName) => {
          const { container } = render(
            <ProfileFooter
              photographerName={photographerName}
              hasCustomDomain={true}
            />
          );

          // "Propulsé par PikSend" must NOT be present
          const pikSendText = container.textContent;
          expect(pikSendText).not.toContain('Propulsé par PikSend');
          expect(pikSendText).not.toContain('PikSend');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: If custom domain is NOT configured, footer must show "Propulsé par PikSend"
   * Validates: Requirement 7.5
   */
  it('should display "Propulsé par PikSend" when custom domain is not configured', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // photographerName
        (photographerName) => {
          const { container } = render(
            <ProfileFooter
              photographerName={photographerName}
              hasCustomDomain={false}
            />
          );

          // "Propulsé par PikSend" must be present
          const pikSendText = container.textContent;
          expect(pikSendText).toContain('Propulsé par');
          expect(pikSendText).toContain('PikSend');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Branding elements are independent and can be combined
   * Validates: Requirements 7.1, 7.2, 7.3
   */
  it('should correctly apply multiple branding elements together', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // displayName (non-empty)
        fc.option(urlArb), // customLogo (optional)
        fc.option(brandColorsArb), // brandColors (optional)
        (displayName, customLogo, brandColors) => {
          const { container } = render(
            <ProfileHeader
              displayName={displayName}
              customLogo={customLogo ?? undefined}
              brandColors={brandColors ?? undefined}
            />
          );

          // If logo is configured, it must be displayed
          if (customLogo) {
            const logoImg = container.querySelector('img[alt*="logo"]');
            expect(logoImg).toBeTruthy();
            expect(logoImg?.getAttribute('src')).toBe(customLogo);
          } else {
            const logoImg = container.querySelector('img[alt*="logo"]');
            expect(logoImg).toBeFalsy();
          }

          // If brand colors are configured, they must be applied
          const headerContainer = container.querySelector('.container');
          const style = headerContainer?.getAttribute('style');
          
          if (brandColors) {
            expect(style).toBeTruthy();
            expect(style).toContain('--brand-primary');
            expect(style).toContain('--brand-secondary');
            expect(style).toContain('--brand-accent');
          } else {
            expect(style).toBeFalsy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}
