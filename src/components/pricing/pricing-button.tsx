'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PricingButtonProps {
  planKey: 'free' | 'premium' | 'pro';
  interval?: 'monthly' | 'yearly';
  currentPlan?: string;
  variant?: 'default' | 'outline';
  className?: string;
  children: React.ReactNode;
}

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

  const handleClick = async () => {
    // If not authenticated, redirect to auth
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    // If free plan, redirect to dashboard
    if (isFree) {
      router.push('/dashboard');
      return;
    }

    // If current plan, do nothing
    if (isCurrentPlan) {
      return;
    }

    // Create Stripe checkout session
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planKey,
          interval,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
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
    return children;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || isCurrentPlan}
      variant={variant}
      className={className}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      {getButtonText()}
    </Button>
  );
}
