"use client";

import { createPortal } from "react-dom";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ count, onConfirm, onCancel }: DeleteModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in" 
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in slide-in-from-bottom-4">
        <div className="p-8 sm:p-10">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6 shadow-inner">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
            Supprimer {count} photo{count > 1 ? 's' : ''} ?
          </h3>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            Cette action est définitive. Les fichiers seront immédiatement purgés et ne pourront pas être récupérés.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all"
            >
              Annuler
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Oui, supprimer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
