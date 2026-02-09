'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCachedSession } from '@/hooks/use-cached-session';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { MobileNav } from './mobile-nav';
import { LayoutDashboard, FolderOpen } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { GuestSessionManager } from '@/lib/guest/session';

export function LandingHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: session, status } = useCachedSession();
  const isAuthenticated = status === 'authenticated' && !!session;
  const isLandingPage = pathname === '/';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasGuestGalleries, setHasGuestGalleries] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      const sessionManager = new GuestSessionManager();
      const token = sessionManager.getSessionToken();
      if (token) {
        fetch('/api/guest/galleries', {
          headers: { 'x-guest-token': token },
        })
          .then(res => res.json())
          .then(data => {
            setHasGuestGalleries(data.galleries?.length > 0);
          })
          .catch(() => setHasGuestGalleries(false));
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (mobileOpen) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogoClick = () => {
    if (isLandingPage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/');
    }
  };

  const onLogin = () => router.push('/auth');
  const onSignUp = () => router.push('/auth');

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b ${mobileOpen
          ? 'bg-background border-border py-2'
          : scrolled
            ? 'bg-background/80 backdrop-blur-md border-border/50 py-2 shadow-sm'
            : 'bg-transparent border-transparent py-4'
        }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 group transition-transform active:scale-95"
        >
          <div className="logo-wrapper group-hover:opacity-90 transition-opacity p-1.5 rounded-xl bg-primary/5">
            <img
              src="/icons/logo.svg"
              alt="PikSend"
              className="h-6 w-auto"
            />
          </div>
          <span className="font-display text-lg font-extrabold tracking-tight brand-text" dir="ltr">
            PikSend
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { href: '/features', label: t('nav.features') },
            { href: '/pricing', label: t('nav.pricing') },
            { href: '/help', label: t('nav.help') },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${pathname === link.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="compact" className="hidden sm:flex" />

          {isAuthenticated ? (
            <Button
              asChild
              size="sm"
              className="hidden sm:flex items-center gap-2 font-semibold shadow-md rounded-xl"
            >
              <Link href="/dashboard">
                <LayoutDashboard size={14} />
                {t('nav.dashboard')}
              </Link>
            </Button>
          ) : (
            <>
              {hasGuestGalleries && (
                <Button variant="ghost" size="sm" asChild className="hidden md:flex items-center gap-2 font-medium">
                  <Link href="/my-galleries">
                    <FolderOpen size={14} />
                    {t('myGalleries.title')}
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogin}
                className="hidden md:inline-flex font-medium"
              >
                {t('nav.signIn')}
              </Button>
              <Button
                size="sm"
                onClick={onSignUp}
                className="hidden sm:flex items-center gap-2 font-semibold shadow-md rounded-xl"
              >
                {t('nav.getStarted')}
              </Button>
            </>
          )}

          <MobileNav isOpen={mobileOpen} setIsOpen={setMobileOpen} />
        </div>
      </div>
    </header>
  );
}

