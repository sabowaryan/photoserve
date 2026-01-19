'use client';

import { useState } from 'react';
import { useCachedSession } from '@/hooks/use-cached-session';
import { useRouter } from 'next/navigation';
import { Loader2, Check, ArrowDown, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface PricingButtonProps {
  planKey: 'free' | 'premium' | 'pro';
  interval?: 'monthly' | 'yearly';
  currentPlan?: string;
  variant?: 'default' | 'outline';
  className?: string;
  children: React.ReactNode;
}

const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  premium: 1,
  pro: 2,
};

export function PricingButton({
  planKey,
  interval = 'monthly',
  currentPlan,
  className = '',
  children,
}: PricingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useCachedSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated' && !!session;
  const isCurrentPlan = isAuthenticated && currentPlan === planKey;
  const isFree = planKey === 'free';

  const currentPlanLevel = PLAN_HIERARCHY[currentPlan || 'free'] ?? 0;
  const targetPlanLevel = PLAN_HIERARCHY[planKey] ?? 0;
  const isDowngrade = isAuthenticated && targetPlanLevel < currentPlanLevel;

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (isCurrentPlan) {
      return;
    }

    if (isDowngrade) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/stripe/portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de l'accès au portail");
        }

        if (data.url) {
          window.location.href = data.url;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Impossible d'accéder au portail";
        toast.error(errorMessage);
        setIsLoading(false);
      }
      return;
    }

    if (isFree && currentPlan === 'free') {
      router.push('/dashboard');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, interval }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de créer la session de paiement';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={16} />
          <span>Chargement...</span>
        </span>
      );
    }
    
    if (isCurrentPlan) {
      return (
        <span className="flex items-center justify-center gap-2">
          <Check size={16} strokeWidth={3} />
          <span className="font-bold">Plan actuel</span>
        </span>
      );
    }
    
    if (isDowngrade) {
      return (
        <span className="flex items-center justify-center gap-2">
          <ArrowDown size={16} />
          <span className="font-semibold">{isFree ? 'Annuler l\'abonnement' : 'Rétrograder'}</span>
        </span>
      );
    }
    
    if (!isAuthenticated) {
      return (
        <span className="flex items-center justify-center gap-2">
          <span className="font-semibold">{children}</span>
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      );
    }
    
    return (
      <span className="flex items-center justify-center gap-2">
        <span className="font-semibold">{children}</span>
        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
      </span>
    );
  };

  const getButtonStyles = () => {
    // Base styles that are always applied
    const baseStyles = 'w-full py-2.5 rounded-lg text-sm transition-all';
    
    if (isCurrentPlan) {
      return `${baseStyles} bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 cursor-default hover:shadow-xl hover:shadow-emerald-500/30`;
    }
    
    if (isDowngrade) {
      return `${baseStyles} bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow`;
    }
    
    // For upgrade/normal state, use the className passed from parent
    return `${baseStyles} ${className}`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isCurrentPlan}
      className={`group flex items-center justify-center transition-all active:scale-[0.98] disabled:cursor-not-allowed ${getButtonStyles()}`}
    >
      {getButtonContent()}
    </button>
  );
}
