'use client';

/**
 * Analytics Tab Component
 * Main analytics tab with conversion funnel, revenue trends, cohort analysis, and advanced metrics
 * 
 * @module components/revenue/analytics-tab
 * Requirements: 
 * - 9.1: Revenue Analytics - detailed analytics for pricing optimization
 * - 9.2: Sales Funnel - conversion funnel (Views → Paywall → Checkout → Purchase)
 */
import { useState, useEffect } from 'react';
import { ConversionFunnel } from './conversion-funnel';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Sun,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Revenue trend data point
 */
interface RevenueTrend {
  period: string;
  revenue: number;
  sales: number;
  averageOrderValue: number;
  growthRate: number;
}

/**
 * Cohort data
 */
interface CohortData {
  cohortMonth: string;
  totalCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  retentionByMonth: {
    month: number;
    customers: number;
    revenue: number;
    retentionRate: number;
  }[];
}

/**
 * Cohort analysis result
 */
interface CohortAnalysis {
  cohorts: CohortData[];
  summary: {
    averageRetention: number;
    averageLifetimeValue: number;
    bestPerformingCohort: string;
  };
}

/**
 * Advanced analytics summary
 */
interface AdvancedAnalyticsSummary {
  revenuePerGallery: number;
  conversionRate: number;
  averageTimeToConversion: number;
  topPerformingDay: string;
  peakHour: number;
}

type Period = 'week' | 'month' | 'quarter' | 'year';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: '7j' },
  { value: 'month', label: '30j' },
  { value: 'quarter', label: '90j' },
  { value: 'year', label: '12m' },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year!), parseInt(month!) - 1);
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

function formatHour(hour: number): string {
  return `${hour}h00`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white/60 rounded-2xl border border-slate-200/60" />
        ))}
      </div>
      <div className="h-80 bg-white/60 rounded-2xl border border-slate-200/60" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 bg-white/60 rounded-2xl border border-slate-200/60" />
        <div className="h-96 bg-white/60 rounded-2xl border border-slate-200/60" />
      </div>
    </div>
  );
}

/**
 * Advanced Metrics Summary Cards
 */
function AdvancedMetricsCards({ data }: { data: AdvancedAnalyticsSummary | null }) {
  const metrics = [
    {
      title: 'Revenu par galerie',
      value: formatCurrency(data?.revenuePerGallery || 0),
      icon: BarChart3,
      gradient: 'from-indigo-500 to-violet-600',
      bgLight: 'bg-indigo-50',
    },
    {
      title: 'Taux de conversion',
      value: formatPercent(data?.conversionRate || 0),
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-green-600',
      bgLight: 'bg-emerald-50',
    },
    {
      title: 'Temps moyen conversion',
      value: `${data?.averageTimeToConversion || 0}h`,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
    },
    {
      title: 'Meilleur jour',
      value: data?.topPerformingDay || 'N/A',
      subtitle: data?.peakHour !== undefined ? `Pic à ${formatHour(data.peakHour)}` : undefined,
      icon: Sun,
      gradient: 'from-rose-500 to-pink-600',
      bgLight: 'bg-rose-50',
    },
  ];

  return (
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
  );
}

/**
 * Revenue Trends Chart
 */
