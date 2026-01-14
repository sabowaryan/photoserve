"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Settings, X, Home, Bell, Menu, Crown, HelpCircle, ExternalLink, ChevronRight, Zap, Plus } from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SignOutButton } from "@/app/(dashboard)/dashboard/sign-out-button";
import { useTranslation } from "@/lib/i18n/context";

interface DashboardHeaderProps {
  userName: string;
  userPlan: "free" | "premium" | "pro";
  userAvatar?: string | null;
}

export function DashboardHeader({ userName, userPlan, userAvatar }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

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

  const planConfig = {
    free: { 
      labelKey: "dashboard.plans.free", 
      bg: "bg-slate-100", 
      text: "text-slate-700", 
      gradient: "from-slate-400 to-slate-500",
      icon: Zap
    },
    premium: { 
      labelKey: "dashboard.plans.premium", 
      bg: "bg-indigo-50", 
      text: "text-indigo-700", 
      gradient: "from-indigo-500 to-violet-600",
      icon: Crown
    },
    pro: { 
      labelKey: "dashboard.plans.pro", 
      bg: "bg-purple-50", 
      text: "text-purple-700", 
      gradient: "from-purple-500 to-pink-600",
      icon: Zap
    },
  };

  const currentPlan = planConfig[userPlan];
  const currentPlanLabel = t(currentPlan.labelKey);
  const PlanIcon = currentPlan.icon;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 md:mx-6 mt-4">
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50">
            <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Image 
                    src="/icons/logo.svg" 
                    alt="PikSend" 
                    width={24} 
                    height={24}
                  />
                </div>
                <span className="hidden sm:block font-black text-xl bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  PikSend
                </span>
              </Link>

              {/* Central Navigation (Desktop) */}
              <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    isDashboardActive
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Home size={16} />
                  {t('nav.dashboard')}
                </Link>
                <Link
                  href="/settings"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    isSettingsActive
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Settings size={16} />
                  {t('nav.settings')}
                </Link>
              </nav>

              {/* Right Actions */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-all text-slate-500 hover:text-slate-700">
                  <Bell size={18} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full" />
                </button>

                {/* Language Switcher */}
                <LanguageSwitcher variant="compact" className="hidden md:flex" />

                {/* Sign Out (Desktop) */}
                <div className="hidden md:block">
                  <SignOutButton variant="icon" />
                </div>

                {/* Profile (Desktop) */}
                <Link 
                  href="/settings" 
                  className="hidden md:flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl hover:bg-slate-50 transition-all group"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md overflow-hidden">
                    {userAvatar ? (
                      <Image src={userAvatar} alt={userName} width={36} height={36} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-white">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                      {userName}
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${currentPlan.text}`}>
                      {currentPlanLabel}
                    </span>
                  </div>
                </Link>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
                  aria-label="Menu"
                >
                  <Menu size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Redesigned */}
      {mounted && isMobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-over Panel */}
          <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-[300px] bg-gradient-to-b from-white to-slate-50 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            
            {/* Header with gradient */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
              
              <div className="relative px-3.5 pt-3.5 pb-4">
                {/* Close button */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white/80 hover:text-white"
                >
                  <X size={16} />
                </button>

                {/* Profile Card */}
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20 overflow-hidden">
                    {userAvatar ? (
                      <Image src={userAvatar} alt={userName} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-white">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">{userName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <PlanIcon size={10} className="text-white/80" />
                      <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                        {currentPlanLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="px-3 -mt-3 relative z-10">
              <Link
                href="/dashboard/gallery/new"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-white rounded-lg shadow-lg border border-slate-100 font-bold text-sm text-indigo-600 hover:bg-indigo-50 transition-all"
              >
                <Plus size={16} />
                {t('dashboard.newGallery')}
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2">
                Navigation
              </p>
              
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-bold text-sm transition-all group ${
                  isDashboardActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-white hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-md ${isDashboardActive ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
                    <Home size={14} className={isDashboardActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-500'} />
                  </div>
                  <span>{t('nav.dashboard')}</span>
                </div>
                <ChevronRight size={14} className="text-slate-300" />
              </Link>

              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-bold text-sm transition-all group ${
                  isSettingsActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-white hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-md ${isSettingsActive ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
                    <Settings size={14} className={isSettingsActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-500'} />
                  </div>
                  <span>{t('nav.settings')}</span>
                </div>
                <ChevronRight size={14} className="text-slate-300" />
              </Link>

              {/* Upgrade Card (for free users) */}
              {userPlan === "free" && (
                <div className="mt-4 p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white relative overflow-hidden">
                  <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Crown size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">{t('dashboard.plans.premium')}</span>
                    </div>
                    <p className="font-bold text-sm mb-2">{t('common.upgradeLevel')}</p>
                    <Link
                      href="/settings?upgrade=true"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-white text-indigo-600 font-bold text-xs rounded-lg hover:bg-white/90 transition-all"
                    >
                      {t('pricing.selectPlan')}
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Help Section */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2">
                  {t('common.help')}
                </p>
                <a
                  href="#"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-white hover:text-slate-700 transition-all"
                >
                  <HelpCircle size={14} />
                  <span className="text-xs font-medium">{t('common.helpCenter')}</span>
                </a>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <SignOutButton variant="full" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
