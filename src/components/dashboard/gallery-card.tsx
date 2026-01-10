"use client";

import Link from "next/link";
import { Eye, Clock, Settings2, ChevronRight, Calendar, Sparkles, AlertCircle } from "lucide-react";
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
}

export function GalleryCard({
  id,
  title,
  slug,
  expiresAt,
  viewsCount,
  imageUrl,
  createdAt,
  isListView = false,
}: GalleryCardProps) {
  const isExpired = new Date(expiresAt) < new Date();

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  const StatusBadge = ({ condensed = false }) => (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border backdrop-blur-md transition-all ${
      isExpired 
        ? 'bg-rose-50/80 text-rose-600 border-rose-100 shadow-sm' 
        : 'bg-emerald-50/80 text-emerald-600 border-emerald-100 shadow-sm'
    }`}>
      {!isExpired ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
      ) : (
        <AlertCircle size={10} className="text-rose-500" />
      )}
      {!condensed && (isExpired ? 'Expirée' : 'Active')}
    </div>
  );

  if (isListView) {
    return (
      <div className="group bg-white rounded-3xl p-4 border border-slate-100 transition-all hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative">
        {/* Thumbnail Mini */}
        <div className="w-16 h-16 sm:w-16 sm:h-16 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-50 group-hover:scale-105 transition-transform duration-500 shadow-sm">
          <img 
            src={imageUrl || `https://picsum.photos/seed/${id}/100/100`} 
            alt={title} 
            className="w-full h-full object-cover" 
            loading="lazy"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
            <h3 className="font-black text-slate-800 truncate text-base tracking-tight w-full sm:w-auto">
              {title}
            </h3>
            <StatusBadge condensed={true} />
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-5 text-[10px] sm:text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Eye size={14} className="text-indigo-400/50" /> 
              {viewsCount.toLocaleString()} <span>vues</span>
            </span>
            {createdAt && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-400/50" /> 
                {formatDate(createdAt)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} className={isExpired ? 'text-rose-400' : 'text-indigo-400/50'} />
              Exp: {formatDate(expiresAt)}
            </span>
          </div>
        </div>

        {/* Actions List View */}
        <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50 w-full sm:w-auto justify-center">
          <GalleryActions
            galleryId={id}
            gallerySlug={slug}
            galleryTitle={title}
          />
          <Link href={`/dashboard/gallery/${id}`}>
            <button 
              className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all active:scale-90"
              aria-label="Éditer la galerie"
            >
              <ChevronRight size={18} />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-[2.8rem] p-6 border border-slate-100 transition-all duration-500 hover:border-indigo-100 hover:shadow-[0_40px_80px_-20px_rgba(99,102,241,0.12)] flex flex-col relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/40 rounded-full blur-[80px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

      <div className="aspect-[16/10] rounded-[2.2rem] bg-slate-100 mb-6 relative overflow-hidden border border-slate-50 shadow-inner group-hover:shadow-lg transition-shadow duration-500">
        <img 
          src={imageUrl || `https://picsum.photos/seed/${id}/400/300`} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          loading="lazy"
        />

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <StatusBadge />
        </div>

        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-4 backdrop-blur-[2px] translate-y-6 group-hover:translate-y-0">
          <div className="bg-white/95 p-3 rounded-3xl shadow-2xl flex items-center gap-2 border border-white">
            <GalleryActions
              galleryId={id}
              gallerySlug={slug}
              galleryTitle={title}
            />
            <div className="w-px h-6 bg-slate-100 mx-1"></div>
            <Link href={`/dashboard/gallery/${id}`}>
              <button
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                title="Paramètres de la galerie"
              >
                <Settings2 size={18} />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-black text-xl text-slate-900 tracking-tight mb-3 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100/50">
              <Eye size={12} className="text-indigo-500" />
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                {viewsCount.toLocaleString()} <span className="text-slate-400 font-bold">vues</span>
              </span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              isExpired 
                ? 'bg-rose-50 border-rose-100 text-rose-500' 
                : 'bg-slate-50 border-slate-100/50 text-slate-500'
            }`}>
              <Clock size={12} className={isExpired ? 'text-rose-500' : 'text-indigo-500'} />
              <span className="text-[11px] font-black uppercase tracking-widest">
                Exp: {formatDate(expiresAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {createdAt ? `Dernière modif. ${formatDate(createdAt)}` : 'Aucune date'}
            </span>
          </div>
          <Link href={`/dashboard/gallery/${id}`}>
            <button
              className="w-11 h-11 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all flex items-center justify-center group/btn shadow-sm active:scale-90"
            >
              <ChevronRight size={22} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
