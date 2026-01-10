"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Image from "next/image";

interface LightboxProps {
  images: { id: string; url: string }[];
  currentIndex: number;
  title: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDownload: (url: string) => void;
}

export function Lightbox({ 
  images, 
  currentIndex, 
  title, 
  onClose, 
  onPrev, 
  onNext,
  onDownload 
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" 
        onClick={onClose}
      />
      
      {/* Header */}
      <div className="absolute top-8 left-8 z-[210] flex items-center gap-5 text-white">
        <Image 
          src="/icons/logo.svg" 
          alt="PikSend" 
          width={32} 
          height={32}
          className="invert"
        />
        <div className="w-px h-8 bg-white/10 hidden sm:block" />
        <div className="hidden sm:block">
          <h3 className="text-sm font-black uppercase tracking-widest">{title}</h3>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
            PikSend Gallery
          </p>
        </div>
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose} 
        className="absolute top-8 right-8 z-[210] p-4 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
      >
        <X size={40} />
      </button>

      {/* Navigation Buttons */}
      <button 
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        disabled={currentIndex === 0}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-[210] p-6 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all disabled:opacity-0"
      >
        <ChevronLeft size={64} />
      </button>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        disabled={currentIndex === images.length - 1}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-[210] p-6 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all disabled:opacity-0"
      >
        <ChevronRight size={64} />
      </button>

      {/* Image Container */}
      <div className="relative z-[205] max-w-7xl max-h-[85vh] px-8 flex flex-col items-center justify-center gap-10">
        <img 
          src={currentImage.url} 
          className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-in zoom-in duration-500" 
          alt={`Photo ${currentIndex + 1}`} 
        />
        
        {/* Bottom Controls */}
        <div className="flex items-center gap-10 px-10 py-5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl">
          <span className="text-sm font-black text-white uppercase tracking-[0.2em]">
            {currentIndex + 1} <span className="text-white/30">/ {images.length}</span>
          </span>
          <div className="w-px h-6 bg-white/10" />
          <button 
            onClick={() => onDownload(currentImage.url)}
            className="flex items-center gap-3 text-xs font-black text-white uppercase tracking-widest hover:text-indigo-400 transition-colors"
          >
            <Download size={20} /> Télécharger
          </button>
        </div>
      </div>
    </div>
  );
}
