"use client";

import { useState } from "react";
import { Star, X, Send } from "lucide-react";

interface TestimonialModalProps {
  galleryTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (testimonial: { rating: number; comment: string; authorName: string }) => Promise<void>;
}

/**
 * TestimonialCollector Component - Requirements 8.3.1, 8.3.2
 * 
 * Collects client reviews after gallery interaction with:
 * - 1-5 star rating system
 * - Optional comment field
 * - Optional author name
 * - Displays after download or at end of gallery viewing
 */
export function TestimonialModal({ 
  galleryTitle,
  isOpen, 
  onClose, 
  onSubmit 
}: TestimonialModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStarClick = (value: number) => {
    setRating(value);
    setError(null);
  };

  const handleStarHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - Requirement 8.3.1
    if (rating === 0) {
      setError("Veuillez sélectionner une note");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        authorName: authorName.trim()
      });
      
      // Reset form and close
      setRating(0);
      setComment("");
      setAuthorName("");
      onClose();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      console.error("Failed to submit testimonial:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    setComment("");
    setAuthorName("");
    setError(null);
    onClose();
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Votre avis compte
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {galleryTitle}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Star Rating - Requirement 8.3.1 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Comment évaluez-vous cette galerie ?
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStarClick(value)}
                  onMouseEnter={() => handleStarHover(value)}
                  onMouseLeave={handleStarLeave}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                  aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
                >
                  <Star
                    size={32}
                    className={`transition-colors ${
                      value <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  {rating}/5
                </span>
              )}
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Comment Field - Requirement 8.3.2 */}
          <div>
            <label 
              htmlFor="comment" 
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Commentaire (optionnel)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec cette galerie..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Author Name Field (Optional) */}
          <div>
            <label 
              htmlFor="authorName" 
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Votre nom (optionnel)
            </label>
            <input
              id="authorName"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ex: Marie Dupont"
              maxLength={100}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Passer
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Envoyer
                </>
              )}
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Votre avis aidera le photographe à améliorer ses services
          </p>
        </form>
      </div>
    </div>
  );
}
