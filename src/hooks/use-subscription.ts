'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface Subscription {
  plan: 'free' | 'premium' | 'pro';
  interval?: 'monthly' | 'yearly';
  status?: string;
  currentPeriodEnd?: string;
}

export function useSubscription() {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      if (status === 'loading') return;
      
      if (!session?.user?.id) {
        setSubscription({ plan: 'free' });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        
        setSubscription({
          plan: data.subscription_plan || data.subscription_tier || 'free',
          interval: data.subscription_interval,
          status: data.subscription_status,
          currentPeriodEnd: data.subscription_current_period_end,
        });
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setSubscription({ plan: 'free' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, [session, status]);

  return {
    subscription,
    isLoading,
    plan: subscription?.plan || 'free',
    isActive: subscription?.status === 'active',
    isPremium: subscription?.plan === 'premium',
    isPro: subscription?.plan === 'pro',
    isFree: !subscription || subscription.plan === 'free',
  };
}
