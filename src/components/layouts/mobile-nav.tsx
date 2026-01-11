'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Zap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';

type MobileNavProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function MobileNav({ isOpen, setIsOpen }: MobileNavProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session;

  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const onLogin = () => {
    router.push('/auth');
    setIsOpen(false);
  };

  const onSignUp = () => {
    router.push('/auth');
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
    setIsOpen(false);
  };

  const links = [
    {
      id: 'features',
      label: 'Fonctionnalités',
      icon: Sparkles,
      onClick: () => handleNavClick('features'),
    },
    {
      id: 'tarifs',
      label: 'Tarification',
      icon: Zap,
      onClick: () => handleNavClick('tarifs'),
    },
    {
      id: 'help',
      label: 'Aide',
      icon: HelpCircle,
      href: '/help',
    },
  ];

  return (
    <>
      {/* Burger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all active:scale-90 border border-slate-100"
        aria-label="Ouvrir le menu"
      >
        <Menu size={22} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                  <LogoIcon size={20} />
                </div>
                <span className="font-black text-xl tracking-tighter text-slate-900">
                  PikSend
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                aria-label="Fermer le menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">
                Menu Principal
              </div>

              {links.map((item) => {
                const Icon = item.icon;

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all text-slate-500 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <Icon size={20} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all text-slate-500 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <Icon size={20} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                );
              })}

              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all bg-indigo-50 text-indigo-600"
                >
                  <div className="flex items-center gap-4">
                    <LayoutDashboard size={20} />
                    <span className="text-sm">Dashboard</span>
                  </div>
                  <ChevronRight size={16} className="text-indigo-300" />
                </Link>
              )}
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-slate-50 space-y-4">
              {isAuthenticated ? (
                <>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">
                    Compte
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-4 p-4 text-rose-600 font-bold rounded-2xl hover:bg-rose-50 transition-all"
                  >
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <LogOut size={18} />
                    </div>
                    <span className="text-sm">Déconnexion</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={onLogin}
                    className="w-full py-4 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all text-sm"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={onSignUp}
                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm"
                  >
                    Commencer
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
