/**
 * Unit tests for ProfileFooter component
 * 
 * Tests:
 * - Copyright display with photographer name
 * - Legal links display
 * - "Powered by PikSend" display when no custom domain
 * - White-label footer when custom domain is configured
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileFooter } from './profile-footer';

describe('ProfileFooter', () => {
  describe('Copyright', () => {
    it('should display copyright with photographer name', () => {
      render(<ProfileFooter photographerName="John Doe" />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} John Doe`))).toBeInTheDocument();
    });

    it('should display current year in copyright', () => {
      render(<ProfileFooter photographerName="Jane Smith" />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    });
  });

  describe('Legal Links', () => {
    it('should display Terms of Service link', () => {
      render(<ProfileFooter photographerName="John Doe" />);
      
      const termsLink = screen.getByRole('link', { name: /Conditions Générales d'Utilisation/i });
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('href', '/legal/terms');
    });

    it('should display Privacy Policy link', () => {
      render(<ProfileFooter photographerName="John Doe" />);
      
      const privacyLink = screen.getByRole('link', { name: /Politique de Confidentialité/i });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/legal/privacy');
    });
  });

  describe('Branding - Requirement 7.5', () => {
    it('should display "Propulsé par PikSend" when no custom domain', () => {
      render(<ProfileFooter photographerName="John Doe" hasCustomDomain={false} />);
      
      expect(screen.getByText(/Propulsé par/i)).toBeInTheDocument();
      
      const piksendLink = screen.getByRole('link', { name: /PikSend/i });
      expect(piksendLink).toBeInTheDocument();
      expect(piksendLink).toHaveAttribute('href', 'https://piksend.com');
      expect(piksendLink).toHaveAttribute('target', '_blank');
      expect(piksendLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should display "Propulsé par PikSend" by default when hasCustomDomain is undefined', () => {
      render(<ProfileFooter photographerName="John Doe" />);
      
      expect(screen.getByText(/Propulsé par/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /PikSend/i })).toBeInTheDocument();
    });
  });

  describe('White-label Footer - Requirements 7.3, 7.4', () => {
    it('should NOT display "Propulsé par PikSend" when custom domain is configured', () => {
      render(<ProfileFooter photographerName="John Doe" hasCustomDomain={true} />);
      
      expect(screen.queryByText(/Propulsé par/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /PikSend/i })).not.toBeInTheDocument();
    });

    it('should still display copyright and legal links with custom domain', () => {
      render(<ProfileFooter photographerName="John Doe" hasCustomDomain={true} />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} John Doe`))).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Conditions Générales/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Politique de Confidentialité/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render all footer sections', () => {
      render(<ProfileFooter photographerName="John Doe" />);
      
      // Copyright section
      expect(screen.getByText(/© \d{4} John Doe/)).toBeInTheDocument();
      
      // Legal links section
      expect(screen.getByRole('link', { name: /Conditions Générales/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Politique de Confidentialité/i })).toBeInTheDocument();
      
      // Branding section
      expect(screen.getByText(/Propulsé par/i)).toBeInTheDocument();
    });
  });
});
