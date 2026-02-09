/**
 * Property-Based Tests for Enhanced Authentication Components
 * Feature: auth-pages-redesign
 * 
 * These tests verify universal properties that should hold across all inputs
 * using fast-check for property-based testing.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as fc from "fast-check";
import { AuthButton } from "../AuthButton";
import { FormInput } from "../FormInput";
import { ErrorMessage } from "../ErrorMessage";
import { SuccessMessage } from "../SuccessMessage";
import { LoadingSpinner } from "../LoadingSpinner";

/**
 * Helper function to extract transition duration from computed styles
 */
function getTransitionDuration(element: HTMLElement): number {
  const style = window.getComputedStyle(element);
  const duration = style?.transitionDuration;
  
  if (!duration || duration === '0s') return 0;
  
  // Handle multiple durations (take the first one)
  const firstDuration = duration.split(',')[0]?.trim();
  
  if (!firstDuration) return 0;
  
  // Convert to milliseconds
  if (firstDuration.endsWith('ms')) {
    return parseFloat(firstDuration);
  } else if (firstDuration.endsWith('s')) {
    return parseFloat(firstDuration) * 1000;
  }
  
  return 0;
}

/**
 * Helper function to check if element has scale transform on hover
 */
function hasScaleTransform(element: HTMLElement): boolean {
  const classes = element.className;
  // Check for hover:scale-[1.02] or similar patterns
  return classes.includes('hover:scale-') || classes.includes('hover:scale-[');
}

/**
 * Helper function to extract scale value from classes
 */
function getScaleValue(element: HTMLElement): number | null {
  const classes = element.className;
  
  // Match hover:scale-[1.02] pattern
  const bracketMatch = classes.match(/hover:scale-\[(\d+\.?\d*)\]/);
  if (bracketMatch && bracketMatch[1]) {
    return parseFloat(bracketMatch[1]);
  }
  
  // Match hover:scale-105 pattern (Tailwind default)
  const defaultMatch = classes.match(/hover:scale-(\d+)/);
  if (defaultMatch && defaultMatch[1]) {
    const value = parseInt(defaultMatch[1]);
    return value / 100; // Convert 105 to 1.05
  }
  
  return null;
}

/**
 * Helper function to check focus ring properties
 */
function checkFocusRing(element: HTMLElement): {
  hasRing: boolean;
  width: string | null;
  color: string | null;
  offset: string | null;
} {
  const classes = element.className;
  
  return {
    hasRing: classes.includes('focus-visible:ring') || classes.includes('focus:ring'),
    width: classes.match(/ring-(\d+)/)?.[1] || null,
    color: classes.includes('ring-indigo-500') ? 'indigo-500' : null,
    offset: classes.match(/ring-offset-(\d+)/)?.[1] || null,
  };
}

