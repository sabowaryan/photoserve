"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { signOut } from "next-auth/react";
import { LogOut, Loader2, AlertCircle, X } from "lucide-react";

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
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut({ redirect: true, callbackUrl: "/" });
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    } finally {
      setIsLoggingOut(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl border border-rose-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600">
            <LogOut size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Déconnexion</p>
            <p className="text-xs text-slate-500">Terminer votre session</p>
          </div>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
        >
          Se déconnecter
        </button>
      </div>

      {/* Confirmation Modal */}
      {mounted && showConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isLoggingOut && setShowConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                  <AlertCircle size={24} />
                </div>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoggingOut}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2">
                Quitter PikSend ?
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Vous devrez vous reconnecter pour accéder à vos galeries.
              </p>
              
              <div className="flex flex-col gap-2">
                <button
                  disabled={isLoggingOut}
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Déconnexion...
                    </>
                  ) : (
                    <>
                      <LogOut size={16} />
                      Oui, me déconnecter
                    </>
                  )}
                </button>
                <button
                  disabled={isLoggingOut}
                  onClick={() => setShowConfirm(false)}
                  className="w-full px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
