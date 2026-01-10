"use client";

import { useState } from "react";
import { Share2, Copy, Check, ChevronRight } from "lucide-react";

interface ShareCardProps {
  publicUrl: string;
}

export function ShareCard({ publicUrl }: ShareCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
            <Share2 size={20} />
          </div>
          <span className="text-white font-bold tracking-tight">Partage public</span>
        </div>
        
        <div className="relative mb-6">
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-indigo-200 text-xs font-mono truncate">
            {publicUrl}
          </div>
          <button 
            onClick={handleCopy} 
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-white transition-colors"
          >
            {isCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          </button>
        </div>
        
        <button 
          onClick={() => window.open(publicUrl, '_blank')} 
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group/btn"
        >
          Ouvrir la galerie
          <ChevronRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
        </button>
      </div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full blur-[80px] opacity-40" />
    </div>
  );
}
