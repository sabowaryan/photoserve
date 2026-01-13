"use client";

import { ImageIcon, CheckSquare, Square, ImagePlus, Sparkles } from "lucide-react";

interface ContentHeaderProps {
  imageCount: number;
  maxImages: number;
  isLimitReached: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectAll: () => void;
  onUpload: (files: File[]) => void;
}

export function ContentHeader({ 
  imageCount, 
  maxImages, 
  isLimitReached, 
  selectedCount, 
  totalCount,
  onToggleSelectAll, 
  onUpload 
}: ContentHeaderProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const percentage = Math.min(100, (imageCount / maxImages) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg text-white shadow-md shadow-indigo-500/25">
            <ImageIcon size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Photos
              {!isLimitReached && imageCount > 0 && (
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              )}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-bold ${isLimitReached ? 'text-rose-500' : 'text-slate-500'}`}>
                {imageCount} / {maxImages}
              </span>
              {isLimitReached && (
                <span className="text-[8px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Limite
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {totalCount > 0 && (
            <button 
              onClick={onToggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-600 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-all border border-slate-200"
            >
              {allSelected ? <CheckSquare size={14} className="text-indigo-600" /> : <Square size={14} />}
              <span className="hidden sm:inline">Tout sélectionner</span>
            </button>
          )}

          <div className="relative group">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className={`absolute inset-0 opacity-0 z-10 ${isLimitReached ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onChange={(e) => onUpload(Array.from(e.target.files || []))}
              disabled={isLimitReached}
            />
            <button 
              disabled={isLimitReached}
              className={`flex items-center gap-1.5 px-4 py-2 font-bold rounded-lg text-xs transition-all pointer-events-none ${
                isLimitReached 
                  ? 'bg-slate-100 text-slate-400' 
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 group-hover:shadow-lg group-hover:shadow-indigo-500/30'
              }`}
            >
              <ImagePlus size={16} />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div 
          className={`h-full transition-all duration-500 ${
            isLimitReached 
              ? 'bg-gradient-to-r from-rose-500 to-pink-500' 
              : 'bg-gradient-to-r from-indigo-500 to-violet-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
