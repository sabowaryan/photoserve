"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface GallerySkeletonProps {
  imageCount?: number;
}

export function GallerySkeleton({ imageCount = 12 }: GallerySkeletonProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 font-['Plus_Jakarta_Sans']">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/3 to-violet-500/3 rounded-full blur-[200px]" />
      </div>

      {/* Header Skeleton */}
      <GalleryHeaderSkeleton />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-32 md:pt-36 pb-16">
        {/* Masonry Grid Skeleton */}
        <MasonryGridSkeleton imageCount={imageCount} />

        {/* Footer Skeleton */}
        <footer className="mt-12 md:mt-16 pt-6 border-t border-slate-200/60">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Skeleton className="w-7 h-7 rounded-lg" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-3 w-40 mx-auto" />
          </div>
        </footer>
      </main>
    </div>
  );
}

function GalleryHeaderSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100]">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white/0 pointer-events-none h-32" />
      
      <nav className="relative mx-3 md:mx-4 mt-3 md:mt-4">
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-xl md:rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Main header content */}
          <div className="px-3 md:px-5 py-2.5 md:py-3 flex items-center justify-between gap-3">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Skeleton className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl" />
              <div className="min-w-0">
                <Skeleton className="h-4 md:h-5 w-40 md:w-56 mb-1" />
                <div className="flex items-center gap-2 md:gap-3 mt-0.5">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <Skeleton className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl" />
              <Skeleton className="w-24 md:w-32 h-9 md:h-10 rounded-lg md:rounded-xl" />
            </div>
          </div>
          
          {/* Bottom info bar */}
          <div className="px-3 md:px-5 py-1.5 md:py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
        </div>
      </nav>
    </header>
  );
}

function MasonryGridSkeleton({ imageCount = 12 }: { imageCount?: number }) {
  return (
    <div className="space-y-4">
      {/* Gallery grid - Simple square grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
        {Array.from({ length: imageCount }).map((_, index) => (
          <div 
            key={index}
            className="relative overflow-hidden bg-slate-100 rounded-lg md:rounded-xl aspect-square shadow-lg shadow-slate-200/50"
          >
            <Skeleton className="w-full h-full" />
          </div>
        ))}
      </div>
      
      {/* Gallery stats footer skeleton */}
      <div className="flex items-center justify-center gap-4 pt-6">
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export { GalleryHeaderSkeleton, MasonryGridSkeleton };
