'use client';

/**
 * Top Images Component
 * Displays the most viewed images in the gallery
 * 
 * @module app/(dashboard)/dashboard/gallery/[id]/analytics/components/top-images
 * Phase 3: Event tracking analytics
 */
import { Eye, ImageIcon } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface TopImagesProps {
  data: Array<{ imageId: string; views: number }>;
  images?: Array<{ id: string; cloudinary_url: string }>;
}

export function TopImages({ data, images = [] }: TopImagesProps) {
  const { t } = useTranslation();
  
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
          <ImageIcon size={20} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-400">{t('admin.galleryAnalytics.topImages.noData')}</p>
        <p className="text-[10px] text-slate-400 mt-1">{t('admin.galleryAnalytics.topImages.photosWillAppear')}</p>
      </div>
    );
  }

  // Create a map of image IDs to URLs
  const imageMap = new Map(images.map(img => [img.id, img.cloudinary_url]));
  const maxViews = data[0]?.views || 1;

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((item, index) => {
        const imageUrl = imageMap.get(item.imageId);
        const percentage = (item.views / maxViews) * 100;
        
        return (
          <div 
            key={item.imageId} 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors group"
          >
            {/* Rank Badge */}
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
              index === 0 
                ? 'bg-amber-100 text-amber-600' 
                : index === 1 
                  ? 'bg-slate-200 text-slate-600'
                  : index === 2
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-slate-100 text-slate-500'
            }`}>
              {index + 1}
            </div>
            
            {/* Image thumbnail */}
            {imageUrl ? (
              <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shadow-sm">
                <img 
                  src={imageUrl} 
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Eye className="w-4 h-4 text-slate-300" />
              </div>
            )}
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-slate-700">
                  Photo {index + 1}
                </p>
                <p className="text-xs font-black text-slate-900">
                  {item.views}
                </p>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    index === 0 
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500' 
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
