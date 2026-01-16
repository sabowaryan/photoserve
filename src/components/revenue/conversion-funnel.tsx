'use client';

/**
 * Conversion Funnel Component
 * Displays visual funnel showing Views → Paywall → Checkout → Purchase
 * with conversion rates at each step and drop-off analysis
 * 
 * @module components/revenue/conversion-funnel
 * Requirements: 9.2 - Sales Funnel (Views → Paywall → Checkout → Purchase)
 */
import { useState, useEffect } from 'react';
import { 
  Eye, 
  Lock, 
  ShoppingCart, 
  CheckCircle2, 
  TrendingDown,
  ArrowDown,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConversionFunnelData {
  views: number;
  paywallViews: number;
  checkoutStarts: number;
  purchases: number;
  conversionRates: {
    viewToPaywall: number;
    paywallToCheckout: number;
    checkoutToPurchase: number;
    overall: number;
  };
  dropOffPoints: {
    step: string;
    dropOffRate: number;
    count: number;
  }[];
  period: {
    startDate: string;
    endDate: string;
  };
}

type DateRange = '7d' | '30d' | '90d' | 'all';

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: 'all', label: 'Tout' },
];

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function LoadingSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

interface FunnelStepProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  percentage: number;
  color: string;
  bgColor: string;
  isLast?: boolean;
  dropOffRate?: number;
  dropOffCount?: number;
}

function FunnelStep({ 
  icon: Icon, 
  label, 
  value, 
  percentage, 
  color, 
  bgColor,
  isLast = false,
  dropOffRate,
  dropOffCount
}: FunnelStepProps) {
  return (
    <div className="relative">
      {/* Main Step */}
      <div 
        className="relative overflow-hidden rounded-xl border border-slate-200/60 transition-all hover:shadow-md hover:border-slate-300/60"
        style={{ 
          background: `linear-gradient(90deg, ${bgColor} ${percentage}%, transparent ${percentage}%)` 
        }}
      >
        <div className="relative z-10 flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color} shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{label}</p>
              <p className="text-xs text-slate-500">
                {formatPercent(percentage)} du total
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-slate-900">{formatNumber(value)}</p>
          </div>
        </div>
      </div>

      {/* Drop-off indicator */}
      {!isLast && dropOffRate !== undefined && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200/60 rounded-full">
            <TrendingDown className="w-3 h-3 text-rose-500" />
            <span className="text-[10px] font-bold text-rose-600">
              -{formatPercent(dropOffRate)} ({formatNumber(dropOffCount || 0)} perdus)
            </span>
          </div>
          <ArrowDown className="w-4 h-4 text-slate-300 ml-2" />
        </div>
      )}
    </div>
  );
}

export function ConversionFunnel() {
  const [data, setData] = useState<ConversionFunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      
      // Calculate date range
      const endDate = new Date().toISOString();
      let startDate: string;
      
      switch (dateRange) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          startDate = new Date('2020-01-01').toISOString();
      }
      
      params.set('startDate', startDate);
      params.set('endDate', endDate);

      const response = await fetch(`/api/photographer/revenue/funnel?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch conversion funnel:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Calculate percentages relative to views (first step)
  const views = data?.views || 0;
  const paywallViews = data?.paywallViews || 0;
  const checkoutStarts = data?.checkoutStarts || 0;
  const purchases = data?.purchases || 0;

  const viewsPercent = 100;
  const paywallPercent = views > 0 ? (paywallViews / views) * 100 : 0;
  const checkoutPercent = views > 0 ? (checkoutStarts / views) * 100 : 0;
  const purchasePercent = views > 0 ? (purchases / views) * 100 : 0;

  const funnelSteps = [
    {
      icon: Eye,
      label: 'Vues de galerie',
      value: views,
      percentage: viewsPercent,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      bgColor: 'rgba(99, 102, 241, 0.1)',
      dropOffRate: data?.dropOffPoints[0]?.dropOffRate,
      dropOffCount: data?.dropOffPoints[0]?.count,
    },
    {
      icon: Lock,
      label: 'Vues du paywall',
      value: paywallViews,
      percentage: paywallPercent,
      color: 'bg-gradient-to-br from-violet-500 to-purple-600',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      dropOffRate: data?.dropOffPoints[1]?.dropOffRate,
      dropOffCount: data?.dropOffPoints[1]?.count,
    },
    {
      icon: ShoppingCart,
      label: 'Démarrages checkout',
      value: checkoutStarts,
      percentage: checkoutPercent,
      color: 'bg-gradient-to-br from-amber-500 to-orange-600',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      dropOffRate: data?.dropOffPoints[2]?.dropOffRate,
      dropOffCount: data?.dropOffPoints[2]?.count,
    },
    {
      icon: CheckCircle2,
      label: 'Achats complétés',
      value: purchases,
      percentage: purchasePercent,
      color: 'bg-gradient-to-br from-emerald-500 to-green-600',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      isLast: true,
    },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Filter size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Entonnoir de conversion</h2>
            <p className="text-xs text-slate-500">
              Taux global: {formatPercent(data?.conversionRates.overall || 0)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg">
            {DATE_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  dateRange === range.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Funnel Visualization */}
      {views === 0 ? (
        <div className="py-12 text-center">
          <Filter className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aucune donnée pour cette période</p>
          <p className="text-slate-400 text-sm">Les données de conversion apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-1">
          {funnelSteps.map((step, index) => (
            <FunnelStep
              key={index}
              {...step}
            />
          ))}
        </div>
      )}

      {/* Conversion Rate Summary */}
      {views > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Taux de conversion par étape
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Vue → Paywall
              </p>
              <p className="text-lg font-black text-indigo-600">
                {formatPercent(data?.conversionRates.viewToPaywall || 0)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Paywall → Checkout
              </p>
              <p className="text-lg font-black text-violet-600">
                {formatPercent(data?.conversionRates.paywallToCheckout || 0)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Checkout → Achat
              </p>
              <p className="text-lg font-black text-amber-600">
                {formatPercent(data?.conversionRates.checkoutToPurchase || 0)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Taux global
              </p>
              <p className="text-lg font-black text-emerald-600">
                {formatPercent(data?.conversionRates.overall || 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
