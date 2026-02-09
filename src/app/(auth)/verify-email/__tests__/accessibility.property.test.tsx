/**
 * Property-Based Accessibility Tests for Email Verification Pages
 * 
 * Feature: authentication-flow-optimization
 * 
 * This test suite validates accessibility properties for email verification pages:
 * - Property 6: WCAG 2.1 Level AA Compliance
 * - Property 7: Keyboard Navigation Support
 * - Property 8: Screen Reader Compatibility
 * - Property 9: Color Contrast Compliance
 * - Property 10: Focus Indicator Visibility
 * 
 * Validates Requirements: 4.6, 4.7, 4.8, 4.9, 4.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as fc from 'fast-check';
import userEvent from '@testing-library/user-event';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => {
      if (key === 'type') return 'expired';
      if (key === 'email') return 'test@example.com';
      return null;
    }),
  }),
}));

// Mock the session hook
vi.mock('@/hooks/use-cached-session', () => ({
  useCachedSession: () => ({
    data: {
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock i18n context
vi.mock('@/lib/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Import components after mocks
import VerifyEmailPage from '../page';
import VerifyEmailSuccessPage from '../success/page';
import VerifyEmailErrorPage from '../error/page';

describe('Feature: authentication-flow-optimization, Property 6: WCAG Compliance', () => {
  /**
   * **Validates: Requirements 4.6**
   * 
   * Property: For any authentication page, automated accessibility testing 
   * should detect no violations of WCAG 2.1 Level AA standards.
   */

  it('should have no WCAG violations on verification pending page', async () => {
    const { container } = render(<VerifyEmailPage />);
    
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should have no WCAG violations on verification success page', async () => {
    const { container } = render(<VerifyEmailSuccessPage />);
    
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should have no WCAG violations on verification error page', async () => {
    const { container } = render(<VerifyEmailErrorPage />);
    
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should have no WCAG violations across multiple error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('expired', 'invalid', 'used', 'not_found', 'generic'),
        async (errorType) => {
          // Mock the error type
          vi.mocked(vi.mocked(await import('next/navigation')).useSearchParams).mockReturnValue({
            get: (key: string) => {
              if (key === 'type') return errorType;
              if (key === 'email') return 'test@example.com';
              return null;
            },
          } as any);

          const { container } = render(<VerifyEmailErrorPage />);
          const results = await axe(container);
          
          expect(results.violations).toEqual([]);
        }
      ),
      { numRuns: 5 } // Test all error types
    );
  });
});

describe('Feature: authentication-flow-optimization, Property 7: Keyboard Navigation', () => {
  /**
   * **Validates: Requirements 4.7**
   * 
   * Property: For any interactive element on authentication pages, the element 
   * must be reachable and operable using only keyboard navigation 
   * (Tab, Enter, Space, Escape).
   */

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should allow keyboard navigation through all interactive elements on pending page', async () => {
    const user = userEvent.setup();
    render(<VerifyEmailPage />);

    // Get all interactive elements
    const backButton = screen.getByLabelText(/common.backToHome/i);
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    const signOutButton = screen.getByLabelText(/auth.buttons.signOut/i);
    const supportLink = screen.getByRole('link', { name: /auth.verification.contactSupport/i });

    // Verify all elements are focusable
    await user.tab();
    expect(backButton).toHaveFocus();

    await user.tab();
    expect(resendButton).toHaveFocus();

    await user.tab();
    expect(signOutButton).toHaveFocus();

    await user.tab();
    expect(supportLink).toHaveFocus();
  });

  it('should allow keyboard navigation on success page', async () => {
    const user = userEvent.setup();
    render(<VerifyEmailSuccessPage />);

    const continueButton = screen.getByLabelText(/auth.verification.continueToDashboard/i);
    const supportLink = screen.getByRole('link', { name: /auth.verification.contactSupport/i });

    // Verify elements are focusable
    await user.tab();
    expect(continueButton).toHaveFocus();

    await user.tab();
    expect(supportLink).toHaveFocus();
  });

  it('should allow keyboard navigation on error page', async () => {
    const user = userEvent.setup();
    render(<VerifyEmailErrorPage />);

    const backButton = screen.getByLabelText(/common.backToHome/i);
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    const signInLink = screen.getByRole('link', { name: /auth.verification.error.backToSignIn/i });
    const supportLink = screen.getByRole('link', { name: /auth.verification.contactSupport/i });

    // Verify all elements are focusable
    await user.tab();
    expect(backButton).toHaveFocus();

    await user.tab();
    expect(resendButton).toHaveFocus();

    await user.tab();
    expect(signInLink).toHaveFocus();

    await user.tab();
    expect(supportLink).toHaveFocus();
  });

  it('should activate buttons with Enter key', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    render(<VerifyEmailPage />);

    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    
    await user.tab();
    await user.tab(); // Focus on resend button
    await user.keyboard('{Enter}');

    // Verify the button action was triggered
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/resend-verification',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should activate buttons with Space key', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    render(<VerifyEmailPage />);

    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    
    await user.tab();
    await user.tab(); // Focus on resend button
    await user.keyboard(' ');

    // Verify the button action was triggered
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/resend-verification',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should have no elements with negative tabindex that break keyboard navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          <VerifyEmailPage />,
          <VerifyEmailSuccessPage />,
          <VerifyEmailErrorPage />
        ),
        async (component) => {
          const { container } = render(component);
          
          // Find all elements with tabindex
          const elementsWithTabindex = container.querySelectorAll('[tabindex]');
          
          elementsWithTabindex.forEach((element) => {
            const tabindex = element.getAttribute('tabindex');
            // Tabindex should be null, "0", or positive (not negative)
            expect(
              tabindex === null || 
              tabindex === '0' || 
              parseInt(tabindex) >= 0
            ).toBe(true);
          });
        }
      ),
      { numRuns: 3 }
    );
  });
});

