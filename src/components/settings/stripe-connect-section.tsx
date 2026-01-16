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
  Shield
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  // Check if user has Pro plan
  const hasStripeConnect = hasFeatureAccess(userPlan, 'stripeConnect');

  // Fetch account status on mount
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
        // No account exists yet
        setAccountStatus('not_connected');
        setAccountData(null);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch account status');
      }

      const data = await response.json();
      
      // Check if account is connected
      if (!data.connected || data.status === 'not_connected') {
        setAccountStatus('not_connected');
        setAccountData(null);
        return;
      }
      
      setAccountData(data);

      // Determine status based on account data
      if (data.chargesEnabled && data.payoutsEnabled && data.detailsSubmitted) {
        setAccountStatus('verified');
      } else if (data.pastDue && data.pastDue.length > 0) {
        setAccountStatus('action_required');
      } else if (data.detailsSubmitted || data.onboardingCompleted) {
        setAccountStatus('pending');
      } else {
        // Account exists but onboarding not started/completed
        setAccountStatus('action_required');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account status';
      setError(errorMessage);
      console.error('Error fetching account status:', err);
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
      
      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect Stripe account';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error connecting Stripe:', err);
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
      
      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh onboarding link';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error refreshing link:', err);
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
      
      // Open Stripe dashboard in new tab
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open Stripe dashboard';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error opening dashboard:', err);
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

      // Reset state
      setAccountStatus('not_connected');
      setAccountData(null);
      toast.success('Stripe account disconnected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect account';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error disconnecting:', err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getStatusBadge = () => {
    switch (accountStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 size={14} className="mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock size={14} className="mr-1" />
            Pending
          </Badge>
        );
      case 'action_required':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertCircle size={14} className="mr-1" />
            Action Required
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (accountStatus) {
      case 'verified':
        return 'Your Stripe account is verified and ready to receive payments.';
      case 'pending':
        return 'Your Stripe account is being verified. This may take a few minutes.';
      case 'action_required':
        return 'Your Stripe account requires additional information. Please complete the onboarding process.';
      case 'not_connected':
        return 'Connect your Stripe account to start receiving payments from your clients.';
    }
  };

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <CreditCard size={18} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Stripe Connect</h2>
          <p className="text-xs text-slate-500">Receive payments directly from clients</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!hasStripeConnect ? (
          // Upgrade prompt for non-Pro users
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Pro Plan Required</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Upgrade to Pro to connect your Stripe account and start monetizing your galleries. 
                  Receive payments directly from clients with our secure payment processing.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span>Direct payments to your bank account</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span>Set custom prices for your galleries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span>Automatic payouts (daily, weekly, or monthly)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span>Revenue dashboard and analytics</span>
                  </li>
                </ul>
                <Button
                  onClick={() => {
                    // Scroll to subscription section
                    const subscriptionSection = document.getElementById('subscription-section');
                    if (subscriptionSection) {
                      subscriptionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Stripe Connect section for Pro users
          <div className="space-y-6">
            {/* Account Status */}
            {accountStatus !== 'not_connected' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Account Status</Label>
                <div className={cn(
                  "p-4 rounded-lg border flex items-start gap-3",
                  accountStatus === 'verified' && "bg-green-50 border-green-200",
                  accountStatus === 'pending' && "bg-yellow-50 border-yellow-200",
                  accountStatus === 'action_required' && "bg-red-50 border-red-200"
                )}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge()}
                    </div>
                    <p className="text-sm text-slate-700">
                      {getStatusMessage()}
                    </p>
                    {accountData && accountData.pastDue && accountData.pastDue.length > 0 && (
                      <div className="mt-3 p-3 bg-white rounded border border-red-200">
                        <p className="text-xs font-medium text-red-900 mb-2">Required Information:</p>
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

            {/* Account Details */}
            {accountData && accountStatus === 'verified' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span className="text-xs font-medium text-slate-700">Charges</span>
                  </div>
                  <p className="text-sm text-slate-900">
                    {accountData.chargesEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span className="text-xs font-medium text-slate-700">Payouts</span>
                  </div>
                  <p className="text-sm text-slate-900">
                    {accountData.payoutsEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
              {accountStatus === 'not_connected' ? (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full sm:w-auto"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Connect Stripe
                    </>
                  )}
                </Button>
              ) : (
                <>
                  {accountStatus === 'action_required' && (
                    <Button
                      onClick={handleRefreshLink}
                      disabled={isConnecting}
                      className="w-full sm:w-auto"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Complete Onboarding
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleViewDashboard}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Dashboard
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        disabled={isDisconnecting}
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Stripe Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will disconnect your Stripe account from PikSend. You will no longer be able to 
                          receive payments through the platform. Any active gallery paywalls will be disabled.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDisconnect}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDisconnecting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Disconnecting...
                            </>
                          ) : (
                            'Disconnect Account'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>

            {/* Information Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">Secure Payment Processing</p>
                  <p className="text-xs text-blue-700">
                    Your payments are processed securely by Stripe. PikSend takes a 10% platform fee, 
                    and you receive 90% of each sale directly to your bank account. Payouts are automatic 
                    and can be configured in your Stripe dashboard.
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
