'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Calculator,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { hasFeatureAccess } from '@/config/plan-features';
import type { SubscriptionPlan } from '@/types';

// Types
interface MonetizationConfig {
  galleryId: string;
  isEnabled: boolean;
  priceCents: number;
  currency: string;
  previewMode: 'full_paywall' | 'freemium';
  watermarkEnabled: boolean;
  accessDurationDays?: number | null;
  stripePriceId?: string | null;
  platformFeePercent?: number;
}

interface MonetizationTabProps {
  galleryId: string;
  userPlan: SubscriptionPlan;
}

// Currency options
const CURRENCY_OPTIONS = [
  { value: 'usd', label: 'USD ($)', symbol: '$' },
  { value: 'eur', label: 'EUR (€)', symbol: '€' },
  { value: 'cad', label: 'CAD ($)', symbol: 'C$' },
];

// Preview mode options
const PREVIEW_MODE_OPTIONS = [
  {
    value: 'full_paywall',
    label: 'Full Paywall',
    description: 'Blurred preview images, complete access after purchase',
  },
  {
    value: 'freemium',
    label: 'Freemium',
    description: 'Low-res images with watermark, HD access after purchase',
  },
];

// Price validation constants
const MIN_PRICE_CENTS = 500; // $5.00
const MAX_PRICE_CENTS = 50000; // $500.00
const PLATFORM_FEE_PERCENT = 10;

