/**
 * Unit tests for ProfileHeader component
 * 
 * Tests branding application:
 * - Custom logo display (Requirement 7.1)
 * - Brand colors application (Requirement 7.2)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileHeader } from './profile-header';
import type { BrandColors } from '@/types';

describe('ProfileHeader', () => {
  const baseProps = {
    displayName: 'John Doe',
  };

  describe('Custom Logo (Requirement 7.1)', () => {
    it('should display custom logo when provided', () => {
      const customLogo = 'https://example.com/logo.png';
      
      const { container } = render(
        <ProfileHeader {...baseProps} customLogo={customLogo} />
      );
      
      const logoImg = container.querySelector(`img[src="${customLogo}"]`);
      expect(logoImg).toBeTruthy();
      expect(logoImg?.getAttribute('alt')).toBe('John Doe logo');
    });

    it('should not display logo section when customLogo is not provided', () => {
      const { container } = render(
        <ProfileHeader {...baseProps} />
      );
      
      const logoImg = container.querySelector('img[alt*="logo"]');
      expect(logoImg).toBeFalsy();
    });

    it('should display logo with proper styling', () => {
      const customLogo = 'https://example.com/logo.png';
      
      const { container } = render(
        <ProfileHeader {...baseProps} customLogo={customLogo} />
      );
      
      const logoImg = container.querySelector(`img[src="${customLogo}"]`);
      expect(logoImg?.className).toContain('h-12');
      expect(logoImg?.className).toContain('md:h-16');
    });
  });

  describe('Brand Colors (Requirement 7.2)', () => {
    it('should apply brand colors as CSS custom properties when provided', () => {
      const brandColors: BrandColors = {
        primary: '#FF5733',
        secondary: '#33FF57',
        accent: '#3357FF',
      };
      
      const { container } = render(
        <ProfileHeader {...baseProps} brandColors={brandColors} />
      );
      
      const headerContainer = container.querySelector('.container');
      const style = headerContainer?.getAttribute('style');
      
      expect(style).toContain('--brand-primary: #FF5733');
      expect(style).toContain('--brand-secondary: #33FF57');
      expect(style).toContain('--brand-accent: #3357FF');
    });

    it('should not apply brand color styles when brandColors is not provided', () => {
      const { container } = render(
        <ProfileHeader {...baseProps} />
      );
      
      const headerContainer = container.querySelector('.container');
      const style = headerContainer?.getAttribute('style');
      
      expect(style).toBeFalsy();
    });
  });

  describe('Basic Information Display', () => {
    it('should display photographer name', () => {
      render(<ProfileHeader {...baseProps} />);
      
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    it('should display tagline when provided', () => {
      render(
        <ProfileHeader {...baseProps} tagline="Professional Wedding Photographer" />
      );
      
      expect(screen.getByText('Professional Wedding Photographer')).toBeTruthy();
    });

    it('should display location when provided', () => {
      render(
        <ProfileHeader {...baseProps} location="Paris, France" />
      );
      
      expect(screen.getByText('Paris, France')).toBeTruthy();
    });

    it('should display avatar when provided', () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      
      const { container } = render(
        <ProfileHeader {...baseProps} avatarUrl={avatarUrl} />
      );
      
      const avatarImg = container.querySelector(`img[src="${avatarUrl}"]`);
      expect(avatarImg).toBeTruthy();
      expect(avatarImg?.getAttribute('alt')).toBe('John Doe');
    });

    it('should display cover image when provided', () => {
      const coverImageUrl = 'https://example.com/cover.jpg';
      
      const { container } = render(
        <ProfileHeader {...baseProps} coverImageUrl={coverImageUrl} />
      );
      
      const coverImg = container.querySelector(`img[src="${coverImageUrl}"]`);
      expect(coverImg).toBeTruthy();
      expect(coverImg?.getAttribute('alt')).toBe('John Doe cover');
    });
  });

  describe('Combined Branding', () => {
    it('should apply both custom logo and brand colors together', () => {
      const customLogo = 'https://example.com/logo.png';
      const brandColors: BrandColors = {
        primary: '#FF5733',
        secondary: '#33FF57',
        accent: '#3357FF',
      };
      
      const { container } = render(
        <ProfileHeader
          {...baseProps}
          customLogo={customLogo}
          brandColors={brandColors}
        />
      );
      
      // Check logo
      const logoImg = container.querySelector(`img[src="${customLogo}"]`);
      expect(logoImg).toBeTruthy();
      
      // Check brand colors
      const headerContainer = container.querySelector('.container');
      const style = headerContainer?.getAttribute('style');
      expect(style).toContain('--brand-primary');
      expect(style).toContain('--brand-secondary');
      expect(style).toContain('--brand-accent');
    });
  });
});
