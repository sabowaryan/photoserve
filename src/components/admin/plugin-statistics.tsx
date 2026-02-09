"use client";

import { useEffect, useState } from "react";
import { Users, Activity, Package, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UsageStats {
  totalActions: number;
  uniqueUsers: number;
  actionBreakdown: Record<string, number>;
  versionDistribution: Record<string, number>;
}

interface PluginStatisticsProps {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Stats Card Component
 */
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: "indigo" | "emerald" | "amber" | "rose";
}) {
  const colorClasses: Record<"indigo" | "emerald" | "amber" | "rose", string> = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <div className="bg-white rounded-[28px] p-6 flex items-center gap-5 shadow-sm border border-slate-50 flex-1 min-w-[220px] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${colorClasses[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

/**
 * Bar Chart Component
 */
function BarChart({
  title,
  data,
  color = "indigo",
}: {
  title: string;
  data: Record<string, number>;
  color?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const colorClasses = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const maxValue = Math.max(...entries.map(([, value]) => value), 1);

  return (
    <div className="bg-white rounded-[32px] border border-slate-50 shadow-sm p-6 lg:p-8">
      <h3 className="text-base lg:text-lg font-bold text-slate-800 mb-6">{title}</h3>
      {entries.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No data available</div>
      ) : (
        <div className="space-y-3">
          {entries.map(([label, value]) => {
            const percentage = (value / maxValue) * 100;
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-slate-800 ml-2">
                    {value.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Pie Chart Component (using simple percentage bars)
 */
function PieChart({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const colors = [
    { bg: "bg-indigo-500", text: "text-indigo-600" },
    { bg: "bg-emerald-500", text: "text-emerald-600" },
    { bg: "bg-amber-500", text: "text-amber-600" },
    { bg: "bg-rose-500", text: "text-rose-600" },
    { bg: "bg-purple-500", text: "text-purple-600" },
    { bg: "bg-cyan-500", text: "text-cyan-600" },
  ];

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div className="bg-white rounded-[32px] border border-slate-50 shadow-sm p-6 lg:p-8">
      <h3 className="text-base lg:text-lg font-bold text-slate-800 mb-6">{title}</h3>
      {entries.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No data available</div>
      ) : (
        <div className="space-y-3">
          {entries.map(([label, value], index) => {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            const colorSet = colors[index % colors.length];
            return (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-3 h-3 rounded-full ${colorSet?.bg}`} />
                  <span className="text-sm text-slate-700 truncate">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    {value.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 w-12 text-right">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Plugin Statistics Component
 * 
 * Displays comprehensive plugin usage statistics with charts.
 * Requirements: 10.8, 11.5, 11.6, 11.7, 11.8
 */
export function PluginStatistics({ dateRange }: PluginStatisticsProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) {
        params.set("startDate", dateRange.startDate);
      }
      if (dateRange?.endDate) {
        params.set("endDate", dateRange.endDate);
      }

      const response = await fetch(`/api/admin/plugin/stats?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          Loading statistics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-[24px] p-6 text-center">
        <p className="text-rose-700 mb-4">{error}</p>
        <Button onClick={fetchStats} variant="outline" size="sm" className="rounded-xl">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-slate-500">
        No statistics available
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Total Actions"
          value={stats.totalActions.toLocaleString()}
          icon={Activity}
          color="indigo"
        />
        <StatsCard
          title="Active Users (30 days)"
          value={stats.uniqueUsers.toLocaleString()}
          icon={Users}
          color="emerald"
        />
        <StatsCard
          title="Plugin Versions"
          value={Object.keys(stats.versionDistribution).length}
          icon={Package}
          color="amber"
        />
        <StatsCard
          title="Actions per User"
          value={
            stats.uniqueUsers > 0
              ? (stats.totalActions / stats.uniqueUsers).toFixed(1)
              : "0"
          }
          icon={Monitor}
          color="rose"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Most Common Actions */}
        <BarChart
          title="Most Common Actions"
          data={stats.actionBreakdown}
          color="indigo"
        />

        {/* Plugin Version Distribution */}
        <PieChart
          title="Plugin Version Distribution"
          data={stats.versionDistribution}
        />
      </div>

      {/* Additional Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-2">
          Statistics Period
        </h3>
        <p className="text-sm text-slate-600">
          {dateRange
            ? `${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(
                dateRange.endDate
              ).toLocaleDateString()}`
            : "All time"}
        </p>
      </div>
    </div>
  );
}
