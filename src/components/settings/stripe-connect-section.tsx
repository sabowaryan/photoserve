'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2, 
  ExternalLink,
  Unlink,
  Shield,
  Wallet,
  ArrowRight,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SubscriptionPlan } from '@/types';
import { hasFeatureAccess } from '@/config/plan-features';

interface StripeConnectSectionProps {
  userPlan: SubscriptionPlan;
}

interface ConnectAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
  onboardingCompleted: boolean;
}

type AccountStatus = 'not_connected' | 'pending' | 'verified' | 'action_required';

export function StripeConnectSection({ userPlan }: StripeConnectSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('not_connected');
  const [accountData, setAccountData] = useState<ConnectAccountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasStripeConnect = hasFeatureAccess(userPlan, 'stripeConnect');

  useEffect(() => {
    if (hasStripeConnect) {
      fetchAccountStatus();
    }
  }, [hasStripeConnect]);

  const fetchAccountStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/stripe/connect/status');
      if (response.status === 404) {
        setAccountStatus('not_connected');
        setAccountData(null);
        return;
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch account status');
      }
      const data = await response.json();
      if (!data.connected || data.status === 'not_connected') {
        setAccountStatus('not_connected');
        setAccountData(null);
        return;
      }
      setAccountData(data);
      if (data.chargesEnabled && data.payoutsEnabled && data.detailsSubmitted) {
        setAccountStatus('verified');
      } else if (data.pastDue && data.pastDue.length > 0) {
        setAccountStatus('action_required');
      } else if (data.detailsSubmitted || data.onboardingCompleted) {
        setAccountStatus('pending');
      } else {
        setAccountStatus('action_required');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create onboarding link');
      }
      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect Stripe account';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsConnecting(false);
    }
  };

  const handleRefreshLink = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const response = await fetch('/api/stripe/connect/refresh-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to refresh onboarding link');
      }
      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh onboarding link';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsConnecting(false);
    }
  };

  const handleViewDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/stripe/connect/dashboard-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create dashboard link');
      }
      const data = await response.json();
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open Stripe dashboard';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      setError(null);
      const response = await fetch('/api/stripe/connect/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disconnect account');
      }
      setAccountStatus('not_connected');
      setAccountData(null);
      toast.success('Compte Stripe déconnecté avec succès');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect account';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getStatusConfig = () => {
    switch (accountStatus) {
      case 'verified':
        return {
          badge: (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={12} />
              Vérifié
            </span>
          ),
          bgColor: 'bg-green-50/50',
          borderColor: 'border-green-200',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          message: 'Votre compte Stripe est vérifié et prêt à recevoir des paiements.',
        };
      case 'pending':
        return {
          badge: (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Clock size={12} />
              En attente
            </span>
          ),
          bgColor: 'bg-amber-50/50',
          borderColor: 'border-amber-200',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          message: 'Votre compte Stripe est en cours de vérification.',
        };
      case 'action_required':
        return {
          badge: (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <AlertCircle size={12} />
              Action requise
            </span>
          ),
          bgColor: 'bg-red-50/50',
          borderColor: 'border-red-200',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          message: 'Votre compte Stripe nécessite des informations supplémentaires.',
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();


  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          accountStatus === 'verified' 
            ? "bg-green-50 text-green-600" 
            : "bg-indigo-50 text-indigo-600"
        )}>
          <CreditCard size={18} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900">Stripe Connect</h2>
          <p className="text-xs text-slate-500">Recevez des paiements de vos clients</p>
        </div>
        {statusConfig?.badge}
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!hasStripeConnect ? (
          <div className="p-5 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/60 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                <Shield size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Plan Pro requis</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Passez au plan Pro pour connecter votre compte Stripe et monétiser vos galeries.
                </p>
                <div className="grid gap-2 mb-5">
                  {[
                    { icon: Banknote, text: 'Paiements directs sur votre compte' },
                    { icon: Wallet, text: 'Définissez vos propres prix' },
                    { icon: Clock, text: 'Virements automatiques' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="p-1 bg-green-100 rounded text-green-600">
                        <item.icon size={12} />
                      </div>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    const el = document.getElementById('subscription-section');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="gap-2"
                >
                  Passer au Pro
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {accountStatus !== 'not_connected' && statusConfig && (
              <div className={cn("p-4 rounded-xl border", statusConfig.bgColor, statusConfig.borderColor)}>
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", statusConfig.iconBg, statusConfig.iconColor)}>
                    {accountStatus === 'verified' ? <CheckCircle2 size={18} /> : 
                     accountStatus === 'pending' ? <Clock size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      {accountStatus === 'verified' ? 'Compte vérifié' :
                       accountStatus === 'pending' ? 'Vérification en cours' : 'Action requise'}
                    </p>
                    <p className="text-xs text-slate-600">{statusConfig.message}</p>
                    {accountData?.pastDue && accountData.pastDue.length > 0 && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                        <p className="text-xs font-medium text-red-900 mb-2">Informations requises :</p>
                        <ul className="text-xs text-red-700 space-y-1">
                          {accountData.pastDue.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <AlertCircle size={12} />
                              <span>{item.replace(/_/g, ' ')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {accountData && accountStatus === 'verified' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-100 rounded-lg text-green-600">
                      <CheckCircle2 size={14} />
                    </div>
                    <span className="text-xs font-medium text-slate-700">Paiements</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {accountData.chargesEnabled ? 'Activés' : 'Désactivés'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-100 rounded-lg text-green-600">
                      <Banknote size={14} />
                    </div>
                    <span className="text-xs font-medium text-slate-700">Virements</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {accountData.payoutsEnabled ? 'Activés' : 'Désactivés'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
              {accountStatus === 'not_connected' ? (
                <Button 
                  onClick={handleConnect} 
                  disabled={isConnecting} 
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 gap-2"
                >
                  {isConnecting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Connexion en cours...</>
                  ) : (
                    <><CreditCard className="w-4 h-4" />Connecter Stripe</>
                  )}
                </Button>
              ) : (
                <>
                  {accountStatus === 'action_required' && (
                    <Button onClick={handleRefreshLink} disabled={isConnecting} className="gap-2">
                      {isConnecting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Chargement...</>
                      ) : (
                        <><AlertCircle className="w-4 h-4" />Compléter l'inscription</>
                      )}
                    </Button>
                  )}
                  <Button onClick={handleViewDashboard} disabled={isLoading} variant="outline" className="gap-2">
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Chargement...</>
                    ) : (
                      <><ExternalLink className="w-4 h-4" />Tableau de bord</>
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" disabled={isDisconnecting}>
                        <Unlink className="w-4 h-4" />Déconnecter
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Déconnecter le compte Stripe ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action déconnectera votre compte Stripe de PikSend. Vous ne pourrez plus 
                          recevoir de paiements via la plateforme. Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
                          {isDisconnecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Déconnexion...</> : 'Déconnecter'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Paiements sécurisés</p>
                  <p className="text-xs text-blue-700">
                    Vos paiements sont traités de manière sécurisée par Stripe. PikSend prélève 10% de frais, 
                    vous recevez 90% de chaque vente directement sur votre compte bancaire.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
