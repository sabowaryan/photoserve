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
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = name !== initialName;

  return (
    <form onSubmit={handleSaveProfile} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-bold text-slate-500 ml-1">
            Adresse email
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              id="email"
              type="email"
              value={initialEmail}
              disabled
              className="w-full pl-11 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-bold">
              Lecture seule
            </span>
          </div>
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-xs font-bold text-slate-500 ml-1">
            Nom complet
          </label>
          <div className="relative group">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-2 ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : "bg-rose-50 text-rose-700 border border-rose-100"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSaving || !hasChanges}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
          hasChanges
            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
      >
        {isSaving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Sauvegarde...
          </>
        ) : (
          <>
            <Save size={16} />
            Enregistrer
          </>
        )}
      </button>
    </form>
  );
}
