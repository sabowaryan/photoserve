'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/shared/logo';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { href: '/features', label: 'Fonctionnalités' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/help', label: 'Aide' },
];

interface PublicHeaderProps {
  showBackButton?: boolean;
}

export function Header({ showBackButton = false }: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
              <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon size={20} />
            <span className="font-display text-xl font-bold gradient-text">PhotoServe</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/auth">Connexion</Link>
          </Button>
          <Button asChild className="btn-primary hidden sm:inline-flex">
            <Link href="/auth">Commencer</Link>
          </Button>
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border/50 mt-2 pt-4 flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth">Connexion</Link>
              </Button>
              <Button asChild className="w-full btn-primary">
                <Link href="/auth">Commencer</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
