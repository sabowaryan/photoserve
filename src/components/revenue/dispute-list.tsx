'use client';

/**
 * Dispute List Component
 * Displays a list of disputes with filtering and pagination
 * 
 * @module components/revenue/dispute-list
 * Requirements: 7.2 - Dispute Handling
 * - THE Dashboard SHALL display dispute alert banner
 * - THE Dispute_Details SHALL show: Amount, Reason, Deadline, Evidence required
 */
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

interface DisputeSummary {
  id: string;
  chargeId: string;
  purchaseId?: string;
  galleryId?: string;
  galleryTitle?: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  evidenceDueBy: string | null;
  createdAt: string;
  buyerEmail?: string;
}

interface DisputeListProps {
  onSelectDispute?: (disputeId: string) => void;
  selectedDisputeId?: string;
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

function formatTimeRemaining(dueDate: string | null): { text: string; urgent: boolean } {
  if (!dueDate) {
    return { text: 'N/A', urgent: false };
  }
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: 'Expiré', urgent: true };
  } else if (diffDays === 0) {
    return { text: "Aujourd'hui", urgent: true };
  } else if (diffDays === 1) {
    return { text: 'Demain', urgent: true };
  } else if (diffDays <= 3) {
    return { text: `${diffDays} jours`, urgent: true };
  } else if (diffDays <= 7) {
    return { text: `${diffDays} jours`, urgent: false };
  } else {
    return { 
      text: new Date(dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), 
      urgent: false 
    };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'needs_response':
    case 'warning_needs_response':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 font-bold text-[10px] uppercase tracking-wider gap-1">
          <AlertCircle className="w-3 h-3" />
          Réponse requise
        </Badge>
      );
    case 'under_review':
    case 'warning_under_review':
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 font-bold text-[10px] uppercase tracking-wider gap-1">
          <Clock className="w-3 h-3" />
          En examen
        </Badge>
      );
    case 'won':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 font-bold text-[10px] uppercase tracking-wider gap-1">
          <CheckCircle className="w-3 h-3" />
          Gagné
        </Badge>
      );
    case 'lost':
      return (
        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0 font-bold text-[10px] uppercase tracking-wider gap-1">
          <XCircle className="w-3 h-3" />
          Perdu
        </Badge>
      );
    case 'charge_refunded':
    case 'warning_closed':
      return (
        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-0 font-bold text-[10px] uppercase tracking-wider">
          Fermé
        </Badge>
      );
    default:
      return (
        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-0 font-bold text-[10px] uppercase tracking-wider">
          {status}
        </Badge>
      );
  }
}

function getReasonLabel(reason: string): string {
  const reasonLabels: Record<string, string> = {
    'bank_cannot_process': 'Banque ne peut pas traiter',
    'check_returned': 'Chèque retourné',
    'credit_not_processed': 'Crédit non traité',
    'customer_initiated': 'Initié par le client',
    'debit_not_authorized': 'Débit non autorisé',
    'duplicate': 'Doublon',
    'fraudulent': 'Fraude',
    'general': 'Général',
    'incorrect_account_details': 'Détails incorrects',
    'insufficient_funds': 'Fonds insuffisants',
    'product_not_received': 'Produit non reçu',
    'product_unacceptable': 'Produit inacceptable',
    'subscription_canceled': 'Abonnement annulé',
    'unrecognized': 'Non reconnu',
  };

  return reasonLabels[reason] || reason;
}

function LoadingSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        Aucun litige
      </h3>
      <p className="text-slate-500 text-sm max-w-sm mx-auto">
        Vous n'avez aucun litige pour le moment. C'est une bonne nouvelle !
      </p>
    </div>
  );
}

export function DisputeList({ onSelectDispute, selectedDisputeId }: DisputeListProps) {
  const [disputes, setDisputes] = useState<DisputeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchDisputes = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
      });
      if (statusFilter) params.set('status', statusFilter);
      if (!reset && cursor) params.set('startingAfter', cursor);

      const response = await fetch(`/api/photographer/disputes?${params}`);
      if (response.ok) {
        const result = await response.json();
        const newDisputes = result.data?.disputes || [];
        
        if (reset) {
          setDisputes(newDisputes);
        } else {
          setDisputes(prev => [...prev, ...newDisputes]);
        }
        
        setHasMore(result.data?.hasMore || false);
        if (newDisputes.length > 0) {
          setCursor(newDisputes[newDisputes.length - 1].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cursor]);

  useEffect(() => {
    setCursor(null);
    fetchDisputes(true);
  }, [statusFilter]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchDisputes(false);
    }
  };

  if (loading && disputes.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Litiges</h2>
            <p className="text-xs text-slate-500">
              {disputes.length} litige{disputes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 cursor-pointer transition-all"
          >
            <option value="">Tous les statuts</option>
            <option value="needs_response">Réponse requise</option>
            <option value="under_review">En examen</option>
            <option value="won">Gagné</option>
            <option value="lost">Perdu</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="p-6">
        {disputes.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Disputes List */}
            <div className="space-y-3">
              {disputes.map((dispute) => {
                const timeRemaining = formatTimeRemaining(dispute.evidenceDueBy);
                const isSelected = selectedDisputeId === dispute.id;
                const needsResponse = dispute.status === 'needs_response' || dispute.status === 'warning_needs_response';

                return (
                  <div
                    key={dispute.id}
                    onClick={() => onSelectDispute?.(dispute.id)}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all cursor-pointer group
                      ${isSelected 
                        ? 'border-amber-500 bg-amber-50/50' 
                        : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50'
                      }
                      ${needsResponse ? 'ring-2 ring-amber-200/50' : ''}
                    `}
                  >
                    {/* Urgent indicator */}
                    {needsResponse && timeRemaining.urgent && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 truncate">
                            {dispute.galleryTitle || 'Galerie inconnue'}
                          </span>
                          {getStatusBadge(dispute.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {getReasonLabel(dispute.reason)}
                          </span>
                          {dispute.buyerEmail && (
                            <span className="truncate max-w-[200px]">
                              {dispute.buyerEmail}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount and deadline */}
                      <div className="flex items-center gap-4 sm:gap-6">
                        {/* Deadline */}
                        {needsResponse && dispute.evidenceDueBy && (
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                              Échéance
                            </p>
                            <p className={`text-sm font-bold ${timeRemaining.urgent ? 'text-rose-600' : 'text-slate-700'}`}>
                              {timeRemaining.text}
                            </p>
                          </div>
                        )}

                        {/* Amount */}
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            Montant
                          </p>
                          <p className="text-sm font-bold text-slate-900">
                            {formatCurrency(dispute.amount, dispute.currency)}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors hidden sm:block" />
                      </div>
                    </div>

                    {/* Date */}
                    <p className="text-xs text-slate-400 mt-2">
                      Créé le {formatDate(dispute.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold"
                >
                  {loading ? 'Chargement...' : 'Charger plus'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
