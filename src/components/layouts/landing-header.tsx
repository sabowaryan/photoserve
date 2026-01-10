'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LogoIcon } from '@/components/shared/logo';
import { MobileNav } from './mobile-nav';
import { LayoutDashboard } from 'lucide-react';

export function LandingHeader() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const onLogin = () => router.push('/auth');
  const onSignUp = () => router.push('/auth');

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b border-transparent ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl border-slate-200/50 py-3 shadow-sm' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 group"
        >
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-lg group-hover:scale-110 transition-transform">
            <LogoIcon size={20} />
          </div>
          <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-slate-900 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            PikSend
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => handleNavClick('features')} 
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Fonctionnalités
          </button>
          <button 
            onClick={() => handleNavClick('tarifs')} 
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Tarifs
          </button>
          <Link 
            href="/help" 
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Aide
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          ) : (
            <>
              <button 
                onClick={onLogin}
                className="hidden md:inline-flex px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors rounded-xl hover:bg-slate-50"
              >
                Connexion
              </button>
              <button 
                onClick={onSignUp}
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
              >
                Créer une galerie
              </button>
            </>
          )}
          
          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
