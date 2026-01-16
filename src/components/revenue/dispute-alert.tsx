'use client';

/**
 * Dispute Alert Component
 * Displays an alert banner when there are disputes needing response
 * 
 * @module components/revenue/dispute-alert
 * Requirements: 7.2 - Dispute Handling
 * - THE Dashboard SHALL display dispute alert banner
 * - THE System SHALL notify photographer immediately (email + in-app)
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight, X, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DisputeSummary {
  id: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  evidenceDueBy: string | null;
  galleryTitle?: string;
}

interface DisputeAlertProps {
  className?: string;
  onDismiss?: () => void;
}

function formatCurrency(cents: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatTimeRemaining(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Expiré';
  } else if (diffDays === 0) {
    return "Aujourd'hui";
  } else if (diffDays === 1) {
    return 'Demain';
  } else if (diffDays <= 7) {
    return `${diffDays} jours`;
  } else {
    return new Date(dueDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }
}

export function DisputeAlert({ className = '', onDismiss }: DisputeAlertProps) {
  const [disputes, setDisputes] = useState<DisputeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const response = await fetch('/api/photographer/disputes?status=needs_response&limit=5');
        if (response.ok) {
          const data = await response.json();
          setDisputes(data.data?.disputes || []);
        }
      } catch (error) {
        console.error('Failed to fetch disputes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Don't show if loading, dismissed, or no disputes needing response
  if (loading || dismissed || disputes.length === 0) {
    return null;
  }

  const totalAmount = disputes.reduce((sum, d) => sum + d.amount, 0);
  const currency = disputes[0]?.currency || 'eur';
  const urgentDispute = disputes.find(d => {
    if (!d.evidenceDueBy) return false;
    const daysRemaining = Math.ceil((new Date(d.evidenceDueBy).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 3;
  });

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-xl sm:rounded-2xl shadow-lg shadow-amber-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
        
        <div className="relative p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-white font-black text-base sm:text-lg tracking-tight">
                    {disputes.length === 1 
                      ? 'Litige en attente de réponse'
                      : `${disputes.length} litiges en attente de réponse`
                    }
                  </h3>
                  <p className="text-white/80 text-sm mt-1">
                    Montant total: <span className="font-bold">{formatCurrency(totalAmount, currency)}</span>
                    {urgentDispute && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                        <Clock className="w-3 h-3" />
                        Urgent: {formatTimeRemaining(urgentDispute.evidenceDueBy!)}
                      </span>
                    )}
                  </p>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={handleDismiss}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Fermer l'alerte"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Link href="/revenue/disputes">
                  <Button
                    className="bg-white text-amber-600 hover:bg-white/90 font-bold rounded-xl shadow-lg shadow-black/10 gap-2"
                  >
                    Voir les litiges
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a
                  href="https://dashboard.stripe.com/disputes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-white/90 hover:text-white font-semibold text-sm transition-colors"
                >
                  Stripe Dashboard
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
