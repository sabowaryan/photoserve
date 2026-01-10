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
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center flex flex-col items-center group hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden">
        {!isLimitReached && (
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            onChange={(e) => onUpload(Array.from(e.target.files || []))}
          />
        )}
        <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner transition-all duration-500 ${
          isLimitReached 
            ? 'bg-slate-50 text-slate-200' 
            : 'bg-slate-50 text-slate-300 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-600'
        }`}>
          <FileUp size={48} />
        </div>
        <h4 className="text-2xl font-black text-slate-900 mb-2">Votre galerie est vide</h4>
        <p className="text-slate-500 font-medium mb-8 max-w-xs">
          {isLimitReached 
            ? "Limite atteinte pour ce plan. Supprimez des photos ou passez au plan supérieur."
            : "Glissez vos photos ici ou cliquez pour commencer l'envoi."
          }
        </p>
        {!isLimitReached && (
          <div className="px-8 py-4 bg-indigo-600 text-white font-extrabold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2">
            <Plus size={22} />
            Sélectionner des photos
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
      {images.map((img) => {
        const isSelected = selectedIds.has(img.id);
        return (
          <div 
            key={img.id} 
            onClick={(e) => onToggleSelection(img.id, e)}
            className={`group relative aspect-square rounded-[2rem] overflow-hidden border-4 transition-all duration-500 cursor-pointer animate-in zoom-in ${
              isSelected 
                ? 'border-indigo-600 scale-[0.98] shadow-2xl ring-8 ring-indigo-50' 
                : 'border-white shadow-md hover:border-slate-100'
            }`}
          >
            <img 
              src={img.cloudinary_url} 
              alt="" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
            
            {/* Selection indicator */}
            <div className={`absolute top-5 left-5 w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center z-20 ${
              isSelected 
                ? 'bg-indigo-600 border-indigo-600 text-white scale-110' 
                : 'bg-black/20 border-white text-white opacity-0 group-hover:opacity-100'
            }`}>
              {isSelected && <Check size={18} strokeWidth={3} />}
            </div>

            {/* Hover overlay with actions */}
            <div className="absolute inset-x-0 bottom-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between z-10">
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-xl text-[10px] font-black text-white uppercase tracking-wider">
                {img.file_size_mb.toFixed(1)} Mo
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(img.cloudinary_url, '_blank'); }}
                  className="w-10 h-10 bg-white text-slate-700 rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-lg"
                >
                  <ExternalLink size={16} />
                </button>
                <button 
                  onClick={(e) => onDeleteSingle(img.id, e)}
                  className="w-10 h-10 bg-white text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
