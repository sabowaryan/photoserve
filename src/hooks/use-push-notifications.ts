'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        const subscriptionData = convertSubscription(existingSubscription);
        setSubscription(subscriptionData);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  const convertSubscription = (sub: PushSubscription): PushSubscriptionData => {
    const json = sub.toJSON();
    return {
      endpoint: json.endpoint!,
      keys: {
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
      },
    };
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Les notifications push ne sont pas supportées par ce navigateur');
      return null;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      setError('Les notifications push ne sont pas configurées sur ce serveur');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setError('Permission de notification refusée');
        setIsLoading(false);
        return null;
      }

      // Check if service worker is registered
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        setError('Service worker non disponible. Les notifications push nécessitent HTTPS en production.');
        setIsLoading(false);
        return null;
      }

      // Add timeout for service worker ready
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Service worker timeout')), 5000);
      });

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        timeoutPromise
      ]);

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      const subscriptionData = convertSubscription(pushSubscription);
      setSubscription(subscriptionData);
      setIsSubscribed(true);
      setIsLoading(false);

      return subscriptionData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec de l\'inscription';
      if (message === 'Service worker timeout') {
        setError('Service worker non prêt. Rechargez la page et réessayez.');
      } else {
        setError(message);
      }
      setIsLoading(false);
      return null;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }
      
      setSubscription(null);
      setIsSubscribed(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err instanceof Error ? err.message : 'Échec de la désinscription');
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