function RevenueTrendsChart({ 
  data, 
  period, 
  onPeriodChange 
}: { 
  data: RevenueTrend[]; 
  period: Period;
  onPeriodChange: (period: Period) => void;
}) {
  // Handle null/undefined data
  const safeData = data || [];
  const maxRevenue = safeData.length > 0 ? Math.max(...safeData.map(d => d.revenue), 1) : 1;
  const totalRevenue = safeData.reduce((sum, d) => sum + d.revenue, 0);
  const avgGrowth = safeData.length > 0 
    ? safeData.reduce((sum, d) => sum + d.growthRate, 0) / safeData.length 
    : 0;

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <TrendingUp size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Tendances des revenus</h2>
            <p className="text-xs text-slate-500">
              {formatCurrency(totalRevenue)} • Croissance moy. {formatPercent(avgGrowth)}
            </p>
          </div>
        </div>
        <div className="inline-flex p-1 bg-slate-100 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                period === p.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {safeData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <BarChart3 size={48} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">Aucune donnée pour cette période</p>
        </div>
      ) : (
        <div className="h-64 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-[10px] font-bold text-slate-400 pointer-events-none">
            <span>{formatCurrency(maxRevenue)}</span>
            <span>{formatCurrency(maxRevenue / 2)}</span>
            <span>0€</span>
          </div>

          {/* Chart area */}
          <div className="absolute left-16 right-0 top-0 bottom-8 flex items-end gap-1">
            {safeData.map((point, index) => {
              const height = (point.revenue / maxRevenue) * 100;
              const isPositiveGrowth = point.growthRate >= 0;
              return (
                <div
                  key={index}
                  className="flex-1 group relative"
                  style={{ minWidth: '8px' }}
                >
                  <div
                    className={`rounded-t-md transition-all cursor-pointer group-hover:shadow-lg ${
                      isPositiveGrowth 
                        ? 'bg-gradient-to-t from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600'
                        : 'bg-gradient-to-t from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600'
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-slate-900 text-white text-[10px] font-bold rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                      <div className="text-slate-400">{point.period}</div>
                      <div className="text-emerald-400">{formatCurrency(point.revenue)}</div>
                      <div className="text-slate-300">{point.sales} ventes</div>
                      <div className={`flex items-center gap-1 ${isPositiveGrowth ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositiveGrowth ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {formatPercent(point.growthRate)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          {safeData.length > 0 && (
            <div className="absolute left-16 right-0 bottom-0 flex justify-between text-[10px] font-bold text-slate-400">
              <span>{safeData[0]?.period}</span>
              <span>{safeData[safeData.length - 1]?.period}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Cohort Analysis Table
 */
function CohortAnalysisTable({ data }: { data: CohortAnalysis | null }) {
  if (!data || !data.cohorts || data.cohorts.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
            <Users size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Analyse de cohortes</h2>
            <p className="text-xs text-slate-500">Rétention des clients par mois</p>
          </div>
        </div>
        <div className="py-12 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Pas assez de données</p>
          <p className="text-slate-400 text-sm">Les cohortes apparaîtront avec plus de ventes</p>
        </div>
      </div>
    );
  }

  // Get max months for table columns
  const maxMonths = Math.max(...data.cohorts.map(c => c.retentionByMonth.length));

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
            <Users size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Analyse de cohortes</h2>
            <p className="text-xs text-slate-500">
              Rétention moy. {formatPercent(data.summary.averageRetention)} • 
              LTV moy. {formatCurrency(data.summary.averageLifetimeValue)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Cohorte
              </th>
              <th className="text-center py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Clients
              </th>
              {[...Array(Math.min(maxMonths, 6))].map((_, i) => (
                <th key={i} className="text-center py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  M{i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.cohorts.slice(0, 6).map((cohort) => (
              <tr key={cohort.cohortMonth} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="py-3 px-3">
                  <span className="font-bold text-slate-900">{formatMonth(cohort.cohortMonth)}</span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="text-sm font-bold text-slate-700">{cohort.totalCustomers}</span>
                </td>
                {[...Array(Math.min(maxMonths, 6))].map((_, monthIndex) => {
                  const retention = cohort.retentionByMonth[monthIndex];
                  const rate = retention?.retentionRate || 0;
                  
                  return (
                    <td key={monthIndex} className="py-3 px-3 text-center">
                      {retention ? (
                        <div 
                          className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-xs font-bold ${
                            rate >= 50 ? 'bg-emerald-100 text-emerald-700' :
                            rate >= 25 ? 'bg-emerald-50 text-emerald-600' :
                            rate > 0 ? 'bg-slate-100 text-slate-600' :
                            'bg-slate-50 text-slate-400'
                          }`}
                        >
                          {formatPercent(rate)}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Meilleure cohorte: <span className="font-bold text-slate-700">{formatMonth(data.summary.bestPerformingCohort)}</span>
        </span>
      </div>
    </div>
  );
}

export function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [trends, setTrends] = useState<RevenueTrend[]>([]);
  const [cohorts, setCohorts] = useState<CohortAnalysis | null>(null);
  const [summary, setSummary] = useState<AdvancedAnalyticsSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch all analytics data in parallel
      const [trendsRes, cohortsRes, summaryRes] = await Promise.all([
        fetch(`/api/photographer/revenue/trends?period=${period}`),
        fetch('/api/photographer/revenue/cohorts'),
        fetch('/api/photographer/revenue/summary'),
      ]);

      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setTrends(trendsData);
      }

      if (cohortsRes.ok) {
        const cohortsData = await cohortsRes.json();
        setCohorts(cohortsData);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [period]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/photographer/sales/export?format=csv');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-sm"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Advanced Metrics Summary */}
      <AdvancedMetricsCards data={summary} />

      {/* Conversion Funnel */}
      <ConversionFunnel />

      {/* Revenue Trends & Cohort Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendsChart 
          data={trends} 
          period={period}
          onPeriodChange={setPeriod}
        />
        <CohortAnalysisTable data={cohorts} />
      </div>
    </div>
  );
}
