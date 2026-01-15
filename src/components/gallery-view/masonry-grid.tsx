"use client";

import Image from "next/image";
import { Maximize2, Download, ImageOff, Sparkles, Heart } from "lucide-react";
import { WatermarkOverlay } from "@/components/gallery/watermark-overlay";
import { useState } from "react";
import type { ImageWithMeta } from "@/types";

// Number of images above the fold that should be prioritized for LCP optimization
const ABOVE_FOLD_THRESHOLD = 4;

interface MasonryGridProps {
  images: ImageWithMeta[];
  onImageClick: (index: number) => void;
  onDownload: (url: string, imageId: string, e: React.MouseEvent) => void;
  onFavorite?: (imageId: string) => void;
  onToggleSelection?: (imageId: string) => void;
  selectedImages?: Set<string>;
  showWatermark?: boolean;
  showFavorites?: boolean;
  favorites?: Set<string>;
}

export function MasonryGrid({ 
  images, 
  onImageClick, 
  onDownload, 
  onFavorite,
  onToggleSelection,
  selectedImages = new Set(),
  showWatermark = false,
  showFavorites = false,
  favorites = new Set()
}: MasonryGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [touchedIndex, setTouchedIndex] = useState<number | null>(null);

  // Handle touch for mobile - single tap shows controls, double tap opens lightbox
  const handleTouch = (index: number, e: React.TouchEvent) => {
    if (touchedIndex === index) {
      // Double tap - open lightbox
      onImageClick(index);
      setTouchedIndex(null);
    } else {
      // Single tap - show controls
      e.preventDefault();
      setTouchedIndex(index);
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setTouchedIndex(null);
      }, 3000);
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 md:py-32 text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-inner mb-4">
          <ImageOff size={36} className="text-slate-300 dark:text-slate-500" />
        </div>
        <p className="font-black text-lg md:text-xl tracking-tight text-slate-400 dark:text-slate-500 mb-1.5">
          Galerie vide
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
          Cette galerie ne contient aucune image.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Gallery grid - Simple square grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
        {images.map((img, index) => {
          const isHovered = hoveredIndex === index;
          const isTouched = touchedIndex === index;
          const isActive = isHovered || isTouched; // Active on hover (desktop) or touch (mobile)
          const isFavorite = favorites.has(img.id);
          const isSelected = selectedImages.has(img.id);
          
          return (
            <div 
              key={img.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={(e) => handleTouch(index, e)}
              className={`
                group relative overflow-hidden
                bg-slate-100 dark:bg-slate-800 rounded-lg md:rounded-xl
                transition-all duration-500 ease-out
                aspect-square
                ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-2' : ''}
                ${isActive ? 'shadow-2xl shadow-slate-400/30 dark:shadow-slate-900/50 scale-[1.02] z-10' : 'shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50'}
              `}
            >
              {/* Image - Using Next/Image for LCP optimization */}
              <div 
                onClick={() => onImageClick(index)}
                className="cursor-zoom-in w-full h-full"
              >
                <Image 
                  src={img.cloudinary_url} 
                  alt={`Photo ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  priority={index < ABOVE_FOLD_THRESHOLD}
                  className={`
                    object-cover
                    transition-transform duration-700 ease-out
                    ${isActive ? 'scale-105' : 'scale-100'}
                  `}
                />
              </div>
              
              {/* Watermark overlay */}
              <WatermarkOverlay 
                visible={showWatermark} 
                position="bottom-center" 
                opacity={50}
                size="sm"
              />
              
              {/* Gradient overlay */}
              <div className={`
                absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent
                transition-opacity duration-300 pointer-events-none
                ${isActive ? 'opacity-100' : 'opacity-0'}
              `} />
              
              {/* Top gradient for index badge and favorite button */}
              <div className={`
                absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent
                transition-opacity duration-300 pointer-events-none
                ${isActive || isFavorite ? 'opacity-100' : 'opacity-0'}
              `} />
              
              {/* Selection checkbox */}
              {onToggleSelection && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(img.id);
                  }}
                  className={`
                    absolute top-2 left-2 md:top-3 md:left-3
                    w-6 h-6 md:w-7 md:h-7
                    rounded-md md:rounded-lg
                    border-2 border-white
                    transition-all duration-300 pointer-events-auto
                    ${isSelected 
                      ? 'bg-indigo-600 opacity-100 scale-100' 
                      : isActive 
                        ? 'bg-white/20 backdrop-blur-md opacity-100 scale-100' 
                        : 'opacity-0 scale-75'
                    }
                    hover:scale-110
                  `}
                  aria-label={isSelected ? "Désélectionner" : "Sélectionner"}
                >
                  {isSelected && (
                    <svg className="w-full h-full text-white p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )}
              
              {/* Index badge - moved to top right (before favorite button) */}
              <div className={`
                absolute top-2 ${showFavorites && onFavorite ? 'right-12 md:right-14' : 'right-2 md:right-3'}
                px-2 py-0.5 md:px-2.5 md:py-1
                bg-white/90 backdrop-blur-md rounded-md md:rounded-lg
                text-[9px] md:text-[10px] font-black text-slate-700
                transition-all duration-300 pointer-events-none
                ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
              `}>
                #{index + 1}
              </div>
              
              {/* Favorite button - Requirements 3.1.1, 3.1.2 */}
              {showFavorites && onFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite(img.id);
                  }}
                  className={`
                    absolute top-2 right-2 md:top-3 md:right-3
                    p-2 md:p-2.5
                    bg-white/90 backdrop-blur-md rounded-full
                    transition-all duration-300 pointer-events-auto
                    hover:scale-110
                    ${isFavorite ? 'opacity-100 translate-y-0' : isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
                  `}
                  aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Heart 
                    size={16} 
                    className={`transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}`}
                    strokeWidth={2.5}
                  />
                </button>
              )}
              
              {/* Center zoom icon */}
              <div className={`
                absolute inset-0 flex items-center justify-center
                transition-all duration-300 pointer-events-none
                ${isActive ? 'opacity-100' : 'opacity-0'}
              `}>
                <div className={`
                  p-3 md:p-4 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl
                  border border-white/30 shadow-2xl
                  transition-all duration-500
                  ${isActive ? 'scale-100' : 'scale-75'}
                `}>
                  <Maximize2 size={20} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
              
              {/* Bottom action bar */}
              <div className={`
                absolute bottom-0 left-0 right-0 p-2 md:p-3
                flex items-center justify-between
                transition-all duration-300 pointer-events-none
                ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}>
                <div className="flex items-center gap-1.5">
                  <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-white text-[9px] md:text-[10px] font-bold">
                    HD
                  </div>
                  {isFavorite && (
                    <div className="px-2 py-0.5 bg-red-500/80 backdrop-blur-md rounded-md text-white text-[9px] md:text-[10px] font-bold flex items-center gap-1">
                      <Heart size={10} className="fill-white" />
                      Favori
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={(e) => onDownload(img.cloudinary_url, img.id, e)}
                  className="p-2 md:p-2.5 bg-white hover:bg-indigo-500 text-slate-700 hover:text-white rounded-lg md:rounded-xl transition-all shadow-lg pointer-events-auto"
                >
                  <Download size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Gallery stats footer */}
      {images.length > 0 && (
        <div className="flex items-center justify-center gap-4 pt-6 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} />
            <span className="text-[10px] font-medium">{images.length} photos en qualité originale</span>
          </div>
        </div>
      )}
    </div>
  );
}
