"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Clock, ChevronRight, Calendar, AlertCircle, ImageIcon } from "lucide-react";
import { GalleryActions } from "@/app/(dashboard)/dashboard/gallery-actions";

interface GalleryCardProps {
  id: string;
  title: string;
  slug: string;
  expiresAt: string;
  viewsCount: number;
  isActive: boolean;
  imageUrl?: string;
  imageCount?: number;
  createdAt?: string;
  isListView?: boolean;
  priority?: boolean; // For LCP optimization - prioritize first visible cards
}

export function GalleryCard({
  id,
  title,
  slug,
  expiresAt,
  viewsCount,
  imageUrl,
  imageCount,
  createdAt,
  isListView = false,
  priority = false,
}: GalleryCardProps) {
  const isExpired = new Date(expiresAt) < new Date();
  const [isTouched, setIsTouched] = useState(false);

  // Handle touch for mobile - tap to show actions
  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsTouched(!isTouched);
    // Auto-hide after 3 seconds
    if (!isTouched) {
      setTimeout(() => {
        setIsTouched(false);
      }, 3000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const expDate = new Date(expiresAt);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  const StatusBadge = () => (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
      isExpired 
        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
    }`}>
      {!isExpired ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
      ) : (
        <AlertCircle size={10} />
      )}
      {isExpired ? 'Expirée' : 'Active'}
    </div>
  );

  if (isListView) {
    return (
      <div className="group bg-white rounded-xl p-3 border border-slate-100 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-500/5 transition-all flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-50 relative">
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={title} 
              fill
              sizes="48px"
              priority={priority}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ImageIcon size={18} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-slate-900 truncate text-xs">{title}</h3>
            <StatusBadge />
          </div>
          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <Eye size={10} className="text-slate-300" />
              {viewsCount.toLocaleString()}
            </span>
            {imageCount !== undefined && (
              <span className="flex items-center gap-1">
                <ImageIcon size={10} className="text-slate-300" />
                {imageCount}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={10} className={isExpired ? 'text-rose-400' : 'text-slate-300'} />
              {isExpired ? 'Expirée' : `${daysRemaining}j`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <GalleryActions galleryId={id} gallerySlug={slug} galleryTitle={title} />
          <Link href={`/dashboard/gallery/${id}`}>
            <button className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              <ChevronRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* Image */}
      <div 
        className="aspect-[16/10] bg-slate-100 relative overflow-hidden"
        onTouchStart={handleTouch}
      >
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={title} 
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <ImageIcon size={40} />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <StatusBadge />
        </div>

        {/* Hover/Touch Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent transition-all duration-300 flex items-end justify-center pb-3 ${
          isTouched ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-lg border border-white/50">
            <GalleryActions galleryId={id} gallerySlug={slug} galleryTitle={title} />
            <div className="w-px h-4 bg-slate-200" />
            <Link href={`/dashboard/gallery/${id}`}>
              <button className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all">
                <ChevronRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 mb-2.5 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug text-sm">
          {title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 mt-auto">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
            <Eye size={10} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-slate-600">{viewsCount.toLocaleString()}</span>
          </div>
          
          {imageCount !== undefined && (
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
              <ImageIcon size={10} className="text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-600">{imageCount}</span>
            </div>
          )}

          <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
            isExpired 
              ? 'bg-rose-50 border-rose-100 text-rose-600' 
              : daysRemaining <= 3 
                ? 'bg-amber-50 border-amber-100 text-amber-600'
                : 'bg-slate-50 border-slate-100 text-slate-600'
          }`}>
            <Clock size={10} />
            <span className="text-[10px] font-bold">
              {isExpired ? 'Expirée' : `${daysRemaining}j`}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-50">
          <div className="flex items-center gap-1 text-slate-400">
            <Calendar size={10} />
            <span className="text-[9px] font-medium">
              {createdAt ? formatDate(createdAt) : 'N/A'}
            </span>
          </div>
          <Link href={`/dashboard/gallery/${id}`}>
            <button className="p-1.5 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-md transition-all">
              <ChevronRight size={12} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