describe('Feature: authentication-flow-optimization, Property 8: Screen Reader Compatibility', () => {
  /**
   * **Validates: Requirements 4.8**
   * 
   * Property: For any form field, button, or error message on authentication pages, 
   * appropriate ARIA labels and roles must be present for screen reader announcement.
   */

  it('should have proper ARIA labels on all buttons in pending page', () => {
    render(<VerifyEmailPage />);

    // Verify buttons have aria-label
    expect(screen.getByLabelText(/common.backToHome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth.verification.resendEmail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth.buttons.signOut/i)).toBeInTheDocument();
  });

  it('should have proper ARIA labels on all buttons in success page', () => {
    render(<VerifyEmailSuccessPage />);

    expect(screen.getByLabelText(/auth.verification.continueToDashboard/i)).toBeInTheDocument();
  });

  it('should have proper ARIA labels on all buttons in error page', () => {
    render(<VerifyEmailErrorPage />);

    expect(screen.getByLabelText(/common.backToHome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth.verification.resendEmail/i)).toBeInTheDocument();
  });

  it('should have aria-hidden on decorative icons', () => {
    render(<VerifyEmailPage />);

    // Find all SVG elements (icons)
    const { container } = render(<VerifyEmailPage />);
    const icons = container.querySelectorAll('svg');

    // Most icons should have aria-hidden="true"
    const decorativeIcons = Array.from(icons).filter(
      icon => icon.getAttribute('aria-hidden') === 'true'
    );

    expect(decorativeIcons.length).toBeGreaterThan(0);
  });

  it('should have proper role and aria-live for error messages', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded' }),
    });
    global.fetch = mockFetch;

    const user = userEvent.setup();
    render(<VerifyEmailPage />);

    // Trigger an error
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    await user.click(resendButton);

    // Wait for error message to appear
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    expect(errorMessage).toHaveAttribute('aria-atomic', 'true');
  });

  it('should have proper role and aria-live for success messages', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    const user = userEvent.setup();
    render(<VerifyEmailPage />);

    // Trigger success
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    await user.click(resendButton);

    // Wait for success message to appear
    const successMessage = await screen.findByRole('status');
    expect(successMessage).toHaveAttribute('aria-live', 'polite');
    expect(successMessage).toHaveAttribute('aria-atomic', 'true');
  });

  it('should have dismiss buttons with proper aria-labels', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Test error' }),
    });
    global.fetch = mockFetch;

    const user = userEvent.setup();
    render(<VerifyEmailPage />);

    // Trigger an error to show dismiss button
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    await user.click(resendButton);

    // Find dismiss button
    const dismissButton = await screen.findByLabelText(/common.dismiss/i);
    expect(dismissButton).toBeInTheDocument();
  });

  it('should have proper ARIA labels across all form elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          <VerifyEmailPage />,
          <VerifyEmailSuccessPage />,
          <VerifyEmailErrorPage />
        ),
        async (component) => {
          const { container } = render(component);
          
          // Get all buttons
          const buttons = container.querySelectorAll('button');
          
          buttons.forEach((button) => {
            // Each button should have either aria-label or accessible text content
            const hasAriaLabel = button.hasAttribute('aria-label');
            const hasTextContent = button.textContent && button.textContent.trim().length > 0;
            
            expect(hasAriaLabel || hasTextContent).toBe(true);
          });
        }
      ),
      { numRuns: 3 }
    );
  });
});

