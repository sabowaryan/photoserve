/**
 * Profile Galleries Component
 * 
 * Responsive grid of galleries
 * 
 * Requirements:
 * - 3.6: Display galleries in a responsive grid
 * - 3.10: Display galleries in a 2-4 column grid based on screen size
 */

import { GalleryCard } from './gallery-card';
import type { PublicGallery } from '@/types/public-profile';

interface ProfileGalleriesProps {
  galleries: PublicGallery[];
}

export function ProfileGalleries({ galleries }: ProfileGalleriesProps) {
  if (!galleries || galleries.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl text-white shadow-lg shadow-violet-500/30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Portfolio</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {galleries.map((gallery) => (
          <GalleryCard
            key={gallery.id}
            slug={gallery.slug}
            title={gallery.title}
            coverImageUrl={gallery.coverImageUrl}
            imageCount={gallery.imageCount}
            createdAt={gallery.createdAt}
            isNew={gallery.isNew}
            isPasswordProtected={gallery.isPasswordProtected}
          />
        ))}
      </div>
    </section>
  );
}
