"use client";

import { Crown, Sparkles, User } from "lucide-react";

interface PlanDistributionChartProps {
  distribution: {
    free: number;
    premium: number;
    pro: number;
  };
}

/**
 * Plan Distribution Chart Component
 * 
 * Displays the distribution of subscription plans as a horizontal bar chart
 * with individual plan counts and percentages.
 * 
 * Requirements: 2.4
 */
export function PlanDistributionChart({
  distribution,
}: PlanDistributionChartProps) {
  const total = distribution.free + distribution.premium + distribution.pro;
  
  const plans = [
    {
      name: "Free",
      count: distribution.free,
      percentage: total > 0 ? (distribution.free / total) * 100 : 0,
      color: "bg-slate-400",
      bgColor: "bg-slate-50",
      textColor: "text-slate-600",
      icon: User,
    },
    {
      name: "Premium",
      count: distribution.premium,
      percentage: total > 0 ? (distribution.premium / total) * 100 : 0,
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      icon: Sparkles,
    },
    {
      name: "Pro",
      count: distribution.pro,
      percentage: total > 0 ? (distribution.pro / total) * 100 : 0,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      icon: Crown,
    },
  ];

  return (
    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base lg:text-lg font-bold text-slate-800">
            Distribution des plans
          </h3>
          <p className="text-[10px] lg:text-xs text-slate-400 mt-1">
            {total.toLocaleString("fr-FR")} utilisateurs au total
          </p>
        </div>
      </div>

      {/* Stacked Bar */}
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex mb-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`${plan.color} transition-all duration-500`}
            style={{ width: `${plan.percentage}%` }}
            title={`${plan.name}: ${plan.count} (${plan.percentage.toFixed(1)}%)`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.name}
              className={`${plan.bgColor} rounded-2xl p-4 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${plan.color} bg-opacity-20`}>
                  <Icon size={14} className={plan.textColor} />
                </div>
                <span className={`text-xs font-bold ${plan.textColor}`}>
                  {plan.name}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-800">
                  {plan.count.toLocaleString("fr-FR")}
                </span>
                <span className="text-xs text-slate-400">
                  ({plan.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
