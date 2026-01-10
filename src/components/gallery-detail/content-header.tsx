"use client";

import { ImageIcon, CheckSquare, Square, ImagePlus } from "lucide-react";

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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
          <ImageIcon size={24} />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Photos de la galerie
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className={`text-sm font-bold ${isLimitReached ? 'text-rose-500' : 'text-slate-500'}`}>
              {imageCount} / {maxImages}
            </p>
            {isLimitReached && (
              <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md uppercase tracking-widest">
                Quota plein
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleSelectAll}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 rounded-xl transition-all border border-slate-100"
        >
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          Tout sélectionner
        </button>

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
            className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg pointer-events-none ${
              isLimitReached 
                ? 'bg-slate-200 text-slate-400 shadow-none' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            <ImagePlus size={18} />
            Uploader
          </button>
        </div>
      </div>
    </div>
  );
}