describe('Feature: authentication-flow-optimization, Property 9: Color Contrast', () => {
  /**
   * **Validates: Requirements 4.9**
   * 
   * Property: For any text or interactive element on authentication pages, 
   * the color contrast ratio must meet or exceed WCAG AA standards 
   * (4.5:1 for normal text, 3:1 for large text).
   */

  it('should have sufficient contrast for all text on pending page', async () => {
    const { container } = render(<VerifyEmailPage />);
    
    // axe checks color contrast automatically
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    
    expect(results.violations.filter(v => v.id === 'color-contrast')).toEqual([]);
  });

  it('should have sufficient contrast for all text on success page', async () => {
    const { container } = render(<VerifyEmailSuccessPage />);
    
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    
    expect(results.violations.filter(v => v.id === 'color-contrast')).toEqual([]);
  });

  it('should have sufficient contrast for all text on error page', async () => {
    const { container } = render(<VerifyEmailErrorPage />);
    
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    
    expect(results.violations.filter(v => v.id === 'color-contrast')).toEqual([]);
  });

  it('should have sufficient contrast for error messages', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Test error' }),
    });
    global.fetch = mockFetch;

    const user = userEvent.setup();
    const { container } = render(<VerifyEmailPage />);

    // Trigger an error
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    await user.click(resendButton);

    // Wait for error message
    await screen.findByRole('alert');

    // Check contrast on the updated container
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    
    expect(results.violations.filter(v => v.id === 'color-contrast')).toEqual([]);
  });

  it('should have sufficient contrast for success messages', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    const user = userEvent.setup();
    const { container } = render(<VerifyEmailPage />);

    // Trigger success
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    await user.click(resendButton);

    // Wait for success message
    await screen.findByRole('status');

    // Check contrast on the updated container
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    
    expect(results.violations.filter(v => v.id === 'color-contrast')).toEqual([]);
  });

  it('should maintain contrast across all button states', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          <VerifyEmailPage />,
          <VerifyEmailSuccessPage />,
          <VerifyEmailErrorPage />
        ),
        async (component) => {
          const { container } = render(component);
          
          // Check contrast for all buttons
          const results = await axe(container, {
            rules: {
              'color-contrast': { enabled: true },
            },
          });
          
          expect(results.violations.filter(v => v.id === 'color-contrast')).toEqual([]);
        }
      ),
      { numRuns: 3 }
    );
  });
});

