'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface SubscribeIntent {
  intent: string;
  plan: string;
  gallery: string | null;
}

/**
 * Auth Callback Page
 * 
 * Handles post-authentication flow:
 * 1. Waits for session to be established
 * 2. Migrates any guest galleries to the user's account (Requirements: 8.4, 8.6)
 * 3. Handles subscription intent if present
 * 4. Redirects to appropriate dashboard
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [statusMessage, setStatusMessage] = useState('Redirection en cours...');
  const migrationAttempted = useRef(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session) {
      // Migrate guest galleries if not already attempted
      // Requirement 8.4: Automatically migrate all Guest_Galleries to the new profile
      // Requirement 8.6: Migrated galleries appear in user's dashboard immediately
      if (!migrationAttempted.current) {
        migrationAttempted.current = true;
        handlePostAuthFlow();
      }
    } else {
      // Not authenticated, redirect to auth
      router.replace('/auth');
    }
  }, [session, status, router]);

  /**
   * Handle the complete post-authentication flow
   */
  const handlePostAuthFlow = async () => {
    // First, migrate guest galleries
    await migrateGuestGalleries();
    
    // Then, check for subscription intent
    const subscribeIntent = checkSubscribeIntent();
    
    if (subscribeIntent) {
      await handleSubscriptionRedirect(subscribeIntent);
    } else {
      redirectUser();
    }
  };

  /**
   * Check if there's a subscription intent stored in localStorage
   */
  const checkSubscribeIntent = (): SubscribeIntent | null => {
    try {
      const intentData = localStorage.getItem('piksend_subscribe_intent');
      if (!intentData) return null;
      
      const intent = JSON.parse(intentData) as SubscribeIntent;
      // Clear the intent after reading
      localStorage.removeItem('piksend_subscribe_intent');
      
      if (intent.intent === 'subscribe' && intent.plan) {
        return intent;
      }
      return null;
    } catch {
      return null;
    }
  };

  /**
   * Redirect to Stripe checkout for subscription
   */
  const handleSubscriptionRedirect = async (intent: SubscribeIntent) => {
    try {
      setStatusMessage('Redirection vers le paiement...');
      
      const response = await fetch('/api/stripe/checkout/guest-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: intent.plan,
          galleryId: null,
          successUrl: `${window.location.origin}/dashboard?subscribed=true${intent.gallery ? `&gallery=${intent.gallery}` : ''}`,
          cancelUrl: intent.gallery 
            ? `${window.location.origin}/g/${intent.gallery}?showPricing=true`
            : `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('[AuthCallback] Subscription redirect failed:', error);
      // Fallback to dashboard
      redirectUser();
    }
  };

  /**
   * Migrate guest galleries to the authenticated user's account
   * This is called after successful signup/signin to transfer any galleries
   * created during the guest session.
   */
  const migrateGuestGalleries = async () => {
    try {
      // Check if there's a guest session token in localStorage
      const guestSessionData = localStorage.getItem('piksend_guest_session');
      if (!guestSessionData) {
        // No guest session, nothing to migrate
        return;
      }

      const guestSession = JSON.parse(guestSessionData);
      if (!guestSession?.token) {
        return;
      }

      setStatusMessage('Migration de vos galeries...');

      // Call migration API
      const response = await fetch('/api/guest/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestToken: guestSession.token,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.migratedCount > 0) {
          setStatusMessage(`${result.migratedCount} galerie(s) migrée(s) !`);
          // Clear guest session from localStorage after successful migration
          localStorage.removeItem('piksend_guest_session');
          // Small delay to show the success message
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      // Log error but don't block the redirect
      console.error('[AuthCallback] Failed to migrate guest galleries:', error);
    }
  };

  /**
   * Redirect user to appropriate dashboard based on role
   */
  const redirectUser = () => {
    if (session?.user.isAdmin) {
      router.replace('/admin');
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium">{statusMessage}</p>
      </div>
    </div>
  );
}
