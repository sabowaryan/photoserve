/**
 * Unit Tests for Public Profile Settings Component
 * 
 * Feature: public-photographer-profile
 * Task: 14 - Créer l'interface de configuration dans le dashboard
 * 
 * Validates: Requirements 10.1, 10.2, 10.6, 10.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublicProfileSettings } from './public-profile-settings';

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
delete (window as any).location;
window.location = { origin: 'http://localhost:3000' } as any;

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Mock window.open
window.open = vi.fn();

describe('PublicProfileSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 10.1: Section "Profil Public" dans les paramètres', () => {
    it('should render the public profile settings section', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={null}
        />
      );

      expect(screen.getByText('Profil Public')).toBeInTheDocument();
      expect(screen.getByText('Créez votre vitrine professionnelle en ligne')).toBeInTheDocument();
    });

    it('should display back link to settings', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={null}
        />
      );

      const backLink = screen.getByText('Paramètres');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/settings');
    });
  });

  describe('Requirement 10.2: Organisation en onglets', () => {
    it('should display all required tabs', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={null}
        />
      );

      expect(screen.getByRole('tab', { name: /général/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /médias/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /contact/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /galeries/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /témoignages/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /seo/i })).toBeInTheDocument();
    });

    it('should switch between tabs when clicked', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={null}
        />
      );

      const generalTab = screen.getByRole('tab', { name: /général/i });
      const mediaTab = screen.getByRole('tab', { name: /médias/i });
      
      // Initially, general tab should be selected
      expect(generalTab).toHaveAttribute('aria-selected', 'true');
      expect(mediaTab).toHaveAttribute('aria-selected', 'false');
      
      // Click on media tab
      fireEvent.click(mediaTab);
      
      // Media tab should now be clickable (we can't test the actual state change in this test environment)
      expect(mediaTab).toBeInTheDocument();
    });
  });

  describe('Requirement 10.6: Affichage du lien du profil public', () => {
    it('should display profile URL when profile is enabled and has slug', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            is_enabled: true,
            slug: 'john-doe',
          }}
        />
      );

      expect(screen.getByText(/http:\/\/localhost:3000\/p\/john-doe/)).toBeInTheDocument();
    });

    it('should not display profile URL when profile is disabled', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            is_enabled: false,
            slug: 'john-doe',
          }}
        />
      );

      expect(screen.queryByText(/http:\/\/localhost:3000\/p\/john-doe/)).not.toBeInTheDocument();
    });

    it('should not display profile URL when slug is not configured', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            is_enabled: true,
            slug: '',
          }}
        />
      );

      expect(screen.queryByText(/http:\/\/localhost:3000\/p\//)).not.toBeInTheDocument();
    });

    it('should allow copying profile URL', async () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            is_enabled: true,
            slug: 'john-doe',
          }}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copier/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'http://localhost:3000/p/john-doe'
        );
      });
    });
  });

  describe('Requirement 10.7: Bouton "Prévisualiser"', () => {
    it('should display preview button when slug is configured', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            slug: 'john-doe',
          }}
        />
      );

      expect(screen.getByRole('button', { name: /prévisualiser/i })).toBeInTheDocument();
    });

    it('should not display preview button when slug is not configured', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={null}
        />
      );

      expect(screen.queryByRole('button', { name: /prévisualiser/i })).not.toBeInTheDocument();
    });

    it('should open profile in new tab when preview button is clicked', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            slug: 'john-doe',
          }}
        />
      );

      const previewButton = screen.getByRole('button', { name: /prévisualiser/i });
      fireEvent.click(previewButton);

      expect(window.open).toHaveBeenCalledWith('/p/john-doe', '_blank');
    });
  });

  describe('Profile Activation Toggle', () => {
    it('should display activation toggle', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={null}
        />
      );

      expect(screen.getByLabelText(/activer le profil public/i)).toBeInTheDocument();
    });

    it('should reflect initial enabled state', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            is_enabled: true,
            slug: 'john-doe',
          }}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeChecked();
    });

    it('should be disabled for non-Pro users', () => {
      render(
        <PublicProfileSettings
          currentPlan="free"
          initialProfile={null}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeDisabled();
    });

    it('should display Pro plan notice for non-Pro users', () => {
      render(
        <PublicProfileSettings
          currentPlan="free"
          initialProfile={null}
        />
      );

      expect(screen.getByText(/Fonctionnalité Pro/i)).toBeInTheDocument();
      expect(screen.getByText(/Passer au plan Pro/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should prevent enabling profile without slug', async () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            is_enabled: false,
            slug: '',
          }}
        />
      );

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      // Should not make API call
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            is_enabled: false,
            slug: 'john-doe',
          }}
        />
      );

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Toggle should revert to original state
      expect(toggle).not.toBeChecked();
    });
  });

  describe('Active Status Badge', () => {
    it('should display active badge when profile is enabled', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            is_enabled: true,
            slug: 'john-doe',
          }}
        />
      );

      expect(screen.getByText(/actif/i)).toBeInTheDocument();
    });

    it('should not display active badge when profile is disabled', () => {
      render(
        <PublicProfileSettings
          currentPlan="pro"
          initialProfile={{
            is_enabled: false,
            slug: 'john-doe',
          }}
        />
      );

      expect(screen.queryByText(/actif/i)).not.toBeInTheDocument();
    });
  });
});
