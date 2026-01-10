"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Settings, X } from "lucide-react";
import { LogoIcon } from "@/components/shared/logo";
import { SignOutButton } from "@/app/(dashboard)/dashboard/sign-out-button";

interface DashboardHeaderProps {
  userName: string;
  userPlan: "free" | "premium" | "pro";
}

export function DashboardHeader({ userName, userPlan }: DashboardHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Determine active link
  const isDashboardActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/gallery");
  const isSettingsActive = pathname === "/settings";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const planLabel = userPlan === "free" ? "Gratuit" : userPlan === "premium" ? "Premium" : "Pro";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-50">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo & Branding */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
              <LogoIcon size={24} className="text-white" />
            </div>
            <span className="font-black text-2xl tracking-tight gradient-text">
              PikSend
            </span>
          </Link>

          {/* Central Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-full">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                isDashboardActive
                  ? "bg-white shadow-sm text-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/settings"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                isSettingsActive
                  ? "bg-white shadow-sm text-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Settings className="w-4 h-4" strokeWidth={2.5} />
              Paramètres
            </Link>
          </nav>

          {/* Actions & Profile (Right) */}
          <div className="flex items-center gap-4">
            {/* Search Bar (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 w-64">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher..."
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative p-2.5 rounded-xl hover:bg-slate-50 transition-all">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
            </button>

            {/* Sign Out Button (Desktop) */}
            <div className="hidden md:block">
              <SignOutButton variant="icon" />
            </div>

            {/* Profile Block (Desktop) */}
            <Link href="/settings" className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all group">
              <div className="text-right">
                <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {userName}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {planLabel}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 border-2 border-white shadow-lg flex items-center justify-center">
                <span className="text-sm font-black text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2.5 rounded-xl hover:bg-slate-50 transition-all"
              aria-label="Ouvrir le menu"
            >
              <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Slide-over */}
      {mounted && isMobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-over Panel */}
          <div className="absolute top-0 right-0 bottom-0 w-[85%] bg-white shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <span className="font-black text-xl gradient-text">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-50 transition-all"
                  aria-label="Fermer le menu"
                >
                  <X className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
                </button>
              </div>

              {/* Profile Section */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 border-2 border-white shadow-lg flex items-center justify-center">
                    <span className="text-xl font-black text-white">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">{userName}</p>
                    <span className="inline-block text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded mt-1">
                      {planLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-6 space-y-2">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                    isDashboardActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                    isSettingsActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Settings className="w-5 h-5" strokeWidth={2.5} />
                  Paramètres
                </Link>
              </nav>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200">
                <SignOutButton variant="full" />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
