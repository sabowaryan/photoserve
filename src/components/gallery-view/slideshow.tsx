"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { WatermarkOverlay } from "@/components/gallery/watermark-overlay";
import type { ImageWithMeta } from "@/types";

interface SlideshowProps {
  images: ImageWithMeta[];
  interval?: 3000 | 5000 | 10000;
  onClose: () => void;
  autoPlay?: boolean;
  showWatermark?: boolean;
}

/**
 * Slideshow Component - Requirements 1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.5
 * 
 * Displays images in fullscreen slideshow mode with:
 * - Auto-advance with configurable interval
 * - Play/pause controls
 * - Manual navigation
 * - Looping behavior
 */
export function Slideshow({ 
  images, 
  interval = 5000, 
  onClose, 
  autoPlay = true,
  showWatermark = false
}: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [, setIsPaused] = useState(false);

  // Auto-advance logic - Requirements 1.4.2, 1.4.5
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        // Loop back to first image after last - Requirement 1.4.5
        if (prev >= images.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, interval, images.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowLeft") {
      handlePrev();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === " ") {
      e.preventDefault();
      togglePlayPause();
    }
  }, [currentIndex, images.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? images.length - 1 : prev - 1));
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
    setIsPaused((prev) => !prev);
  };

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950 animate-in fade-in duration-500">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-[210] flex items-center justify-between px-6 py-4">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent backdrop-blur-xl pointer-events-none" />
        
        {/* Left side - Title */}
        <div className="relative flex items-center gap-3 text-white">
          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Image 
              src="/icons/logo.svg" 
              alt="PikSend" 
              width={18} 
              height={18}
            />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider">Diaporama</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
              {currentIndex + 1} / {images.length}
            </p>
          </div>
        </div>

        {/* Right side - Close button */}
        <button 
          onClick={onClose} 
          className="relative p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
          aria-label="Fermer le diaporama"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Image Display */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative max-w-full max-h-full">
            <img 
              key={currentImage.id}
              src={currentImage.cloudinary_url} 
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-700" 
              alt={`Photo ${currentIndex + 1}`} 
            />
            {/* Watermark overlay */}
            <WatermarkOverlay visible={showWatermark} position="bottom-right" opacity={30} />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <button 
        onClick={handlePrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-[210] p-4 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all"
        aria-label="Image précédente"
      >
        <ChevronLeft size={32} strokeWidth={2.5} />
      </button>
      
      <button 
        onClick={handleNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-[210] p-4 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all"
        aria-label="Image suivante"
      >
        <ChevronRight size={32} strokeWidth={2.5} />
      </button>

      {/* Bottom Controls - Requirements 1.4.4 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[210] flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="p-2 text-white hover:text-indigo-400 transition-colors"
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </button>

        <div className="w-px h-5 bg-white/10" />

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-8 bg-white' 
                  : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Interval display */}
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
          {interval / 1000}s
        </span>
      </div>
    </div>
  );
}
