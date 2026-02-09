/**
 * Subscription Success Component
 * Shows immediate confirmation feedback after successful upgrade
 * 
 * @module components/subscription/subscription-success
 * Requirement: 24.1 - Immediate confirmation feedback
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export function SubscriptionSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      setShow(true);
      
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#ec4899'],
      });

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShow(false);
        // Clean up URL
        router.replace('/settings');
      }, 10000);

      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-in zoom-in duration-700">
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce">
              <Sparkles className="w-8 h-8 text-amber-400 fill-amber-400" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Bienvenue dans Premium !
          </h2>
          <p className="text-slate-600 font-medium">
            Votre essai gratuit de 14 jours commence maintenant. Profitez de toutes les fonctionnalités sans limite.
          </p>
        </div>

        {/* Benefits List */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Vous avez maintenant accès à :
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>100 galeries actives</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>100 Go de stockage</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Téléchargement ZIP</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Watermark personnalisé</span>
            </li>
          </ul>
        </div>

        {/* Trial Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800 font-medium">
            💳 Aucun paiement avant 14 jours. Annulez à tout moment sans frais.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setShow(false);
            router.replace('/settings');
          }}
          className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:from-indigo-700 hover:to-violet-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 group"
        >
          Commencer à créer
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
