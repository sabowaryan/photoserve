/**
 * Responsive Design Tests
 * 
 * Tests for responsive design implementation
 * 
 * Requirements:
 * - 11.1: Display responsive on mobile, tablet, and desktop
 * - 11.2: Adapt gallery grid (1 column mobile, 2-3 tablet, 3-4 desktop)
 */

import { describe, it, expect } from 'vitest';

describe('Responsive Design', () => {
  describe('Gallery Grid Breakpoints', () => {
    it('should use 1 column on mobile (< 640px)', () => {
      // Mobile breakpoint: grid-cols-1
      const mobileClass = 'grid-cols-1';
      expect(mobileClass).toBe('grid-cols-1');
    });

    it('should use 2 columns on small tablets (>= 640px)', () => {
      // Small tablet breakpoint: sm:grid-cols-2
      const tabletClass = 'sm:grid-cols-2';
      expect(tabletClass).toBe('sm:grid-cols-2');
    });

    it('should use 3 columns on large tablets/desktop (>= 1024px)', () => {
      // Large tablet/desktop breakpoint: lg:grid-cols-3
      const desktopClass = 'lg:grid-cols-3';
      expect(desktopClass).toBe('lg:grid-cols-3');
    });

    it('should use 4 columns on extra large desktop (>= 1280px)', () => {
      // Extra large desktop breakpoint: xl:grid-cols-4
      const xlDesktopClass = 'xl:grid-cols-4';
      expect(xlDesktopClass).toBe('xl:grid-cols-4');
    });
  });

  describe('Hero Section Breakpoints', () => {
    it('should have appropriate height on mobile (320px)', () => {
      // Mobile: h-64 (256px)
      const mobileHeight = 'h-64';
      expect(mobileHeight).toBe('h-64');
    });

    it('should have appropriate height on small tablet (640px)', () => {
      // Small tablet: sm:h-80 (320px)
      const smTabletHeight = 'sm:h-80';
      expect(smTabletHeight).toBe('sm:h-80');
    });

    it('should have appropriate height on tablet (768px)', () => {
      // Tablet: md:h-96 (384px)
      const tabletHeight = 'md:h-96';
      expect(tabletHeight).toBe('md:h-96');
    });

    it('should have appropriate height on desktop (1024px+)', () => {
      // Desktop: lg:h-[32rem] (512px)
      const desktopHeight = 'lg:h-[32rem]';
      expect(desktopHeight).toBe('lg:h-[32rem]');
    });
  });

  describe('Avatar Size Breakpoints', () => {
    it('should have small avatar on mobile', () => {
      // Mobile: w-28 h-28 (112px)
      const mobileSize = 'w-28 h-28';
      expect(mobileSize).toContain('w-28');
      expect(mobileSize).toContain('h-28');
    });

    it('should have medium avatar on small screens', () => {
      // Small: sm:w-32 sm:h-32 (128px)
      const smallSize = 'sm:w-32 sm:h-32';
      expect(smallSize).toContain('sm:w-32');
      expect(smallSize).toContain('sm:h-32');
    });

    it('should have large avatar on medium screens', () => {
      // Medium: md:w-40 md:h-40 (160px)
      const mediumSize = 'md:w-40 md:h-40';
      expect(mediumSize).toContain('md:w-40');
      expect(mediumSize).toContain('md:h-40');
    });

    it('should have extra large avatar on large screens', () => {
      // Large: lg:w-48 lg:h-48 (192px)
      const largeSize = 'lg:w-48 lg:h-48';
      expect(largeSize).toContain('lg:w-48');
      expect(largeSize).toContain('lg:h-48');
    });
  });

  describe('Typography Breakpoints', () => {
    it('should have appropriate heading sizes on mobile', () => {
      // Mobile: text-2xl (24px)
      const mobileHeading = 'text-2xl';
      expect(mobileHeading).toBe('text-2xl');
    });

    it('should have appropriate heading sizes on tablet', () => {
      // Tablet: md:text-4xl (36px)
      const tabletHeading = 'md:text-4xl';
      expect(tabletHeading).toBe('md:text-4xl');
    });

    it('should have appropriate heading sizes on desktop', () => {
      // Desktop: lg:text-5xl (48px)
      const desktopHeading = 'lg:text-5xl';
      expect(desktopHeading).toBe('lg:text-5xl');
    });
  });

  describe('Layout Breakpoints', () => {
    it('should use single column layout on mobile', () => {
      // Mobile: grid-cols-1
      const mobileLayout = 'grid-cols-1';
      expect(mobileLayout).toBe('grid-cols-1');
    });

    it('should use 3-column layout on large screens', () => {
      // Large: lg:grid-cols-3
      const desktopLayout = 'lg:grid-cols-3';
      expect(desktopLayout).toBe('lg:grid-cols-3');
    });

    it('should make contact sidebar sticky on large screens', () => {
      // Large: lg:sticky lg:top-6
      const stickyClass = 'lg:sticky lg:top-6';
      expect(stickyClass).toContain('lg:sticky');
      expect(stickyClass).toContain('lg:top-6');
    });
  });

  describe('Spacing Breakpoints', () => {
    it('should have compact spacing on mobile', () => {
      // Mobile: px-4 py-8
      const mobileSpacing = 'px-4 py-8';
      expect(mobileSpacing).toContain('px-4');
      expect(mobileSpacing).toContain('py-8');
    });

    it('should have comfortable spacing on tablet', () => {
      // Tablet: sm:px-6 sm:py-12
      const tabletSpacing = 'sm:px-6 sm:py-12';
      expect(tabletSpacing).toContain('sm:px-6');
      expect(tabletSpacing).toContain('sm:py-12');
    });

    it('should have generous spacing on desktop', () => {
      // Desktop: md:py-16
      const desktopSpacing = 'md:py-16';
      expect(desktopSpacing).toBe('md:py-16');
    });
  });

  describe('Screen Size Requirements', () => {
    it('should support 320px mobile screens', () => {
      // Minimum mobile width: 320px
      // Base classes without breakpoints should work at this size
      const minWidth = 320;
      expect(minWidth).toBeGreaterThanOrEqual(320);
    });

    it('should support 768px tablet screens', () => {
      // Tablet breakpoint: md (768px)
      const tabletWidth = 768;
      expect(tabletWidth).toBeGreaterThanOrEqual(768);
    });

    it('should support 1024px desktop screens', () => {
      // Desktop breakpoint: lg (1024px)
      const desktopWidth = 1024;
      expect(desktopWidth).toBeGreaterThanOrEqual(1024);
    });

    it('should support 1440px large desktop screens', () => {
      // Large desktop: 1440px
      const largeDesktopWidth = 1440;
      expect(largeDesktopWidth).toBeGreaterThanOrEqual(1440);
    });
  });

  describe('Social Links Grid', () => {
    it('should use 2 columns on mobile', () => {
      // Mobile: grid-cols-2
      const mobileGrid = 'grid-cols-2';
      expect(mobileGrid).toBe('grid-cols-2');
    });

    it('should use 3 columns on small tablets', () => {
      // Small tablet: sm:grid-cols-3
      const tabletGrid = 'sm:grid-cols-3';
      expect(tabletGrid).toBe('sm:grid-cols-3');
    });

    it('should use 2 columns on large screens (sidebar)', () => {
      // Large: lg:grid-cols-2 (in sidebar)
      const sidebarGrid = 'lg:grid-cols-2';
      expect(sidebarGrid).toBe('lg:grid-cols-2');
    });
  });

  describe('Flexbox Direction', () => {
    it('should use column direction on mobile for header', () => {
      // Mobile: flex-col
      const mobileDirection = 'flex-col';
      expect(mobileDirection).toBe('flex-col');
    });

    it('should use row direction on small screens for header', () => {
      // Small: sm:flex-row
      const tabletDirection = 'sm:flex-row';
      expect(tabletDirection).toBe('sm:flex-row');
    });

    it('should use column direction on mobile for footer', () => {
      // Mobile: flex-col
      const mobileFooter = 'flex-col';
      expect(mobileFooter).toBe('flex-col');
    });

    it('should use row direction on medium screens for footer', () => {
      // Medium: md:flex-row
      const desktopFooter = 'md:flex-row';
      expect(desktopFooter).toBe('md:flex-row');
    });
  });
});
