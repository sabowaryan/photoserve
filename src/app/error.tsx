'use client';

import Link from 'next/link';
import { ServerCrash, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
      <div className="max-w-screen-lg w-full text-center space-y-8">
        {/* Animated 500 */}
        <div className="relative">
          <h1 className="text-[150px] sm:text-[200px] font-black text-destructive/10 leading-none select-none">
            500
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-6">
              <ServerCrash className="w-16 h-16 text-destructive animate-pulse" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">
            Erreur interne du serveur
          </h2>
          <p className="text-lg text-muted-foreground">
            Nous rencontrons des difficultés techniques. 
            Notre équipe a été notifiée et travaille à résoudre le problème.
          </p>
        </div>

        {/* Status */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="font-medium text-destructive">Service temporairement indisponible</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Veuillez réessayer dans quelques minutes
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>

        {/* Support */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Le problème persiste ?
          </p>
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <a href="mailto:support@photoserve.app">
              <Mail className="w-4 h-4" />
              Contacter le support
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
