'use client';

/**
 * Balance Widget Component
 * Displays current balance with available, pending, and total amounts
 * 
 * @module components/revenue/balance-widget
 * Requirements: 5.3 - Balance Display (Available, Pending, Total)
 * Requirements: 5.1 - Display next payout date
 */
import { useState, useEffect } from 'react';
import { Wallet, Clock, Calendar, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BalanceAmount {
  amount: number;
  currency: string;
  sourceTypes?: {
    card?: number;
    bank_account?: number;
  };
}

interface BalanceData {
  available: BalanceAmount[];
  pending: BalanceAmount[];
  instantAvailable?: BalanceAmount[];
  totalAvailable: number;
  totalPending: number;
  currency: string;
  nextPayoutDate: string | null;
}

function formatCurrency(cents: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';
  if (diffDays < 7) return `Dans ${diffDays} jours`;
  return formatDate(dateStr);
}

function LoadingSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="p-6 space-y-4">
        <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
          <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
        </div>
        <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export function BalanceWidget() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/photographer/balance');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch balance');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-rose-200/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-rose-100 flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
            <AlertCircle size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Solde</h2>
            <p className="text-xs text-rose-500">{error}</p>
          </div>
        </div>
        <div className="p-6">
          <Button 
            variant="outline" 
            onClick={() => fetchBalance()} 
            className="w-full gap-2 rounded-xl"
          >
            <RefreshCw size={16} />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const totalBalance = (data?.totalAvailable || 0) + (data?.totalPending || 0);
  const currency = data?.currency || 'eur';

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Wallet size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Solde</h2>
            <p className="text-xs text-slate-500">Stripe Connect</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchBalance(true)}
          disabled={refreshing}
          className="rounded-lg hover:bg-slate-100"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </Button>
      </div>

      <div className="p-6 space-y-4">
        {/* Total Balance */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/20">
          <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-1">
            Solde total
          </p>
          <p className="text-3xl font-black tracking-tight">
            {formatCurrency(totalBalance, currency)}
          </p>
        </div>

        {/* Available & Pending */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Disponible
              </p>
            </div>
            <p className="text-lg font-black text-emerald-600">
              {formatCurrency(data?.totalAvailable || 0, currency)}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={10} className="text-amber-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                En attente
              </p>
            </div>
            <p className="text-lg font-black text-amber-600">
              {formatCurrency(data?.totalPending || 0, currency)}
            </p>
          </div>
        </div>

        {/* Next Payout */}
        {data?.nextPayoutDate && (
          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-indigo-500" />
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    Prochain virement
                  </p>
                  <p className="text-sm font-bold text-indigo-700">
                    {formatRelativeDate(data.nextPayoutDate)}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-indigo-400" />
            </div>
          </div>
        )}

        {/* Stripe Dashboard Link */}
        <a
          href="https://dashboard.stripe.com/connect/payouts"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all"
        >
          Voir sur Stripe
          <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}
