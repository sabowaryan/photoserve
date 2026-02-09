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
 * Styled to match wastebank design.
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
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
    primary: {
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    success: {
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    warning: {
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    danger: {
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="bg-white rounded-[28px] p-6 flex items-center gap-5 shadow-sm border border-slate-50 flex-1 min-w-[220px] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${styles.iconBg}`}>
        <Icon size={24} strokeWidth={2} className={styles.iconColor} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-3xl font-bold text-slate-800 tracking-tight">
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
      {trend && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
  );
}
