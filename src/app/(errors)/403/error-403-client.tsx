'use client';

import Link from 'next/link';
import { ShieldX, Home, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error403Client() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-500/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Animated 403 */}
        <div className="relative">
          <h1 className="text-[120px] sm:text-[140px] font-black text-orange-500/10 leading-none select-none">
            403
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-4">
              <ShieldX className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Accès refusé
          </h2>
          <p className="text-base text-muted-foreground">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page 
            ou cette ressource est protégée.
          </p>
        </div>

        {/* Reasons */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-left space-y-2">
          <p className="text-sm font-medium text-foreground">Raisons possibles :</p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              Vous n&apos;êtes pas connecté à votre compte
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              Votre abonnement ne donne pas accès à cette fonctionnalité
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              Cette galerie n&apos;est pas la vôtre
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="sm" className="gap-2">
            <Link href="/auth">
              <LogIn className="w-4 h-4" />
              Se connecter
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>

        {/* Back */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.history.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Page précédente
        </Button>
      </div>
    </div>
  );
}
