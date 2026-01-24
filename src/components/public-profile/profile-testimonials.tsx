/**
 * Profile Testimonials Component
 * 
 * Carousel displaying client testimonials with navigation
 * 
 * Requirements:
 * - 5.1: Display testimonials in a carousel
 * - 5.2: Limit display to 5 testimonials maximum
 * - 5.3: Display client name, rating, text, and date for each testimonial
 * - 5.4: Display client photo if available
 * - 5.5: Implement carousel with previous/next navigation
 */

'use client';

import { useState } from 'react';
import type { Testimonial } from '@/types/public-profile';
import { TestimonialCard } from './testimonial-card';

interface ProfileTestimonialsProps {
  testimonials: Testimonial[];
}

export function ProfileTestimonials({ testimonials }: ProfileTestimonialsProps) {
  // Limit to 5 testimonials maximum (Requirement 5.2)
  const displayTestimonials = testimonials.slice(0, 5);

  // State for current slide
  const [currentIndex, setCurrentIndex] = useState(0);

  // If no testimonials, don't render anything
  if (!displayTestimonials || displayTestimonials.length === 0) {
    return null;
  }

  // Navigation handlers
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? displayTestimonials.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === displayTestimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Only show navigation if there's more than one testimonial
  const showNavigation = displayTestimonials.length > 1;

  return (
    <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white shadow-lg shadow-amber-500/30">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Témoignages</h2>
      </div>

      <div className="relative">
        {/* Carousel Container */}
        <div className="overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {displayTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="w-full flex-shrink-0 px-2"
              >
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        {showNavigation && (
          <>
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white border-2 border-slate-200 shadow-xl hover:bg-slate-50 hover:border-amber-300 transition-all hover:scale-110 flex items-center justify-center z-10"
              aria-label="Témoignage précédent"
            >
              <svg
                className="w-6 h-6 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white border-2 border-slate-200 shadow-xl hover:bg-slate-50 hover:border-amber-300 transition-all hover:scale-110 flex items-center justify-center z-10"
              aria-label="Témoignage suivant"
            >
              <svg
                className="w-6 h-6 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {showNavigation && (
          <div className="flex justify-center gap-2 mt-8">
            {displayTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 w-10 shadow-sm'
                    : 'bg-slate-300 w-2 hover:bg-slate-400'
                }`}
                aria-label={`Aller au témoignage ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
