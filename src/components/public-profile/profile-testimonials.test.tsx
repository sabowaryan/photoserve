/**
 * Unit Tests for ProfileTestimonials and TestimonialCard Components
 * 
 * Feature: public-photographer-profile
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ProfileTestimonials } from './profile-testimonials';
import { TestimonialCard } from './testimonial-card';
import type { Testimonial } from '@/types/public-profile';

// Helper function to create a test testimonial
function createTestimonial(overrides?: Partial<Testimonial>): Testimonial {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    clientName: 'Jean Dupont',
    rating: 5,
    text: 'Excellent photographe, très professionnel !',
    date: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

describe('TestimonialCard Component', () => {
  describe('Client information display (Requirements 5.3, 5.4)', () => {
    it('should display client name', () => {
      const testimonial = createTestimonial({ clientName: 'Marie Martin' });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      expect(container.textContent).toContain('Marie Martin');
    });

    it('should display client photo when provided', () => {
      const testimonial = createTestimonial({
        clientPhoto: 'https://example.com/photo.jpg',
      });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      const img = container.querySelector('img[alt="Jean Dupont"]');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('https://example.com/photo.jpg');
    });

    it('should display client initial when no photo provided', () => {
      const testimonial = createTestimonial({
        clientName: 'Alice Bernard',
        clientPhoto: undefined,
      });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      expect(container.textContent).toContain('A');
      const img = container.querySelector('img');
      expect(img).toBeNull();
    });

    it('should handle names with lowercase first letter', () => {
      const testimonial = createTestimonial({
        clientName: 'jean dupont',
        clientPhoto: undefined,
      });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      expect(container.textContent).toContain('J');
    });
  });

  describe('Rating display (Requirement 5.6)', () => {
    it('should display 5 stars for rating 5', () => {
      const testimonial = createTestimonial({ rating: 5 });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      const stars = container.querySelectorAll('svg.text-yellow-400');
      expect(stars.length).toBe(5);
    });

    it('should display 4 filled stars for rating 4', () => {
      const testimonial = createTestimonial({ rating: 4 });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      const filledStars = container.querySelectorAll('svg.text-yellow-400');
      const emptyStars = container.querySelectorAll('svg.text-gray-300');
      expect(filledStars.length).toBe(4);
      expect(emptyStars.length).toBe(1);
    });

    it('should display 3 filled stars for rating 3', () => {
      const testimonial = createTestimonial({ rating: 3 });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      const filledStars = container.querySelectorAll('svg.text-yellow-400');
      const emptyStars = container.querySelectorAll('svg.text-gray-300');
      expect(filledStars.length).toBe(3);
      expect(emptyStars.length).toBe(2);
    });

    it('should display 2 filled stars for rating 2', () => {
      const testimonial = createTestimonial({ rating: 2 });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      const filledStars = container.querySelectorAll('svg.text-yellow-400');
      const emptyStars = container.querySelectorAll('svg.text-gray-300');
      expect(filledStars.length).toBe(2);
      expect(emptyStars.length).toBe(3);
    });

    it('should display 1 filled star for rating 1', () => {
      const testimonial = createTestimonial({ rating: 1 });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      const filledStars = container.querySelectorAll('svg.text-yellow-400');
      const emptyStars = container.querySelectorAll('svg.text-gray-300');
      expect(filledStars.length).toBe(1);
      expect(emptyStars.length).toBe(4);
    });

    it('should have proper ARIA label for rating', () => {
      const testimonial = createTestimonial({ rating: 4 });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      const ratingElement = container.querySelector('[role="img"]');
      expect(ratingElement?.getAttribute('aria-label')).toBe('4 étoiles sur 5');
    });
  });

  describe('Testimonial text display (Requirement 5.3)', () => {
    it('should display testimonial text', () => {
      const testimonial = createTestimonial({
        text: 'Un travail exceptionnel, je recommande vivement !',
      });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      expect(container.textContent).toContain('Un travail exceptionnel, je recommande vivement !');
    });

    it('should display text in blockquote with quotes', () => {
      const testimonial = createTestimonial({
        text: 'Superbe expérience',
      });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeTruthy();
      expect(blockquote?.textContent).toContain('"Superbe expérience"');
    });

    it('should handle long text', () => {
      const longText = 'A'.repeat(200);
      const testimonial = createTestimonial({ text: longText });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      expect(container.textContent).toContain(longText);
    });
  });

  describe('Date display (Requirement 5.3)', () => {
    it('should display formatted date in French', () => {
      const testimonial = createTestimonial({
        date: '2024-01-15T10:00:00Z',
      });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      // French date format: "15 janvier 2024"
      expect(container.textContent).toMatch(/15 janvier 2024/i);
    });

    it('should handle different dates', () => {
      const testimonial = createTestimonial({
        date: '2023-12-25T15:30:00Z',
      });
      const { container } = render(<TestimonialCard testimonial={testimonial} />);
      
      expect(container.textContent).toMatch(/25 décembre 2023/i);
    });
  });
});

describe('ProfileTestimonials Component', () => {
  describe('Carousel display (Requirement 5.1)', () => {
    it('should display testimonials in a carousel', () => {
      const testimonials = [
        createTestimonial({ id: '1', clientName: 'Client 1' }),
        createTestimonial({ id: '2', clientName: 'Client 2' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      expect(container.textContent).toContain('Témoignages');
      expect(container.textContent).toContain('Client 1');
    });

    it('should show navigation buttons when multiple testimonials', () => {
      const testimonials = [
        createTestimonial({ id: '1' }),
        createTestimonial({ id: '2' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const prevButton = container.querySelector('button[aria-label="Témoignage précédent"]');
      const nextButton = container.querySelector('button[aria-label="Témoignage suivant"]');
      
      expect(prevButton).toBeTruthy();
      expect(nextButton).toBeTruthy();
    });

    it('should not show navigation buttons for single testimonial', () => {
      const testimonials = [createTestimonial({ id: '1' })];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const prevButton = container.querySelector('button[aria-label="Témoignage précédent"]');
      const nextButton = container.querySelector('button[aria-label="Témoignage suivant"]');
      
      expect(prevButton).toBeNull();
      expect(nextButton).toBeNull();
    });

    it('should show dot indicators when multiple testimonials', () => {
      const testimonials = [
        createTestimonial({ id: '1' }),
        createTestimonial({ id: '2' }),
        createTestimonial({ id: '3' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const dots = container.querySelectorAll('button[aria-label^="Aller au témoignage"]');
      expect(dots.length).toBe(3);
    });

    it('should not show dot indicators for single testimonial', () => {
      const testimonials = [createTestimonial({ id: '1' })];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const dots = container.querySelectorAll('button[aria-label^="Aller au témoignage"]');
      expect(dots.length).toBe(0);
    });
  });

  describe('Maximum testimonials limit (Requirement 5.2)', () => {
    it('should limit display to 5 testimonials', () => {
      const testimonials = Array.from({ length: 10 }, (_, i) =>
        createTestimonial({ id: `${i}`, clientName: `Client ${i}` })
      );
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const dots = container.querySelectorAll('button[aria-label^="Aller au témoignage"]');
      expect(dots.length).toBe(5);
    });

    it('should display first 5 testimonials when more than 5 provided', () => {
      const testimonials = Array.from({ length: 7 }, (_, i) =>
        createTestimonial({ id: `${i}`, clientName: `Client ${i}` })
      );
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      // Should have exactly 5 dot indicators (one per testimonial displayed)
      const dots = container.querySelectorAll('button[aria-label^="Aller au témoignage"]');
      expect(dots.length).toBe(5);
    });

    it('should display all testimonials when less than 5', () => {
      const testimonials = [
        createTestimonial({ id: '1' }),
        createTestimonial({ id: '2' }),
        createTestimonial({ id: '3' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const dots = container.querySelectorAll('button[aria-label^="Aller au témoignage"]');
      expect(dots.length).toBe(3);
    });
  });

  describe('Navigation functionality (Requirement 5.5)', () => {
    it('should navigate to next testimonial when next button clicked', () => {
      const testimonials = [
        createTestimonial({ id: '1', clientName: 'Client 1' }),
        createTestimonial({ id: '2', clientName: 'Client 2' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const nextButton = container.querySelector('button[aria-label="Témoignage suivant"]');
      if (nextButton) {
        fireEvent.click(nextButton);
        
        // Check that the second dot is now active
        const activeDot = container.querySelector('button[aria-current="true"]');
        expect(activeDot?.getAttribute('aria-label')).toBe('Aller au témoignage 2');
      }
    });

    it('should navigate to previous testimonial when previous button clicked', () => {
      const testimonials = [
        createTestimonial({ id: '1', clientName: 'Client 1' }),
        createTestimonial({ id: '2', clientName: 'Client 2' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      // First go to next
      const nextButton = container.querySelector('button[aria-label="Témoignage suivant"]');
      if (nextButton) {
        fireEvent.click(nextButton);
      }
      
      // Then go back to previous
      const prevButton = container.querySelector('button[aria-label="Témoignage précédent"]');
      if (prevButton) {
        fireEvent.click(prevButton);
        
        // Check that the first dot is now active
        const activeDot = container.querySelector('button[aria-current="true"]');
        expect(activeDot?.getAttribute('aria-label')).toBe('Aller au témoignage 1');
      }
    });

    it('should wrap to last testimonial when clicking previous on first', () => {
      const testimonials = [
        createTestimonial({ id: '1' }),
        createTestimonial({ id: '2' }),
        createTestimonial({ id: '3' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const prevButton = container.querySelector('button[aria-label="Témoignage précédent"]');
      if (prevButton) {
        fireEvent.click(prevButton);
        
        // Should wrap to last testimonial (index 2)
        const activeDot = container.querySelector('button[aria-current="true"]');
        expect(activeDot?.getAttribute('aria-label')).toBe('Aller au témoignage 3');
      }
    });

    it('should wrap to first testimonial when clicking next on last', () => {
      const testimonials = [
        createTestimonial({ id: '1' }),
        createTestimonial({ id: '2' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const nextButton = container.querySelector('button[aria-label="Témoignage suivant"]');
      if (nextButton) {
        // Click twice to get to last, then once more to wrap
        fireEvent.click(nextButton);
        fireEvent.click(nextButton);
        
        // Should wrap to first testimonial
        const activeDot = container.querySelector('button[aria-current="true"]');
        expect(activeDot?.getAttribute('aria-label')).toBe('Aller au témoignage 1');
      }
    });

    it('should navigate to specific testimonial when dot clicked', () => {
      const testimonials = [
        createTestimonial({ id: '1' }),
        createTestimonial({ id: '2' }),
        createTestimonial({ id: '3' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const thirdDot = container.querySelector('button[aria-label="Aller au témoignage 3"]');
      if (thirdDot) {
        fireEvent.click(thirdDot);
        
        // Check that the third dot is now active
        const activeDot = container.querySelector('button[aria-current="true"]');
        expect(activeDot?.getAttribute('aria-label')).toBe('Aller au témoignage 3');
      }
    });
  });

  describe('Conditional rendering', () => {
    it('should render nothing when no testimonials provided', () => {
      const { container } = render(<ProfileTestimonials testimonials={[]} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should render section when testimonials are provided', () => {
      const testimonials = [createTestimonial({ id: '1' })];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      expect(container.firstChild).not.toBeNull();
      expect(container.textContent).toContain('Témoignages');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for navigation buttons', () => {
      const testimonials = [
        createTestimonial({ id: '1' }),
        createTestimonial({ id: '2' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const prevButton = container.querySelector('button[aria-label="Témoignage précédent"]');
      const nextButton = container.querySelector('button[aria-label="Témoignage suivant"]');
      
      expect(prevButton).toBeTruthy();
      expect(nextButton).toBeTruthy();
    });

    it('should have proper ARIA labels for dot indicators', () => {
      const testimonials = [
        createTestimonial({ id: '1' }),
        createTestimonial({ id: '2' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const firstDot = container.querySelector('button[aria-label="Aller au témoignage 1"]');
      const secondDot = container.querySelector('button[aria-label="Aller au témoignage 2"]');
      
      expect(firstDot).toBeTruthy();
      expect(secondDot).toBeTruthy();
    });

    it('should mark current slide with aria-current', () => {
      const testimonials = [
        createTestimonial({ id: '1' }),
        createTestimonial({ id: '2' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const activeDot = container.querySelector('button[aria-current="true"]');
      expect(activeDot).toBeTruthy();
      expect(activeDot?.getAttribute('aria-label')).toBe('Aller au témoignage 1');
    });

    it('should have aria-hidden on decorative icons', () => {
      const testimonials = [
        createTestimonial({ id: '1' }),
        createTestimonial({ id: '2' }),
      ];
      const { container } = render(<ProfileTestimonials testimonials={testimonials} />);
      
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
