'use client';

/**
 * Gallery Analytics Client Component
 * Displays comprehensive analytics with charts and visualizations
 * 
 * @module app/(dashboard)/dashboard/gallery/[id]/analytics/analytics-client
 * Requirement 3.3.4: THE Dashboard SHALL display analytics per gallery
 * Phase 3: Event tracking analytics
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Eye, Users, Heart, MessageSquare, TrendingUp, Globe, 
  Download, Activity, Image as ImageIcon, PieChart, Sparkles, Play,
  MousePointer, BarChart3
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n/context';
import type { GalleryStats } from '@/types';
import { 
  ViewsChart, 
  CountryMap, 
  DownloadsChart,
  TopImages,
  EngagementStats,
  EventsBreakdown,
} from './components';

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  created_at: string;
}

interface GalleryImage {
  id: string;
  cloudinary_url: string;
}

interface AnalyticsClientProps {
  gallery: Gallery;
}

export function AnalyticsClient({ gallery }: AnalyticsClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'downloads' | 'geography'>('overview');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [analyticsRes, galleryRes] = await Promise.all([
          fetch(`/api/galleries/${gallery.id}/analytics`),
          fetch(`/api/galleries/${gallery.id}`),
        ]);
        
        if (!analyticsRes.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const analyticsData = await analyticsRes.json();
        setStats(analyticsData.stats);

        if (galleryRes.ok) {
          const galleryData = await galleryRes.json();
          setImages(galleryData.images || []);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [gallery.id]);

  const handleBack = () => {
    router.push(`/dashboard/gallery/${gallery.id}`);
  };

  // Calculate download rate
  const downloadRate = stats && stats.totalViews > 0 && stats.eventStats
    ? ((stats.eventStats.downloadStats.total / stats.totalViews) * 100).toFixed(1)
    : '0';

  // Calculate engagement rate
  const engagementRate = stats && stats.totalViews > 0 && stats.eventStats
    ? ((stats.eventStats.totalEvents / stats.totalViews) * 100).toFixed(1)
    : '0';

  const tabs = [
    { id: 'overview', label: t('admin.galleryAnalytics.tabs.overview'), icon: BarChart3 },
    { id: 'engagement', label: t('admin.galleryAnalytics.tabs.engagement'), icon: Activity },
    { id: 'downloads', label: t('admin.galleryAnalytics.tabs.downloads'), icon: Download },
    { id: 'geography', label: t('admin.galleryAnalytics.tabs.geography'), icon: Globe },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-['Plus_Jakarta_Sans']">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('admin.galleryAnalytics.backToGallery')}
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">
                <Sparkles size={10} className="text-indigo-500" />
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">{t('common.analytics')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {gallery.title}
              </h1>
              <p className="text-slate-500 font-medium text-sm">
                {t('admin.galleryAnalytics.subtitle')}
              </p>
            </div>
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-6">
            <p className="text-rose-600 font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        )}

        {/* Stats Display */}
        {!loading && stats && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {/* Views Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
                <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-indigo-500/20 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-white/10 text-indigo-400">
                      <Eye size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('admin.galleryAnalytics.metrics.totalViews')}</p>
                  <p className="text-2xl font-black text-white">{stats.totalViews.toLocaleString()}</p>
                </div>
              </div>

              {/* Visitors Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <Users size={16} />
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {t('admin.galleryAnalytics.metrics.unique')}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('admin.galleryAnalytics.metrics.visitors')}</p>
                <p className="text-2xl font-black text-slate-900">{stats.uniqueVisitors.toLocaleString()}</p>
              </div>

              {/* Downloads Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
                    <Download size={16} />
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-violet-50 text-violet-600 border border-violet-100">
                    {downloadRate}%
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('admin.galleryAnalytics.metrics.downloads')}</p>
                <p className="text-2xl font-black text-slate-900">{(stats.eventStats?.downloadStats.total || 0).toLocaleString()}</p>
              </div>

              {/* Events Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Activity size={16} />
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                    {engagementRate}%
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('admin.galleryAnalytics.metrics.interactions')}</p>
                <p className="text-2xl font-black text-slate-900">{(stats.eventStats?.totalEvents || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              {/* Tab Headers */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Views Chart */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                          <TrendingUp size={14} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{t('admin.galleryAnalytics.viewsChart.title')}</h3>
                          <p className="text-[10px] text-slate-500 font-medium">{t('admin.galleryAnalytics.viewsChart.subtitle')}</p>
                        </div>
                      </div>
                      <ViewsChart data={stats.viewsByDate} />
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Top Images */}
                      <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
                            <ImageIcon size={14} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900">{t('admin.galleryAnalytics.topImages.title')}</h3>
                            <p className="text-[10px] text-slate-500 font-medium">{t('admin.galleryAnalytics.topImages.subtitle')}</p>
                          </div>
                        </div>
                        <TopImages 
                          data={stats.eventStats?.mostViewedImages || []} 
                          images={images}
                        />
                      </div>

                      {/* Events Breakdown */}
                      <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                            <PieChart size={14} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900">{t('admin.galleryAnalytics.eventsBreakdown.title')}</h3>
                            <p className="text-[10px] text-slate-500 font-medium">{t('admin.galleryAnalytics.eventsBreakdown.subtitle')}</p>
                          </div>
                        </div>
                        <EventsBreakdown data={stats.eventStats?.eventsByType || {}} />
                      </div>
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-rose-50 flex items-center justify-center">
                          <Heart size={18} className="text-rose-500" />
                        </div>
                        <p className="text-xl font-black text-slate-900">{stats.favoritesCount}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('admin.galleryAnalytics.secondaryStats.favorites')}</p>
                      </div>
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-50 flex items-center justify-center">
                          <MessageSquare size={18} className="text-blue-500" />
                        </div>
                        <p className="text-xl font-black text-slate-900">{stats.commentsCount}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('admin.galleryAnalytics.secondaryStats.comments')}</p>
                      </div>
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <Play size={18} className="text-emerald-500" />
                        </div>
                        <p className="text-xl font-black text-slate-900">{stats.eventStats?.slideshowStats.starts || 0}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('admin.galleryAnalytics.secondaryStats.slideshows')}</p>
                      </div>
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-indigo-50 flex items-center justify-center">
                          <MousePointer size={18} className="text-indigo-500" />
                        </div>
                        <p className="text-xl font-black text-slate-900">{stats.eventStats?.ctaClicks || 0}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('admin.galleryAnalytics.secondaryStats.ctaClicks')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Engagement Tab */}
                {activeTab === 'engagement' && (
                  <div className="space-y-6">
                    {stats.eventStats ? (
                      <>
                        {/* Engagement Metrics */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                              <Activity size={14} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-900">{t('admin.galleryAnalytics.engagement.metricsTitle')}</h3>
                              <p className="text-[10px] text-slate-500 font-medium">{t('admin.galleryAnalytics.engagement.metricsSubtitle')}</p>
                            </div>
                          </div>
                          <EngagementStats 
                            sessionStats={stats.eventStats.sessionStats}
                            slideshowStats={stats.eventStats.slideshowStats}
                            ctaClicks={stats.eventStats.ctaClicks}
                          />
                        </div>

                        {/* Favorites Activity */}
                        <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                              <Heart size={14} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-900">{t('admin.galleryAnalytics.engagement.favoritesActivity')}</h3>
                              <p className="text-[10px] text-slate-500 font-medium">{t('admin.galleryAnalytics.engagement.additionsAndRemovals')}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                              <p className="text-2xl font-black text-emerald-600">
                                +{stats.eventStats.favoriteStats.added}
                              </p>
                              <p className="text-[10px] text-emerald-600/70 font-semibold uppercase tracking-wider mt-1">{t('admin.galleryAnalytics.engagement.added')}</p>
                            </div>
                            <div className="text-center p-4 bg-rose-50 rounded-xl border border-rose-100">
                              <p className="text-2xl font-black text-rose-600">
                                -{stats.eventStats.favoriteStats.removed}
                              </p>
                              <p className="text-[10px] text-rose-600/70 font-semibold uppercase tracking-wider mt-1">{t('admin.galleryAnalytics.engagement.removed')}</p>
                            </div>
                            <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                              <p className="text-2xl font-black text-indigo-600">
                                {stats.eventStats.favoriteStats.net}
                              </p>
                              <p className="text-[10px] text-indigo-600/70 font-semibold uppercase tracking-wider mt-1">{t('admin.galleryAnalytics.engagement.net')}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Activity size={28} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">{t('admin.galleryAnalytics.engagement.noData')}</h3>
                        <p className="text-slate-500 text-sm font-medium">
                          {t('admin.galleryAnalytics.engagement.statsWillAppear')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Downloads Tab */}
                {activeTab === 'downloads' && (
                  <div className="space-y-6">
                    {/* Downloads Chart */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
                          <Download size={14} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{t('admin.galleryAnalytics.downloads.byTypeTitle')}</h3>
                          <p className="text-[10px] text-slate-500 font-medium">{t('admin.galleryAnalytics.downloads.byTypeSubtitle')}</p>
                        </div>
                      </div>
                      {stats.eventStats ? (
                        <DownloadsChart data={stats.eventStats.downloadStats} />
                      ) : (
                        <div className="flex items-center justify-center h-48 text-slate-400">
                          <p className="text-sm font-medium">{t('admin.galleryAnalytics.downloads.noDownloads')}</p>
                        </div>
                      )}
                    </div>

                    {/* Download Stats Cards */}
                    {stats.eventStats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-center">
                          <p className="text-2xl font-black text-slate-900">{stats.eventStats.downloadStats.single}</p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{t('admin.galleryAnalytics.downloads.singlePhotos')}</p>
                        </div>
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-center">
                          <p className="text-2xl font-black text-slate-900">{stats.eventStats.downloadStats.all}</p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{t('admin.galleryAnalytics.downloads.allPhotos')}</p>
                        </div>
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-center">
                          <p className="text-2xl font-black text-slate-900">{stats.eventStats.downloadStats.selection}</p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{t('admin.galleryAnalytics.downloads.selections')}</p>
                        </div>
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-center">
                          <p className="text-2xl font-black text-slate-900">{stats.eventStats.downloadStats.favorites}</p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{t('admin.galleryAnalytics.downloads.favorites')}</p>
                        </div>
                      </div>
                    )}

                    {/* Download Rate */}
                    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl p-5 border border-violet-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{t('admin.galleryAnalytics.downloads.downloadRate')}</h3>
                          <p className="text-[10px] text-slate-500 font-medium">{t('admin.galleryAnalytics.downloads.visitorsWhoDownload')}</p>
                        </div>
                        <span className="text-3xl font-black text-violet-600">{downloadRate}%</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, parseFloat(downloadRate))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Geography Tab */}
                {activeTab === 'geography' && (
                  <div className="space-y-6">
                    {/* Country Map */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                          <Globe size={14} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{t('admin.galleryAnalytics.geography.title')}</h3>
                          <p className="text-[10px] text-slate-500 font-medium">{t('admin.galleryAnalytics.geography.subtitle')}</p>
                        </div>
                      </div>
                      <CountryMap data={stats.viewsByCountry} />
                    </div>

                    {/* Country Details */}
                    {Object.keys(stats.viewsByCountry).length > 0 && (
                      <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                        <h3 className="text-sm font-black text-slate-900 mb-4">{t('admin.galleryAnalytics.geography.detailsByCountry')}</h3>
                        <div className="space-y-2">
                          {Object.entries(stats.viewsByCountry)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 10)
                            .map(([country, views], index) => (
                              <div 
                                key={country} 
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                    {index + 1}
                                  </span>
                                  <span className="font-bold text-sm text-slate-700">{country}</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">
                                  {views} <span className="text-slate-400 font-medium">{views > 1 ? t('admin.galleryAnalytics.geography.views') : t('admin.galleryAnalytics.geography.view')}</span>
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
