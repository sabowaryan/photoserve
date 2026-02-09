"use client";

import { UserPlus, Image, TrendingUp, Activity } from "lucide-react";

interface RecentActivityProps {
  recentSignups: number;
  recentGalleries: number;
  period?: string;
}

/**
 * Recent Activity Component
 * 
 * Displays recent platform activity including new signups and gallery creations.
 * Shows activity from the last 7 days by default.
 * 
 * Requirements: 2.5
 */
export function RecentActivity({
  recentSignups,
  recentGalleries,
  period = "7 derniers jours",
}: RecentActivityProps) {
  const activities = [
    {
      label: "Nouvelles inscriptions",
      value: recentSignups,
      icon: UserPlus,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
    },
    {
      label: "Galeries créées",
      value: recentGalleries,
      icon: Image,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
    },
  ];

  const totalActivity = recentSignups + recentGalleries;
  const avgPerDay = (totalActivity / 7).toFixed(1);

  return (
    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-50 shadow-sm">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-100">
            <Activity size={18} className="text-slate-600" />
          </div>
          <div>
            <h3 className="text-base lg:text-lg font-bold text-slate-800">
              Activité récente
            </h3>
            <p className="text-[10px] lg:text-xs text-slate-400">{period}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl">
          <TrendingUp size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">
            ~{avgPerDay}/jour
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.label}
              className={`flex items-center justify-between p-4 rounded-2xl ${activity.bgColor} border ${activity.borderColor} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white shadow-sm`}>
                  <Icon size={18} className={activity.color} />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {activity.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${activity.color}`}>
                  {activity.value.toLocaleString("fr-FR")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Total d'activités</span>
          <span className="font-bold text-slate-800">
            {totalActivity.toLocaleString("fr-FR")}
          </span>
        </div>
      </div>
    </div>
  );
}
