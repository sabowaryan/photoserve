"use client";

import { BarChart3, AlertTriangle } from "lucide-react";

interface QuotaCardProps {
  currentCount: number;
  maxCount: number;
  planName: string;
}

export function QuotaCard({ currentCount, maxCount, planName }: QuotaCardProps) {
  const isLimitReached = currentCount >= maxCount;
  const percentage = Math.min(100, (currentCount / maxCount) * 100);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
      <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
        <BarChart3 size={18} className="text-indigo-600" /> 
        Quotas d'images
      </h4>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Utilisation locale
            </span>
            <span className={`text-sm font-black ${isLimitReached ? 'text-rose-600' : 'text-slate-900'}`}>
              {currentCount} / {maxCount}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isLimitReached ? 'bg-rose-500' : 'bg-indigo-600'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Plan : <span className="text-indigo-600">{planName}</span>
            <br />
            Images restantes : <span className="text-slate-900">{maxCount - currentCount}</span>
          </p>
        </div>
        
        {isLimitReached && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-wide">
            <AlertTriangle size={14} className="shrink-0" />
            Limite atteinte. Passez à un plan supérieur pour ajouter plus de photos.
          </div>
        )}
      </div>
    </div>
  );
}
