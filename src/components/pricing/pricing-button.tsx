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
      return <Loader2 className="animate-spin" size={18} />;
    }
    
    if (isCurrentPlan) {
      return (
        <span className="flex items-center justify-center gap-2">
          <Check size={16} />
          Plan actuel
        </span>
      );
    }
    
    if (isDowngrade) {
      return (
        <span className="flex items-center justify-center gap-2">
          <ArrowDown size={16} />
          {isFree ? 'Annuler l\'abonnement' : 'Rétrograder'}
        </span>
      );
    }
    
    return (
      <span className="flex items-center justify-center gap-2">
        {children}
        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
      </span>
    );
  };

  const getButtonStyles = () => {
    if (isCurrentPlan) {
      return 'bg-emerald-100 text-emerald-700 cursor-default';
    }
    
    if (isDowngrade) {
      return 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200';
    }
    
    return className;
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
