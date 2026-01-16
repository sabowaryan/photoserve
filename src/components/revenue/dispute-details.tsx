'use client';

/**
 * Dispute Details Component
 * Displays detailed information about a specific dispute
 * 
 * @module components/revenue/dispute-details
 * Requirements: 7.2 - Dispute Handling
 * - THE Dispute_Details SHALL show: Amount, Reason, Deadline, Evidence required
 * - THE Photographer SHALL be able to submit evidence
 * - THE System SHALL provide link to Stripe Dashboard for full dispute management
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  User,
  DollarSign,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Info
} from 'lucide-react';

interface DisputeDetails {
  id: string;
  chargeId: string;
  purchaseId?: string;
  galleryId?: string;
  galleryTitle?: string;
  amount: number;
  currency: string;
  reason: string;
  reasonDescription: string;
  status: string;
  evidenceDueBy: string | null;
  hasEvidence: boolean;
  evidenceSubmissionCount: number;
  evidenceRequired: string[];
  createdAt: string;
  buyerEmail?: string;
  buyerName?: string;
  stripeDashboardUrl: string;
  networkReasonCode?: string;
  balanceTransactionId?: string;
  isRefundable: boolean;
}

interface DisputeDetailsProps {
  disputeId: string | null;
  onBack?: () => void;
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
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimeRemaining(dueDate: string | null): { text: string; urgent: boolean; expired: boolean } {
  if (!dueDate) {
    return { text: 'N/A', urgent: false, expired: false };
  }
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  if (diffMs < 0) {
    return { text: 'Expiré', urgent: true, expired: true };
  } else if (diffHours <= 24) {
    return { text: `${diffHours} heure${diffHours > 1 ? 's' : ''}`, urgent: true, expired: false };
  } else if (diffDays <= 3) {
    return { text: `${diffDays} jour${diffDays > 1 ? 's' : ''}`, urgent: true, expired: false };
  } else if (diffDays <= 7) {
    return { text: `${diffDays} jours`, urgent: false, expired: false };
  } else {
    return { 
      text: formatDate(dueDate), 
      urgent: false,
      expired: false
    };
  }
}

function getStatusInfo(status: string): { label: string; color: string; icon: React.ReactNode; description: string } {
  switch (status) {
    case 'needs_response':
    case 'warning_needs_response':
      return {
        label: 'Réponse requise',
        color: 'amber',
        icon: <AlertCircle className="w-5 h-5" />,
        description: 'Vous devez soumettre des preuves pour contester ce litige.',
      };
    case 'under_review':
    case 'warning_under_review':
      return {
        label: 'En examen',
        color: 'blue',
        icon: <Clock className="w-5 h-5" />,
        description: 'Stripe examine les preuves soumises. Vous serez notifié du résultat.',
      };
    case 'won':
      return {
        label: 'Gagné',
        color: 'emerald',
        icon: <CheckCircle className="w-5 h-5" />,
        description: 'Le litige a été résolu en votre faveur. Les fonds ont été restitués.',
      };
    case 'lost':
      return {
        label: 'Perdu',
        color: 'rose',
        icon: <XCircle className="w-5 h-5" />,
        description: 'Le litige a été résolu en faveur du client. Les fonds ont été déduits.',
      };
    case 'charge_refunded':
    case 'warning_closed':
      return {
        label: 'Fermé',
        color: 'slate',
        icon: <CheckCircle className="w-5 h-5" />,
        description: 'Ce litige a été fermé.',
      };
    default:
      return {
        label: status,
        color: 'slate',
        icon: <Info className="w-5 h-5" />,
        description: 'Statut du litige.',
      };
  }
}

function LoadingSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm p-6">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    </div>
  );
}

function EmptyState({ onBack }: { onBack?: () => void }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm p-6">
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Sélectionnez un litige
        </h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-4">
          Cliquez sur un litige dans la liste pour voir ses détails.
        </p>
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold gap-2 sm:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </Button>
        )}
      </div>
    </div>
  );
}

export function DisputeDetails({ disputeId, onBack }: DisputeDetailsProps) {
  const [dispute, setDispute] = useState<DisputeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!disputeId) {
      setDispute(null);
      return;
    }

    const fetchDispute = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/photographer/disputes/${disputeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dispute details');
        }
        const result = await response.json();
        setDispute(result.data);
      } catch (err) {
        console.error('Failed to fetch dispute:', err);
        setError('Impossible de charger les détails du litige');
      } finally {
        setLoading(false);
      }
    };

    fetchDispute();
  }, [disputeId]);

  if (!disputeId) {
    return <EmptyState onBack={onBack} />;
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !dispute) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Erreur
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {error || 'Impossible de charger les détails du litige'}
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(dispute.status);
  const timeRemaining = formatTimeRemaining(dispute.evidenceDueBy);
  const needsResponse = dispute.status === 'needs_response' || dispute.status === 'warning_needs_response';

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`p-6 bg-gradient-to-br from-${statusInfo.color}-500 via-${statusInfo.color}-600 to-${statusInfo.color}-700 relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
        
        <div className="relative">
          {/* Back button (mobile) */}
          {onBack && (
            <button
              onClick={onBack}
              className="sm:hidden flex items-center gap-1.5 text-white/80 hover:text-white font-medium text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}

          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              {statusInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-white/20 text-white border-0 font-bold text-[10px] uppercase tracking-wider">
                  {statusInfo.label}
                </Badge>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight truncate">
                {dispute.galleryTitle || 'Litige'}
              </h2>
              <p className="text-white/70 text-sm mt-1">
                {statusInfo.description}
              </p>
            </div>
          </div>

          {/* Urgent deadline warning */}
          {needsResponse && dispute.evidenceDueBy && (
            <div className={`mt-4 p-3 rounded-xl ${timeRemaining.urgent ? 'bg-white/20' : 'bg-white/10'}`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">
                  {timeRemaining.expired 
                    ? 'Délai expiré' 
                    : `Échéance: ${timeRemaining.text}`
                  }
                </span>
              </div>
              {!timeRemaining.expired && (
                <p className="text-white/70 text-xs mt-1">
                  Soumettez vos preuves avant cette date pour contester le litige.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Key Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Montant
              </span>
            </div>
            <p className="text-xl font-black text-slate-900">
              {formatCurrency(dispute.amount, dispute.currency)}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Raison
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {dispute.reason.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Reason Description */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm mb-1">
                Détail de la raison
              </p>
              <p className="text-amber-700 text-sm">
                {dispute.reasonDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Buyer Info */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            Informations client
          </h3>
          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
            {dispute.buyerEmail && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Email</span>
                <span className="text-sm font-medium text-slate-900">{dispute.buyerEmail}</span>
              </div>
            )}
            {dispute.buyerName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Nom</span>
                <span className="text-sm font-medium text-slate-900">{dispute.buyerName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Date d'achat</span>
              <span className="text-sm font-medium text-slate-900">{formatDate(dispute.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Evidence Required */}
        {needsResponse && dispute.evidenceRequired.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Preuves recommandées
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl">
              <ul className="space-y-2">
                {dispute.evidenceRequired.map((evidence, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{evidence}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Evidence Status */}
        {dispute.hasEvidence && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-emerald-800 text-sm">
                Preuves soumises ({dispute.evidenceSubmissionCount} soumission{dispute.evidenceSubmissionCount > 1 ? 's' : ''})
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <a
            href={dispute.stripeDashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              className={`w-full rounded-xl font-bold gap-2 ${
                needsResponse 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {needsResponse ? 'Soumettre des preuves' : 'Voir dans Stripe Dashboard'}
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
          <p className="text-xs text-slate-500 text-center">
            La soumission de preuves se fait directement dans le tableau de bord Stripe.
          </p>
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t border-slate-100">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <span>Informations techniques</span>
              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-3 p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ID Litige</span>
                <code className="text-slate-700 bg-slate-200 px-2 py-0.5 rounded">{dispute.id}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ID Charge</span>
                <code className="text-slate-700 bg-slate-200 px-2 py-0.5 rounded">{dispute.chargeId}</code>
              </div>
              {dispute.networkReasonCode && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Code réseau</span>
                  <code className="text-slate-700 bg-slate-200 px-2 py-0.5 rounded">{dispute.networkReasonCode}</code>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
