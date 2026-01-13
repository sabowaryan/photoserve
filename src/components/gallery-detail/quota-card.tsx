"use client";

import { BarChart3, AlertTriangle, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

interface QuotaCardProps {
  currentCount: number;
  maxCount: number;
  planName: string;
}

export function QuotaCard({ currentCount, maxCount, planName }: QuotaCardProps) {
  const isLimitReached = currentCount >= maxCount;
  const percentage = Math.min(100, (currentCount / maxCount) * 100);
  const remaining = maxCount - currentCount;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-xl ${
          isLimitReached 
            ? 'bg-rose-100 text-rose-600' 
            : 'bg-indigo-100 text-indigo-600'
        }`}>
          <BarChart3 size={18} />
        </div>
        <span className="font-bold text-slate-900">Quota images</span>
      </div>
      
      <div className="space-y-4">
        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={12} />
              Utilisation
            </span>
            <span className={`text-sm font-black ${isLimitReached ? 'text-rose-600' : 'text-slate-900'}`}>
              {currentCount} / {maxCount}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 rounded-full ${
                isLimitReached 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500' 
                  : percentage > 80 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-indigo-500 to-violet-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        
        {/* Plan info */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plan</p>
            <p className="text-sm font-black text-indigo-600 capitalize">{planName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Restantes</p>
            <p className={`text-sm font-black ${remaining === 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {remaining}
            </p>
          </div>
        </div>
        
        {/* Warning or upgrade CTA */}
        {isLimitReached ? (
          <div className="flex items-start gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-relaxed">
              Limite atteinte. Passez à un plan supérieur pour ajouter plus de photos.
            </p>
          </div>
        ) : planName === 'free' && percentage > 50 && (
          <Link 
            href="/settings?upgrade=true"
            className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Zap size={14} />
            Passer à Premium
          </Link>
        )}
      </div>
    </div>
  );
}
