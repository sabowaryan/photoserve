'use client';

/**
 * Views Chart Component
 * Professional area chart with gradient fill for views over time
 * 
 * @module app/(dashboard)/dashboard/gallery/[id]/analytics/components/views-chart
 */
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface ViewsChartProps {
  data: { date: string; count: number }[];
}

// Custom tooltip component
function CustomTooltip({ active, payload, label, viewsLabel }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-xl font-black">
        {payload[0].value}
        <span className="text-sm font-medium text-slate-400 ml-1">{viewsLabel}</span>
      </p>
    </div>
  );
}

// Custom dot for active state
function CustomActiveDot(props: any) {
  const { cx, cy } = props;
  return (
    <g>
      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={12} fill="rgb(99 102 241 / 0.2)" />
      {/* Middle ring */}
      <circle cx={cx} cy={cy} r={8} fill="rgb(99 102 241 / 0.3)" />
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r={4} fill="rgb(99 102 241)" stroke="white" strokeWidth={2} />
    </g>
  );
}

export function ViewsChart({ data }: ViewsChartProps) {
  const { t, locale } = useTranslation();
  
  // Format data for recharts
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
    fullDate: new Date(item.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
    views: item.count,
  }));

  // Calculate stats
  const totalViews = chartData.reduce((sum, item) => sum + item.views, 0);
  const avgViews = chartData.length > 0 ? Math.round(totalViews / chartData.length) : 0;
  const maxViews = Math.max(...chartData.map(d => d.views), 0);
  
  // Calculate trend (compare last 7 days vs previous 7 days)
  const last7Days = chartData.slice(-7).reduce((sum, item) => sum + item.views, 0);
  const prev7Days = chartData.slice(-14, -7).reduce((sum, item) => sum + item.views, 0);
  const trendPercent = prev7Days > 0 ? Math.round(((last7Days - prev7Days) / prev7Days) * 100) : 0;
  const trendDirection = trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'neutral';

  // Empty state
  if (chartData.length === 0 || totalViews === 0) {
    return (
      <div className="h-72 w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
          <TrendingUp size={28} className="text-slate-300" />
        </div>
        <p className="text-sm font-bold text-slate-400">{t('admin.galleryAnalytics.viewsChart.noData')}</p>
        <p className="text-xs text-slate-400 mt-1">{t('admin.galleryAnalytics.viewsChart.viewsWillAppear')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Total */}
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{t('admin.galleryAnalytics.viewsChart.total')}</span>
          <span className="text-lg font-black text-indigo-700">{totalViews}</span>
        </div>
        
        {/* Average */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('admin.galleryAnalytics.viewsChart.avgPerDay')}</span>
          <span className="text-lg font-black text-slate-700">{avgViews}</span>
        </div>
        
        {/* Peak */}
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t('admin.galleryAnalytics.viewsChart.peak')}</span>
          <span className="text-lg font-black text-emerald-700">{maxViews}</span>
        </div>
        
        {/* Trend */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
          trendDirection === 'up' 
            ? 'bg-emerald-50 border-emerald-100' 
            : trendDirection === 'down'
              ? 'bg-rose-50 border-rose-100'
              : 'bg-slate-50 border-slate-100'
        }`}>
          {trendDirection === 'up' && <TrendingUp size={14} className="text-emerald-600" />}
          {trendDirection === 'down' && <TrendingDown size={14} className="text-rose-600" />}
          {trendDirection === 'neutral' && <Minus size={14} className="text-slate-500" />}
          <span className={`text-sm font-black ${
            trendDirection === 'up' 
              ? 'text-emerald-700' 
              : trendDirection === 'down'
                ? 'text-rose-700'
                : 'text-slate-600'
          }`}>
            {trendPercent > 0 ? '+' : ''}{trendPercent}%
          </span>
          <span className="text-[10px] font-medium text-slate-400">{t('admin.galleryAnalytics.viewsChart.vsPrevWeek')}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full bg-gradient-to-br from-slate-50/50 to-white rounded-xl border border-slate-100 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity={0.3} />
                <stop offset="50%" stopColor="rgb(99 102 241)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(99 102 241)" />
                <stop offset="50%" stopColor="rgb(129 140 248)" />
                <stop offset="100%" stopColor="rgb(167 139 250)" />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgb(226 232 240)" 
              vertical={false}
            />
            
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: 'rgb(148 163 184)', 
                fontSize: 10, 
                fontWeight: 600 
              }}
              dy={10}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: 'rgb(148 163 184)', 
                fontSize: 10, 
                fontWeight: 600 
              }}
              dx={-10}
              allowDecimals={false}
            />
            
            {/* Average reference line */}
            <ReferenceLine 
              y={avgViews} 
              stroke="rgb(99 102 241)" 
              strokeDasharray="5 5" 
              strokeOpacity={0.4}
            />
            
            <Tooltip 
              content={<CustomTooltip viewsLabel={t('admin.galleryAnalytics.viewsChart.views')} />}
              cursor={{ 
                stroke: 'rgb(99 102 241)', 
                strokeWidth: 1, 
                strokeDasharray: '5 5',
                strokeOpacity: 0.5
              }}
            />
            
            <Area 
              type="monotone" 
              dataKey="views" 
              stroke="url(#lineGradient)"
              strokeWidth={3}
              fill="url(#viewsGradient)"
              activeDot={<CustomActiveDot />}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
          <span>{t('admin.galleryAnalytics.viewsChart.dailyViews')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-indigo-400" />
          <span>{t('admin.galleryAnalytics.viewsChart.average')} ({avgViews}/jour)</span>
        </div>
      </div>
    </div>
  );
}
