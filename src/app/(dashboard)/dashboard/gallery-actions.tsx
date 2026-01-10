"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Link, Trash2, Loader2, Check, AlertTriangle, X, Info } from "lucide-react";
import { toast } from "sonner";

interface GalleryActionsProps {
  galleryId: string;
  gallerySlug: string;
  galleryTitle?: string;
}

export function GalleryActions({ galleryId, gallerySlug, galleryTitle }: GalleryActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/g/${gallerySlug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur de copie :", err);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/galleries/${galleryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete gallery");
      }

      setShowConfirm(false);
      toast.success("Galerie supprimée avec succès");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de supprimer la galerie");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  // Toast Notification Component
  const toastContent = copied ? (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none px-4 w-full max-w-xs sm:max-w-none">
      <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl animate-in slide-in-from-bottom-4 zoom-in duration-300">
        <div className="bg-emerald-500 p-1.5 rounded-full text-white shrink-0">
          <Check size={14} strokeWidth={4} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight">Lien copié !</span>
          <span className="text-[10px] text-slate-400 font-medium leading-none">Prêt à être partagé</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Bouton Copier Lien */}
      <button
        onClick={handleShare}
        className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center relative group/share border ${
          copied
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-inner scale-95'
            : 'bg-white hover:bg-indigo-50 text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600 shadow-sm'
        }`}
        title="Copier le lien public"
      >
        {copied ? (
          <Check size={18} className="animate-in zoom-in duration-300" />
        ) : (
          <Link size={18} />
        )}
      </button>

      {/* Bouton Supprimer */}
      <button
        onClick={handleDeleteClick}
        disabled={isDeleting}
        className="p-2.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-sm relative group/del"
        title="Supprimer définitivement"
      >
        {isDeleting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Trash2 size={18} />
        )}
      </button>

      {/* Rendu du Toast via Portal */}
      {mounted && copied && createPortal(toastContent, document.body)}

      {/* Modale de Confirmation de Suppression */}
      {mounted && showConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => !isDeleting && setShowConfirm(false)}
          ></div>

          <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                  <AlertTriangle size={32} />
                </div>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                Supprimer cette galerie ?
              </h3>

              <div className="space-y-4 text-slate-500 mb-10">
                <p className="leading-relaxed font-medium">
                  Vous êtes sur le point de supprimer{" "}
                  <span className="text-slate-900 font-bold italic">
                    &quot;{galleryTitle || 'Sans titre'}&quot;
                  </span>.
                </p>

                <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex gap-3">
                  <Info size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-rose-700 leading-tight uppercase tracking-wider">
                    Attention : Toutes les photos seront supprimées et l&apos;accès client sera immédiatement coupé.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all active:scale-[0.98]"
                >
                  Annuler
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Oui, supprimer
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-50"></div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
