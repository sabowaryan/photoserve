'use client';

/**
 * Payouts Tab Component
 * Main tab component for displaying payouts section in revenue dashboard
 * Combines balance widget and payout history list
 * 
 * @module components/revenue/payouts-tab
 * Requirements: 
 * - 5.1: Automatic Payouts (Stripe Connect) - Display next payout date
 * - 5.2: Payout History - List with filtering
 * - 5.3: Balance Display - Available, Pending, Total
 */
import { useState } from 'react';
import { BalanceWidget } from './balance-widget';
import { PayoutList } from './payout-list';
import { 
  Banknote, 
  X, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Truck,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type PayoutStatus = 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';

interface Payout {
  id: string;
  photographerId: string;
  stripeAccountId: string;
  stripePayoutId: string | null;
  amountCents: number;
  currency: string;
  status: PayoutStatus;
  failureCode: string | null;
  failureMessage: string | null;
  arrivalDate: string | null;
  createdAt: string;
  paidAt: string | null;
  failedAt: string | null;
  destinationBankAccountLast4: string | null;
}

function formatCurrency(cents: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusConfig(status: PayoutStatus) {
  switch (status) {
    case 'paid':
      return {
        label: 'Payé',
        icon: CheckCircle2,
        badgeClass: 'bg-emerald-100 text-emerald-700',
        iconClass: 'text-emerald-500',
        bgClass: 'bg-emerald-50',
      };
    case 'in_transit':
      return {
        label: 'En transit',
        icon: Truck,
        badgeClass: 'bg-blue-100 text-blue-700',
        iconClass: 'text-blue-500',
        bgClass: 'bg-blue-50',
      };
    case 'pending':
      return {
        label: 'En attente',
        icon: Clock,
        badgeClass: 'bg-amber-100 text-amber-700',
        iconClass: 'text-amber-500',
        bgClass: 'bg-amber-50',
      };
    case 'failed':
      return {
        label: 'Échoué',
        icon: XCircle,
        badgeClass: 'bg-rose-100 text-rose-700',
        iconClass: 'text-rose-500',
        bgClass: 'bg-rose-50',
      };
    case 'canceled':
      return {
        label: 'Annulé',
        icon: XCircle,
        badgeClass: 'bg-slate-100 text-slate-600',
        iconClass: 'text-slate-400',
        bgClass: 'bg-slate-50',
      };
    default:
      return {
        label: status,
        icon: Clock,
        badgeClass: 'bg-slate-100 text-slate-600',
        iconClass: 'text-slate-400',
        bgClass: 'bg-slate-50',
      };
  }
}

interface PayoutDetailModalProps {
  payout: Payout;
  onClose: () => void;
}

function PayoutDetailModal({ payout, onClose }: PayoutDetailModalProps) {
  const statusConfig = getStatusConfig(payout.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgClass} ${statusConfig.iconClass}`}>
              <Banknote size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Détails du virement</h3>
              <p className="text-xs text-slate-500">ID: {payout.id.slice(0, 8)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount */}
          <div className="text-center py-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Montant
            </p>
            <p className={`text-4xl font-black ${
              payout.status === 'paid' 
                ? 'text-emerald-600' 
                : payout.status === 'failed' || payout.status === 'canceled'
                ? 'text-slate-400'
                : 'text-slate-900'
            }`}>
              {formatCurrency(payout.amountCents, payout.currency)}
            </p>
            <Badge className={`${statusConfig.badgeClass} border-0 font-bold text-xs uppercase tracking-wider mt-2`}>
              <StatusIcon size={12} className="mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {/* Bank Account */}
            {payout.destinationBankAccountLast4 && (
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500">
                  <CreditCard size={16} />
                  <span className="text-sm font-medium">Compte bancaire</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  •••• {payout.destinationBankAccountLast4}
                </span>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar size={16} />
                <span className="text-sm font-medium">Date de création</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {formatFullDate(payout.createdAt)}
              </span>
            </div>

            {/* Arrival Date */}
            {payout.arrivalDate && (
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500">
                  <Truck size={16} />
                  <span className="text-sm font-medium">Date d'arrivée prévue</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {formatFullDate(payout.arrivalDate)}
                </span>
              </div>
            )}

            {/* Paid Date */}
            {payout.paidAt && (
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-medium">Date de paiement</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {formatFullDate(payout.paidAt)}
                </span>
              </div>
            )}

            {/* Failed Date */}
            {payout.failedAt && (
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-500">
                  <XCircle size={16} />
                  <span className="text-sm font-medium">Date d'échec</span>
                </div>
                <span className="text-sm font-bold text-rose-600">
                  {formatFullDate(payout.failedAt)}
                </span>
              </div>
            )}

            {/* Currency */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">Devise</span>
              <span className="text-sm font-bold text-slate-900 uppercase">
                {payout.currency}
              </span>
            </div>

            {/* Stripe Payout ID */}
            {payout.stripePayoutId && (
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-500">ID Stripe</span>
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                  {payout.stripePayoutId}
                </span>
              </div>
            )}
          </div>

          {/* Failure Message */}
          {payout.failureMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-700 mb-1">
                    Raison de l'échec
                  </p>
                  <p className="text-sm text-rose-600">
                    {payout.failureMessage}
                  </p>
                  {payout.failureCode && (
                    <p className="text-xs text-rose-400 mt-1">
                      Code: {payout.failureCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {payout.stripePayoutId && (
              <a
                href={`https://dashboard.stripe.com/connect/payouts/${payout.stripePayoutId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all"
              >
                Voir sur Stripe
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PayoutsTab() {
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  return (
    <div className="space-y-6">
      {/* Layout: Balance Widget + Payout List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Widget - Takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <BalanceWidget />
        </div>

        {/* Payout List - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <PayoutList onPayoutClick={setSelectedPayout} />
        </div>
      </div>

      {/* Payout Detail Modal */}
      {selectedPayout && (
        <PayoutDetailModal
          payout={selectedPayout}
          onClose={() => setSelectedPayout(null)}
        />
      )}
    </div>
  );
}