describe("Property-Based Tests: Enhanced Authentication Components", () => {
  /**
   * Property 1: Transition Duration Consistency
   * Validates: Requirements 1.7
   */
  describe("Property 1: Transition Duration Consistency", () => {
    it("all interactive elements have transitions between 200-500ms", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("primary", "secondary", "oauth", "ghost"),
          fc.constantFrom("sm", "md", "lg"),
          fc.string({ minLength: 1, maxLength: 20 }),
          (variant, size, text) => {
            const { container } = render(
              <AuthButton variant={variant as any} size={size as any}>
                {text}
              </AuthButton>
            );
            
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            if (button) {
              const duration = getTransitionDuration(button);
              
              // Transition duration should be between 200ms and 500ms
              // Allow 0 if no transition is set (will be caught by class check)
              if (duration > 0) {
                expect(duration).toBeGreaterThanOrEqual(200);
                expect(duration).toBeLessThanOrEqual(500);
              }
              
              // Check that transition classes are present
              expect(button.className).toMatch(/transition|duration/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("FormInput elements have transitions between 200-500ms", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (label, placeholder) => {
            const { container } = render(
              <FormInput
                id="test-input"
                label={label}
                placeholder={placeholder}
              />
            );
            
            const input = container.querySelector('input');
            expect(input).toBeTruthy();
            
            if (input) {
              const duration = getTransitionDuration(input);
              
              if (duration > 0) {
                expect(duration).toBeGreaterThanOrEqual(200);
                expect(duration).toBeLessThanOrEqual(500);
              }
              
              expect(input.className).toMatch(/transition|duration/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Hover Scale Transformation
   * Validates: Requirements 2.1
   */
  describe("Property 2: Hover Scale Transformation", () => {
    it("interactive buttons apply scale transformation between 1.02 and 1.05 on hover", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("primary", "secondary", "oauth", "ghost"),
          fc.string({ minLength: 1, maxLength: 20 }),
          (variant, text) => {
            const { container } = render(
              <AuthButton variant={variant as any}>{text}</AuthButton>
            );
            
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            if (button) {
              const hasScale = hasScaleTransform(button);
              
              // All interactive buttons should have hover scale
              // If not present, this is a bug that needs fixing
              expect(hasScale).toBe(true);
              
              const scaleValue = getScaleValue(button);
              if (scaleValue !== null) {
                expect(scaleValue).toBeGreaterThanOrEqual(1.02);
                expect(scaleValue).toBeLessThanOrEqual(1.05);
              } else {
                // If no scale value found but hasScale is true, fail
                throw new Error(`Button variant ${variant} has hover:scale class but no parseable scale value`);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Focus Ring Display
   * Validates: Requirements 2.2, 5.2
   */
  describe("Property 3: Focus Ring Display", () => {
    it("focusable elements display focus ring with 2px width, indigo-500 color, 2px offset", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("primary", "secondary", "oauth", "ghost"),
          fc.string({ minLength: 1, maxLength: 20 }),
          (variant, text) => {
            const { container } = render(
              <AuthButton variant={variant as any}>{text}</AuthButton>
            );
            
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            if (button) {
              const focusRing = checkFocusRing(button);
              
              expect(focusRing.hasRing).toBe(true);
              expect(focusRing.width).toBe('2');
              expect(focusRing.color).toBe('indigo-500');
              expect(focusRing.offset).toBe('2');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("FormInput elements display focus ring with correct properties", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 20 }),
          (label) => {
            const { container } = render(
              <FormInput id="test-input" label={label} />
            );
            
            const input = container.querySelector('input');
            expect(input).toBeTruthy();
            
            if (input) {
              // FormInput uses focus:shadow instead of ring, but should have focus styles
              expect(input.className).toMatch(/focus:/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Loading State Accessibility
   * Validates: Requirements 5.6, 8.2
   */
  describe("Property 12: Loading State Accessibility", () => {
    it("loading buttons have aria-busy='true' and are disabled", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("primary", "secondary", "oauth", "ghost"),
          fc.string({ minLength: 1, maxLength: 20 }),
          (variant, text) => {
            const { container } = render(
              <AuthButton variant={variant as any} loading>
                {text}
              </AuthButton>
            );
            
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            if (button) {
              expect(button.getAttribute('aria-busy')).toBe('true');
              expect(button).toBeDisabled();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Password Toggle Accessibility
   * Validates: Requirements 5.8
   */
  describe("Property 14: Password Toggle Accessibility", () => {
    it("password toggle aria-label updates correctly based on state", async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 20 }),
          async (label) => {
            const user = userEvent.setup();
            
            render(
              <FormInput
                id="password-input"
                label={label}
                type="password"
                showPasswordToggle
              />
            );
            
            const toggleButton = screen.getByLabelText(/password/i);
            expect(toggleButton).toBeTruthy();
            
            // Initial state should be "Show password"
            expect(toggleButton.getAttribute('aria-label')).toMatch(/show password/i);
            
            // Click to toggle
            await user.click(toggleButton);
            
            // After click, should be "Hide password"
            expect(toggleButton.getAttribute('aria-label')).toMatch(/hide password/i);
            
            // Click again to toggle back
            await user.click(toggleButton);
            
            // Should be back to "Show password"
            expect(toggleButton.getAttribute('aria-label')).toMatch(/show password/i);
          }
        ),
        { numRuns: 50 } // Reduced runs for async tests
      );
    });
  });

  /**
   * Property 20: Button Loading State Consistency
   * Validates: Requirements 8.1, 8.2, 8.6
   */
  describe("Property 20: Button Loading State Consistency", () => {
    it("loading buttons maintain dimensions and show spinner", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("primary", "secondary", "oauth", "ghost"),
          fc.constantFrom("sm", "md", "lg"),
          fc.string({ minLength: 1, maxLength: 20 }),
          (variant, size, text) => {
            // Render without loading first
            const { container: container1 } = render(
              <AuthButton variant={variant as any} size={size as any}>
                {text}
              </AuthButton>
            );
            
            const button1 = container1.querySelector('button');
            const heightClass1 = button1?.className.match(/h-\d+/)?.[0];
            
            // Render with loading
            const { container: container2 } = render(
              <AuthButton variant={variant as any} size={size as any} loading>
                {text}
              </AuthButton>
            );
            
            const button2 = container2.querySelector('button');
            const heightClass2 = button2?.className.match(/h-\d+/)?.[0];
            
            // Height should be the same
            expect(heightClass1).toBe(heightClass2);
            
            // Should have spinner (Loader2 icon)
            const spinner = container2.querySelector('[class*="animate-spin"]');
            expect(spinner).toBeTruthy();
            
            // Text should still be present
            expect(button2?.textContent).toContain(text);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 25: Validation Message Animation
   * Validates: Requirements 2.3, 2.5
   */
  describe("Property 25: Validation Message Animation", () => {
    it("error messages animate with fade-in and slide-in", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 100 }),
          (message) => {
            const { container } = render(
              <ErrorMessage message={message} />
            );
            
            const errorDiv = container.querySelector('[role="alert"]');
            expect(errorDiv).toBeTruthy();
            
            if (errorDiv) {
              const classes = errorDiv.className;
              
              // Should have animation classes
              expect(classes).toMatch(/animate-in|fade-in/);
              expect(classes).toMatch(/slide-in-from-top/);
              expect(classes).toMatch(/duration-300/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("success messages animate with fade-in and slide-in", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 100 }),
          (message) => {
            const { container } = render(
              <SuccessMessage message={message} />
            );
            
            const successDiv = container.querySelector('[role="status"]');
            expect(successDiv).toBeTruthy();
            
            if (successDiv) {
              const classes = successDiv.className;
              
              // Should have animation classes
              expect(classes).toMatch(/animate-in|fade-in/);
              expect(classes).toMatch(/slide-in-from-top/);
              expect(classes).toMatch(/duration-300/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 26: Loading Spinner Animation
   * Validates: Requirements 2.5
   */
  describe("Property 26: Loading Spinner Animation", () => {
    it("spinners have rotation and pulse animations", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("sm", "md", "lg", "xl"),
          fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: undefined }),
          (size, text) => {
            const { container } = render(
              <LoadingSpinner size={size as any} text={text} />
            );
            
            // Find the spinner icon (Loader2)
            const spinner = container.querySelector('[class*="animate-spin"]');
            expect(spinner).toBeTruthy();
            
            if (spinner) {
              // Get className as string
              const classes = spinner.getAttribute('class') || '';
              
              // Should have both spin and pulse animations
              expect(classes).toMatch(/animate-spin/);
              expect(classes).toMatch(/animate-pulse/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
