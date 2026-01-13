'use client';

/**
 * Pricing Modal Component
 * 
 * Displays three monetization options after a guest creates a gallery:
 * - Keep it Free (24h, watermark) - De-emphasized
 * - Unlock This Gallery ($2.99 one-time) - Popular choice
 * - Go Premium ($9.99/mo subscription) - Best value, center position
 * 
 * Requirements: 3.1, 3.2, 3.6
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Unlock, Crown, Check, Sparkles, ArrowRight, Loader2, AlertTriangle, Zap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { PLAN_LIMITS, PLAN_PRICING } from '@/config/plans';

/**
 * Calculate hours remaining until expiration
 */
function calculateHoursRemaining(expiresAt: string): number {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diffMs = expiration.getTime() - now.getTime();
  const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
  return diffHours;
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallerySlug: string;
  galleryTitle: string;
  expiresAt: string;
  onSelectFree: () => void;
  onSelectUnlock: () => void;
  onSelectSubscribe: () => void;
}

type PricingOptionId = 'free' | 'unlock' | 'subscribe';

export function PricingModal({
  isOpen,
  onClose,
  galleryTitle,
  expiresAt,
  onSelectFree,
  onSelectUnlock,
  onSelectSubscribe,
}: PricingModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PricingOptionId | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate hours remaining for urgency display
  const hoursRemaining = useMemo(() => calculateHoursRemaining(expiresAt), [expiresAt]);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || !isOpen) return null;

  const handleOptionSelect = async (optionId: PricingOptionId) => {
    setSelectedOption(optionId);
    setIsLoading(true);

    try {
      switch (optionId) {
        case 'free':
          onSelectFree();
          break;
        case 'unlock':
          onSelectUnlock();
          break;
        case 'subscribe':
          onSelectSubscribe();
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get premium plan limits and pricing from config
  const premiumLimits = PLAN_LIMITS.premium;
  const premiumPricing = PLAN_PRICING.premium;
  const storageGB = Math.round(premiumLimits.storage_limit_mb / 1024);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition-colors z-10"
          disabled={isLoading}
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-8 pb-6 text-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
              {t('guest.pricing.title')}
            </h2>
            {galleryTitle && (
              <p className="text-white/80 font-medium">
                &ldquo;{galleryTitle}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Urgency Banner */}
        {hoursRemaining > 0 && hoursRemaining <= 24 && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">
              {t('gallery.watermark.expiresIn').replace('{{hours}}', String(hoursRemaining))}
            </span>
          </div>
        )}

        {/* Pricing Options - Reordered: Free | Subscribe (center) | Unlock */}
        <div className="p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-3 items-start">
            
            {/* FREE Option - De-emphasized */}
            <div className="order-1 md:order-1">
              <button
                onClick={() => handleOptionSelect('free')}
                disabled={isLoading}
                className={cn(
                  'w-full p-5 rounded-2xl border-2 text-left transition-all duration-200',
                  'border-slate-200 bg-slate-50/50 hover:border-slate-300',
                  'opacity-75 hover:opacity-100',
                  selectedOption === 'free' && 'border-slate-400 opacity-100',
                  isLoading && 'cursor-not-allowed'
                )}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-slate-500" />
                </div>

                {/* Title & Price */}
                <h3 className="text-base font-bold text-slate-600 mb-1">
                  {t('guest.pricing.options.free.title')}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xl font-black text-slate-500">
                    {t('guest.pricing.options.free.price')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mb-3">
                  {t('guest.pricing.options.free.description')}
                </p>

                {/* Benefits - Smaller */}
                <ul className="space-y-1.5 mb-4">
                  <li className="flex items-center gap-2 text-xs text-slate-500">
                    <Check className="w-3 h-3 text-slate-400" />
                    {t('guest.pricing.options.free.benefits.0')}
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500">
                    <Check className="w-3 h-3 text-slate-400" />
                    {t('guest.pricing.options.free.benefits.1')}
                  </li>
                </ul>

                {/* Action */}
                <div className={cn(
                  'py-2.5 rounded-xl font-medium text-sm text-center transition-all',
                  'bg-slate-200 text-slate-600',
                  selectedOption === 'free' && isLoading && 'opacity-75'
                )}>
                  {selectedOption === 'free' && isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    t('guest.pricing.options.free.title')
                  )}
                </div>
              </button>
            </div>

            {/* SUBSCRIBE Option - Center, Best Value */}
            <div className="order-2 md:order-2">
              <div className="relative">
                {/* Best Value Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black rounded-full shadow-lg uppercase tracking-wide">
                    {t('guest.pricing.options.subscribe.recommended')}
                  </span>
                </div>

                <button
                  onClick={() => handleOptionSelect('subscribe')}
                  disabled={isLoading}
                  className={cn(
                    'w-full p-6 rounded-2xl border-2 text-left transition-all duration-200',
                    'border-indigo-500 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50',
                    'ring-4 ring-indigo-500/20 shadow-xl',
                    'hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]',
                    'md:transform md:scale-105',
                    selectedOption === 'subscribe' && 'ring-indigo-500/40',
                    isLoading && 'cursor-not-allowed'
                  )}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4 shadow-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>

                  {/* Title & Price */}
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    {t('guest.pricing.options.subscribe.title')}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-black text-indigo-600">
                      {premiumPricing.monthlyPrice}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">
                      {t('pricing.perMonth')}
                    </span>
                  </div>
                  <p className="text-sm text-indigo-600 font-bold mb-4">
                    {t('guest.pricing.options.subscribe.description')}
                  </p>

                  {/* Benefits */}
                  <ul className="space-y-2 mb-5">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{premiumLimits.max_galleries} {t('dashboard.stats.galleries').toLowerCase()}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{storageGB} GB {t('dashboard.stats.storage').toLowerCase()}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{t('guest.pricing.options.unlock.benefits.1')}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{premiumLimits.max_expiration_days} {t('gallery.detail.expires').toLowerCase()}</span>
                    </li>
                  </ul>

                  {/* Action */}
                  <div className={cn(
                    'py-3.5 rounded-xl font-bold text-center transition-all',
                    'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg',
                    'flex items-center justify-center gap-2',
                    selectedOption === 'subscribe' && isLoading && 'opacity-75'
                  )}>
                    {selectedOption === 'subscribe' && isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {t('guest.pricing.options.subscribe.title')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* UNLOCK Option - Popular */}
            <div className="order-3 md:order-3">
              <div className="relative">
                {/* Popular Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Popular
                  </span>
                </div>

                <button
                  onClick={() => handleOptionSelect('unlock')}
                  disabled={isLoading}
                  className={cn(
                    'w-full p-5 rounded-2xl border-2 text-left transition-all duration-200',
                    'border-emerald-400 bg-emerald-50/50',
                    'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
                    selectedOption === 'unlock' && 'border-emerald-500 ring-2 ring-emerald-500/20',
                    isLoading && 'cursor-not-allowed'
                  )}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                    <Unlock className="w-6 h-6 text-emerald-600" />
                  </div>

                  {/* Title & Price */}
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    {t('guest.pricing.options.unlock.title')}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-black text-emerald-600">
                      {t('guest.pricing.options.unlock.price')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {t('guest.pricing.options.unlock.description')}
                    </span>
                  </div>

                  {/* Benefits */}
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{t('guest.pricing.options.unlock.benefits.0')}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{t('guest.pricing.options.unlock.benefits.1')}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{t('guest.pricing.options.unlock.benefits.2')}</span>
                    </li>
                  </ul>

                  {/* Action */}
                  <div className={cn(
                    'py-3 rounded-xl font-bold text-center transition-all',
                    'bg-emerald-600 text-white',
                    'flex items-center justify-center gap-2',
                    selectedOption === 'unlock' && isLoading && 'opacity-75'
                  )}>
                    {selectedOption === 'unlock' && isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {t('guest.pricing.options.unlock.title')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">
              {t('landing.finalCta.note')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
