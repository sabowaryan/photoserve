"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Users, HardDrive, TrendingUp, RefreshCw } from "lucide-react";
import { DateRangePicker } from "@/components/admin/date-range-picker";
import { LineChart, ConversionChart } from "@/components/admin/analytics-chart";
import { TopUsersTable } from "@/components/admin/top-users-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { AnalyticsData } from "@/types/admin";

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const isoString = date.toISOString().split("T")[0];
  return isoString ?? "";
}

/**
 * Get default date range (last 30 days)
 */
function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: formatDate(from),
    to: formatDate(to),
  };
}

/**
 * Format storage size for display
 */
function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
}

/**
 * Loading skeleton for analytics
 */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Admin Analytics Page
 * 
 * Displays detailed platform analytics including:
 * - User growth over time
 * - Storage consumption trends
 * - Subscription conversion rates
 * - Most active users
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export default function AdminAnalyticsPage() {
  const defaultRange = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/analytics?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du chargement des analytics");
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDateChange = (newFrom: string, newTo: string) => {
    setDateFrom(newFrom);
    setDateTo(newTo);
  };

  // Calculate summary stats from analytics data
  const summaryStats = analytics
    ? {
        totalNewUsers: analytics.userGrowth.reduce((sum, d) => sum + d.value, 0),
        totalStorageGrowth:
          analytics.storageGrowth.length > 0
            ? (analytics.storageGrowth[analytics.storageGrowth.length - 1]?.value ?? 0) -
              (analytics.storageGrowth[0]?.value ?? 0)
            : 0,
        totalConversions:
          analytics.subscriptionConversions.freeToPremiun +
          analytics.subscriptionConversions.freeToPro +
          analytics.subscriptionConversions.premiumToPro,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Analytics
          </h1>
          <p className="text-slate-500 mt-1">
            Statistiques détaillées de la plateforme
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={handleDateChange}
        isLoading={isLoading}
      />

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700">
          <p className="font-medium">Erreur</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <AnalyticsSkeleton />}

      {/* Analytics Content */}
      {!isLoading && analytics && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Nouveaux utilisateurs
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {summaryStats?.totalNewUsers.toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50">
                <HardDrive className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Croissance stockage
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {summaryStats ? formatStorage(summaryStats.totalStorageGrowth) : "0 MB"}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Conversions
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {summaryStats?.totalConversions.toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LineChart
              title="Croissance des utilisateurs"
              subtitle="Nouveaux utilisateurs par jour"
              data={analytics.userGrowth}
              color="indigo"
            />
            <LineChart
              title="Évolution du stockage"
              subtitle="Stockage total utilisé (MB)"
              data={analytics.storageGrowth}
              color="emerald"
              formatValue={formatStorage}
            />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ConversionChart
              title="Conversions d'abonnements"
              subtitle="Upgrades de plans sur la période"
              data={analytics.subscriptionConversions}
            />
            <TopUsersTable users={analytics.topUsers} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && !analytics && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Aucune donnée disponible
          </h3>
          <p className="text-slate-500">
            Sélectionnez une période différente pour voir les analytics.
          </p>
        </div>
      )}
    </div>
  );
}
