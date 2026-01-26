/**
 * Cookie Consent Banner - Unit Tests
 * 
 * Tests the GDPR-compliant cookie consent banner functionality
 * 
 * Requirements:
 * - 9.10: Allow visitors to refuse tracking via cookie consent banner
 * - Store consent choice in localStorage
 * - Provide clear accept/refuse options
 * 
 * @module components/public-profile/__tests__/cookie-consent-banner.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CookieConsentBanner,
  getStoredConsent,
  storeConsent,
  hasTrackingConsent,
} from '../cookie-consent-banner';

describe('CookieConsentBanner - Storage Functions', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should return null when no consent is stored', () => {
    expect(getStoredConsent()).toBe(null);
  });

  it('should store and retrieve accepted consent', () => {
    storeConsent('accepted');
    expect(getStoredConsent()).toBe('accepted');
  });

  it('should store and retrieve refused consent', () => {
    storeConsent('refused');
    expect(getStoredConsent()).toBe('refused');
  });

  it('should return true for hasTrackingConsent when accepted', () => {
    storeConsent('accepted');
    expect(hasTrackingConsent()).toBe(true);
  });

  it('should return false for hasTrackingConsent when refused', () => {
    storeConsent('refused');
    expect(hasTrackingConsent()).toBe(false);
  });

  it('should return false for hasTrackingConsent when no consent', () => {
    expect(hasTrackingConsent()).toBe(false);
  });
});

describe('CookieConsentBanner - Component Rendering', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should not render immediately (waits for delay)', () => {
    render(<CookieConsentBanner />);
    
    // Banner should not be visible immediately
    expect(screen.queryByText(/Respect de votre vie privée/i)).not.toBeInTheDocument();
  });

  it('should render after delay when no consent is stored', async () => {
    render(<CookieConsentBanner />);
    
    // Wait for banner to appear after delay
    await waitFor(() => {
      expect(screen.getByText(/Respect de votre vie privée/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should not render when consent is already stored', async () => {
    storeConsent('accepted');
    
    render(<CookieConsentBanner />);
    
    // Wait a bit to ensure it doesn't appear
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    expect(screen.queryByText(/Respect de votre vie privée/i)).not.toBeInTheDocument();
  });

  it('should display accept and refuse buttons', async () => {
    render(<CookieConsentBanner />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accepter/i })).toBeInTheDocument();
      // Check for the refuse button by text content
      const refuseButton = screen.getAllByRole('button').find(btn => btn.textContent === 'Refuser');
      expect(refuseButton).toBeDefined();
    }, { timeout: 2000 });
  });

  it('should display link to privacy policy', async () => {
    render(<CookieConsentBanner />);
    
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /en savoir plus/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/legal/cookies');
    }, { timeout: 2000 });
  });
});

describe('CookieConsentBanner - User Interactions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store accepted consent when clicking Accept button', async () => {
    const user = userEvent.setup();
    const onConsentChange = vi.fn();
    
    render(<CookieConsentBanner onConsentChange={onConsentChange} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accepter/i })).toBeInTheDocument();
    }, { timeout: 2000 });
    
    const acceptButton = screen.getByRole('button', { name: /accepter/i });
    await user.click(acceptButton);
    
    expect(getStoredConsent()).toBe('accepted');
    expect(onConsentChange).toHaveBeenCalledWith('accepted');
  });

  it('should store refused consent when clicking Refuse button', async () => {
    const user = userEvent.setup();
    const onConsentChange = vi.fn();
    
    render(<CookieConsentBanner onConsentChange={onConsentChange} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Respect de votre vie privée/i)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Get the refuse button by its exact text content
    const refuseButton = screen.getAllByRole('button').find(btn => btn.textContent === 'Refuser');
    expect(refuseButton).toBeDefined();
    await user.click(refuseButton!);
    
    expect(getStoredConsent()).toBe('refused');
    expect(onConsentChange).toHaveBeenCalledWith('refused');
  });

  it('should store refused consent when clicking close button', async () => {
    const user = userEvent.setup();
    const onConsentChange = vi.fn();
    
    render(<CookieConsentBanner onConsentChange={onConsentChange} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/fermer et refuser/i)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    const closeButton = screen.getByLabelText(/fermer et refuser/i);
    await user.click(closeButton);
    
    expect(getStoredConsent()).toBe('refused');
    expect(onConsentChange).toHaveBeenCalledWith('refused');
  });

  it('should hide banner after accepting', async () => {
    const user = userEvent.setup();
    
    render(<CookieConsentBanner />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accepter/i })).toBeInTheDocument();
    }, { timeout: 2000 });
    
    const acceptButton = screen.getByRole('button', { name: /accepter/i });
    await user.click(acceptButton);
    
    // Wait for animation and removal
    await waitFor(() => {
      expect(screen.queryByText(/Respect de votre vie privée/i)).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should hide banner after refusing', async () => {
    const user = userEvent.setup();
    
    render(<CookieConsentBanner />);
    
    await waitFor(() => {
      expect(screen.getByText(/Respect de votre vie privée/i)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Get the refuse button by its exact text content
    const refuseButton = screen.getAllByRole('button').find(btn => btn.textContent === 'Refuser');
    expect(refuseButton).toBeDefined();
    await user.click(refuseButton!);
    
    // Wait for animation and removal
    await waitFor(() => {
      expect(screen.queryByText(/Respect de votre vie privée/i)).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

describe('CookieConsentBanner - Accessibility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should have proper ARIA attributes', async () => {
    render(<CookieConsentBanner />);
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'cookie-consent-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'cookie-consent-description');
    }, { timeout: 2000 });
  });

  it('should have descriptive button labels', async () => {
    render(<CookieConsentBanner />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accepter/i })).toBeInTheDocument();
      // Check for the refuse button by text content
      const refuseButton = screen.getAllByRole('button').find(btn => btn.textContent === 'Refuser');
      expect(refuseButton).toBeDefined();
      expect(screen.getByLabelText(/fermer et refuser/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
