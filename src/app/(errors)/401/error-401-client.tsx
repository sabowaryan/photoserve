'use client';

import Link from 'next/link';
import { UserX, LogIn, Home, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error401Client() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-screen-lg w-full text-center space-y-8">
        {/* Animated 401 */}
        <div className="relative">
          <h1 className="text-[150px] sm:text-[200px] font-black text-primary/10 leading-none select-none">
            401
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-6">
              <UserX className="w-16 h-16 text-primary" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">
            Authentification requise
          </h2>
          <p className="text-lg text-muted-foreground">
            Vous devez être connecté pour accéder à cette page. 
            Connectez-vous ou créez un compte pour continuer.
          </p>
        </div>

        {/* Info box */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <p className="text-sm text-muted-foreground">
            PhotoServe vous permet de créer et partager des galeries photo sécurisées. 
            Inscrivez-vous gratuitement pour commencer !
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="gap-2">
            <Link href="/auth">
              <LogIn className="w-4 h-4" />
              Se connecter
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/auth?tab=register">
              <UserPlus className="w-4 h-4" />
              Créer un compte
            </Link>
          </Button>
        </div>

        {/* Home link */}
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <Home className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
