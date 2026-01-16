"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { clearSessionCache } from "@/hooks/use-cached-session";

interface SignOutButtonProps {
  variant?: "icon" | "full";
}

export function SignOutButton({ variant = "icon" }: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // 1️⃣ Logout Supabase
      await fetch("/api/auth/logout", { method: "POST" });

      // 2️⃣ Clear session cache
      clearSessionCache();

      // 3️⃣ Logout NextAuth (supprime les cookies) - sans redirection auto
      await signOut({ redirect: false });

      // 4️⃣ Force un refresh complet de la page pour vider tous les caches
      window.location.href = "/";
    } catch (error) {
      setIsLoading(false);
    }
  };

  if (variant === "full") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
            Déconnexion...
          </>
        ) : (
          <>
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
            Se déconnecter
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="p-2.5 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Se déconnecter"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 text-slate-600 animate-spin" strokeWidth={2.5} />
      ) : (
        <LogOut className="w-5 h-5 text-slate-600" strokeWidth={2.5} />
      )}
    </button>
  );
}
