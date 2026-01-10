"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Loader2, Shield } from "lucide-react";
import { LogoIcon } from "@/components/shared/logo";

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

      // Logout NextAuth (removes cookies)
      await signOut({
        redirect: true,
        callbackUrl: "/",
      });
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-slate-900 border-b border-slate-800 z-50">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Logo & Admin Badge */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/admin" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
              <LogoIcon size={20} className="text-white sm:hidden" />
              <LogoIcon size={24} className="text-white hidden sm:block" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white">
                PikSend
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                <Shield className="w-3 h-3" />
                Administration
              </span>
            </div>
          </Link>
        </div>

        {/* Admin Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Admin Info - Hidden on small screens */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50">
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                {adminName}
              </p>
              <p className="text-xs text-slate-400">
                {adminEmail}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-slate-700 shadow-lg flex items-center justify-center">
              <span className="text-sm font-black text-white">
                {adminName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Mobile Avatar - Shown only on small screens */}
          <div className="md:hidden w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-slate-700 shadow-lg flex items-center justify-center">
            <span className="text-sm font-black text-white">
              {adminName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Role Badge - Hidden on mobile */}
          <div className="hidden sm:block px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Admin
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Se déconnecter"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Déconnexion...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Se déconnecter</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
