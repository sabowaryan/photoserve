/**
 * Testimonial Card Component
 * 
 * Individual testimonial card displaying client feedback
 * 
 * Requirements:
 * - 5.3: Display client name, rating (stars), text, and date
 * - 5.4: Display client photo if available
 * - 5.6: Display rating as stars (1-5)
 */

import type { Testimonial } from '@/types/public-profile';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

/**
 * Renders a star icon (filled or empty)
 */
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

/**
 * Renders a rating as stars
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${rating} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= rating} />
      ))}
    </div>
  );
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { clientName, clientPhoto, rating, text, date } = testimonial;

  // Format the date
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="bg-card rounded-lg p-6 shadow-sm h-full flex flex-col">
      {/* Client Info */}
      <div className="flex items-center gap-4 mb-4">
        {/* Client Photo */}
        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0" role="img" aria-label={`Photo de ${clientName}`}>
          {clientPhoto ? (
            <img
              src={clientPhoto}
              alt={`Photo de ${clientName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-lg font-semibold text-muted-foreground"
              aria-label={`Initiale de ${clientName}`}
            >
              {clientName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Client Name and Rating */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{clientName}</h3>
          <StarRating rating={rating} />
        </div>
      </div>

      {/* Testimonial Text */}
      <blockquote className="flex-1 text-muted-foreground mb-4 italic">
        "{text}"
      </blockquote>

      {/* Date */}
      <time className="text-sm text-muted-foreground" dateTime={date}>
        {formattedDate}
      </time>
    </article>
  );
}
