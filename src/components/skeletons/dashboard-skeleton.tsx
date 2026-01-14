"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface DashboardSkeletonProps {
  showStats?: boolean;
  galleryCount?: number;
}

export function DashboardSkeleton({ 
  showStats = true, 
  galleryCount = 6 
}: DashboardSkeletonProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pt-18 pb-10 font-['Plus_Jakarta_Sans']">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-9 space-y-5">
            {/* Welcome Header Skeleton */}
            <header className="relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-7 w-64" />
                  <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-36 rounded-xl" />
              </div>
            </header>

            {/* Stats Cards Skeleton */}
            {showStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Plan Card Skeleton */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/60 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 w-12 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-5 w-20" />
                </div>

                {/* Storage Card Skeleton */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/60 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 w-8 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-1 w-full mt-1.5 rounded-full" />
                </div>

                {/* Galleries Card Skeleton */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/60 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 w-8 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-14 mb-1" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-1 w-full mt-1.5 rounded-full" />
                </div>

                {/* Views Card Skeleton (Dark) */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-3 shadow-lg relative overflow-hidden">
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-indigo-500/20 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
                      <Skeleton className="h-4 w-12 rounded-full bg-white/10" />
                    </div>
                    <Skeleton className="h-3 w-16 mb-1 bg-white/10" />
                    <Skeleton className="h-5 w-20 bg-white/10" />
                    <Skeleton className="h-2 w-24 mt-1 bg-white/10" />
                  </div>
                </div>
              </div>
            )}

            {/* Galleries Section Skeleton */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              {/* Toolbar Skeleton */}
              <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Skeleton className="h-9 w-52 rounded-lg" />
                  <Skeleton className="h-9 w-16 rounded-lg" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              </div>

              {/* Gallery Grid Skeleton */}
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: galleryCount }).map((_, i) => (
                    <GalleryCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-3">
            <SidebarSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden h-full flex flex-col">
      {/* Image Skeleton */}
      <Skeleton className="aspect-[16/10] w-full" />

      {/* Content Skeleton */}
      <div className="p-3 flex-1 flex flex-col">
        <Skeleton className="h-4 w-3/4 mb-2.5" />

        <div className="flex flex-wrap items-center gap-2 mt-auto">
          <Skeleton className="h-6 w-14 rounded-md" />
          <Skeleton className="h-6 w-12 rounded-md" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-50">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3 sticky top-24">
      {/* Activity Card Skeleton */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-2 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Card Skeleton */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-3.5 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-violet-400/20 rounded-full blur-xl" />
        
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-2">
            <Skeleton className="h-5 w-5 rounded-md bg-white/20" />
            <Skeleton className="h-3 w-16 bg-white/20" />
          </div>
          <Skeleton className="h-5 w-32 mb-1.5 bg-white/20" />
          <Skeleton className="h-3 w-full mb-1 bg-white/20" />
          <Skeleton className="h-3 w-3/4 mb-3 bg-white/20" />
          <Skeleton className="h-8 w-full rounded-lg bg-white/30" />
        </div>
      </div>

      {/* Help Card Skeleton */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-full rounded-md" />
          <Skeleton className="h-7 w-full rounded-md" />
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200">
          <Skeleton className="h-3 w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export { GalleryCardSkeleton, SidebarSkeleton };
