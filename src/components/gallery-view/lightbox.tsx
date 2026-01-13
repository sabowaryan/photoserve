"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Image from "next/image";
import { WatermarkOverlay } from "@/components/gallery/watermark-overlay";

interface LightboxProps {
  images: { id: string; url: string }[];
  currentIndex: number;
  title: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDownload: (url: string) => void;
  /** Whether to show watermark overlay on images */
  showWatermark?: boolean;
}

export function Lightbox({ 
  images, 
  currentIndex, 
  title, 
  onClose, 
  onPrev, 
  onNext,
  onDownload,
  showWatermark = false
}: LightboxProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft" && currentIndex > 0) onPrev();
    if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNext();
  }, [currentIndex, images.length, onClose, onPrev, onNext]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" 
        onClick={onClose}
      />
      
      {/* Header - Sticky */}
      <div className="relative z-[210] flex items-center justify-between px-4 py-4">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-transparent backdrop-blur-xl pointer-events-none" />
        
        <div className="relative flex items-center gap-3 text-white">
          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Image 
              src="/icons/logo.svg" 
              alt="PikSend" 
              width={18} 
              height={18}
            />
          </div>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <div className="hidden sm:block">
            <h3 className="text-xs font-black uppercase tracking-wider">{title}</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
              PikSend Gallery
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="relative p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation Buttons */}
      <button 
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        disabled={currentIndex === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-[210] p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all disabled:opacity-0"
      >
        <ChevronLeft size={32} />
      </button>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        disabled={currentIndex === images.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-[210] p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all disabled:opacity-0"
      >
        <ChevronRight size={32} />
      </button>

      {/* Scrollable Image Container */}
      <div className="relative z-[205] flex-1 overflow-y-auto overflow-x-hidden">
        <div className="min-h-full flex items-center justify-center p-4 pb-24">
          <div className="relative">
            <img 
              src={currentImage.url} 
              className="max-w-full h-auto object-contain rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in zoom-in duration-500" 
              alt={`Photo ${currentIndex + 1}`} 
            />
            {/* Watermark overlay for free guest galleries - Requirements 2.1, 2.2 */}
            <WatermarkOverlay visible={showWatermark} position="bottom-right" opacity={30} />
          </div>
        </div>
      </div>
      
      {/* Bottom Controls - Fixed position */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[210] flex items-center gap-6 px-6 py-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl">
        <span className="text-xs font-black text-white uppercase tracking-wider">
          {currentIndex + 1} <span className="text-white/30">/ {images.length}</span>
        </span>
        <div className="w-px h-5 bg-white/10" />
        <button 
          onClick={() => onDownload(currentImage.url)}
          className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-wider hover:text-indigo-400 transition-colors"
        >
          <Download size={14} /> Télécharger
        </button>
      </div>
    </div>
  );
}
