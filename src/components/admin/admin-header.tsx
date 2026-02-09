"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Loader2, Shield } from "lucide-react";
import { LogoIcon } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { clearSessionCache } from "@/hooks/use-cached-session";

interface AdminHeaderProps {
  adminName: string;
  adminEmail: string;
}

/**
 * Admin Header Component
 * 
 * Fixed responsive header for the admin dashboard displaying:
 * - PikSend logo with admin badge
 * - Admin name and role indicator
 * - Sign out button
 * 
 * Requirements: 1.3
 */
export function AdminHeader({ adminName, adminEmail }: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      // Logout Supabase session
      await fetch("/api/auth/logout", { method: "POST" });

      // Clear session cache
      clearSessionCache();

      // Logout NextAuth (removes cookies)
      await signOut({ redirect: false });

      // Force un refresh complet pour vider tous les caches
      window.location.href = "/";
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-50">
      <div className="h-full px-3 sm:px-4 flex items-center justify-between">
        {/* Logo & Admin Badge */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
              <LogoIcon size={16} variant="white" className="sm:hidden" />
              <LogoIcon size={20} variant="white" className="hidden sm:block" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-lg tracking-tight text-white" dir="ltr">
                PikSend
              </span>
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                <Shield className="w-2.5 h-2.5" />
                Administration
              </span>
            </div>
          </Link>
        </div>

        {/* Admin Profile & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Admin Info - Hidden on small screens */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/50">
            <div className="text-right">
              <p className="text-xs font-bold text-white">
                {adminName}
              </p>
              <p className="text-[10px] text-slate-400">
                {adminEmail}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-slate-700 shadow-md flex items-center justify-center">
              <span className="text-xs font-black text-white">
                {adminName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Mobile Avatar - Shown only on small screens */}
          <div className="md:hidden w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-slate-700 shadow-md flex items-center justify-center">
            <span className="text-[10px] font-black text-white">
              {adminName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Role Badge - Hidden on mobile */}
          <div className="hidden sm:block px-2 py-1 rounded-md bg-amber-500/20 border border-amber-500/30">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Admin
            </span>
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" className="hidden sm:flex text-slate-300" />

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Se déconnecter"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Déconnexion...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Se déconnecter</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
