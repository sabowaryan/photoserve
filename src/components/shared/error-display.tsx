'use client';

/**
 * Error Display Components
 * 
 * Provides consistent error display across the application with
 * support for translations and different error types.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

import { AlertCircle, AlertTriangle, XCircle, RefreshCw, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Error codes that map to translation keys
 */
export type ErrorCode = 
  // Upload errors
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'TOO_MANY_FILES'
  | 'NO_FILES'
  | 'NETWORK_ERROR'
  | 'GALLERY_CREATION_FAILED'
  | 'UPLOAD_FAILED'
  // Payment errors
  | 'PAYMENT_FAILED'
  | 'PAYMENT_DECLINED'
  | 'SESSION_EXPIRED'
  | 'CHECKOUT_FAILED'
  | 'INVALID_AMOUNT'
  | 'STRIPE_ERROR'
  // Session errors
  | 'GUEST_SESSION_EXPIRED'
  | 'GUEST_SESSION_INVALID'
  | 'SESSION_CREATION_FAILED'
  // Gallery errors
  | 'GALLERY_NOT_FOUND'
  | 'GALLERY_EXPIRED'
  | 'GALLERY_ACCESS_DENIED'
  | 'MIGRATION_FAILED'
  // Generic errors
  | 'UNEXPECTED_ERROR'
  | 'GENERIC_NETWORK_ERROR'
  | 'RETRY_ERROR';

/**
 * Maps error codes to translation keys
 */
const ERROR_CODE_TO_TRANSLATION: Record<ErrorCode, string> = {
  // Upload errors
  FILE_TOO_LARGE: 'errors.upload.fileTooLarge',
  INVALID_FILE_TYPE: 'errors.upload.invalidFileType',
  TOO_MANY_FILES: 'errors.upload.tooManyFiles',
  NO_FILES: 'errors.upload.noFiles',
  NETWORK_ERROR: 'errors.upload.networkError',
  GALLERY_CREATION_FAILED: 'errors.upload.galleryCreationFailed',
  UPLOAD_FAILED: 'errors.upload.uploadFailed',
  // Payment errors
  PAYMENT_FAILED: 'errors.payment.failed',
  PAYMENT_DECLINED: 'errors.payment.declined',
  SESSION_EXPIRED: 'errors.payment.sessionExpired',
  CHECKOUT_FAILED: 'errors.payment.checkoutFailed',
  INVALID_AMOUNT: 'errors.payment.invalidAmount',
  STRIPE_ERROR: 'errors.payment.stripeError',
  // Session errors
  GUEST_SESSION_EXPIRED: 'errors.session.expired',
  GUEST_SESSION_INVALID: 'errors.session.invalid',
  SESSION_CREATION_FAILED: 'errors.session.creationFailed',
  // Gallery errors
  GALLERY_NOT_FOUND: 'errors.gallery.notFound',
  GALLERY_EXPIRED: 'errors.gallery.expired',
  GALLERY_ACCESS_DENIED: 'errors.gallery.accessDenied',
  MIGRATION_FAILED: 'errors.gallery.migrationFailed',
  // Generic errors
  UNEXPECTED_ERROR: 'errors.generic.unexpected',
  GENERIC_NETWORK_ERROR: 'errors.generic.networkError',
  RETRY_ERROR: 'errors.generic.retry',
};

interface ErrorDisplayProps {
  /** Error code for translation lookup */
  code?: ErrorCode;
  /** Custom error message (overrides code-based translation) */
  message?: string;
  /** Translation parameters for interpolation */
  params?: Record<string, string>;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Whether the error can be dismissed */
  dismissible?: boolean;
  /** Callback when error is dismissed */
  onDismiss?: () => void;
  /** Whether to show a retry button */
  showRetry?: boolean;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Gets the appropriate icon for the error severity
 */
function getErrorIcon(severity: ErrorSeverity) {
  switch (severity) {
    case 'warning':
      return AlertTriangle;
    case 'info':
      return AlertCircle;
    case 'error':
    default:
      return XCircle;
  }
}

/**
 * Gets the appropriate color classes for the error severity
 */
function getErrorColors(severity: ErrorSeverity) {
  switch (severity) {
    case 'warning':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: 'text-amber-500',
        button: 'text-amber-600 hover:text-amber-800 hover:bg-amber-100',
      };
    case 'info':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'text-blue-500',
        button: 'text-blue-600 hover:text-blue-800 hover:bg-blue-100',
      };
    case 'error':
    default:
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        icon: 'text-rose-500',
        button: 'text-rose-600 hover:text-rose-800 hover:bg-rose-100',
      };
  }
}

/**
 * Error Display Component
 * 
 * Displays error messages with consistent styling and translation support.
 * Supports different severity levels, dismissible errors, and retry functionality.
 */
