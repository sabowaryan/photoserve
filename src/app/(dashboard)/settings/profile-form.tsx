"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ProfileFormProps {
  initialEmail: string;
  initialName: string;
}

export function ProfileForm({ initialEmail, initialName }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      setMessage({ type: "success", text: "Profil mis à jour avec succès" });
      router.refresh();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde du profil" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Email Field - Read Only */}
        <div className="space-y-2.5">
          <label
            htmlFor="email"
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1"
          >
            Adresse Email
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
              <Mail size={18} />
            </div>
            <input
              id="email"
              type="email"
              value={initialEmail}
              disabled
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-400 cursor-not-allowed outline-none ring-0 transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-wider">
                Lecture seule
              </div>
            </div>
          </div>
        </div>

        {/* Name Field - Editable */}
        <div className="space-y-2.5">
          <label
            htmlFor="name"
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1"
          >
            Nom Complet
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <User size={18} />
            </div>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom ou pseudonyme"
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none font-bold text-slate-900 placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : "bg-rose-50 text-rose-600 border border-rose-100"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="flex-1">{message.text}</span>
          {message.type === "success" && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving || (name === initialName && !message)}
          className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl overflow-hidden relative group/btn ${
            isSaving
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : name === initialName && !message
              ? "bg-slate-50 text-slate-300 border border-slate-200 shadow-none cursor-default"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
          }`}
        >
          {/* Animated background effect */}
          {!isSaving && name !== initialName && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shine_1.5s_infinite] pointer-events-none"></div>
          )}
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Sauvegarde en cours...</span>
            </>
          ) : (
            <>
              <Save className={`h-5 w-5 ${name !== initialName ? "animate-pulse" : ""}`} />
              <span>Enregistrer les modifications</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
