'use client';

/**
 * Downloads Chart Component
 * Displays download statistics by type
 * 
 * @module app/(dashboard)/dashboard/gallery/[id]/analytics/components/downloads-chart
 * Phase 3: Event tracking analytics
 */
import { Download, Image, FolderArchive, Heart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface DownloadsChartProps {
  data: {
    total: number;
    single: number;
    all: number;
    selection: number;
    favorites: number;
  };
}

export function DownloadsChart({ data }: DownloadsChartProps) {
  const { t } = useTranslation();
  
  const items = [
    { 
      key: 'single', 
      labelKey: 'admin.galleryAnalytics.downloads.singlePhotos', 
      value: data.single, 
      icon: Image,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    { 
      key: 'all', 
      labelKey: 'admin.galleryAnalytics.downloads.allPhotos', 
      value: data.all, 
      icon: FolderArchive,
      color: 'bg-violet-500',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600'
    },
    { 
      key: 'selection', 
      labelKey: 'admin.galleryAnalytics.downloads.selections', 
      value: data.selection, 
      icon: Download,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    { 
      key: 'favorites', 
      labelKey: 'admin.galleryAnalytics.downloads.favorites', 
      value: data.favorites, 
      icon: Heart,
      color: 'bg-rose-500',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600'
    },
  ];

  const maxValue = Math.max(...items.map(i => i.value), 1);
  const hasData = items.some(i => i.value > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
          <Download size={20} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-400">{t('admin.galleryAnalytics.downloads.noDownloads')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const percentage = (item.value / maxValue) * 100;
        const Icon = item.icon;
        
        return (
          <div key={item.key} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${item.bgColor}`}>
                  <Icon size={12} className={item.textColor} />
                </div>
                <span className="text-xs font-bold text-slate-700">{t(item.labelKey)}</span>
              </div>
              <span className="text-xs font-black text-slate-900">{item.value}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${item.color} rounded-full transition-all group-hover:opacity-80`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
      
      {/* Total */}
      <div className="pt-3 mt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.galleryAnalytics.downloads.total')}</span>
          <span className="text-lg font-black text-slate-900">{data.total}</span>
        </div>
      </div>
    </div>
  );
}
