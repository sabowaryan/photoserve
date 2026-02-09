/**
 * Email Unsubscribe Page
 * Allows users to unsubscribe from marketing emails
 * Requirement: 18.8
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setError('Email address is required');
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    if (!email) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          reason: reason.trim() || undefined,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unsubscribe');
      }
      
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">✓ Désabonnement confirmé</CardTitle>
            <CardDescription className="text-center">
              Vous ne recevrez plus d&apos;emails marketing de PikSend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Vous continuerez à recevoir les emails transactionnels importants concernant votre compte.
            </p>
            <div className="text-center">
              <Button asChild variant="outline">
                <a href="/">Retour à l&apos;accueil</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Se désabonner des emails marketing</CardTitle>
          <CardDescription>
            Nous sommes désolés de vous voir partir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}
          
          {email && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Email : <span className="font-medium">{email}</span>
              </p>
              
              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium text-gray-700">
                  Pourquoi vous désabonnez-vous ? (optionnel)
                </label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Vos commentaires nous aident à améliorer nos communications..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
              
              <Button
                onClick={handleUnsubscribe}
                disabled={isSubmitting}
                className="w-full"
                variant="destructive"
              >
                {isSubmitting ? 'Désabonnement...' : 'Confirmer le désabonnement'}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Vous continuerez à recevoir les emails transactionnels importants
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
