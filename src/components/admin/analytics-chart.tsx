"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TimeSeriesData, ConversionData } from "@/types/admin";

interface LineChartProps {
  title: string;
  subtitle?: string;
  data: TimeSeriesData[];
  color?: "indigo" | "emerald" | "amber" | "rose";
  formatValue?: (value: number) => string;
}

interface ConversionChartProps {
  title: string;
  subtitle?: string;
  data: ConversionData;
}

/**
 * Calculate trend from time series data
 */
function calculateTrend(data: TimeSeriesData[]): {
  percentage: number;
  direction: "up" | "down" | "neutral";
} {
  if (data.length < 2) {
    return { percentage: 0, direction: "neutral" };
  }

  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

  if (firstAvg === 0) {
    return { percentage: secondAvg > 0 ? 100 : 0, direction: secondAvg > 0 ? "up" : "neutral" };
  }

  const percentage = ((secondAvg - firstAvg) / firstAvg) * 100;
  const direction = percentage > 1 ? "up" : percentage < -1 ? "down" : "neutral";

  return { percentage: Math.abs(percentage), direction };
}

/**
 * Color configurations for charts
 */
const colorConfig = {
  indigo: {
    line: "stroke-indigo-500",
    fill: "fill-indigo-500/10",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    gradient: "from-indigo-500/20 to-transparent",
  },
  emerald: {
    line: "stroke-emerald-500",
    fill: "fill-emerald-500/10",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    gradient: "from-emerald-500/20 to-transparent",
  },
  amber: {
    line: "stroke-amber-500",
    fill: "fill-amber-500/10",
    bg: "bg-amber-50",
    text: "text-amber-600",
    gradient: "from-amber-500/20 to-transparent",
  },
  rose: {
    line: "stroke-rose-500",
    fill: "fill-rose-500/10",
    bg: "bg-rose-50",
    text: "text-rose-600",
    gradient: "from-rose-500/20 to-transparent",
  },
};

/**
 * Line Chart Component
 * 
 * Displays time series data as a simple line chart with trend indicator.
 * Requirements: 5.1, 5.2
 */
export function LineChart({
  title,
  subtitle,
  data,
  color = "indigo",
  formatValue = (v) => v.toLocaleString("fr-FR"),
}: LineChartProps) {
  const colors = colorConfig[color];
  const trend = useMemo(() => calculateTrend(data), [data]);

  // Calculate chart dimensions and path
  const chartData = useMemo(() => {
    if (data.length === 0) return { path: "", areaPath: "", points: [], max: 0, min: 0 };

    const values = data.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const width = 100;
    const height = 60;
    const padding = 2;

    const points = data.map((d, i) => ({
      x: padding + (i / (data.length - 1 || 1)) * (width - padding * 2),
      y: height - padding - ((d.value - min) / range) * (height - padding * 2),
      value: d.value,
      date: d.date,
    }));

    const path = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const areaPath = `${path} L ${points[points.length - 1]?.x || 0} ${height} L ${points[0]?.x || 0} ${height} Z`;

    return { path, areaPath, points, max, min };
  }, [data]);

  const latestValue = data[data.length - 1]?.value ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trend.direction === "up"
              ? "bg-emerald-50 text-emerald-600"
              : trend.direction === "down"
              ? "bg-rose-50 text-rose-600"
              : "bg-slate-50 text-slate-600"
          }`}
        >
          {trend.direction === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : trend.direction === "down" ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          {trend.percentage.toFixed(1)}%
        </div>
      </div>

      {/* Current value */}
      <div className="mb-4">
        <span className="text-2xl font-bold text-slate-800">
          {formatValue(latestValue)}
        </span>
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <div className="h-16">
          <svg
            viewBox="0 0 100 60"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Area fill */}
            <path
              d={chartData.areaPath}
              className={colors.fill}
            />
            {/* Line */}
            <path
              d={chartData.path}
              fill="none"
              className={colors.line}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        <div className="h-16 flex items-center justify-center text-sm text-slate-400">
          Aucune donnée disponible
        </div>
      )}

      {/* Date range */}
      {data.length > 0 && data[0] && data[data.length - 1] && (
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>
            {new Date(data[0].date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <span>
            {new Date(data[data.length - 1]!.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      )}
    </div>
  );
}


/**
 * Conversion Chart Component
 * 
 * Displays subscription conversion rates as a visual breakdown.
 * Requirements: 5.3
 */
export function ConversionChart({
  title,
  subtitle,
  data,
}: ConversionChartProps) {
  const conversions = [
    {
      label: "Free → Premium",
      value: data.freeToPremiun,
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      label: "Free → Pro",
      value: data.freeToPro,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      label: "Premium → Pro",
      value: data.premiumToPro,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
  ];

  const total = conversions.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Total conversions */}
      <div className="mb-6">
        <span className="text-2xl font-bold text-slate-800">
          {total.toLocaleString("fr-FR")}
        </span>
        <span className="text-sm text-slate-500 ml-2">conversions totales</span>
      </div>

      {/* Conversion bars */}
      <div className="space-y-4">
        {conversions.map((conversion) => {
          const percentage = total > 0 ? (conversion.value / total) * 100 : 0;
          return (
            <div key={conversion.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">
                  {conversion.label}
                </span>
                <span className={`text-sm font-bold ${conversion.textColor}`}>
                  {conversion.value.toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${conversion.color} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
