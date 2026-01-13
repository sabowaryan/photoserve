"use client";

import { UploadCloud, Sparkles } from "lucide-react";

interface DragOverlayProps {
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function DragOverlay({ onDragOver, onDragLeave, onDrop }: DragOverlayProps) {
  return (
    <div 
      className="fixed inset-0 z-[200] bg-indigo-600/10 backdrop-blur-md border-4 border-dashed border-indigo-500 m-4 rounded-3xl flex items-center justify-center transition-all animate-in fade-in"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-violet-100 rounded-full blur-xl" />
        
        <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
          <UploadCloud size={40} className="animate-bounce" />
        </div>
        
        <div className="relative text-center">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Relâchez pour uploader
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h3>
          <p className="text-slate-500 font-medium mt-1">
            Vos photos seront ajoutées instantanément
          </p>
        </div>
      </div>
    </div>
  );
}
