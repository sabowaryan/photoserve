"use client";

import { ArrowLeft, ChevronRight, ExternalLink, Clock, ImageIcon, Eye, Calendar, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GalleryHeroProps {
  title: string;
  uniqueSlug: string;
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
  imageCount: number;
  isExpired: boolean;
  galleryId: string;
}

export function GalleryHero({
  title,
  uniqueSlug,
  viewsCount,
  expiresAt,
  createdAt,
  imageCount,
  isExpired,
  galleryId,
}: GalleryHeroProps) {
  const router = useRouter();
  
  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/g/${uniqueSlug}` 
    : `/g/${uniqueSlug}`;

  // Calculate days remaining
  const daysRemaining = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <>
      {/* Navigation / Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-left-4 duration-500">
        <Link 
          href="/dashboard"
          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-bold text-xs transition-all group"
        >
          <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md group-active:scale-95 transition-all">
            <ArrowLeft size={14} />
          </div>
          <span className="hidden sm:inline">Tableau de bord</span>
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-xs font-bold text-slate-400 truncate max-w-[200px]">{title}</span>
      </div>

      {/* Hero Section */}
      <div className="relative mb-5 animate-in slide-in-from-top-4 duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>

        <div className="relative z-10 p-4 sm:p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2.5 flex-1 min-w-0">
              {/* Status Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md ${
                  isExpired 
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-400/30' 
                    : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${
                    isExpired ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'
                  }`} />
                  {isExpired ? 'Expirée' : 'Active'}
                </div>
                <div className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-[9px] font-bold uppercase tracking-wider border border-white/10 backdrop-blur-md">
                  #{uniqueSlug}
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight truncate">
                {title}
              </h1>
              
              <p className="text-indigo-100/60 text-xs sm:text-sm font-medium max-w-xl leading-relaxed hidden sm:block">
                Gérez les accès, visualisez les statistiques et personnalisez votre galerie.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="shrink-0 flex gap-2">
              <button 
                onClick={() => router.push(`/dashboard/gallery/${galleryId}/analytics`)}
                className="group relative px-4 py-2.5 bg-white/10 backdrop-blur-md text-white font-bold text-sm rounded-xl hover:bg-white/20 transition-all border border-white/20 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
              >
                <BarChart3 size={16} />
                <span className="hidden sm:inline">Analytics</span>
              </button>
              <button 
                onClick={() => window.open(publicUrl, '_blank')}
                className="group relative px-4 py-2.5 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none" />
                <ExternalLink size={16} className="text-indigo-600" />
                <span>Aperçu Public</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
            {/* Views Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg text-white group-hover/stat:scale-110 transition-transform">
                  <Eye size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Vues</p>
                  <p className="text-base font-black tracking-tight">{viewsCount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Photos Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg text-white group-hover/stat:scale-110 transition-transform">
                  <ImageIcon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Photos</p>
                  <p className="text-base font-black tracking-tight">{imageCount}</p>
                </div>
              </div>
            </div>

            {/* Expiration Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg group-hover/stat:scale-110 transition-transform ${
                  isExpired ? 'bg-rose-500/20 text-rose-300' : daysRemaining <= 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white'
                }`}>
                  <Clock size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Expire</p>
                  <p className={`text-sm font-black tracking-tight truncate ${
                    isExpired ? 'text-rose-300' : daysRemaining <= 3 ? 'text-amber-300' : ''
                  }`}>
                    {isExpired ? 'Expirée' : `${daysRemaining}j`}
                  </p>
                </div>
              </div>
            </div>

            {/* Created Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg text-white group-hover/stat:scale-110 transition-transform">
                  <Calendar size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Créée</p>
                  <p className="text-[11px] font-bold tracking-tight truncate">{formatDate(createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
