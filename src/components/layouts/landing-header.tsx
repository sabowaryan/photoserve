'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/shared/logo';
import { MobileNav } from './mobile-nav';
import { LayoutDashboard } from 'lucide-react';

export function LandingHeader() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon size={20} />
          <span className="font-display text-xl font-bold gradient-text">PikSend</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Fonctionnalités
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Tarifs
          </Link>
          <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Aide
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <Button asChild className="btn-primary hidden sm:inline-flex">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/auth">Connexion</Link>
              </Button>
              <Button asChild className="btn-primary hidden sm:inline-flex">
                <Link href="/auth">Créer une galerie</Link>
              </Button>
            </>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
