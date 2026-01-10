"use client";

import { Maximize2, Download, ImageOff } from "lucide-react";

interface MasonryGridProps {
  images: { id: string; url: string }[];
  onImageClick: (index: number) => void;
  onDownload: (url: string, e: React.MouseEvent) => void;
}

export function MasonryGrid({ images, onImageClick, onDownload }: MasonryGridProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center text-slate-300 space-y-8 animate-in zoom-in">
        <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center shadow-inner">
          <ImageOff size={64} />
        </div>
        <p className="font-black text-2xl tracking-tight text-slate-400">
          Cette galerie ne contient aucune image.
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
      {images.map((img, index) => (
        <div 
          key={img.id}
          onClick={() => onImageClick(index)}
          className="group relative break-inside-avoid rounded-[3rem] overflow-hidden bg-white p-2 border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-700 cursor-zoom-in"
        >
          <div className="rounded-[2.5rem] overflow-hidden">
            <img 
              src={img.url} 
              className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110" 
              alt={`Photo ${index + 1}`} 
              loading="lazy"
            />
          </div>
          
          {/* Overlay on hover */}
          <div className="absolute inset-2 bg-indigo-950/20 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center rounded-[2.5rem]">
            <div className="p-6 bg-white/20 backdrop-blur-xl rounded-[2rem] text-white shadow-2xl scale-75 group-hover:scale-100 transition-all duration-700 border border-white/20">
              <Maximize2 size={32} strokeWidth={2.5} />
            </div>
            
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center text-white text-[11px] font-black uppercase tracking-[0.2em] translate-y-4 group-hover:translate-y-0 transition-all duration-700">
              <span className="bg-slate-950/40 px-4 py-2 rounded-full backdrop-blur-md">
                Pksnd #{index + 1}
              </span>
              <button 
                onClick={(e) => onDownload(img.url, e)}
                className="bg-white text-indigo-950 p-3 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-xl"
              >
                <Download size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
