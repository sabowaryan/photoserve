'use client';

/**
 * Expiration Banner Component
 * 
 * Displays a banner indicating that a gallery is free and will expire.
 * Shows "Free Gallery - Expires in X hours" message.
 * 
 * Requirements: 2.4
 */

import { useMemo } from 'react';
import { Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

interface ExpirationBannerProps {
  /** The expiration date/time as ISO string */
  expiresAt: string;
  /** Whether the gallery is unlocked (paid) */
  isUnlocked?: boolean;
  /** Optional className for styling */
  className?: string;
  /** Variant of the banner */
  variant?: 'default' | 'compact' | 'floating';
  /** Optional callback when upgrade is clicked */
  onUpgradeClick?: () => void;
}

/**
 * Calculate hours remaining until expiration
 */
function calculateTimeRemaining(expiresAt: string): { hours: number; minutes: number; isExpired: boolean } {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diffMs = expiration.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, isExpired: true };
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, isExpired: false };
}

/**
 * ExpirationBanner Component
 * 
 * Displays expiration information for free guest galleries.
 * Shows different states based on time remaining:
 * - Normal: Blue/indigo theme
 * - Warning (< 6 hours): Amber theme
 * - Critical (< 1 hour): Red theme
 * - Expired: Gray theme
 */
export function ExpirationBanner({
  expiresAt,
  isUnlocked = false,
  className,
  variant = 'default',
  onUpgradeClick,
}: ExpirationBannerProps) {
  const { t } = useTranslation();
  
  const timeRemaining = useMemo(() => calculateTimeRemaining(expiresAt), [expiresAt]);
  
  // Don't show banner for unlocked galleries
  if (isUnlocked) {
    return null;
  }
  
  const { hours, minutes, isExpired } = timeRemaining;
  
  // Determine urgency level for styling
  const urgency = isExpired 
    ? 'expired' 
    : hours < 1 
    ? 'critical' 
    : hours < 6 
    ? 'warning' 
    : 'normal';
  
  const urgencyStyles = {
    normal: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      icon: 'text-indigo-500',
      badge: 'bg-indigo-100 text-indigo-700',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: 'text-amber-500',
      badge: 'bg-amber-100 text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    critical: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      icon: 'text-rose-500',
      badge: 'bg-rose-100 text-rose-700',
      button: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    expired: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-600',
      icon: 'text-slate-400',
      badge: 'bg-slate-100 text-slate-600',
      button: 'bg-slate-600 hover:bg-slate-700 text-white',
    },
  };
  
  const styles = urgencyStyles[urgency];
  
  // Format time display
  const formatTimeDisplay = () => {
    if (isExpired) {
      return t('gallery.detail.expired');
    }
    if (hours === 0) {
      return `${minutes}m`;
    }
    if (hours < 24) {
      return t('gallery.watermark.expiresIn', { hours: String(hours) });
    }
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };
  
  // Compact variant (for inline use)
  if (variant === 'compact') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold',
        styles.badge,
        className
      )}>
        {isExpired ? (
          <AlertTriangle className="w-3.5 h-3.5" />
        ) : (
          <Clock className="w-3.5 h-3.5" />
        )}
        <span>{formatTimeDisplay()}</span>
      </div>
    );
  }
  
  // Floating variant (for overlay on gallery)
  if (variant === 'floating') {
    return (
      <div className={cn(
        'absolute top-4 left-4 z-20',
        className
      )}>
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-2xl shadow-lg backdrop-blur-sm',
          styles.bg,
          'border',
          styles.border
        )}>
          <div className={cn('p-1.5 rounded-lg', styles.badge)}>
            {isExpired ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className={cn('text-xs font-bold', styles.text)}>
              {t('gallery.watermark.badge')}
            </p>
            <p className={cn('text-xs font-medium', styles.text, 'opacity-80')}>
              {formatTimeDisplay()}
            </p>
          </div>
          {onUpgradeClick && !isExpired && (
            <button
              onClick={onUpgradeClick}
              className={cn(
                'ml-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                styles.button
              )}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              Upgrade
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // Default variant (full-width banner)
  return (
    <div className={cn(
      'w-full px-4 py-3 border rounded-2xl',
      styles.bg,
      styles.border,
      className
    )}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-xl', styles.badge)}>
            {isExpired ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className={cn('text-sm font-bold', styles.text)}>
              {t('gallery.watermark.badge')}
            </p>
            <p className={cn('text-xs font-medium', styles.text, 'opacity-80')}>
              {formatTimeDisplay()}
            </p>
          </div>
        </div>
        
        {onUpgradeClick && !isExpired && (
          <button
            onClick={onUpgradeClick}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold transition-all',
              'shadow-lg hover:shadow-xl active:scale-[0.98]',
              styles.button
            )}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}
