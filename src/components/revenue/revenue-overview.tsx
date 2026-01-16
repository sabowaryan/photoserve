'use client';

/**
 * Revenue Overview Component
 * Displays key revenue metrics in card format
 * 
 * @module components/revenue/revenue-overview
 * Requirements: 5.3 - UI - Revenue Dashboard Page
 */
import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RevenueData {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  platformFees: number;
  netRevenue: number;
  periodComparison: {
    revenueChange: number;
    salesChange: number;
  };
}

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year', label: 'Cette année' },
  { value: 'all', label: 'Tout' },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="h-10 w-40 bg-slate-200 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/60 rounded-2xl border border-slate-200/60 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function RevenueOverview() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/photographer/revenue/overview?period=${period}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch revenue overview:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const metrics = [
    {
      title: 'Revenus totaux',
      value: formatCurrency(data?.totalRevenue || 0),
      change: data?.periodComparison.revenueChange,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-green-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Ventes',
      value: data?.totalSales?.toString() || '0',
      change: data?.periodComparison.salesChange,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Panier moyen',
      value: formatCurrency(data?.averageOrderValue || 0),
      icon: TrendingUp,
      gradient: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
    {
      title: 'Revenus nets',
      value: formatCurrency(data?.netRevenue || 0),
      subtitle: `${formatCurrency(data?.platformFees || 0)} de frais`,
      icon: Percent,
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex justify-end">
        <div className="inline-flex p-1 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === p.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div 
            key={metric.title} 
            className="group bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-slate-300/60 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {metric.title}
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {metric.value}
                </p>
                {metric.change !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-bold ${
                    metric.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {metric.change >= 0 ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                    {formatChange(metric.change)}
                    <span className="text-slate-400 font-medium">vs période préc.</span>
                  </div>
                )}
                {metric.subtitle && (
                  <p className="text-xs text-slate-400 font-medium">
                    {metric.subtitle}
                  </p>
                )}
              </div>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${metric.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                <metric.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
