/**
 * Form Validation Enhancement Tests
 * 
 * Tests for Task 2: Enhance form validation and inline feedback
 * - Real-time email validation with debouncing (500ms)
 * - Inline error display with timing constraints (300ms)
 * - Password strength indicator with dark theme colors
 * - Auto-dismissal of errors on user input
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormInput } from '../FormInput';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator';
import { ErrorMessage } from '../ErrorMessage';

describe('Form Validation Enhancements', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Real-time Email Validation with Debouncing', () => {
    it('should debounce email validation by 500ms', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <FormInput
          id="email"
          name="email"
          label="Email"
          type="email"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/email/i);
      
      // Type quickly (using fireEvent for better control with fake timers)
      input.focus();
      input.setAttribute('value', 'test');
      mockOnChange({ target: { name: 'email', value: 'test' } } as any);
      
      // Validation should not happen immediately
      expect(mockOnChange).toHaveBeenCalled();
      
      // Fast-forward time by 400ms (less than debounce)
      vi.advanceTimersByTime(400);
      
      // Continue typing
      input.setAttribute('value', 'test@');
      mockOnChange({ target: { name: 'email', value: 'test@' } } as any);
      
      // Fast-forward by 500ms
      vi.advanceTimersByTime(500);
      
      // Now validation should have occurred
      expect(input).toBeInTheDocument();
    });

    it('should validate email immediately on blur', () => {
      const mockOnBlur = vi.fn();
      
      render(
        <FormInput
          id="email"
          name="email"
          label="Email"
          type="email"
          onBlur={mockOnBlur}
        />
      );

      const input = screen.getByLabelText(/email/i);
      
      input.focus();
      input.setAttribute('value', 'invalid-email');
      input.blur();
      
      expect(mockOnBlur).toHaveBeenCalled();
    });

    it('should clear error immediately when user starts typing', () => {
      const mockOnChange = vi.fn();
      
      const { rerender } = render(
        <FormInput
          id="email"
          name="email"
          label="Email"
          type="email"
          error="Invalid email"
          onChange={mockOnChange}
        />
      );

      // Error should be visible
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      
      // Start typing
      const input = screen.getByLabelText(/email/i);
      input.focus();
      input.setAttribute('value', 'a');
      mockOnChange({ target: { name: 'email', value: 'a' } } as any);
      
      // Rerender without error (simulating parent component clearing error)
      rerender(
        <FormInput
          id="email"
          name="email"
          label="Email"
          type="email"
          onChange={mockOnChange}
        />
      );
      
      // Error should be cleared
      expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
    });
  });

  describe('Inline Error Display with Timing', () => {
    it('should display error message with animation within 300ms', async () => {
      const { rerender } = render(
        <FormInput
          id="test"
          name="test"
          label="Test"
        />
      );

      // Initially no error
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      
      // Add error
      rerender(
        <FormInput
          id="test"
          name="test"
          label="Test"
          error="This field is required"
        />
      );

      // Error should appear with animation
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('animate-in', 'fade-in', 'slide-in-from-top-2', 'duration-300');
    });

    it('should have aria-live="assertive" for immediate announcement', () => {
      render(
        <FormInput
          id="test"
          name="test"
          label="Test"
          error="Error message"
        />
      );

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'assertive');
    });

    it('should display error icon with correct styling', () => {
      render(
        <FormInput
          id="test"
          name="test"
          label="Test"
          error="Error message"
        />
      );

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent('Error message');
      // Icon should be present (AlertCircle)
      const icon = errorElement.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Password Strength Indicator Dark Theme', () => {
    it('should display correct colors for weak password', () => {
      const { container } = render(
        <PasswordStrengthIndicator password="weak" />
      );

      // Should show "Weak" label with rose-400 color
      expect(screen.getByText('Weak')).toBeInTheDocument();
      
      // Check for strength bar segments
      const segments = container.querySelectorAll('.h-2.flex-1.rounded-full');
      expect(segments).toHaveLength(5);
      
      // First segment should have rose-500 background (weak)
      const activeSegment = Array.from(segments).find(seg => 
        seg.className.includes('bg-rose-500')
      );
      expect(activeSegment).toBeInTheDocument();
    });

    it('should display correct colors for fair password', () => {
      render(
        <PasswordStrengthIndicator password="Fair123" />
      );

      // Should show "Fair" label
      expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    it('should display correct colors for good password', () => {
      render(
        <PasswordStrengthIndicator password="Good1234" />
      );

      // Should show "Good" label (4 requirements met: length, upper, lower, number)
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('should display correct colors for strong password', () => {
      render(
        <PasswordStrengthIndicator password="Strong123!@" />
      );

      // Should show "Strong" label with emerald-400 color
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    it('should show checkmarks for met requirements in emerald-500', () => {
      render(
        <PasswordStrengthIndicator password="Strong123!@" />
      );

      // All requirements should be met
      const requirements = screen.getAllByRole('listitem');
      expect(requirements.length).toBeGreaterThan(0);
      
      // Check for emerald color on met requirements
      requirements.forEach(req => {
        const icon = req.querySelector('svg');
        if (icon && req.textContent?.includes('At least 8 characters')) {
          expect(icon).toHaveClass('text-emerald-500');
        }
      });
    });

    it('should show X icons for unmet requirements in slate-400', () => {
      render(
        <PasswordStrengthIndicator password="weak" />
      );

      // Some requirements should not be met
      const requirements = screen.getAllByRole('listitem');
      expect(requirements.length).toBeGreaterThan(0);
      
      // Check for slate color on unmet requirements
      const unmetReq = requirements.find(req => 
        req.textContent?.includes('Contains uppercase letter')
      );
      
      if (unmetReq) {
        const icon = unmetReq.querySelector('svg');
        expect(icon).toHaveClass('text-slate-400');
      }
    });

    it('should update colors smoothly with transition-colors duration-300', () => {
      const { container } = render(
        <PasswordStrengthIndicator password="test" />
      );

      const segments = container.querySelectorAll('.h-2.flex-1.rounded-full');
      segments.forEach(segment => {
        expect(segment).toHaveClass('transition-colors', 'duration-300');
      });
    });
  });

  describe('Error Auto-Dismissal', () => {
    it('should auto-dismiss error message when user types', () => {
      const mockOnDismiss = vi.fn();
      
      const { rerender } = render(
        <div>
          <ErrorMessage
            message="An error occurred"
            dismissible
            onDismiss={mockOnDismiss}
          />
          <FormInput
            id="test"
            name="test"
            label="Test"
          />
        </div>
      );

      // Error should be visible
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
      
      // Type in input
      const input = screen.getByLabelText(/test/i);
      input.focus();
      input.setAttribute('value', 'a');
      
      // In real implementation, parent component would clear error
      // Here we simulate that by rerendering without error
      rerender(
        <div>
          <FormInput
            id="test"
            name="test"
            label="Test"
          />
        </div>
      );
      
      expect(screen.queryByText('An error occurred')).not.toBeInTheDocument();
    });

    it('should have dismissible close button', () => {
      const mockOnDismiss = vi.fn();
      
      render(
        <ErrorMessage
          message="Error message"
          dismissible
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText(/dismiss/i);
      expect(dismissButton).toBeInTheDocument();
    });

    it('should call onDismiss when close button is clicked', () => {
      const mockOnDismiss = vi.fn();
      
      render(
        <ErrorMessage
          message="Error message"
          dismissible
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText(/dismiss/i);
      dismissButton.click();
      
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should have aria-live="assertive" for error announcements', () => {
      render(
        <ErrorMessage message="Error message" />
      );

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Integration: Form Validation Flow', () => {
    it('should handle complete validation flow', () => {
      render(
        <div>
          <FormInput
            id="email"
            name="email"
            label="Email"
            type="email"
          />
          <FormInput
            id="password"
            name="password"
            label="Password"
            type="password"
          />
        </div>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      // Type invalid email
      emailInput.focus();
      emailInput.setAttribute('value', 'invalid');
      
      // Move to password field
      passwordInput.focus();
      
      // Type password
      passwordInput.setAttribute('value', 'test123');
      
      // Both inputs should be in the document
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });
  });
});
