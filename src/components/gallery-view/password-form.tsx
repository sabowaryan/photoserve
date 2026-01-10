"use client";

import { useState } from "react";
import { Lock, AlertTriangle, Loader2, Calendar, ArrowRight } from "lucide-react";
import Image from "next/image";

interface PasswordFormProps {
  title: string;
  expiresAt: string;
  backgroundImage?: string;
  onSubmit: (password: string) => Promise<boolean>;
}

export function PasswordForm({ title, expiresAt, backgroundImage, onSubmit }: PasswordFormProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(3);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts <= 0) return;
    
    setIsLoading(true);
    setError(null);

    const success = await onSubmit(password);
    
    if (!success) {
      const nextAttempts = attempts - 1;
      setAttempts(nextAttempts);
      setError(
        nextAttempts > 0 
          ? `Mot de passe incorrect. ${nextAttempts} tentative${nextAttempts > 1 ? 's' : ''} restante${nextAttempts > 1 ? 's' : ''}.`
          : "Accès bloqué. Trop de tentatives."
      );
    }
    
    setIsLoading(false);
  };

  const formatExpirationDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        {backgroundImage && (
          <img 
            src={backgroundImage} 
            className="w-full h-full object-cover opacity-20 blur-3xl scale-125" 
            alt="" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/80 to-slate-950" />
      </div>

      <div className="w-full max-w-lg z-10 animate-in slide-in-from-bottom-6 duration-1000">
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-10 sm:p-16 shadow-[0_32px_120px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="p-6 bg-indigo-50 rounded-[2rem] text-indigo-600 shadow-xl border border-indigo-100 mb-8 transform hover:scale-105 transition-transform duration-500">
              <Image 
                src="/icons/logo.svg" 
                alt="PikSend" 
                width={48} 
                height={48}
              />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-3 leading-tight">
              {title}
            </h1>
            <p className="text-indigo-200/40 text-sm font-bold uppercase tracking-widest">
              Galerie Sécurisée
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-8">
            <div className="space-y-3">
              <div className="relative group">
                <Lock 
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors" 
                  size={20} 
                />
                <input
                  type="password"
                  required
                  disabled={attempts <= 0}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-white placeholder:text-white/20 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-lg disabled:opacity-20"
                  placeholder="Entrez le mot de passe"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="px-6 py-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black rounded-2xl animate-in shake-in flex items-center gap-3 uppercase tracking-wider">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || attempts <= 0}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-4 active:scale-95 group/btn overflow-hidden relative disabled:bg-slate-800 disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <>
                  <span className="text-xl">Ouvrir l'album</span>
                  <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shine_1.5s_infinite] pointer-events-none" />
            </button>
          </form>

          <div className="mt-14 pt-10 border-t border-white/5 flex flex-col items-center gap-4 text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
            <div className="flex items-center gap-3">
              <Calendar size={14} /> 
              Expire le {formatExpirationDate(expiresAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
