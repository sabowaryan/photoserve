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

interface EmailVolumeChartProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  loading?: boolean;
}

interface VolumeData {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

/**
 * Email Volume Chart Component
 * 
 * Displays time series chart of email volume metrics
 * 
 * Requirements: 8.5
 */
export function EmailVolumeChart({ dateRange, loading }: EmailVolumeChartProps) {
  const [data, setData] = useState<VolumeData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    fetchVolumeData();
  }, [dateRange]);

  /**
   * Fetch volume data for chart
   */
  const fetchVolumeData = async () => {
    setChartLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("from", dateRange.from.toISOString());
      params.set("to", dateRange.to.toISOString());
      params.set("groupBy", "day");

      const response = await fetch(`/api/emails/analytics/volume?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch volume data");
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching volume data:", error);
      setData([]);
    } finally {
      setChartLoading(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-800">
          Email Volume Over Time
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
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                labelFormatter={(value) => format(new Date(value), "MMM d, yyyy")}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sent"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Sent"
                dot={{ fill: "#3b82f6", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#10b981"
                strokeWidth={2}
                name="Delivered"
                dot={{ fill: "#10b981", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="opened"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Opened"
                dot={{ fill: "#8b5cf6", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="clicked"
                stroke="#6366f1"
                strokeWidth={2}
                name="Clicked"
                dot={{ fill: "#6366f1", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
