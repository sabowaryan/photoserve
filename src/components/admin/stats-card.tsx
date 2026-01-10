"use client";

import { Users, Image, HardDrive, TrendingUp, type LucideIcon } from "lucide-react";

type IconName = "users" | "image" | "hard-drive" | "trending-up";

const iconMap: Record<IconName, LucideIcon> = {
  "users": Users,
  "image": Image,
  "hard-drive": HardDrive,
  "trending-up": TrendingUp,
};

interface AdminStatsCardProps {
  icon: IconName;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

/**
 * Admin Stats Card Component
 * 
 * Displays a single statistic with icon, label, value, and optional trend indicator.
 * Used in the admin dashboard to show key metrics.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export function AdminStatsCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  variant = "default",
}: AdminStatsCardProps) {
  const Icon = iconMap[icon];
  
  const variantStyles = {
    default: {
      bg: "bg-slate-50",
      icon: "bg-slate-100 text-slate-600",
      iconHover: "group-hover:bg-slate-200",
    },
    primary: {
      bg: "bg-indigo-50",
      icon: "bg-indigo-100 text-indigo-600",
      iconHover: "group-hover:bg-indigo-200",
    },
    success: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
      iconHover: "group-hover:bg-emerald-200",
    },
    warning: {
      bg: "bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
      iconHover: "group-hover:bg-amber-200",
    },
    danger: {
      bg: "bg-rose-50",
      icon: "bg-rose-100 text-rose-600",
      iconHover: "group-hover:bg-rose-200",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-xl transition-colors ${styles.icon} ${styles.iconHover}`}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
        {trend && (
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              trend.positive
                ? "text-emerald-600 bg-emerald-50"
                : "text-rose-600 bg-rose-50"
            }`}
          >
            {trend.positive ? "+" : ""}
            {trend.value}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <h4 className="text-2xl font-bold text-slate-800 tracking-tight">
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        </h4>
        {subtitle && (
          <p className="text-sm text-slate-500 font-medium mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
