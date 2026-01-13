"use client";

import { Loader2 } from "lucide-react";

interface UploadingFile {
  id: string;
  preview: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

interface UploadQueueProps {
  items: UploadingFile[];
}

export function UploadQueue({ items }: UploadQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 animate-in slide-in-from-top-4">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="relative aspect-square rounded-2xl overflow-hidden border-2 border-indigo-400 bg-slate-50 shadow-lg shadow-indigo-100/50"
        >
          <img src={item.preview} alt="" className="w-full h-full object-cover blur-sm opacity-40" />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex flex-col items-center justify-center p-4">
            {/* Circular progress */}
            <div className="relative w-14 h-14 mb-3">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="28" 
                  cy="28" 
                  r="24" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="transparent" 
                  className="text-white/30" 
                />
                <circle 
                  cx="28" 
                  cy="28" 
                  r="24" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="transparent" 
                  strokeDasharray={150.8} 
                  strokeDashoffset={150.8 - (150.8 * item.progress) / 100} 
                  strokeLinecap="round"
                  className="text-indigo-600 transition-all duration-300" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {item.status === 'done' ? (
                  <span className="text-xs font-black text-indigo-600">✓</span>
                ) : (
                  <span className="text-xs font-black text-indigo-600">{Math.round(item.progress)}%</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-indigo-600">
              <Loader2 size={12} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Upload...
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
