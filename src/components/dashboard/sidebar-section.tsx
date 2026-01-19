"use client";

import { Activity, ChevronRight, Keyboard, HelpCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface ActivityItem {
  id: string;
  type: "created" | "viewed" | "expired";
  title: string;
  timestamp: string;
}

interface SidebarSectionProps {
  activities?: ActivityItem[];
  userPlan?: string;
}

export function SidebarSection({ activities = [], userPlan = "free" }: SidebarSectionProps) {
  const { t } = useTranslation();
  
  const displayActivities = activities.length > 0 ? activities : [];

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours === 1) return "Il y a 1h";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hier";
    return `Il y a ${diffInDays}j`;
  };

  return (
    <div className="space-y-3 sticky top-24">
      {/* Activity Card */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-amber-50 rounded-md text-amber-600">
            <Activity size={14} />
          </div>
          <h3 className="font-bold text-slate-900 text-xs">{t('common.recentActivity')}</h3>
        </div>

        <div className="space-y-3">
          {displayActivities.slice(0, 4).map((activity, i) => (
            <div key={activity.id} className="flex gap-2 relative group">
              {i < displayActivities.slice(0, 4).length - 1 && (
                <div className="absolute left-[6px] top-4 bottom-0 w-px bg-slate-100" />
              )}
              <div className="w-3 h-3 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex-shrink-0 mt-0.5 z-10 group-hover:bg-indigo-500 transition-colors" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-slate-700 leading-snug truncate group-hover:text-indigo-600 transition-colors">
                  {activity.title}
                </p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                  {getTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {displayActivities.length > 4 && (
          <button className="w-full mt-3 py-2 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center justify-center gap-1">
            {t('common.view')}
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Upgrade Card - Only show for free users */}
      {userPlan === "free" && (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-3.5 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-violet-400/20 rounded-full blur-xl" />
          
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="p-1 bg-white/20 rounded-md">
                <Zap size={12} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">{t('dashboard.plans.premium')}</span>
            </div>
            <h4 className="font-black text-base mb-1.5">{t('common.upgradeLevel')}</h4>
            <p className="text-white/70 text-[10px] font-medium leading-relaxed mb-3">
              {t('pricing.plans.premium.description')}
            </p>
            <Link href="/settings">
              <button className="w-full py-2 bg-white text-indigo-600 font-bold text-xs rounded-lg hover:bg-white/90 transition-all shadow-lg">
                {t('pricing.selectPlan')}
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Help Card */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-slate-200/50 rounded-md text-slate-500">
            <HelpCircle size={14} />
          </div>
          <h3 className="font-bold text-slate-700 text-xs">{t('common.quickHelp')}</h3>
        </div>
        
        <div className="space-y-1.5">
          <a href="#" className="block px-2.5 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-white hover:text-indigo-600 rounded-md transition-all">
            📖 Documentation
          </a>
          <a href="#" className="block px-2.5 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-white hover:text-indigo-600 rounded-md transition-all">
            💬 {t('common.support')}
          </a>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-center gap-1.5 text-[9px] font-medium text-slate-400">
            <Keyboard size={10} />
            <span>{t('common.shortcuts')} <kbd className="px-1 py-0.5 bg-white rounded border border-slate-200 font-mono text-[8px]">N</kbd> <kbd className="px-1 py-0.5 bg-white rounded border border-slate-200 font-mono text-[8px]">S</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
}
