'use client';

import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-100/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl w-full text-center space-y-6 relative z-10">
        {/* Animated 404 */}
        <div className="relative">
          <h1 className="text-[120px] sm:text-[140px] font-black bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 bg-clip-text text-transparent leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-full p-4 shadow-xl shadow-indigo-500/20">
              <Search className="w-12 h-12 text-indigo-600 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            Page introuvable
          </h2>
          <p className="text-base text-slate-600">
            Désolé, la page que vous recherchez n&apos;existe pas, a été déplacée 
            ou n&apos;est temporairement plus disponible.
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-white/60 backdrop-blur-xl border border-indigo-100 rounded-xl p-4 text-left space-y-2 shadow-lg shadow-indigo-500/5">
          <p className="text-sm font-medium text-slate-900">Suggestions :</p>
          <ul className="text-sm text-slate-600 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600">•</span>
              Vérifiez l&apos;orthographe de l&apos;URL
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600">•</span>
              La galerie a peut-être expiré
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600">•</span>
              Le lien que vous avez suivi est peut-être obsolète
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="sm" className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25">
            <Link href="/">
              <Home className="w-4 h-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2 border-indigo-200 hover:bg-indigo-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Page précédente
          </Button>
        </div>
      </div>
    </div>
  );
}
