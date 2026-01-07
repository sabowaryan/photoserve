'use client';

import { ServerCrash, RefreshCw, Home, Mail } from 'lucide-react';
import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="fr">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-red-50 flex items-center justify-center p-4">
          <div className="max-w-screen-lg w-full text-center space-y-8">
            {/* Animated 500 */}
            <div className="relative">
              <h1 className="text-[150px] sm:text-[200px] font-black text-red-100 leading-none select-none">
                500
              </h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-full p-6">
                  <ServerCrash className="w-16 h-16 text-red-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">
                Erreur critique
              </h2>
              <p className="text-lg text-slate-600">
                Une erreur inattendue s&apos;est produite. 
                Notre équipe a été notifiée et travaille à résoudre le problème.
              </p>
            </div>

            {/* Status */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="font-medium text-red-600">Service temporairement indisponible</span>
              </div>
              <p className="text-sm text-slate-600">
                Veuillez réessayer dans quelques minutes
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
              <a 
                href="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-md hover:bg-slate-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                Retour à l&apos;accueil
              </a>
            </div>

            {/* Support */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-3">
                Le problème persiste ?
              </p>
              <a 
                href="mailto:support@piksend.com"
                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contacter le support
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
