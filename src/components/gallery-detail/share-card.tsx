"use client";

import { useState } from "react";
import { Share2, Copy, Check, ExternalLink, Link2 } from "lucide-react";

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
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/10 rounded-full blur-xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl text-white shadow-lg">
            <Share2 size={18} />
          </div>
          <span className="text-white font-bold">Lien de partage</span>
        </div>
        
        <div className="relative mb-5">
          <div className="flex items-center gap-2 w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-12">
            <Link2 size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-indigo-200 text-xs font-mono truncate">
              {publicUrl}
            </span>
          </div>
          <button 
            onClick={handleCopy} 
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
              isCopied 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        
        <button 
          onClick={() => window.open(publicUrl, '_blank')} 
          className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group"
        >
          <ExternalLink size={16} />
          Ouvrir la galerie
        </button>
      </div>
    </div>
  );
}
