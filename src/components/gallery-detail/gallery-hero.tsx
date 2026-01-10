"use client";

import { ArrowLeft, ChevronRight, ExternalLink, Activity, Clock, ImageIcon, Sparkles } from "lucide-react";
import Link from "next/link";

interface GalleryHeroProps {
  title: string;
  uniqueSlug: string;
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
  imageCount: number;
  isExpired: boolean;
}

export function GalleryHero({
  title,
  uniqueSlug,
  viewsCount,
  expiresAt,
  createdAt,
  imageCount,
  isExpired,
}: GalleryHeroProps) {
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

  return (
    <>
      {/* Navigation / Breadcrumb */}
      <div className="flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
        <Link 
          href="/dashboard"
          className="flex items-center gap-3 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-all group"
        >
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md group-active:scale-95 transition-all">
            <ArrowLeft size={18} />
          </div>
          Tableau de bord
        </Link>
        <div className="text-slate-300">
          <ChevronRight size={16} />
        </div>
        <span className="text-sm font-bold text-slate-400">Configuration galerie</span>
      </div>

      {/* Hero Section */}
      <div className="relative mb-12 animate-in slide-in-from-top-4 duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3rem] sm:rounded-[4rem] shadow-2xl overflow-hidden">
          {/* Decorative patterns */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative z-10 p-8 sm:p-14 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="space-y-6 max-w-3xl">
              {/* Status Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 border shadow-lg backdrop-blur-md ${
                  isExpired 
                    ? 'bg-rose-500/20 text-rose-200 border-rose-500/30' 
                    : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
                    isExpired ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'
                  }`} />
                  {isExpired ? 'Galerie Expirée' : 'Diffusion Active'}
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white/10 text-white/70 text-[11px] font-bold uppercase tracking-widest border border-white/10 backdrop-blur-md">
                  ID: {uniqueSlug}
                </div>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight drop-shadow-sm">
                {title}
              </h1>
              
              <p className="text-indigo-100/70 text-lg font-medium max-w-2xl leading-relaxed">
                Gérez les accès, visualisez les statistiques et personnalisez l'expérience client de votre galerie sécurisée.
              </p>
            </div>

            {/* Action Preview Button */}
            <div className="shrink-0">
              <button 
                onClick={() => window.open(publicUrl, '_blank')}
                className="group relative w-full sm:w-auto px-10 py-6 bg-white text-slate-900 font-black rounded-[2rem] hover:bg-slate-50 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1.5 active:scale-95 flex items-center justify-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none" />
                <ExternalLink size={24} className="text-indigo-600" />
                <span className="text-lg">Aperçu Public</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
            {/* Views Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl text-white group-hover/stat:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Total Vues</p>
                  <p className="text-2xl font-black tracking-tight">{viewsCount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Expiration Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl text-white group-hover/stat:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Expiration</p>
                  <p className="text-xl font-black tracking-tight truncate">{formatDate(expiresAt)}</p>
                </div>
              </div>
            </div>

            {/* Media Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl text-white group-hover/stat:scale-110 transition-transform">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Photos</p>
                  <p className="text-2xl font-black tracking-tight">
                    {imageCount} <span className="text-white/40 text-sm font-bold">Média</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Created At Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl text-white group-hover/stat:scale-110 transition-transform">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Mise en ligne</p>
                  <p className="text-xl font-black tracking-tight truncate">{formatDate(createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
