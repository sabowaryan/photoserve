'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';

const navLinks = [
  { href: '/features', label: 'Fonctionnalités' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/help', label: 'Aide' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
        <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <LogoIcon size={20} />
              <span className="font-display text-lg font-bold gradient-text">PhotoServe</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center px-4 py-3 text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-3">
            {isAuthenticated ? (
              <Button asChild className="w-full btn-primary">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth" onClick={() => setOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button asChild className="w-full btn-primary">
                  <Link href="/auth" onClick={() => setOpen(false)}>
                    Créer une galerie
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
