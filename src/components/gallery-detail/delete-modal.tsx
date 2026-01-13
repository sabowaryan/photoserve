"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X, ImageOff } from "lucide-react";

interface DeleteModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ count, onConfirm, onCancel }: DeleteModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-4 h-4 text-white/80" />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-5 pb-4 relative overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
          
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Supprimer {count} photo{count > 1 ? 's' : ''} ?
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Warning message */}
          <div className="bg-rose-50 rounded-xl p-3 mb-4 border border-rose-100">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ImageOff className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-900 mb-0.5">
                  Action irréversible
                </p>
                <p className="text-[10px] text-rose-700 leading-relaxed">
                  Les fichiers seront immédiatement purgés et ne pourront pas être récupérés.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={onCancel}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-sm rounded-lg shadow-lg shadow-rose-500/25 hover:from-rose-700 hover:to-pink-700 transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} />
              Oui, supprimer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
