"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  Mail, 
  CheckCircle2, 
  Eye, 
  MousePointerClick, 
  AlertCircle, 
  XCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import type { SystemAnalytics } from "@/lib/services/email-analytics.service";

interface AnalyticsSummaryCardsProps {
  analytics: SystemAnalytics;
  loading?: boolean;
}

/**
 * Analytics Summary Cards Component
 * 
 * Displays key email metrics in card format:
 * - Sent, Delivered, Opened, Clicked
 * - Bounced, Failed, Open Rate, Click Rate
 * 
 * Requirements: 8.4
 */
export function AnalyticsSummaryCards({ analytics, loading }: AnalyticsSummaryCardsProps) {
  const cards = [
    {
      title: "Sent",
      value: analytics.sent.toLocaleString(),
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Delivered",
      value: analytics.delivered.toLocaleString(),
      subtitle: `${analytics.deliveryRate.toFixed(1)}% delivery rate`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Opened",
      value: analytics.opened.toLocaleString(),
      subtitle: `${analytics.openRate.toFixed(1)}% open rate`,
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Clicked",
      value: analytics.clicked.toLocaleString(),
      subtitle: `${analytics.clickRate.toFixed(1)}% click rate`,
      icon: MousePointerClick,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Bounced",
      value: analytics.bounced.toLocaleString(),
      subtitle: `${analytics.bounceRate.toFixed(1)}% bounce rate`,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: analytics.bounceRate > 5 ? "up" : undefined,
    },
    {
      title: "Failed",
      value: analytics.failed.toLocaleString(),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Open Rate",
      value: `${analytics.openRate.toFixed(1)}%`,
      subtitle: `${analytics.opened} of ${analytics.delivered} delivered`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Click Rate",
      value: `${analytics.clickRate.toFixed(1)}%`,
      subtitle: `${analytics.clicked} of ${analytics.delivered} delivered`,
      icon: MousePointerClick,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const TrendIcon = card.trend === "up" ? TrendingUp : TrendingDown;
        
        return (
          <Card key={card.title} className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${loading ? "text-slate-400" : "text-slate-900"}`}>
                    {loading ? "..." : card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-slate-500 mt-1">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              
              {card.trend && (
                <div className="mt-3 flex items-center gap-1">
                  <TrendIcon className="h-3 w-3 text-orange-600" />
                  <span className="text-xs text-orange-600 font-medium">
                    Above threshold
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
