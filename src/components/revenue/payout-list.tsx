'use client';

/**
 * Payout List Component
 * Displays paginated list of payouts with filtering
 * 
 * @module components/revenue/payout-list
 * Requirements: 5.2 - Payout History (List with filtering)
 */
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Banknote, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Calendar,
  ArrowRight,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Truck
} from 'lucide-react';

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

interface PayoutsResponse {
  payouts: Payout[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PayoutListProps {
  onPayoutClick?: (payout: Payout) => void;
}

function formatCurrency(cents: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
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
        badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        iconClass: 'text-emerald-500',
      };
    case 'in_transit':
      return {
        label: 'En transit',
        icon: Truck,
        badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        iconClass: 'text-blue-500',
      };
    case 'pending':
      return {
        label: 'En attente',
        icon: Clock,
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        iconClass: 'text-amber-500',
      };
    case 'failed':
      return {
        label: 'Échoué',
        icon: XCircle,
        badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        iconClass: 'text-rose-500',
      };
    case 'canceled':
      return {
        label: 'Annulé',
        icon: XCircle,
        badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        iconClass: 'text-slate-400',
      };
    default:
      return {
        label: status,
        icon: Clock,
        badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        iconClass: 'text-slate-400',
      };
  }
}

function LoadingSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="p-6">
        <div className="h-12 bg-slate-100 rounded-xl animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PayoutList({ onPayoutClick }: PayoutListProps) {
  const [data, setData] = useState<PayoutsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (status) params.set('status', status);

      const response = await fetch(`/api/photographer/payouts?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Banknote size={18} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900">Historique des virements</h2>
          <p className="text-xs text-slate-500">
            {data?.total || 0} virements au total
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="appearance-none px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer transition-all"
            >
              <option value="">Tous les statuts</option>
              <option value="paid">Payé</option>
              <option value="in_transit">En transit</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
              <option value="canceled">Annulé</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Payout List */}
        <div className="space-y-3">
          {data?.payouts.length === 0 ? (
            <div className="py-12 text-center">
              <Banknote className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Aucun virement trouvé</p>
              <p className="text-slate-400 text-sm">Les virements apparaîtront ici</p>
            </div>
          ) : (
            data?.payouts.map((payout) => {
              const statusConfig = getStatusConfig(payout.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={payout.id}
                  onClick={() => onPayoutClick?.(payout)}
                  className={`group bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl p-4 transition-all ${
                    onPayoutClick ? 'cursor-pointer hover:shadow-sm' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Status & Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg bg-white border border-slate-100 ${statusConfig.iconClass}`}>
                        <StatusIcon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${statusConfig.badgeClass} border-0 font-bold text-[10px] uppercase tracking-wider`}>
                            {statusConfig.label}
                          </Badge>
                          {payout.destinationBankAccountLast4 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <CreditCard size={10} />
                              •••• {payout.destinationBankAccountLast4}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                          <Calendar size={12} />
                          <span>Créé le {formatDate(payout.createdAt)}</span>
                        </div>
                        {payout.arrivalDate && payout.status !== 'paid' && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-indigo-600">
                            <ArrowRight size={12} />
                            <span>Arrivée prévue: {formatDate(payout.arrivalDate)}</span>
                          </div>
                        )}
                        {payout.paidAt && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600">
                            <CheckCircle2 size={12} />
                            <span>Payé le {formatDate(payout.paidAt)}</span>
                          </div>
                        )}
                        {payout.failureMessage && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-rose-600">
                            <AlertCircle size={12} />
                            <span>{payout.failureMessage}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-black ${
                        payout.status === 'paid' 
                          ? 'text-emerald-600' 
                          : payout.status === 'failed' || payout.status === 'canceled'
                          ? 'text-slate-400'
                          : 'text-slate-900'
                      }`}>
                        {formatCurrency(payout.amountCents, payout.currency)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {payout.currency.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-medium">
              Page {page} sur {data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border-slate-200 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(data.totalPages, 5))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                        page === pageNum
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="rounded-lg border-slate-200 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
