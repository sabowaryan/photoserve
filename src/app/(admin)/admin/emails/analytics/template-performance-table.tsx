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
import type { TemplateAnalytics } from "@/lib/services/email-analytics.service";

interface TemplatePerformanceTableProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  loading?: boolean;
}

/**
 * Template Performance Table Component
 * 
 * Displays performance metrics for each email template
 * 
 * Requirements: 8.5
 */
export function TemplatePerformanceTable({
  dateRange,
  loading,
}: TemplatePerformanceTableProps) {
  const [templates, setTemplates] = useState<TemplateAnalytics[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    fetchTemplatePerformance();
  }, [dateRange]);

  /**
   * Fetch template performance data
   */
  const fetchTemplatePerformance = async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("from", dateRange.from.toISOString());
      params.set("to", dateRange.to.toISOString());

      const response = await fetch(
        `/api/emails/analytics/templates?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch template performance");
      }

      const result = await response.json();
      setTemplates(result.templates || []);
    } catch (error) {
      console.error("Error fetching template performance:", error);
      setTemplates([]);
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
          Template Performance Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tableLoading || loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            Loading template performance...
          </div>
        ) : templates.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            No templates found for selected date range
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
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
                {templates.map((template) => (
                  <TableRow key={template.templateId}>
                    <TableCell className="font-medium">
                      {template.templateName || "Unknown Template"}
                    </TableCell>
                    <TableCell className="text-right">
                      {template.sent.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {template.delivered.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {template.opened.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {template.clicked.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getRateBadgeVariant(template.openRate, "open")}>
                        {template.openRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getRateBadgeVariant(template.clickRate, "click")}>
                        {template.clickRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getRateBadgeVariant(template.bounceRate, "bounce")}>
                        {template.bounceRate.toFixed(1)}%
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
