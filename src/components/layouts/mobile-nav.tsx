'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useCachedSession, clearSessionCache } from '@/hooks/use-cached-session';
import {
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Zap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Globe,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslation } from '@/lib/i18n/context';

type MobileNavProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function MobileNav({ isOpen, setIsOpen }: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: session, status } = useCachedSession();
  const isAuthenticated = status === 'authenticated' && !!session;

  const onLogin = () => {
    router.push('/auth');
    setIsOpen(false);
  };

  const onSignUp = () => {
    router.push('/auth');
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearSessionCache();
      await signOut({ redirect: false });
      // Force un refresh complet pour vider tous les caches
      window.location.href = "/";
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
    setIsOpen(false);
  };

  const links = [
    { id: 'features', labelKey: 'nav.features', icon: Sparkles, href: '/features' },
    { id: 'pricing', labelKey: 'nav.pricing', icon: Zap, href: '/pricing' },
    { id: 'help', labelKey: 'nav.help', icon: HelpCircle, href: '/help' },
  ];

  return (
    <>
      {/* Burger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-all active:scale-90 border border-slate-100"
        aria-label={t('common.open')}
      >
        <Menu size={18} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-xs bg-white shadow-xl animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-indigo-50 rounded-lg">
                  <img 
                    src="/icons/logo.svg" 
                    alt="PikSend" 
                    className="h-5 w-auto"
                  />
                </div>
                <span className="font-bold text-base text-slate-900" dir="ltr">PikSend</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {/* Language Switcher */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 mb-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Globe size={14} />
                  <span className="text-xs font-medium">{t('common.language')}</span>
                </div>
                <LanguageSwitcher variant="compact" />
              </div>

              {links.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} />
                      <span className="text-sm">{t(item.labelKey)}</span>
                    </div>
                    <ChevronRight size={14} className={isActive ? 'text-indigo-300' : 'text-slate-300'} />
                  </Link>
                );
              })}

              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg font-medium transition-all bg-indigo-50 text-indigo-600"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard size={16} />
                    <span className="text-sm">{t('nav.dashboard')}</span>
                  </div>
                  <ChevronRight size={14} className="text-indigo-300" />
                </Link>
              )}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 p-2.5 text-rose-600 font-medium rounded-lg hover:bg-rose-50 transition-all"
                >
                  <LogOut size={16} />
                  <span className="text-sm">{t('nav.signOut')}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onLogin}
                    className="py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-all text-xs"
                  >
                    {t('nav.signIn')}
                  </button>
                  <button
                    onClick={onSignUp}
                    className="py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-all text-xs"
                  >
                    {t('nav.getStarted')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
