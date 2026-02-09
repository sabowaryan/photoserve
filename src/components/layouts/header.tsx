'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCachedSession } from '@/hooks/use-cached-session';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { MobileNav } from './mobile-nav';

interface PublicHeaderProps {
  showBackButton?: boolean;
}

export function Header({ showBackButton = false }: PublicHeaderProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useCachedSession();
  const isAuthenticated = status === 'authenticated' && !!session;

  const navLinks = [
    { href: '/features', label: t('nav.features') },
    { href: '/pricing', label: t('nav.pricing') },
    { href: '/help', label: t('nav.help') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex h-9 w-9">
              <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
            <div className="logo-wrapper group-hover:opacity-90 transition-opacity p-1.5 rounded-xl bg-primary/5">
              <img
                src="/icons/logo.svg"
                alt="PikSend"
                className="h-6 w-auto"
              />
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight brand-text" dir="ltr">PikSend</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
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

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button asChild size="sm" className="hidden sm:inline-flex font-semibold shadow-sm rounded-xl">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {t('nav.dashboard')}
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex font-medium">
                <Link href="/auth">{t('nav.signIn')}</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex font-semibold shadow-sm rounded-xl">
                <Link href="/auth">{t('nav.getStarted')}</Link>
              </Button>
            </>
          )}

          <MobileNav
            isOpen={mobileMenuOpen}
            setIsOpen={setMobileMenuOpen}
          />
        </div>
      </div>
    </header>
  );
}
