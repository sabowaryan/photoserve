/**
 * Unit tests for ProfileContact component
 * 
 * Tests branding application:
 * - Brand colors on CTA button (Requirement 7.2)
 * - Brand colors on links (Requirement 7.2)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileContact } from './profile-contact';
import type { BrandColors, CTAButton } from '@/types';

describe('ProfileContact', () => {
  describe('Brand Colors on CTA Button (Requirement 7.2)', () => {
    it('should apply primary brand color to primary CTA button', () => {
      const brandColors: BrandColors = {
        primary: '#FF5733',
        secondary: '#33FF57',
        accent: '#3357FF',
      };
      
      const ctaButton: CTAButton = {
        text: 'Book Now',
        url: 'https://example.com/book',
        style: 'primary',
      };
      
      render(
        <ProfileContact ctaButton={ctaButton} brandColors={brandColors} />
      );
      
      const button = screen.getByText('Book Now');
      const style = button.getAttribute('style');
      
      expect(style).toContain('background-color: rgb(255, 87, 51)'); // #FF5733
      expect(style).toContain('color: rgb(255, 255, 255)');
    });

    it('should apply secondary brand color to secondary CTA button', () => {
      const brandColors: BrandColors = {
        primary: '#FF5733',
        secondary: '#33FF57',
        accent: '#3357FF',
      };
      
      const ctaButton: CTAButton = {
        text: 'Contact Me',
        url: 'https://example.com/contact',
        style: 'secondary',
      };
      
      render(
        <ProfileContact ctaButton={ctaButton} brandColors={brandColors} />
      );
      
      const button = screen.getByText('Contact Me');
      const style = button.getAttribute('style');
      
      expect(style).toContain('background-color: rgb(51, 255, 87)'); // #33FF57
    });

    it('should use default styling when brand colors are not provided', () => {
      const ctaButton: CTAButton = {
        text: 'Book Now',
        url: 'https://example.com/book',
        style: 'primary',
      };
      
      render(<ProfileContact ctaButton={ctaButton} />);
      
      const button = screen.getByText('Book Now');
      expect(button.className).toContain('bg-primary');
      expect(button.className).toContain('text-primary-foreground');
    });
  });

  describe('Brand Colors on Links (Requirement 7.2)', () => {
    it('should apply accent brand color to website link', () => {
      const brandColors: BrandColors = {
        primary: '#FF5733',
        secondary: '#33FF57',
        accent: '#3357FF',
      };
      
      render(
        <ProfileContact
          website="https://example.com"
          brandColors={brandColors} />
      );
      
      const link = screen.getByText('https://example.com');
      const style = link.getAttribute('style');
      
      expect(style).toContain('color: rgb(51, 87, 255)'); // #3357FF
    });

    it('should use default link styling when brand colors are not provided', () => {
      render(<ProfileContact website="https://example.com" />);
      
      const link = screen.getByText('https://example.com');
      expect(link.className).toContain('hover:underline');
    });
  });

  describe('Contact Information Display', () => {
    it('should display email with anti-spam protection', () => {
      render(<ProfileContact email="john@example.com" />);
      
      expect(screen.getByText('john[at]example[dot]com')).toBeTruthy();
    });

    it('should display phone number', () => {
      render(<ProfileContact phone="+33 6 12 34 56 78" />);
      
      expect(screen.getByText('+33 6 12 34 56 78')).toBeTruthy();
    });

    it('should display address', () => {
      render(<ProfileContact address="123 Main St, Paris" />);
      
      expect(screen.getByText('123 Main St, Paris')).toBeTruthy();
    });

    it('should return null when no contact information is provided', () => {
      const { container } = render(<ProfileContact />);
      
      expect(container.firstChild).toBeFalsy();
    });
  });

  describe('Social Links', () => {
    it('should display social media links', () => {
      const socialLinks = {
        instagram: 'https://instagram.com/photographer',
        facebook: 'https://facebook.com/photographer',
      };
      
      render(<ProfileContact socialLinks={socialLinks} />);
      
      expect(screen.getByText('Instagram')).toBeTruthy();
      expect(screen.getByText('Facebook')).toBeTruthy();
    });

    it('should call onSocialClick when social link is clicked', () => {
      const onSocialClick = vi.fn();
      const socialLinks = {
        instagram: 'https://instagram.com/photographer',
      };
      
      render(
        <ProfileContact
          socialLinks={socialLinks}
          onSocialClick={onSocialClick}
        />
      );
      
      const instagramLink = screen.getByText('Instagram').closest('a');
      instagramLink?.click();
      
      expect(onSocialClick).toHaveBeenCalledWith('instagram');
    });
  });

  describe('CTA Button', () => {
    it('should display CTA button with custom text', () => {
      const ctaButton: CTAButton = {
        text: 'Book a Session',
        url: 'https://example.com/book',
        style: 'primary',
      };
      
      render(<ProfileContact ctaButton={ctaButton} />);
      
      expect(screen.getByText('Book a Session')).toBeTruthy();
    });

    it('should call onCTAClick when button is clicked', () => {
      const onCTAClick = vi.fn();
      const ctaButton: CTAButton = {
        text: 'Book Now',
        url: 'https://example.com/book',
        style: 'primary',
      };
      
      render(
        <ProfileContact ctaButton={ctaButton} onCTAClick={onCTAClick} />
      );
      
      const button = screen.getByText('Book Now');
      button.click();
      
      expect(onCTAClick).toHaveBeenCalled();
    });
  });

  describe('Combined Branding', () => {
    it('should apply brand colors to both CTA button and links', () => {
      const brandColors: BrandColors = {
        primary: '#FF5733',
        secondary: '#33FF57',
        accent: '#3357FF',
      };
      
      const ctaButton: CTAButton = {
        text: 'Book Now',
        url: 'https://example.com/book',
        style: 'primary',
      };
      
      render(
        <ProfileContact
          website="https://example.com"
          ctaButton={ctaButton}
          brandColors={brandColors}
        />
      );
      
      // Check CTA button has brand color
      const button = screen.getByText('Book Now');
      const buttonStyle = button.getAttribute('style');
      expect(buttonStyle).toContain('background-color: rgb(255, 87, 51)');
      
      // Check link has brand color
      const link = screen.getByText('https://example.com');
      const linkStyle = link.getAttribute('style');
      expect(linkStyle).toContain('color: rgb(51, 87, 255)');
    });
  });
});
