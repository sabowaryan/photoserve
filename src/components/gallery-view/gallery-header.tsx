"use client";

import { Download, Eye, Loader2, Share2, Calendar, ImageIcon, Check } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface GalleryHeaderProps {
  title: string;
  viewsCount: number;
  imagesCount: number;
  expiresAt: string;
  isDownloading: boolean;
  isUnlocked: boolean;
  onDownloadAll: () => void;
}

export function GalleryHeader({ 
  title, 
  viewsCount, 
  imagesCount,
  expiresAt,
  isDownloading, 
  isUnlocked,
  onDownloadAll 
}: GalleryHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const expiresDate = new Date(expiresAt);
  const daysRemaining = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

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
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-md border border-slate-100">
                <Image 
                  src="/icons/logo.svg" 
                  alt="PikSend" 
                  width={20} 
                  height={20}
                  className="md:w-6 md:h-6"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-base font-black text-slate-900 tracking-tight truncate">
                  {title}
                </h1>
                <div className="flex items-center gap-2 md:gap-3 mt-0.5">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Eye size={10} />
                    <span className="text-[9px] md:text-[10px] font-bold">{viewsCount.toLocaleString()}</span>
                  </div>
                  <div className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
                  <div className="flex items-center gap-1 text-slate-400">
                    <ImageIcon size={10} />
                    <span className="text-[9px] md:text-[10px] font-bold">{imagesCount}</span>
                  </div>
                  {isUnlocked && (
                    <>
                      <div className="w-0.5 h-0.5 bg-slate-300 rounded-full hidden sm:block" />
                      <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                        <Check size={8} />
                        <span className="text-[8px] font-black uppercase tracking-wider">HD</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {/* Share button */}
              <button 
                onClick={handleShare}
                className="p-2 md:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg md:rounded-xl transition-all"
                title="Partager"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
              </button>
              
              {/* Download button */}
              <button 
                onClick={onDownloadAll}
                disabled={isDownloading}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-lg md:rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                {isDownloading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Download size={14} />
                )}
                <span className="hidden sm:inline">
                  {isDownloading ? 'Préparation...' : 'Télécharger'}
                </span>
              </button>
            </div>
          </div>
          
          {/* Bottom info bar */}
          <div className="px-3 md:px-5 py-1.5 md:py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar size={11} />
              <span className="text-[9px] md:text-[10px] font-medium">
                Expire le {expiresDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {daysRemaining <= 7 && (
              <div className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider ${
                daysRemaining <= 1 
                  ? 'bg-rose-100 text-rose-600' 
                  : daysRemaining <= 3 
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-100 text-slate-500'
              }`}>
                {daysRemaining === 0 ? "Expire aujourd'hui" : `${daysRemaining}j restant${daysRemaining > 1 ? 's' : ''}`}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
