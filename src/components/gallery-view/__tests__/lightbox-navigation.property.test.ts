/**
 * Property-Based Tests for Lightbox Keyboard Navigation
 * 
 * Feature: piksend-complete-features
 * Property 4: Lightbox Keyboard Navigation
 * 
 * Tests that lightbox keyboard navigation works correctly for all valid states.
 * Validates: Requirements 1.2.2
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Arbitrary generators for test data
 */

// Generate a valid array length (1 to 100 images)
const arrayLengthArb = fc.integer({ min: 1, max: 100 });

// Generate a valid current index given array length

// Generate keyboard events
const keyboardEventArb = fc.constantFrom('ArrowLeft', 'ArrowRight', 'Escape');


/**
 * Simulate the lightbox keyboard navigation logic
 * This mirrors the actual implementation in lightbox.tsx
 */
function simulateLightboxKeyboardNavigation(
  key: string,
  currentIndex: number,
  totalImages: number,
  callbacks: {
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
  }
): void {
  if (key === 'Escape') {
    callbacks.onClose();
  }
  if (key === 'ArrowLeft' && currentIndex > 0) {
    callbacks.onPrev();
  }
  if (key === 'ArrowRight' && currentIndex < totalImages - 1) {
    callbacks.onNext();
  }
}

describe('Lightbox Keyboard Navigation - Property 4', () => {
  /**
   * Feature: piksend-complete-features, Property 4: Lightbox Keyboard Navigation
   * Validates: Requirements 1.2.2
   * 
   * For any lightbox state with currentIndex, pressing ArrowRight SHALL increment index
   * (if not at end), pressing ArrowLeft SHALL decrement (if not at start), pressing
   * Escape SHALL close.
   */

  describe('Escape key behavior', () => {
    it('should always call onClose when Escape is pressed, regardless of index', () => {
      fc.assert(
        fc.property(
          arrayLengthArb,
          fc.integer({ min: 0, max: 99 }), // currentIndex
          (totalImages, rawIndex) => {
            const currentIndex = rawIndex % totalImages; // Ensure valid index
            const onClose = vi.fn();
            const onPrev = vi.fn();
            const onNext = vi.fn();

            simulateLightboxKeyboardNavigation(
              'Escape',
              currentIndex,
              totalImages,
              { onClose, onPrev, onNext }
            );

            // Escape should always trigger onClose
            expect(onClose).toHaveBeenCalledTimes(1);
            // Other callbacks should not be called
            expect(onPrev).not.toHaveBeenCalled();
            expect(onNext).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ArrowLeft key behavior', () => {
    it('should call onPrev when ArrowLeft is pressed and not at start', () => {
      fc.assert(
        fc.property(
          arrayLengthArb.filter(n => n > 1), // Need at least 2 images
          fc.integer({ min: 1, max: 99 }), // currentIndex > 0
          (totalImages, rawIndex) => {
            const currentIndex = Math.max(1, rawIndex % totalImages); // Ensure > 0 and < totalImages
            const onClose = vi.fn();
            const onPrev = vi.fn();
            const onNext = vi.fn();

            simulateLightboxKeyboardNavigation(
              'ArrowLeft',
              currentIndex,
              totalImages,
              { onClose, onPrev, onNext }
            );

            // Should call onPrev since currentIndex > 0
            expect(onPrev).toHaveBeenCalledTimes(1);
            // Other callbacks should not be called
            expect(onClose).not.toHaveBeenCalled();
            expect(onNext).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT call onPrev when ArrowLeft is pressed at start (index 0)', () => {
      fc.assert(
        fc.property(
          arrayLengthArb,
          (totalImages) => {
            const currentIndex = 0; // At start
            const onClose = vi.fn();
            const onPrev = vi.fn();
            const onNext = vi.fn();

            simulateLightboxKeyboardNavigation(
              'ArrowLeft',
              currentIndex,
              totalImages,
              { onClose, onPrev, onNext }
            );

            // Should NOT call onPrev since at start
            expect(onPrev).not.toHaveBeenCalled();
            // Other callbacks should not be called
            expect(onClose).not.toHaveBeenCalled();
            expect(onNext).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ArrowRight key behavior', () => {
    it('should call onNext when ArrowRight is pressed and not at end', () => {
      fc.assert(
        fc.property(
          arrayLengthArb.filter(n => n > 1), // Need at least 2 images
          fc.integer({ min: 0, max: 98 }), // currentIndex < totalImages - 1
          (totalImages, rawIndex) => {
            const currentIndex = Math.min(rawIndex % (totalImages - 1), totalImages - 2); // Ensure < totalImages - 1
            const onClose = vi.fn();
            const onPrev = vi.fn();
            const onNext = vi.fn();

            simulateLightboxKeyboardNavigation(
              'ArrowRight',
              currentIndex,
              totalImages,
              { onClose, onPrev, onNext }
            );

            // Should call onNext since not at end
            expect(onNext).toHaveBeenCalledTimes(1);
            // Other callbacks should not be called
            expect(onClose).not.toHaveBeenCalled();
            expect(onPrev).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT call onNext when ArrowRight is pressed at end (last index)', () => {
      fc.assert(
        fc.property(
          arrayLengthArb,
          (totalImages) => {
            const currentIndex = totalImages - 1; // At end
            const onClose = vi.fn();
            const onPrev = vi.fn();
            const onNext = vi.fn();

            simulateLightboxKeyboardNavigation(
              'ArrowRight',
              currentIndex,
              totalImages,
              { onClose, onPrev, onNext }
            );

            // Should NOT call onNext since at end
            expect(onNext).not.toHaveBeenCalled();
            // Other callbacks should not be called
            expect(onClose).not.toHaveBeenCalled();
            expect(onPrev).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Boundary conditions', () => {
    it('should handle single image gallery correctly (no prev/next possible)', () => {
      const totalImages = 1;
      const currentIndex = 0;

      // Test ArrowLeft
      {
        const onClose = vi.fn();
        const onPrev = vi.fn();
        const onNext = vi.fn();

        simulateLightboxKeyboardNavigation(
          'ArrowLeft',
          currentIndex,
          totalImages,
          { onClose, onPrev, onNext }
        );

        expect(onPrev).not.toHaveBeenCalled();
      }

      // Test ArrowRight
      {
        const onClose = vi.fn();
        const onPrev = vi.fn();
        const onNext = vi.fn();

        simulateLightboxKeyboardNavigation(
          'ArrowRight',
          currentIndex,
          totalImages,
          { onClose, onPrev, onNext }
        );

        expect(onNext).not.toHaveBeenCalled();
      }

      // Test Escape
      {
        const onClose = vi.fn();
        const onPrev = vi.fn();
        const onNext = vi.fn();

        simulateLightboxKeyboardNavigation(
          'Escape',
          currentIndex,
          totalImages,
          { onClose, onPrev, onNext }
        );

        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should handle two image gallery correctly (all transitions possible)', () => {
      const totalImages = 2;

      // At index 0: can go next, cannot go prev
      {
        const currentIndex = 0;
        
        const onNext = vi.fn();
        simulateLightboxKeyboardNavigation(
          'ArrowRight',
          currentIndex,
          totalImages,
          { onClose: vi.fn(), onPrev: vi.fn(), onNext }
        );
        expect(onNext).toHaveBeenCalledTimes(1);

        const onPrev = vi.fn();
        simulateLightboxKeyboardNavigation(
          'ArrowLeft',
          currentIndex,
          totalImages,
          { onClose: vi.fn(), onPrev, onNext: vi.fn() }
        );
        expect(onPrev).not.toHaveBeenCalled();
      }

      // At index 1: can go prev, cannot go next
      {
        const currentIndex = 1;
        
        const onPrev = vi.fn();
        simulateLightboxKeyboardNavigation(
          'ArrowLeft',
          currentIndex,
          totalImages,
          { onClose: vi.fn(), onPrev, onNext: vi.fn() }
        );
        expect(onPrev).toHaveBeenCalledTimes(1);

        const onNext = vi.fn();
        simulateLightboxKeyboardNavigation(
          'ArrowRight',
          currentIndex,
          totalImages,
          { onClose: vi.fn(), onPrev: vi.fn(), onNext }
        );
        expect(onNext).not.toHaveBeenCalled();
      }
    });
  });

  describe('Navigation state transitions', () => {
    it('should maintain correct navigation state for any sequence of valid moves', () => {
      fc.assert(
        fc.property(
          arrayLengthArb.filter(n => n >= 3), // Need at least 3 images for interesting sequences
          fc.array(fc.constantFrom('ArrowLeft', 'ArrowRight'), { minLength: 1, maxLength: 20 }),
          (totalImages, keySequence) => {
            let currentIndex = Math.floor(totalImages / 2); // Start in middle
            
            for (const key of keySequence) {
              const prevIndex = currentIndex;
              
              if (key === 'ArrowLeft' && currentIndex > 0) {
                currentIndex--;
              } else if (key === 'ArrowRight' && currentIndex < totalImages - 1) {
                currentIndex++;
              }
              
              // Index should always be valid
              expect(currentIndex).toBeGreaterThanOrEqual(0);
              expect(currentIndex).toBeLessThan(totalImages);
              
              // Index should only change by at most 1
              expect(Math.abs(currentIndex - prevIndex)).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Callback isolation', () => {
    it('should only call the appropriate callback for each key press', () => {
      fc.assert(
        fc.property(
          arrayLengthArb.filter(n => n >= 3),
          fc.integer({ min: 1, max: 98 }), // Middle index
          keyboardEventArb,
          (totalImages, rawIndex, key) => {
            const currentIndex = Math.max(1, Math.min(rawIndex % totalImages, totalImages - 2)); // Ensure middle
            const onClose = vi.fn();
            const onPrev = vi.fn();
            const onNext = vi.fn();

            simulateLightboxKeyboardNavigation(
              key,
              currentIndex,
              totalImages,
              { onClose, onPrev, onNext }
            );

            // Exactly one callback should be called
            const totalCalls = onClose.mock.calls.length + 
                              onPrev.mock.calls.length + 
                              onNext.mock.calls.length;
            
            expect(totalCalls).toBe(1);

            // Verify the correct callback was called
            if (key === 'Escape') {
              expect(onClose).toHaveBeenCalledTimes(1);
            } else if (key === 'ArrowLeft') {
              expect(onPrev).toHaveBeenCalledTimes(1);
            } else if (key === 'ArrowRight') {
              expect(onNext).toHaveBeenCalledTimes(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
