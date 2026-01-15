'use client';

/**
 * Events Breakdown Component
 * Displays a breakdown of all event types
 * 
 * @module app/(dashboard)/dashboard/gallery/[id]/analytics/components/events-breakdown
 * Phase 3: Event tracking analytics
 */
import { Activity } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface EventsBreakdownProps {
  data: Record<string, number>;
}

const EVENT_CONFIG: Record<string, { labelKey: string; color: string }> = {
  lightbox_open: { labelKey: 'admin.galleryAnalytics.eventsBreakdown.lightboxOpen', color: 'bg-indigo-500' },
  download_single: { labelKey: 'admin.galleryAnalytics.eventsBreakdown.downloadSingle', color: 'bg-violet-500' },
  download_all: { labelKey: 'admin.galleryAnalytics.eventsBreakdown.downloadAll', color: 'bg-purple-500' },
  download_selection: { labelKey: 'admin.galleryAnalytics.eventsBreakdown.downloadSelection', color: 'bg-fuchsia-500' },
  download_favorites: { labelKey: 'admin.galleryAnalytics.eventsBreakdown.downloadFavorites', color: 'bg-pink-500' },
  favorite_add: { labelKey: 'admin.galleryAnalytics.eventsBreakdown.favoriteAdd', color: 'bg-emerald-500' },
  favorite_remove: { labelKey: 'admin.galleryAnalytics.eventsBreakdown.favoriteRemove', color: 'bg-rose-500' },
  cta_click: { labelKey: 'admin.galleryAnalytics.eventsBreakdown.ctaClick', color: 'bg-amber-500' },
  slideshow_start: { labelKey: 'admin.galleryAnalytics.eventsBreakdown.slideshowStart', color: 'bg-cyan-500' },
  slideshow_end: { labelKey: 'admin.galleryAnalytics.eventsBreakdown.slideshowEnd', color: 'bg-teal-500' },
};

export function EventsBreakdown({ data }: EventsBreakdownProps) {
  const { t } = useTranslation();
  
  // Filter out session events and prepare data
  const filteredData = Object.entries(data)
    .filter(([key]) => !key.includes('session') && EVENT_CONFIG[key])
    .map(([key, value]) => ({
      key,
      label: t(EVENT_CONFIG[key]?.labelKey || key),
      value,
      color: EVENT_CONFIG[key]?.color || 'bg-slate-500',
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = filteredData.reduce((sum, item) => sum + item.value, 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
          <Activity size={20} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-400">{t('admin.galleryAnalytics.eventsBreakdown.noEvents')}</p>
        <p className="text-[10px] text-slate-400 mt-1">{t('admin.galleryAnalytics.eventsBreakdown.interactionsWillAppear')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual bar representation */}
      <div className="h-4 rounded-full overflow-hidden flex bg-slate-100">
        {filteredData.map((item) => {
          const percentage = (item.value / total) * 100;
          return (
            <div
              key={item.key}
              className={`${item.color} transition-all hover:opacity-80`}
              style={{ width: `${percentage}%` }}
              title={`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {filteredData.slice(0, 6).map((item) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <div 
              key={item.key}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-700 truncate">{item.label}</p>
                <p className="text-[9px] text-slate-400">{item.value} ({percentage}%)</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('admin.galleryAnalytics.eventsBreakdown.totalInteractions')}</span>
        <span className="text-lg font-black text-slate-900">{total}</span>
      </div>
    </div>
  );
}
