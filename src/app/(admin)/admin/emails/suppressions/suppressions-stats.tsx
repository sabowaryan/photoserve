"use client";

import { AlertTriangle, Ban, XCircle, ShieldAlert } from "lucide-react";
import type { SuppressionStats } from "@/lib/repositories/suppression.repository";

interface SuppressionsStatsProps {
  stats: SuppressionStats;
}

/**
 * Suppressions Stats Component
 * 
 * Displays summary statistics for email suppressions
 * 
 * Requirements: 8.7
 */
export function SuppressionsStats({ stats }: SuppressionsStatsProps) {
  const statCards = [
    {
      label: "Total Suppressions",
      value: stats.total,
      icon: Ban,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
    {
      label: "Hard Bounces",
      value: stats.hardBounces,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      label: "Soft Bounces",
      value: stats.softBounces,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Complaints",
      value: stats.complaints,
      icon: ShieldAlert,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-5 border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
