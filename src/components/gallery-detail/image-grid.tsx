"use client";

import { Check, ExternalLink, Trash2, FileUp, Plus } from "lucide-react";

interface GalleryImage {
  id: string;
  cloudinary_url: string;
  file_size_mb: number;
}

interface ImageGridProps {
  images: GalleryImage[];
  selectedIds: Set<string>;
  isLimitReached: boolean;
  onToggleSelection: (id: string, e: React.MouseEvent) => void;
  onDeleteSingle: (id: string, e: React.MouseEvent) => void;
  onUpload: (files: File[]) => void;
}

export function ImageGrid({ 
  images, 
  selectedIds, 
  isLimitReached, 
  onToggleSelection, 
  onDeleteSingle,
  onUpload 
}: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 sm:p-16 text-center flex flex-col items-center group hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden">
        {!isLimitReached && (
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            onChange={(e) => onUpload(Array.from(e.target.files || []))}
          />
        )}
        
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-inner transition-all duration-300 ${
          isLimitReached 
            ? 'bg-slate-100 text-slate-300' 
            : 'bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-600'
        }`}>
          <FileUp size={40} />
        </div>
        
        <h4 className="text-xl font-black text-slate-900 mb-2">Votre galerie est vide</h4>
        <p className="text-slate-500 font-medium mb-6 max-w-xs text-sm">
          {isLimitReached 
            ? "Limite atteinte. Supprimez des photos ou passez au plan supérieur."
            : "Glissez vos photos ici ou cliquez pour commencer."
          }
        </p>
        
        {!isLimitReached && (
          <div className="relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 group-hover:shadow-xl transition-all">
            <Plus size={18} />
            Sélectionner des photos
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {images.map((img) => {
        const isSelected = selectedIds.has(img.id);
        return (
          <div 
            key={img.id} 
            onClick={(e) => onToggleSelection(img.id, e)}
            className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
              isSelected 
                ? 'border-indigo-500 ring-4 ring-indigo-500/20 scale-[0.98]' 
                : 'border-transparent hover:border-slate-200 shadow-sm hover:shadow-md'
            }`}
          >
            <img 
              src={img.cloudinary_url} 
              alt="" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
            
            {/* Selection indicator */}
            <div className={`absolute top-3 left-3 w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center z-20 ${
              isSelected 
                ? 'bg-indigo-600 border-indigo-600 text-white scale-100' 
                : 'bg-black/30 border-white/70 text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
            }`}>
              {isSelected && <Check size={14} strokeWidth={3} />}
            </div>

            {/* Hover overlay with actions */}
            <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-center justify-between z-10">
              <div className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                {img.file_size_mb.toFixed(1)} Mo
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(img.cloudinary_url, '_blank'); }}
                  className="w-8 h-8 bg-white/90 text-slate-700 rounded-lg hover:bg-white transition-all flex items-center justify-center"
                >
                  <ExternalLink size={14} />
                </button>
                <button 
                  onClick={(e) => onDeleteSingle(img.id, e)}
                  className="w-8 h-8 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
