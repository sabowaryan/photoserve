import { ReactNode } from "react";
import { LucideIcon, ArrowUpRight } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  progress?: number;
  progressMax?: number;
  variant?: "default" | "dark";
  badge?: ReactNode;
  badgeText?: string;
  onUpgrade?: () => void;
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  progress,
  progressMax,
  variant = "default",
  badge,
  badgeText,
  onUpgrade,
}: StatsCardProps) {
  const isDark = variant === "dark";
  const progressPercent = progress !== undefined && progressMax 
    ? (progress / progressMax) * 100 
    : undefined;

  // Determine progress bar color
  const getProgressColor = () => {
    if (!progressPercent) return "";
    if (label === "Stockage") {
      return progressPercent > 85 ? "bg-rose-500" : "bg-amber-500";
    }
    if (label === "Galeries") {
      return progressPercent > 90 ? "bg-rose-500" : "bg-emerald-500";
    }
    return "bg-indigo-500";
  };

  if (isDark) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-white/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
              <Icon size={20} />
            </div>
            {trend && (
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                trend.positive 
                  ? "text-emerald-400 bg-emerald-400/10" 
                  : "text-rose-400 bg-rose-400/10"
              }`}>
                {trend.value}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <h4 className="text-2xl font-bold text-white tracking-tight">
            {value}
          </h4>
          {subtitle && (
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl group-hover:scale-110 transition-transform ${
          label === "Plan" ? "bg-indigo-50 text-indigo-600" :
          label === "Stockage" ? "bg-amber-50 text-amber-600" :
          label === "Galeries" ? "bg-emerald-50 text-emerald-600" :
          "bg-indigo-50 text-indigo-600"
        }`}>
          <Icon size={20} fill={label === "Plan" ? "currentColor" : "none"} />
        </div>
        {badge ? (
          badge
        ) : badgeText ? (
          <span className="text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-50 rounded-full">
            {badgeText}
          </span>
        ) : null}
      </div>

      <div className={progressPercent !== undefined ? "mb-2" : ""}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">
              {value}
            </span>
            {subtitle && progressPercent !== undefined && (
              <span className="text-sm text-slate-400 font-medium">
                / {subtitle.replace("sur ", "")}
              </span>
            )}
          </div>
          {onUpgrade && (
            <button 
              onClick={onUpgrade}
              className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-lg transition-colors"
            >
              <ArrowUpRight size={18} />
            </button>
          )}
        </div>
        {subtitle && progressPercent === undefined && (
          <p className="text-sm text-slate-400 font-medium mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {progressPercent !== undefined && (
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
