'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { MobileNav } from './mobile-nav';
import { LayoutDashboard, FolderOpen } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { GuestSessionManager } from '@/lib/guest/session';

export function LandingHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: session, status } = useSession();
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
      className={`fixed top-0 left-0 right-0 z-[100] transition-none border-b ${
        mobileOpen
          ? 'bg-white border-slate-200 py-2'
          : scrolled
            ? 'bg-white/80 backdrop-blur-xl border-slate-200/50 py-2 shadow-sm'
            : 'bg-transparent border-transparent py-3'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-1.5 group"
        >
          <div className="p-1 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
            <img 
              src="/icons/logo.svg" 
              alt="PikSend" 
              className="h-5 w-auto"
            />
          </div>
          <span className="font-display text-base font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            PikSend
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/features"
            className={`text-xs font-semibold transition-colors ${
              pathname === '/features'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-indigo-600'
            }`}
          >
            {t('nav.features')}
          </Link>
          <Link
            href="/pricing"
            className={`text-xs font-semibold transition-colors ${
              pathname === '/pricing'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-indigo-600'
            }`}
          >
            {t('nav.pricing')}
          </Link>
          <Link
            href="/help"
            className={`text-xs font-semibold transition-colors ${
              pathname === '/help'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-indigo-600'
            }`}
          >
            {t('nav.help')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" className="hidden sm:flex" />

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 transition-all shadow active:scale-95"
            >
              <LayoutDashboard size={14} />
              {t('nav.dashboard')}
            </Link>
          ) : (
            <>
              {hasGuestGalleries && (
                <Link
                  href="/my-galleries"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-50"
                >
                  <FolderOpen size={14} />
                  {t('myGalleries.title')}
                </Link>
              )}
              <button
                onClick={onLogin}
                className="hidden md:inline-flex px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-50"
              >
                {t('nav.signIn')}
              </button>
              <button
                onClick={onSignUp}
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 transition-all shadow active:scale-95"
              >
                {t('nav.getStarted')}
              </button>
            </>
          )}

          <MobileNav isOpen={mobileOpen} setIsOpen={setMobileOpen} />
        </div>
      </div>
    </header>
  );
}
