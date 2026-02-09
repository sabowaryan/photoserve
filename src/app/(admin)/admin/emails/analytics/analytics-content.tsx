"use client";

import { useState } from "react";
import { AnalyticsSummaryCards } from "./analytics-summary-cards";
import { EmailVolumeChart } from "./email-volume-chart";
import { RateChartsSection } from "./rate-charts-section";
import { TemplatePerformanceTable } from "./template-performance-table";
import { SenderPerformanceTable } from "./sender-performance-table";
import { DateRangeSelector } from "./date-range-selector";
import { ExportButton } from "./export-button";
import type { SystemAnalytics } from "@/lib/services/email-analytics.service";

interface AnalyticsContentProps {
  initialData: {
    systemAnalytics: SystemAnalytics;
    dateRange: {
      from: Date;
      to: Date;
    };
  };
}

/**
 * Analytics Content Component
 * 
 * Client-side wrapper that manages state for analytics dashboard
 * and coordinates date range selection and data fetching
 * 
 * Requirements: 8.4, 8.5, 8.6
 */
export function AnalyticsContent({ initialData }: AnalyticsContentProps) {
  const [systemAnalytics, setSystemAnalytics] = useState<SystemAnalytics>(
    initialData.systemAnalytics
  );
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(
    initialData.dateRange
  );
  const [loading, setLoading] = useState(false);

  /**
   * Fetch analytics data for the selected date range
   */
  const fetchAnalytics = async (from: Date, to: Date) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("from", from.toISOString());
      params.set("to", to.toISOString());

      const response = await fetch(`/api/emails/analytics?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setSystemAnalytics(data.systemAnalytics);
      setDateRange({ from, to });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle date range change
   */
  const handleDateRangeChange = (from: Date, to: Date) => {
    fetchAnalytics(from, to);
  };

  /**
   * Handle export
   */
  const handleExport = async (format: "csv" | "json") => {
    try {
      const params = new URLSearchParams();
      params.set("from", dateRange.from.toISOString());
      params.set("to", dateRange.to.toISOString());
      params.set("format", format);

      const response = await fetch(`/api/emails/analytics/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to export analytics");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `email-analytics-${dateRange.from.toISOString().split("T")[0]}-to-${dateRange.to.toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting analytics:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Email Analytics
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">
            Track email performance metrics and delivery statistics
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        loading={loading}
      />

      {/* Summary Cards */}
      <AnalyticsSummaryCards analytics={systemAnalytics} loading={loading} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmailVolumeChart dateRange={dateRange} loading={loading} />
        <RateChartsSection dateRange={dateRange} loading={loading} />
      </div>

      {/* Performance Tables */}
      <div className="space-y-6">
        <TemplatePerformanceTable dateRange={dateRange} loading={loading} />
        <SenderPerformanceTable dateRange={dateRange} loading={loading} />
      </div>
    </div>
  );
}
