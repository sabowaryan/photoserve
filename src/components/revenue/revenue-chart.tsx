'use client';

/**
 * Revenue Chart Component
 * Displays revenue over time using a bar chart
 * 
 * @module components/revenue/revenue-chart
 * Requirements: 5.3 - UI - Revenue Dashboard Page
 */
import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';

interface ChartDataPoint {
  date: string;
  revenue: number;
  sales: number;
}

type Range = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

const RANGES: { value: Range; label: string }[] = [
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

function formatDate(dateStr: string, range: Range): string {
  const date = new Date(dateStr);
  if (range === 'today') {
    return date.toLocaleTimeString('fr-FR', { hour: 'numeric' });
  }
  if (range === 'week' || range === 'month') {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

function LoadingSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
      <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse mb-4" />
      <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
    </div>
  );
}

export function RevenueChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('month');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/photographer/revenue/chart?range=${range}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [range]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <BarChart3 size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Évolution des revenus</h2>
            <p className="text-xs text-slate-500">
              {formatCurrency(totalRevenue)} • {totalSales} ventes
            </p>
          </div>
        </div>
        <div className="inline-flex p-1 bg-slate-100 rounded-lg">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                range === r.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
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
            {data.map((point, index) => {
              const height = (point.revenue / maxRevenue) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 group relative"
                  style={{ minWidth: '8px' }}
                >
                  <div
                    className="bg-gradient-to-t from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 rounded-t-md transition-all cursor-pointer group-hover:shadow-lg"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-slate-900 text-white text-[10px] font-bold rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                      <div className="text-slate-400">{formatDate(point.date, range)}</div>
                      <div className="text-emerald-400">{formatCurrency(point.revenue)}</div>
                      <div className="text-slate-300">{point.sales} ventes</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          {data.length > 0 && (() => {
            const firstItem = data[0];
            const lastItem = data[data.length - 1];
            if (!firstItem || !lastItem) return null;
            return (
              <div className="absolute left-16 right-0 bottom-0 flex justify-between text-[10px] font-bold text-slate-400">
                <span>{formatDate(firstItem.date, range)}</span>
                <span>{formatDate(lastItem.date, range)}</span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