export function ErrorDisplay({
  code,
  message,
  params,
  severity = 'error',
  dismissible = false,
  onDismiss,
  showRetry = false,
  onRetry,
  className,
}: ErrorDisplayProps) {
  const { t } = useTranslation();
  
  // Get translated message
  const displayMessage = message || (code ? t(ERROR_CODE_TO_TRANSLATION[code], params) : t('errors.generic.unexpected'));
  
  const Icon = getErrorIcon(severity);
  const colors = getErrorColors(severity);

  return (
    <div
      className={cn(
        'p-4 rounded-2xl border flex items-start gap-3',
        colors.bg,
        colors.border,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', colors.icon)} />
      
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm', colors.text)}>
          {displayMessage}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              colors.button
            )}
            aria-label={t('errors.500.retry')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              colors.button
            )}
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Inline Error Component
 * 
 * A smaller, inline version of the error display for form fields.
 */
interface InlineErrorProps {
  /** Error code for translation lookup */
  code?: ErrorCode;
  /** Custom error message */
  message?: string;
  /** Translation parameters */
  params?: Record<string, string>;
  /** Additional CSS classes */
  className?: string;
}

export function InlineError({ code, message, params, className }: InlineErrorProps) {
  const { t } = useTranslation();
  
  const displayMessage = message || (code ? t(ERROR_CODE_TO_TRANSLATION[code], params) : '');
  
  if (!displayMessage) return null;

  return (
    <p className={cn('text-sm text-rose-600 font-medium flex items-center gap-1.5', className)}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {displayMessage}
    </p>
  );
}

/**
 * Toast-style Error Component
 * 
 * A floating error notification that can be used for temporary error messages.
 */
interface ErrorToastProps {
  /** Error code for translation lookup */
  code?: ErrorCode;
  /** Custom error message */
  message?: string;
  /** Translation parameters */
  params?: Record<string, string>;
  /** Whether the toast is visible */
  visible: boolean;
  /** Callback when toast is dismissed */
  onDismiss: () => void;
  /** Auto-dismiss timeout in milliseconds (0 to disable) */
  autoHideMs?: number;
  /** Additional CSS classes */
  className?: string;
}

export function ErrorToast({
  code,
  message,
  params,
  visible,
  onDismiss,
  autoHideMs = 5000,
  className,
}: ErrorToastProps) {
  const { t } = useTranslation();
  
  const displayMessage = message || (code ? t(ERROR_CODE_TO_TRANSLATION[code], params) : t('errors.generic.unexpected'));

  // Auto-hide effect
  if (visible && autoHideMs > 0) {
    setTimeout(onDismiss, autoHideMs);
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-md',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        className
      )}
    >
      <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
        <XCircle className="w-5 h-5 flex-shrink-0" />
        <p className="font-medium text-sm flex-1">{displayMessage}</p>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg hover:bg-rose-500 transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Helper function to get error message from error code
 */
export function getErrorMessage(code: ErrorCode, t: (key: string, params?: Record<string, string>) => string, params?: Record<string, string>): string {
  const translationKey = ERROR_CODE_TO_TRANSLATION[code];
  return translationKey ? t(translationKey, params) : t('errors.generic.unexpected');
}

/**
 * Helper function to determine error code from API response
 */
export function getErrorCodeFromResponse(response: { code?: string; error?: string }): ErrorCode {
  const code = response.code?.toUpperCase();
  
  // Map API error codes to our error codes
  const codeMap: Record<string, ErrorCode> = {
    'FILE_SIZE_EXCEEDED': 'FILE_TOO_LARGE',
    'INVALID_FILE_TYPE': 'INVALID_FILE_TYPE',
    'IMAGE_LIMIT_EXCEEDED': 'TOO_MANY_FILES',
    'VALIDATION_ERROR': 'NO_FILES',
    'NETWORK_ERROR': 'NETWORK_ERROR',
    'PAYMENT_FAILED': 'PAYMENT_FAILED',
    'PAYMENT_DECLINED': 'PAYMENT_DECLINED',
    'SESSION_EXPIRED': 'SESSION_EXPIRED',
    'CHECKOUT_FAILED': 'CHECKOUT_FAILED',
    'GUEST_SESSION_EXPIRED': 'GUEST_SESSION_EXPIRED',
    'GUEST_SESSION_INVALID': 'GUEST_SESSION_INVALID',
    'NOT_FOUND': 'GALLERY_NOT_FOUND',
    'GALLERY_EXPIRED': 'GALLERY_EXPIRED',
    'ACCESS_DENIED': 'GALLERY_ACCESS_DENIED',
    'MIGRATION_FAILED': 'MIGRATION_FAILED',
    'INTERNAL_ERROR': 'UNEXPECTED_ERROR',
  };

  return codeMap[code || ''] || 'UNEXPECTED_ERROR';
}
