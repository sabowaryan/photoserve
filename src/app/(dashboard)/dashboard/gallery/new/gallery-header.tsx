'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, HardDrive, AlertTriangle, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface GalleryHeaderProps {
  currentStorageUsed: number;
  storageLimit: number;
  storagePercentage: number;
  subscriptionPlan: string;
  isGalleryLimitReached: boolean;
  galleryCount: number;
  maxGalleries: number;
}

export function GalleryHeader({
  currentStorageUsed,
  storageLimit,
  storagePercentage,
  subscriptionPlan,
  isGalleryLimitReached,
  galleryCount,
  maxGalleries,
}: GalleryHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-all group"
        >
          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md group-active:scale-95 transition-all">
            <ArrowLeft size={16} />
          </div>
          <span className="hidden sm:inline">{t('dashboard.badge')}</span>
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-sm font-bold text-slate-400">{t('common.newGallery')}</span>
      </div>

      {/* Hero Header */}
      <div className="relative mb-8 animate-in slide-in-from-top-4 duration-700">
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  {t('common.newGallery')}
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                {t('gallery.create.title')}
              </h1>
              <p className="text-indigo-100/70 font-medium max-w-md">
                {t('landing.benefits.features.gallery.desc')}
              </p>
            </div>

            {/* Storage Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-5 min-w-[240px]">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl ${storagePercentage >= 90 ? 'bg-rose-500/20' : 'bg-white/10'}`}>
                  <HardDrive size={18} className={storagePercentage >= 90 ? 'text-rose-300' : 'text-white'} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{t('common.storage')}</p>
                  <p className="text-sm font-black">
                    {currentStorageUsed.toFixed(1)} / {storageLimit} Mo
                  </p>
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    storagePercentage >= 90 
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500' 
                      : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  }`}
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  {t('common.offer')} {subscriptionPlan}
                </span>
                <span className="text-[10px] font-bold text-white/70">
                  {Math.round(storagePercentage)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(storagePercentage >= 100 || isGalleryLimitReached) && (
        <div className="mb-6 space-y-3 animate-in slide-in-from-bottom-4 duration-500">
          {storagePercentage >= 100 && (
            <Link
              href="/settings?upgrade=true"
              className="flex items-center gap-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl hover:bg-rose-100 transition-all group"
            >
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-rose-900">{t('common.insufficientStorage')}</p>
                <p className="text-sm text-rose-700">{t('common.upgradeToHigherPlan')}</p>
              </div>
              <Zap size={18} className="text-rose-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          
          {isGalleryLimitReached && (
            <Link
              href="/settings?upgrade=true"
              className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-all group"
            >
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600">
                <TrendingUp size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-900">{t('common.galleryLimitReached')}</p>
                <p className="text-sm text-amber-700">{galleryCount}/{maxGalleries} {t('common.galleries').toLowerCase()} • {t('pricing.upgrade')} Premium</p>
              </div>
              <Zap size={18} className="text-amber-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      )}
    </>
  );
}
