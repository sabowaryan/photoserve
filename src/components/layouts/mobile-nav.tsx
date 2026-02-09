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
import { Button } from '@/components/ui/button';
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
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="md:hidden h-10 w-10 bg-background/90 backdrop-blur-sm text-primary hover:text-primary hover:bg-background active:scale-95 rounded-xl border-border shadow-sm"
        aria-label={t('common.open')}
      >
        <Menu size={24} strokeWidth={2.5} />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-xs bg-background shadow-2xl animate-in slide-in-from-right duration-400 flex flex-col">
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="logo-wrapper p-1 rounded-lg bg-primary/5">
                  <img
                    src="/icons/logo.svg"
                    alt="PikSend"
                    className="h-5 w-auto"
                  />
                </div>
                <span className="font-display font-extrabold text-lg brand-text" dir="ltr">PikSend</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
                aria-label={t('common.close')}
              >
                <X size={20} />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {/* Language Switcher */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 mb-4 border border-border/40">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Globe size={16} />
                  <span className="text-sm font-semibold">{t('common.language')}</span>
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
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl font-semibold transition-all ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span className="text-sm">{t(item.labelKey)}</span>
                    </div>
                    <ChevronRight size={16} className={isActive ? 'text-primary/40' : 'text-muted-foreground/30'} />
                  </Link>
                );
              })}

              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl font-bold transition-all bg-primary/10 text-primary mt-2 shadow-sm border border-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard size={18} />
                    <span className="text-sm">{t('nav.dashboard')}</span>
                  </div>
                  <ChevronRight size={16} className="text-primary/40" />
                </Link>
              )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border/60 space-y-3 bg-muted/10">
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-start gap-3 p-4 text-destructive font-bold rounded-xl hover:bg-destructive/5 hover:text-destructive transition-all"
                >
                  <LogOut size={18} />
                  <span className="text-sm">{t('nav.signOut')}</span>
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={onLogin}
                    className="font-bold rounded-xl text-xs py-5"
                  >
                    {t('nav.signIn')}
                  </Button>
                  <Button
                    onClick={onSignUp}
                    className="font-bold rounded-xl shadow-lg shadow-primary/20 text-xs py-5"
                  >
                    {t('nav.getStarted')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
