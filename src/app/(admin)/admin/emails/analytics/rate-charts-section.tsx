"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface RateChartsSectionProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  loading?: boolean;
}

interface RateData {
  date: string;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

/**
 * Rate Charts Section Component
 * 
 * Displays open rate and click rate charts over time
 * 
 * Requirements: 8.5
 */
export function RateChartsSection({ dateRange, loading }: RateChartsSectionProps) {
  const [data, setData] = useState<RateData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    fetchRateData();
  }, [dateRange]);

  /**
   * Fetch rate data for chart
   */
  const fetchRateData = async () => {
    setChartLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("from", dateRange.from.toISOString());
      params.set("to", dateRange.to.toISOString());
      params.set("groupBy", "day");

      const response = await fetch(`/api/emails/analytics/rates?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch rate data");
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching rate data:", error);
      setData([]);
    } finally {
      setChartLoading(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-800">
          Engagement Rates Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartLoading || loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            Loading chart data...
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            No data available for selected date range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                labelFormatter={(value) => format(new Date(value), "MMM d, yyyy")}
                formatter={(value) => `${typeof value === 'number' ? value.toFixed(1) : '0.0'}%`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="openRate"
                stroke="#10b981"
                strokeWidth={2}
                name="Open Rate"
                dot={{ fill: "#10b981", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="clickRate"
                stroke="#6366f1"
                strokeWidth={2}
                name="Click Rate"
                dot={{ fill: "#6366f1", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="bounceRate"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Bounce Rate"
                dot={{ fill: "#f59e0b", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
