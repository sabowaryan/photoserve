'use client';

/**
 * Refund Modal Component
 * Modal for processing refunds on gallery purchases
 * 
 * @module components/revenue/refund-modal
 * Requirements: 7.1 - Refund Management
 * - THE Sales_List SHALL have "Refund" action button
 * - WHEN clicking refund, THE System SHALL show confirmation modal
 * - THE Modal SHALL display: Amount, Client, Reason input
 * - THE Photographer SHALL choose: Full refund or Partial refund
 */
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Loader2, Check, DollarSign, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface Sale {
  id: string;
  galleryId: string;
  galleryTitle: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  platformFee: number;
  netAmount: number;
  status: string;
  purchasedAt: string;
  refundedAt?: string;
}

interface RefundableAmountResponse {
  purchaseId: string;
  originalAmountCents: number;
  refundedAmountCents: number;
  refundableAmountCents: number;
  currency: string;
  canRefund: boolean;
  status: string;
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onRefundSuccess?: (saleId: string) => void;
}

type RefundType = 'full' | 'partial';

function formatCurrency(cents: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function RefundModal({ isOpen, onClose, sale, onRefundSuccess }: RefundModalProps) {
  const [mounted, setMounted] = useState(false);
  const [refundType, setRefundType] = useState<RefundType>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingRefundable, setFetchingRefundable] = useState(false);
  const [refundableData, setRefundableData] = useState<RefundableAmountResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch refundable amount when modal opens
  const fetchRefundableAmount = useCallback(async () => {
    if (!sale) return;
    
    setFetchingRefundable(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/photographer/sales/${sale.id}/refund`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch refundable amount');
      }
      const data = await response.json();
      setRefundableData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch refundable amount');
    } finally {
      setFetchingRefundable(false);
    }
  }, [sale]);

  // Reset state when modal opens/closes or sale changes
  useEffect(() => {
    if (isOpen && sale) {
      setRefundType('full');
      setPartialAmount('');
      setReason('');
      setError(null);
      setSuccess(false);
      setRefundableData(null);
      fetchRefundableAmount();
    }
  }, [isOpen, sale, fetchRefundableAmount]);

  // Validation
  const validatePartialAmount = useCallback((): string | null => {
    if (refundType !== 'partial') return null;
    
    const amountCents = Math.round(parseFloat(partialAmount) * 100);
    
    if (isNaN(amountCents) || amountCents <= 0) {
      return 'Veuillez entrer un montant valide';
    }
    
    if (refundableData && amountCents > refundableData.refundableAmountCents) {
      return `Le montant ne peut pas dépasser ${formatCurrency(refundableData.refundableAmountCents, refundableData.currency)}`;
    }
    
    return null;
  }, [refundType, partialAmount, refundableData]);

  const validationError = validatePartialAmount();
  const canSubmit = !loading && !fetchingRefundable && refundableData?.canRefund && 
    (refundType === 'full' || (refundType === 'partial' && !validationError));

  // Handle refund submission
  const handleSubmit = async () => {
    if (!sale || !canSubmit) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const body: { type: RefundType; amountCents?: number; reason?: string } = {
        type: refundType,
      };
      
      if (refundType === 'partial') {
        body.amountCents = Math.round(parseFloat(partialAmount) * 100);
      }
      
      if (reason.trim()) {
        body.reason = reason.trim();
      }
      
      const response = await fetch(`/api/photographer/sales/${sale.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }
      
      setSuccess(true);
      
      // Call success callback after a short delay
      setTimeout(() => {
        onRefundSuccess?.(sale.id);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isOpen || !sale) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition-colors z-10 disabled:opacity-50"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 p-6 pb-5 relative overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
          
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mb-1">
              Rembourser cette vente
            </h2>
            <p className="text-white/80 font-medium text-sm">
              Cette action est irréversible
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success State */}
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Remboursement effectué
              </h3>
              <p className="text-slate-500 text-sm">
                Le remboursement sera traité sous 5-10 jours ouvrés
              </p>
            </div>
          ) : (
            <>
              {/* Sale Details */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-medium">Galerie</p>
                      <p className="font-bold text-slate-900 truncate">{sale.galleryTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-medium">Client</p>
                      <p className="font-bold text-slate-900 truncate">{sale.buyerEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-medium">Montant remboursable</p>
                      {fetchingRefundable ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          <span className="text-slate-400 text-sm">Chargement...</span>
                        </div>
                      ) : refundableData ? (
                        <p className="font-bold text-slate-900">
                          {formatCurrency(refundableData.refundableAmountCents, refundableData.currency)}
                        </p>
                      ) : (
                        <p className="font-bold text-slate-900">
                          {formatCurrency(sale.amount, sale.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cannot Refund Warning */}
              {refundableData && !refundableData.canRefund && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-800 text-sm">Remboursement impossible</p>
                      <p className="text-amber-700 text-sm mt-1">
                        {refundableData.status === 'refunded' 
                          ? 'Cette vente a déjà été entièrement remboursée.'
                          : 'Cette vente ne peut pas être remboursée.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Refund Type Selection */}
              {refundableData?.canRefund && (
                <>
                  <div className="mb-5">
                    <Label className="text-sm font-bold text-slate-700 mb-3 block">
                      Type de remboursement
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRefundType('full')}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          refundType === 'full'
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 mb-2 flex items-center justify-center ${
                          refundType === 'full' ? 'border-rose-500' : 'border-slate-300'
                        }`}>
                          {refundType === 'full' && (
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                          )}
                        </div>
                        <p className="font-bold text-slate-900 text-sm">Remboursement total</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatCurrency(refundableData.refundableAmountCents, refundableData.currency)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefundType('partial')}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          refundType === 'partial'
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 mb-2 flex items-center justify-center ${
                          refundType === 'partial' ? 'border-rose-500' : 'border-slate-300'
                        }`}>
                          {refundType === 'partial' && (
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                          )}
                        </div>
                        <p className="font-bold text-slate-900 text-sm">Remboursement partiel</p>
                        <p className="text-xs text-slate-500 mt-1">Montant personnalisé</p>
                      </button>
                    </div>
                  </div>

                  {/* Partial Amount Input */}
                  {refundType === 'partial' && (
                    <div className="mb-5">
                      <Label htmlFor="partialAmount" className="text-sm font-bold text-slate-700 mb-2 block">
                        Montant à rembourser ({refundableData.currency.toUpperCase()})
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                          {refundableData.currency === 'eur' ? '€' : refundableData.currency === 'usd' ? '$' : refundableData.currency.toUpperCase()}
                        </span>
                        <Input
                          id="partialAmount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={(refundableData.refundableAmountCents / 100).toFixed(2)}
                          value={partialAmount}
                          onChange={(e) => setPartialAmount(e.target.value)}
                          placeholder="0.00"
                          className="pl-8 bg-slate-50 border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500"
                        />
                      </div>
                      {validationError && (
                        <p className="text-rose-600 text-xs mt-2 font-medium">{validationError}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-2">
                        Maximum: {formatCurrency(refundableData.refundableAmountCents, refundableData.currency)}
                      </p>
                    </div>
                  )}

                  {/* Reason Input */}
                  <div className="mb-6">
                    <Label htmlFor="reason" className="text-sm font-bold text-slate-700 mb-2 block">
                      Raison du remboursement <span className="text-slate-400 font-normal">(optionnel)</span>
                    </Label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ex: Demande du client, erreur de commande..."
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 placeholder:text-slate-400"
                    />
                    <p className="text-slate-400 text-xs mt-1 text-right">
                      {reason.length}/500
                    </p>
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-800 text-sm">Erreur</p>
                      <p className="text-rose-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-xl border-slate-200 hover:bg-slate-50 font-bold"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Traitement...
                    </>
                  ) : (
                    'Confirmer le remboursement'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
