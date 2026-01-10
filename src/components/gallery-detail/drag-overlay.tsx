"use client";

import { UploadCloud } from "lucide-react";

interface DragOverlayProps {
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function DragOverlay({ onDragOver, onDragLeave, onDrop }: DragOverlayProps) {
  return (
    <div 
      className="fixed inset-0 z-[200] bg-indigo-600/10 backdrop-blur-sm border-4 border-dashed border-indigo-500 m-4 rounded-[3rem] flex items-center justify-center transition-all animate-in fade-in"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
          <UploadCloud size={48} className="animate-bounce" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          Relâchez pour uploader
        </h3>
        <p className="text-slate-500 font-medium">
          Vos photos seront ajoutées instantanément.
        </p>
      </div>
    </div>
  );
}