describe('Feature: authentication-flow-optimization, Property 10: Focus Indicators', () => {
  /**
   * **Validates: Requirements 4.10**
   * 
   * Property: For any interactive element on authentication pages, when focused, 
   * a visible focus indicator must be present with sufficient contrast.
   */

  it('should have visible focus indicators on all interactive elements in pending page', () => {
    render(<VerifyEmailPage />);

    const backButton = screen.getByLabelText(/common.backToHome/i);
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    const signOutButton = screen.getByLabelText(/auth.buttons.signOut/i);
    const supportLink = screen.getByRole('link', { name: /auth.verification.contactSupport/i });

    // Verify focus ring classes are present
    [backButton, resendButton, signOutButton, supportLink].forEach((element) => {
      expect(element).toHaveClass('focus:outline-none');
      // Should have either focus:ring-2 or focus:ring-4
      const hasFocusRing = element.className.includes('focus:ring-2') || element.className.includes('focus:ring-4');
      expect(hasFocusRing).toBe(true);
    });
  });

  it('should have visible focus indicators on all interactive elements in success page', () => {
    render(<VerifyEmailSuccessPage />);

    const continueButton = screen.getByLabelText(/auth.verification.continueToDashboard/i);
    const supportLink = screen.getByRole('link', { name: /auth.verification.contactSupport/i });

    [continueButton, supportLink].forEach((element) => {
      expect(element).toHaveClass('focus:outline-none');
      // Should have either focus:ring-2 or focus:ring-4
      const hasFocusRing = element.className.includes('focus:ring-2') || element.className.includes('focus:ring-4');
      expect(hasFocusRing).toBe(true);
    });
  });

  it('should have visible focus indicators on all interactive elements in error page', () => {
    render(<VerifyEmailErrorPage />);

    const backButton = screen.getByLabelText(/common.backToHome/i);
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    const signInLink = screen.getByRole('link', { name: /auth.verification.error.backToSignIn/i });
    const supportLink = screen.getByRole('link', { name: /auth.verification.contactSupport/i });

    [backButton, resendButton, signInLink, supportLink].forEach((element) => {
      expect(element).toHaveClass('focus:outline-none');
      // Should have either focus:ring-2 or focus:ring-4
      const hasFocusRing = element.className.includes('focus:ring-2') || element.className.includes('focus:ring-4');
      expect(hasFocusRing).toBe(true);
    });
  });

  it('should have focus ring offset for better visibility', () => {
    render(<VerifyEmailPage />);

    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    
    // Check for focus ring offset class
    expect(resendButton.className).toMatch(/focus:ring-offset/);
  });

  it('should have focus indicators on dismiss buttons', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Test error' }),
    });
    global.fetch = mockFetch;

    const user = userEvent.setup();
    render(<VerifyEmailPage />);

    // Trigger an error to show dismiss button
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    await user.click(resendButton);

    // Find dismiss button
    const dismissButton = await screen.findByLabelText(/common.dismiss/i);
    
    expect(dismissButton).toHaveClass('focus:outline-none');
    expect(dismissButton).toHaveClass('focus:ring-2');
  });

  it('should have consistent focus indicators across all pages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          <VerifyEmailPage />,
          <VerifyEmailSuccessPage />,
          <VerifyEmailErrorPage />
        ),
        async (component) => {
          const { container } = render(component);
          
          // Get all interactive elements
          const buttons = container.querySelectorAll('button');
          const links = container.querySelectorAll('a');
          
          [...buttons, ...links].forEach((element) => {
            // Each interactive element should have focus styles
            const classes = element.className;
            const hasFocusStyles = 
              classes.includes('focus:outline-none') &&
              (classes.includes('focus:ring-2') || classes.includes('focus:ring-4'));
            
            expect(hasFocusStyles).toBe(true);
          });
        }
      ),
      { numRuns: 3 }
    );
  });

  it('should not have focus indicators on non-interactive elements', () => {
    const { container } = render(<VerifyEmailPage />);
    
    // Get all divs and spans (non-interactive elements)
    const divs = container.querySelectorAll('div');
    const spans = container.querySelectorAll('span');
    
    [...divs, ...spans].forEach((element) => {
      // Non-interactive elements should not have tabindex or focus styles
      const tabindex = element.getAttribute('tabindex');
      const hasFocusStyles = element.className.includes('focus:ring');
      
      // If it has focus styles, it should be focusable (have tabindex)
      if (hasFocusStyles) {
        expect(tabindex).not.toBeNull();
      }
    });
  });
});

describe('Integration: All Accessibility Properties Together', () => {
  /**
   * Integration test to verify all accessibility properties work together
   */

  it('should pass all accessibility checks on pending page', async () => {
    const { container } = render(<VerifyEmailPage />);
    
    // Run comprehensive accessibility audit
    const results = await axe(container);
    
    // Should have no violations
    expect(results.violations).toEqual([]);
    
    // Should have proper structure
    expect(screen.getByLabelText(/auth.verification.resendEmail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth.buttons.signOut/i)).toBeInTheDocument();
  });

  it('should pass all accessibility checks on success page', async () => {
    const { container } = render(<VerifyEmailSuccessPage />);
    
    const results = await axe(container);
    expect(results.violations).toEqual([]);
    
    expect(screen.getByLabelText(/auth.verification.continueToDashboard/i)).toBeInTheDocument();
  });

  it('should pass all accessibility checks on error page', async () => {
    const { container } = render(<VerifyEmailErrorPage />);
    
    const results = await axe(container);
    expect(results.violations).toEqual([]);
    
    expect(screen.getByLabelText(/auth.verification.resendEmail/i)).toBeInTheDocument();
  });

  it('should maintain accessibility during user interactions', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
    global.fetch = mockFetch;

    const user = userEvent.setup();
    const { container } = render(<VerifyEmailPage />);

    // Initial state should be accessible
    let results = await axe(container);
    expect(results.violations).toEqual([]);

    // Trigger error
    const resendButton = screen.getByLabelText(/auth.verification.resendEmail/i);
    await user.click(resendButton);
    await screen.findByRole('alert');

    // Error state should be accessible
    results = await axe(container);
    expect(results.violations).toEqual([]);

    // Dismiss error
    const dismissButton = screen.getByLabelText(/common.dismiss/i);
    await user.click(dismissButton);

    // Trigger success
    await user.click(resendButton);
    await screen.findByRole('status');

    // Success state should be accessible
    results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
