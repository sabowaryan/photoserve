"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SenderAnalytics } from "@/lib/services/email-analytics.service";

interface SenderPerformanceTableProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  loading?: boolean;
}

/**
 * Sender Performance Table Component
 * 
 * Displays performance metrics for each sender address
 * 
 * Requirements: 8.5
 */
export function SenderPerformanceTable({
  dateRange,
  loading,
}: SenderPerformanceTableProps) {
  const [senders, setSenders] = useState<SenderAnalytics[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    fetchSenderPerformance();
  }, [dateRange]);

  /**
   * Fetch sender performance data
   */
  const fetchSenderPerformance = async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("from", dateRange.from.toISOString());
      params.set("to", dateRange.to.toISOString());

      const response = await fetch(
        `/api/emails/analytics/senders?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sender performance");
      }

      const result = await response.json();
      setSenders(result.senders || []);
    } catch (error) {
      console.error("Error fetching sender performance:", error);
      setSenders([]);
    } finally {
      setTableLoading(false);
    }
  };

  /**
   * Get badge color based on rate
   */
  const getRateBadgeVariant = (rate: number, type: "open" | "click" | "bounce") => {
    if (type === "bounce") {
      if (rate > 5) return "destructive";
      if (rate > 2) return "secondary";
      return "default";
    }
    
    if (type === "open") {
      if (rate > 25) return "default";
      if (rate > 15) return "secondary";
      return "destructive";
    }
    
    // click rate
    if (rate > 5) return "default";
    if (rate > 2) return "secondary";
    return "destructive";
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-800">
          Sender Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tableLoading || loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            Loading sender performance...
          </div>
        ) : senders.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            No senders found for selected date range
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead className="text-right">Clicked</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Click Rate</TableHead>
                  <TableHead className="text-right">Bounce Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {senders.map((sender) => (
                  <TableRow key={sender.senderEmail}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {sender.senderName || sender.senderEmail}
                        </div>
                        {sender.senderName && (
                          <div className="text-xs text-slate-500">
                            {sender.senderEmail}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {sender.sent.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {sender.delivered.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {sender.opened.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {sender.clicked.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getRateBadgeVariant(sender.openRate, "open")}>
                        {sender.openRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getRateBadgeVariant(sender.clickRate, "click")}>
                        {sender.clickRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getRateBadgeVariant(sender.bounceRate, "bounce")}>
                        {sender.bounceRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