export function MonetizationTab({ galleryId, userPlan }: MonetizationTabProps) {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisableWarning, setShowDisableWarning] = useState(false);
  
  // Config state
  const [config, setConfig] = useState<MonetizationConfig | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [previewMode, setPreviewMode] = useState<'full_paywall' | 'freemium'>('full_paywall');
  const [hasStripeConnect, setHasStripeConnect] = useState(false);
  
  // Check if user has Pro plan
  const hasPaywallFeature = hasFeatureAccess(userPlan, 'paywall');

  // Price validation
  const priceValidation = useMemo(() => {
    const priceValue = parseFloat(priceInput);
    if (!priceInput || isNaN(priceValue)) {
      return { isValid: false, error: 'Please enter a price' };
    }
    const priceCents = Math.round(priceValue * 100);
    if (priceCents < MIN_PRICE_CENTS) {
      return { isValid: false, error: 'Minimum price is $5.00' };
    }
    if (priceCents > MAX_PRICE_CENTS) {
      return { isValid: false, error: 'Maximum price is $500.00' };
    }
    return { isValid: true, error: null, priceCents };
  }, [priceInput]);

  // Revenue calculations
  const revenueCalculation = useMemo(() => {
    if (!priceValidation.isValid || !priceValidation.priceCents) {
      return null;
    }
    const price = priceValidation.priceCents / 100;
    const platformFee = price * (PLATFORM_FEE_PERCENT / 100);
    const netEarnings = price - platformFee;
    return {
      price,
      platformFee,
      netEarnings,
      platformFeePercent: PLATFORM_FEE_PERCENT,
    };
  }, [priceValidation]);

  // Get currency symbol
  const currencySymbol = useMemo(() => {
    return CURRENCY_OPTIONS.find(c => c.value === currency)?.symbol || '$';
  }, [currency]);

  // Fetch config on mount
  useEffect(() => {
    if (hasPaywallFeature) {
      fetchConfig();
      checkStripeConnect();
    } else {
      setIsLoading(false);
    }
  }, [hasPaywallFeature, galleryId]);

  const checkStripeConnect = async () => {
    try {
      const response = await fetch('/api/stripe/connect/status');
      if (response.ok) {
        const data = await response.json();
        setHasStripeConnect(data.chargesEnabled && data.payoutsEnabled);
      } else if (response.status === 404) {
        setHasStripeConnect(false);
      }
    } catch (err) {
      console.error('Error checking Stripe Connect:', err);
      setHasStripeConnect(false);
    }
  };

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/galleries/${galleryId}/monetization`);
      
      if (response.status === 404) {
        // No config exists yet
        setConfig(null);
        setIsEnabled(false);
        setPriceInput('');
        setCurrency('usd');
        setPreviewMode('full_paywall');
        return;
      }
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch monetization config');
      }
      
      const data = await response.json();
      setConfig(data);
      setIsEnabled(data.isEnabled);
      setPriceInput((data.priceCents / 100).toFixed(2));
      setCurrency(data.currency);
      setPreviewMode(data.previewMode);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load monetization settings';
      setError(errorMessage);
      console.error('Error fetching monetization config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePaywall = useCallback(async (enabled: boolean) => {
    if (!enabled && isEnabled) {
      // Show warning before disabling
      setShowDisableWarning(true);
      return;
    }
    
    if (enabled && !config) {
      // First time enabling - need to save config first
      setIsEnabled(true);
      return;
    }
    
    // Toggle existing config
    try {
      setIsSaving(true);
      setError(null);
      
      if (enabled) {
        // Re-enable existing config
        const response = await fetch(`/api/galleries/${galleryId}/monetization`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: true }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to enable paywall');
        }
        
        const data = await response.json();
        setConfig(data);
        setIsEnabled(true);
        toast.success('Paywall enabled');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle paywall';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [galleryId, config, isEnabled]);

  const handleDisablePaywall = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setShowDisableWarning(false);
      
      const response = await fetch(`/api/galleries/${galleryId}/monetization`, {
        method: 'DELETE',
      });
      
      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable paywall');
      }
      
      setIsEnabled(false);
      if (config) {
        setConfig({ ...config, isEnabled: false });
      }
      toast.success('Paywall disabled');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable paywall';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!priceValidation.isValid) {
      setError(priceValidation.error || 'Invalid price');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      const priceCents = priceValidation.priceCents!;
      
      if (!config) {
        // Create new config
        const response = await fetch(`/api/galleries/${galleryId}/monetization`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceCents,
            currency,
            previewMode,
            watermarkEnabled: previewMode === 'freemium',
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to enable paywall');
        }
        
        const data = await response.json();
        setConfig(data);
        setIsEnabled(true);
        toast.success('Paywall enabled successfully');
      } else {
        // Update existing config
        const response = await fetch(`/api/galleries/${galleryId}/monetization`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceCents,
            currency,
            previewMode,
            watermarkEnabled: previewMode === 'freemium',
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update paywall');
        }
        
        const data = await response.json();
        setConfig(data);
        toast.success('Settings saved successfully');
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Render upgrade prompt for non-Pro users
  if (!hasPaywallFeature) {
    return (
      <div className="max-w-4xl space-y-6 animate-in slide-in-from-bottom-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl text-white shadow-lg">
              <DollarSign size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Monetize Your Galleries</h2>
              <p className="text-slate-600 max-w-md">
                Upgrade to Pro to enable gallery paywalls and start earning from your photography.
                Set your own prices and receive 90% of each sale directly to your bank account.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span className="font-medium text-slate-900">Set Custom Prices</span>
                </div>
                <p className="text-sm text-slate-600">$5 - $500 per gallery</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span className="font-medium text-slate-900">Keep 90%</span>
                </div>
                <p className="text-sm text-slate-600">Only 10% platform fee</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span className="font-medium text-slate-900">Flexible Preview</span>
                </div>
                <p className="text-sm text-slate-600">Full paywall or freemium mode</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span className="font-medium text-slate-900">Secure Payments</span>
                </div>
                <p className="text-sm text-slate-600">Powered by Stripe</p>
              </div>
            </div>
            
            <Link
              href="/settings?upgrade=true"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25"
            >
              <Sparkles size={18} />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Stripe Connect required prompt
  if (!hasStripeConnect) {
    return (
      <div className="max-w-4xl space-y-6 animate-in slide-in-from-bottom-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-white shadow-lg">
              <Shield size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Connect Stripe First</h2>
              <p className="text-slate-600 max-w-md">
                To enable gallery monetization, you need to connect your Stripe account first.
                This allows you to receive payments directly to your bank account.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-md">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Go to Settings → Stripe Connect to connect your account. 
                  Once verified, you can return here to set up your gallery paywall.
                </p>
              </div>
            </div>
            
            <Link
              href="/settings#stripe-connect"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25"
            >
              <Shield size={18} />
              Connect Stripe Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6 animate-in slide-in-from-bottom-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-600 mb-4" />
            <p className="text-slate-600">Loading monetization settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6 animate-in slide-in-from-bottom-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enable Paywall Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg">
              <Lock size={18} />
            </div>
            <div className="flex-1">
              <span className="font-bold text-slate-900">Enable Paywall</span>
              <p className="text-xs text-slate-500 mt-0.5">Require payment to access gallery</p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleTogglePaywall}
              disabled={isSaving || (!config && !priceValidation.isValid)}
            />
          </div>
          
          {isEnabled && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-700 text-sm">
                <CheckCircle2 size={16} />
                <span className="font-medium">Paywall is active</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                Visitors must purchase access to view full gallery
              </p>
            </div>
          )}
          
          {!isEnabled && config && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <EyeOff size={16} />
                <span className="font-medium">Paywall is disabled</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gallery is currently free to access
              </p>
            </div>
          )}
        </div>

        {/* Price Input Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl text-white shadow-lg">
              <DollarSign size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-900">Gallery Price</span>
              <p className="text-xs text-slate-500 mt-0.5">Set your price ($5 - $500)</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    step="0.01"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    disabled={isSaving}
                    placeholder="0.00"
                    className={cn(
                      "w-full pl-10 pr-4 py-3.5 bg-slate-50 border rounded-xl outline-none font-bold text-lg",
                      "focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all",
                      "disabled:bg-slate-100 disabled:text-slate-400",
                      !priceValidation.isValid && priceInput && "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                    )}
                  />
                </div>
                {!priceValidation.isValid && priceInput && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {priceValidation.error}
                  </p>
                )}
              </div>
              
              <Select value={currency} onValueChange={setCurrency} disabled={isSaving}>
                <SelectTrigger className="w-28 h-[54px] bg-slate-50 border-slate-200 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Mode & Revenue Calculator Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview Mode Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl text-white shadow-lg">
              <Eye size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-900">Preview Mode</span>
              <p className="text-xs text-slate-500 mt-0.5">How visitors see unpurchased gallery</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {PREVIEW_MODE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  previewMode === option.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50"
                )}
              >
                <input
                  type="radio"
                  name="previewMode"
                  value={option.value}
                  checked={previewMode === option.value}
                  onChange={(e) => setPreviewMode(e.target.value as 'full_paywall' | 'freemium')}
                  disabled={isSaving}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <span className={cn(
                    "font-medium",
                    previewMode === option.value ? "text-indigo-900" : "text-slate-900"
                  )}>
                    {option.label}
                  </span>
                  <p className={cn(
                    "text-xs mt-0.5",
                    previewMode === option.value ? "text-indigo-700" : "text-slate-500"
                  )}>
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Revenue Calculator Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white shadow-lg">
              <Calculator size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-900">Revenue Calculator</span>
              <p className="text-xs text-slate-500 mt-0.5">Your earnings per sale</p>
            </div>
          </div>
          
          {revenueCalculation ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Gallery Price</span>
                <span className="font-bold text-slate-900">
                  {currencySymbol}{revenueCalculation.price.toFixed(2)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">
                  Platform Fee ({revenueCalculation.platformFeePercent}%)
                </span>
                <span className="font-medium text-slate-700">
                  -{currencySymbol}{revenueCalculation.platformFee.toFixed(2)}
                </span>
              </div>
              
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                  <div>
                    <span className="text-sm font-medium text-emerald-700">Your Earnings</span>
                    <p className="text-xs text-emerald-600">Per sale (90%)</p>
                  </div>
                  <span className="text-2xl font-bold text-emerald-700">
                    {currencySymbol}{revenueCalculation.netEarnings.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl text-center">
              <Calculator size={24} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-500">
                Enter a valid price to see your earnings
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Paywall Preview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl text-white shadow-lg">
            <ImageIcon size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-900">Paywall Preview</span>
            <p className="text-xs text-slate-500 mt-0.5">How visitors will see your gallery</p>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          {/* Preview Images Grid */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg relative overflow-hidden",
                  previewMode === 'full_paywall' && "blur-md"
                )}
              >
                {previewMode === 'freemium' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-slate-400 text-xs font-bold rotate-[-30deg] opacity-50">
                      PREVIEW
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Paywall Overlay */}
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center p-6 text-center",
            previewMode === 'full_paywall' 
              ? "bg-slate-900/80 backdrop-blur-sm" 
              : "bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"
          )}>
            <div className={cn(
              "p-4 rounded-2xl mb-4",
              previewMode === 'full_paywall' ? "bg-white/10" : "bg-white shadow-lg"
            )}>
              <Lock size={24} className={previewMode === 'full_paywall' ? "text-white" : "text-indigo-600"} />
            </div>
            
            <h3 className={cn(
              "text-lg font-bold mb-2",
              previewMode === 'full_paywall' ? "text-white" : "text-white"
            )}>
              {previewMode === 'full_paywall' ? 'Unlock Full Gallery' : 'Unlock HD Access'}
            </h3>
            
            <p className={cn(
              "text-sm mb-4 max-w-xs",
              previewMode === 'full_paywall' ? "text-white/70" : "text-white/80"
            )}>
              {previewMode === 'full_paywall' 
                ? 'Purchase access to view all photos in full resolution'
                : 'Get full HD quality without watermarks'}
            </p>
            
            {revenueCalculation && (
              <div className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl">
                Purchase for {currencySymbol}{revenueCalculation.price.toFixed(2)}
              </div>
            )}
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mt-3 text-center">
          {previewMode === 'full_paywall' 
            ? 'Visitors see blurred previews until they purchase access'
            : 'Visitors can browse low-res watermarked images before purchasing HD access'}
        </p>
      </div>

      {/* Save Button Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Decorative orb */}
        <div className={cn(
          "absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-2xl transition-colors duration-500",
          saveSuccess ? 'bg-emerald-500/30' : 'bg-indigo-500/20'
        )} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-sm font-bold text-white/70">Save Monetization Settings</span>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={isSaving || !priceValidation.isValid}
            className={cn(
              "relative w-full py-4 h-auto rounded-xl font-bold text-base transition-all duration-300",
              saveSuccess 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-white hover:bg-slate-50 text-slate-900 shadow-lg'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 size={18} className="mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {config ? 'Save Changes' : 'Enable Paywall'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Disable Paywall Warning Dialog */}
      <AlertDialog open={showDisableWarning} onOpenChange={setShowDisableWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              Disable Paywall?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Disabling the paywall will make your gallery free to access. 
              Existing purchases will remain valid, but new visitors won&apos;t need to pay.
              You can re-enable the paywall at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisablePaywall}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable Paywall'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
