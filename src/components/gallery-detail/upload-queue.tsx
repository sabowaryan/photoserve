"use client";

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
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 animate-in slide-in-from-top-4">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="relative aspect-square rounded-[2rem] overflow-hidden border-2 border-indigo-400 bg-slate-50 shadow-lg shadow-indigo-100/50"
        >
          <img src={item.preview} alt="" className="w-full h-full object-cover blur-sm opacity-50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative w-16 h-16 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="transparent" 
                  className="text-indigo-100" 
                />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="transparent" 
                  strokeDasharray={175.9} 
                  strokeDashoffset={175.9 - (175.9 * item.progress) / 100} 
                  className="text-indigo-600 transition-all duration-300" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-indigo-600">
                {Math.round(item.progress)}%
              </div>
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] animate-pulse">
              Upload...
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
