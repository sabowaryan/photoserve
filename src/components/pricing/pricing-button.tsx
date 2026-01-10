'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Check, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

interface PricingButtonProps {
  planKey: 'free' | 'premium' | 'pro';
  interval?: 'monthly' | 'yearly';
  currentPlan?: string;
  variant?: 'default' | 'outline';
  className?: string;
  children: React.ReactNode;
}

// Plan hierarchy for upgrade/downgrade detection
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  premium: 1,
  pro: 2,
};

export function PricingButton({
  planKey,
  interval = 'monthly',
  currentPlan,
  variant = 'default',
  className = '',
  children,
}: PricingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated' && !!session;
  const isCurrentPlan = isAuthenticated && currentPlan === planKey;
  const isFree = planKey === 'free';

  // Determine if this is an upgrade or downgrade
  const currentPlanLevel = PLAN_HIERARCHY[currentPlan || 'free'] ?? 0;
  const targetPlanLevel = PLAN_HIERARCHY[planKey] ?? 0;
  const isDowngrade = isAuthenticated && targetPlanLevel < currentPlanLevel;

  const handleClick = async () => {
    // If not authenticated, redirect to auth
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    // If current plan, do nothing
    if (isCurrentPlan) {
      return;
    }

    // For downgrade, redirect to Stripe portal
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

    // If free plan and user is on free, redirect to dashboard
    if (isFree && currentPlan === 'free') {
      router.push('/dashboard');
      return;
    }

    // For upgrades, create Stripe checkout session
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

  // Button text logic
  const getButtonText = () => {
    if (isLoading) return null;
    if (isCurrentPlan) return (
      <>
        <Check className="h-4 w-4 mr-2" />
        Plan actuel
      </>
    );
    if (isDowngrade) return (
      <>
        <ArrowDown className="h-4 w-4 mr-2" />
        {isFree ? 'Annuler l\'abonnement' : 'Rétrograder'}
      </>
    );
    return children;
  };

  // Determine button variant for downgrade
  const buttonVariant = isDowngrade ? 'outline' : variant;

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || isCurrentPlan}
      variant={buttonVariant}
      className={`${className} ${isDowngrade ? 'text-slate-500 border-slate-300 hover:bg-slate-50' : ''}`}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      {getButtonText()}
    </Button>
  );
}
