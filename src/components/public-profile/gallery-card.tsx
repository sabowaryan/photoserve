/**
 * Gallery Card Component
 * 
 * Individual gallery card with image, title, date, image count, and "New" badge
 * 
 * Requirements:
 * - 3.5: Display "New" badge for galleries < 7 days old
 * - 3.6: Display cover image, title, creation date, and image count
 */

import { ImageIcon, Calendar, Lock } from 'lucide-react';

interface GalleryCardProps {
  slug: string;
  title: string;
  coverImageUrl: string;
  imageCount: number;
  createdAt: Date;
  isNew: boolean;
  isPasswordProtected: boolean;
}

export function GalleryCard({
  slug,
  title,
  coverImageUrl,
  imageCount,
  createdAt,
  isNew,
  isPasswordProtected,
}: GalleryCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <a
      href={`/g/${slug}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden h-full flex flex-col focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 gallery-card gallery-card-hover"
      aria-label={`Voir la galerie ${title} contenant ${imageCount} ${imageCount === 1 ? 'photo' : 'photos'}`}
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`Image de couverture de la galerie ${title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300" aria-label="Aucune image de couverture">
            <ImageIcon size={48} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg"
              role="status"
              aria-label="Nouvelle galerie"
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
              Nouveau
            </span>
          )}
          {isPasswordProtected && (
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold rounded-lg border border-white/20"
              role="status"
              aria-label="Galerie protégée par mot de passe"
            >
              <Lock size={12} aria-hidden="true" />
              Protégé
            </span>
          )}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug text-base profile-text-primary">
          {title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 mt-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg profile-badge">
            <ImageIcon size={12} className="text-indigo-600" aria-hidden="true" />
            <span className="text-xs font-bold text-indigo-700">
              {imageCount} {imageCount === 1 ? 'photo' : 'photos'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg profile-badge">
            <Calendar size={12} className="text-slate-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-600">
              {formatDate(createdAt)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
