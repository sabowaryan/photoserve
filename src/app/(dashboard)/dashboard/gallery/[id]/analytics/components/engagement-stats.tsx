'use client';

/**
 * Engagement Stats Component
 * Displays session and engagement metrics
 * 
 * @module app/(dashboard)/dashboard/gallery/[id]/analytics/components/engagement-stats
 * Phase 3: Event tracking analytics
 */
import { Clock, Activity, Play, MousePointer } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface EngagementStatsProps {
  sessionStats: {
    avgDuration: number;
    avgEventsPerSession: number;
  };
  slideshowStats: {
    starts: number;
    avgDuration: number;
  };
  ctaClicks: number;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function EngagementStats({ 
  sessionStats, 
  slideshowStats, 
  ctaClicks,
}: EngagementStatsProps) {
  const { t } = useTranslation();
  
  const stats = [
    {
      icon: Clock,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      labelKey: 'admin.galleryAnalytics.engagement.avgTime',
      value: formatDuration(sessionStats.avgDuration),
      descriptionKey: 'admin.galleryAnalytics.engagement.avgSessionDuration',
    },
    {
      icon: Activity,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      labelKey: 'admin.galleryAnalytics.engagement.actionsPerSession',
      value: sessionStats.avgEventsPerSession.toFixed(1),
      descriptionKey: 'admin.galleryAnalytics.engagement.interactionsPerVisit',
    },
    {
      icon: Play,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      labelKey: 'admin.galleryAnalytics.engagement.slideshows',
      value: slideshowStats.starts.toString(),
      description: slideshowStats.avgDuration > 0 
        ? `${t('admin.galleryAnalytics.engagement.avgTime')}: ${formatDuration(slideshowStats.avgDuration)}`
        : undefined,
    },
    {
      icon: MousePointer,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      labelKey: 'admin.galleryAnalytics.engagement.ctaClicks',
      value: ctaClicks.toString(),
      descriptionKey: 'admin.galleryAnalytics.engagement.ctaClicksDesc',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div 
          key={stat.labelKey}
          className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 hover:bg-white transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg ${stat.iconBg}`}>
              <stat.icon size={14} className={stat.iconColor} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {t(stat.labelKey)}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mb-1">{stat.value}</p>
          <p className="text-[10px] text-slate-400 font-medium">
            {stat.description || (stat.descriptionKey ? t(stat.descriptionKey) : '')}
          </p>
        </div>
      ))}
    </div>
  );
}
