'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCachedSession } from '@/hooks/use-cached-session';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu, X, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex h-8 w-8">
              <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
          )}
          <Link href="/" className="flex items-center gap-1.5">
            <div className="p-1 bg-indigo-50 rounded-lg">
              <img 
                src="/icons/logo.svg" 
                alt="PikSend" 
                className="h-4 w-auto"
              />
            </div>
            <span className="font-display text-base font-bold brand-text" dir="ltr">PikSend</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs transition-colors ${
                pathname === link.href
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild size="sm" className="btn-primary hidden sm:inline-flex h-8 text-xs">
              <Link href="/dashboard">
                <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                {t('nav.dashboard')}
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex h-8 text-xs">
                <Link href="/auth">{t('nav.signIn')}</Link>
              </Button>
              <Button asChild size="sm" className="btn-primary hidden sm:inline-flex h-8 text-xs">
                <Link href="/auth">{t('nav.getStarted')}</Link>
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                  pathname === link.href
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border/50 mt-2 pt-3 flex flex-col gap-2">
              {isAuthenticated ? (
                <Button asChild size="sm" className="w-full btn-primary h-8 text-xs">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                    {t('nav.dashboard')}
                  </Link>
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                    <Link href="/auth">{t('nav.signIn')}</Link>
                  </Button>
                  <Button asChild size="sm" className="btn-primary h-8 text-xs">
                    <Link href="/auth">{t('nav.getStarted')}</Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
