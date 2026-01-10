"use client";

import { Download, Eye, Loader2 } from "lucide-react";
import Image from "next/image";

interface GalleryHeaderProps {
  title: string;
  viewsCount: number;
  isDownloading: boolean;
  onDownloadAll: () => void;
}

export function GalleryHeader({ title, viewsCount, isDownloading, onDownloadAll }: GalleryHeaderProps) {
  return (
    <nav className="fixed top-6 left-6 right-6 h-24 bg-white/80 backdrop-blur-2xl border border-slate-200 rounded-[2.5rem] z-[100] px-10 flex items-center justify-between shadow-xl shadow-slate-200/40">
      <div className="flex items-center gap-6">
        <Image 
          src="/icons/logo.svg" 
          alt="PikSend" 
          width={32} 
          height={32}
          className="text-indigo-600"
        />
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate max-w-[180px] sm:max-w-none">
            {title}
          </h2>
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            <Eye size={12} /> {viewsCount.toLocaleString()} vues
          </div>
        </div>
      </div>
      
      <button 
        onClick={onDownloadAll}
        disabled={isDownloading}
        className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
      >
        {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
        <span className="hidden sm:inline uppercase tracking-widest">
          {isDownloading ? 'Préparation...' : 'Tout télécharger'}
        </span>
      </button>
    </nav>
  );
}
