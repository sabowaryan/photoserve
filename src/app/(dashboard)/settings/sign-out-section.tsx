"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { signOut } from "next-auth/react";
import { LogOut, Loader2, AlertCircle, X, ShieldAlert } from "lucide-react";

export function SignOutSection() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: true, callbackUrl: "/" });
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    } finally {
      setIsLoggingOut(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="pt-2 space-y-6">
      <div className="p-6 rounded-[2rem] bg-rose-50/30 border border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all hover:bg-rose-50/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-inner">
            <ShieldAlert size={24} />
          </div>
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Fin de session
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Déconnectez-vous de votre compte sur cet appareil.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-3 active:scale-95 group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Se déconnecter
        </button>
      </div>

      {/* Confirmation Modal - Portaled */}
      {mounted &&
        showConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => !isLoggingOut && setShowConfirm(false)}
            ></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
              <div className="p-8 sm:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                    <AlertCircle size={32} />
                  </div>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isLoggingOut}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                  Quitter PikSend ?
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-10">
                  Vous devrez vous reconnecter pour accéder à vos galeries et statistiques.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    disabled={isLoggingOut}
                    onClick={handleSignOut}
                    className="w-full px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                    {isLoggingOut ? "Déconnexion..." : "Oui, me déconnecter"}
                  </button>
                  <button
                    disabled={isLoggingOut}
                    onClick={() => setShowConfirm(false)}
                    className="w-full px-6 py-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded-2xl transition-all active:scale-[0.98]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
