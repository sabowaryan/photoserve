"use client";

import Image from "next/image";
import { Maximize2, Download, ImageOff, Sparkles } from "lucide-react";
import { WatermarkOverlay } from "@/components/gallery/watermark-overlay";
import { useState } from "react";

// Number of images above the fold that should be prioritized for LCP optimization
const ABOVE_FOLD_THRESHOLD = 4;

interface MasonryGridProps {
  images: { id: string; url: string }[];
  onImageClick: (index: number) => void;
  onDownload: (url: string, e: React.MouseEvent) => void;
  showWatermark?: boolean;
}

export function MasonryGrid({ images, onImageClick, onDownload, showWatermark = false }: MasonryGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 md:py-32 text-center animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-inner mb-4">
          <ImageOff size={36} className="text-slate-300" />
        </div>
        <p className="font-black text-lg md:text-xl tracking-tight text-slate-400 mb-1.5">
          Galerie vide
        </p>
        <p className="text-slate-400 text-xs font-medium">
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
          
          return (
            <div 
              key={img.id}
              onClick={() => onImageClick(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`
                group relative overflow-hidden cursor-zoom-in
                bg-slate-100 rounded-lg md:rounded-xl
                transition-all duration-500 ease-out
                aspect-square
                ${isHovered ? 'shadow-2xl shadow-slate-400/30 scale-[1.02] z-10' : 'shadow-lg shadow-slate-200/50'}
              `}
            >
              {/* Image - Using Next/Image for LCP optimization */}
              <Image 
                src={img.url} 
                alt={`Photo ${index + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                priority={index < ABOVE_FOLD_THRESHOLD}
                className={`
                  object-cover
                  transition-transform duration-700 ease-out
                  ${isHovered ? 'scale-105' : 'scale-100'}
                `}
              />
              
              {/* Watermark overlay */}
              <WatermarkOverlay visible={showWatermark} position="bottom-right" opacity={30} />
              
              {/* Gradient overlay */}
              <div className={`
                absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent
                transition-opacity duration-300
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `} />
              
              {/* Top gradient for index badge */}
              <div className={`
                absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent
                transition-opacity duration-300
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `} />
              
              {/* Index badge */}
              <div className={`
                absolute top-2 left-2 md:top-3 md:left-3
                px-2 py-0.5 md:px-2.5 md:py-1
                bg-white/90 backdrop-blur-md rounded-md md:rounded-lg
                text-[9px] md:text-[10px] font-black text-slate-700
                transition-all duration-300
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
              `}>
                #{index + 1}
              </div>
              
              {/* Center zoom icon */}
              <div className={`
                absolute inset-0 flex items-center justify-center
                transition-all duration-300
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `}>
                <div className={`
                  p-3 md:p-4 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl
                  border border-white/30 shadow-2xl
                  transition-all duration-500
                  ${isHovered ? 'scale-100' : 'scale-75'}
                `}>
                  <Maximize2 size={20} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
              
              {/* Bottom action bar */}
              <div className={`
                absolute bottom-0 left-0 right-0 p-2 md:p-3
                flex items-center justify-between
                transition-all duration-300
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}>
                <div className="flex items-center gap-1.5">
                  <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-white text-[9px] md:text-[10px] font-bold">
                    HD
                  </div>
                </div>
                
                <button 
                  onClick={(e) => onDownload(img.url, e)}
                  className="p-2 md:p-2.5 bg-white hover:bg-indigo-500 text-slate-700 hover:text-white rounded-lg md:rounded-xl transition-all shadow-lg"
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
