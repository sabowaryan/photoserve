"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  HardDrive,
  FolderOpen,
  Eye,
  Zap,
  ArrowUpDown,
  Calendar,
  Clock,
  UploadCloud,
  AlertCircle,
  ChevronDown,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { GalleryCard } from "@/components/dashboard/gallery-card";
import { SidebarSection } from "@/components/dashboard/sidebar-section";
import { OnboardingGuide } from "@/components/dashboard/onboarding-guide";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { LoadingButton } from "@/components/ui/loading-button";
import { useTranslation } from "@/lib/i18n/context";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { PLAN_LIMITS } from "@/config/plans";

interface DashboardClientProps {
  userEmail: string;
}

type SortOption = 'created_at_desc' | 'created_at_asc' | 'views_count_desc' | 'views_count_asc' | 'expires_at_desc' | 'expires_at_asc';

const SORT_KEYS: Record<SortOption, { labelKey: string; icon: React.ReactNode }> = {
  created_at_desc: { labelKey: 'dashboard.sort.newest', icon: <Calendar size={14} /> },
  created_at_asc: { labelKey: 'dashboard.sort.oldest', icon: <Calendar size={14} /> },
  views_count_desc: { labelKey: 'dashboard.sort.mostViews', icon: <Eye size={14} /> },
  views_count_asc: { labelKey: 'dashboard.sort.leastViews', icon: <Eye size={14} /> },
  expires_at_desc: { labelKey: 'dashboard.sort.expiresLast', icon: <Clock size={14} /> },
  expires_at_asc: { labelKey: 'dashboard.sort.expiresSoon', icon: <Clock size={14} /> },
};

/**
 * Dashboard Client Component
 * 
 * Uses SWR for client-side data fetching to avoid blocking the initial render.
 * Displays skeleton during loading and error state with retry option.
 * 
 * Requirements: 2.2, 2.3, 2.4
 */
export function DashboardClient({ userEmail }: DashboardClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  
  // Client-side data fetching with SWR
  const { profile, galleries, isLoading, error, mutate } = useDashboardData();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("created_at_desc");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Derive userName from profile or email
  const userName = profile?.name || userEmail.split("@")[0] || "";

  useEffect(() => {
    const shouldShowOnboarding = 
      !profile?.onboarding_completed && 
      galleries.length === 0 &&
      !isLoading;
    setShowOnboarding(shouldShowOnboarding);
  }, [profile?.onboarding_completed, galleries.length, isLoading]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed: true }),
      });
      mutate(); // Revalidate data after update
    } catch (error) {
      console.error("Failed to update onboarding status:", error);
    }
  };

  const handleOnboardingDismiss = async () => {
    setShowOnboarding(false);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed: true }),
      });
      mutate(); // Revalidate data after update
    } catch (error) {
      console.error("Failed to update onboarding status:", error);
    }
  };

  // Calculate stats - Use plan limits from config instead of DB values
  const userPlan = profile?.subscription_plan || "free";
  const planLimits = PLAN_LIMITS[userPlan];
  
  const stats = useMemo(() => ({
    totalGalleries: galleries.length,
    totalImages: galleries.reduce((sum, g) => sum + (g.image_count || 0), 0),
    totalViews: galleries.reduce((sum, g) => sum + g.views_count, 0),
    storageUsed: profile?.storage_used_mb || 0,
    storageLimit: planLimits.storage_limit_mb,
    maxGalleries: planLimits.max_galleries,
  }), [galleries, profile, planLimits]);

  const isGalleryLimitReached = stats.totalGalleries >= stats.maxGalleries;

  const handleNavigateToNewGallery = () => {
    setIsNavigating(true);
    router.push("/dashboard/gallery/new");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
      if (isInput) {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
          setSearchQuery("");
        }
        return;
      }

      const key = e.key.toLowerCase();
      
      if (key === "n" && !isGalleryLimitReached) {
        e.preventDefault();
        handleNavigateToNewGallery();
      } else if (key === "s") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, isGalleryLimitReached]);

  const sortedAndFilteredGalleries = useMemo(() => {
    let result = galleries.filter((g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case 'created_at_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_at_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'views_count_desc':
          return b.views_count - a.views_count;
        case 'views_count_asc':
          return a.views_count - b.views_count;
        case 'expires_at_desc':
          return new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime();
        case 'expires_at_asc':
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [galleries, searchQuery, sortBy]);

  // Calculate view trends
  const viewsTrend = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentGalleries = galleries.filter(g => new Date(g.created_at) >= thirtyDaysAgo);
    const olderGalleries = galleries.filter(g => {
      const createdAt = new Date(g.created_at);
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    });

    const recentViews = recentGalleries.reduce((sum, g) => sum + g.views_count, 0);
    const olderViews = olderGalleries.reduce((sum, g) => sum + g.views_count, 0);

    let trend = { value: "+0%", positive: true };
    let previousMonthViews = Math.floor(stats.totalViews * 0.89);

    if (olderViews > 0) {
      const percentChange = ((recentViews - olderViews) / olderViews) * 100;
      const isPositive = percentChange >= 0;
      trend = {
        value: `${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`,
        positive: isPositive
      };
      previousMonthViews = olderViews;
    } else if (recentViews > 0) {
      trend = { value: "+100%", positive: true };
      previousMonthViews = 0;
    }

    return { trend, previousMonthViews };
  }, [galleries, stats.totalViews]);

  const activities = useMemo(() => 
    galleries.slice(0, 5).map((g) => ({
      id: g.id,
      type: "created" as const,
      title: t('dashboard.activity.galleryCreated', { title: g.title }),
      timestamp: g.created_at,
    })), [galleries, t]);

  const planConfig = {
    free: { labelKey: "dashboard.plans.free", color: "slate", gradient: "from-slate-500 to-slate-600" },
    premium: { labelKey: "dashboard.plans.premium", color: "indigo", gradient: "from-indigo-500 to-violet-600" },
    pro: { labelKey: "dashboard.plans.pro", color: "purple", gradient: "from-purple-500 to-pink-600" },
  };

  const currentPlan = planConfig[profile?.subscription_plan || "free"];
  const currentPlanLabel = t(currentPlan.labelKey);

  // Format storage for display (MB, GB, TB)
  const formatStorage = (mb: number): string => {
    if (mb >= 1024000) {
      return `${(mb / 1024000).toFixed(0)} To`;
    } else if (mb >= 1024) {
      return `${(mb / 1024).toFixed(0)} Go`;
    }
    return `${mb.toFixed(0)} Mo`;
  };

  const storagePercent = (stats.storageUsed / stats.storageLimit) * 100;
  const galleriesPercent = (stats.totalGalleries / stats.maxGalleries) * 100;

  // Show skeleton during loading (Requirements: 2.3)
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show error state with retry option (Requirements: 2.4)
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pt-18 pb-10 font-['Plus_Jakarta_Sans']">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1.5">
              {t('common.errorLoading') || 'Error loading data'}
            </h3>
            <p className="text-slate-500 font-medium text-sm mb-5 max-w-xs">
              {t('common.errorLoadingDescription') || 'Something went wrong while loading your dashboard. Please try again.'}
            </p>
            <button
              onClick={() => mutate()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
            >
              <RefreshCw size={16} />
              {t('common.retry') || 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pt-18 pb-10 font-['Plus_Jakarta_Sans']">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showOnboarding && (
          <div className="mb-5">
            <OnboardingGuide
              onComplete={handleOnboardingComplete}
              onDismiss={handleOnboardingDismiss}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-9 space-y-5">
            {/* Welcome Header */}
            <header className="relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">
                    <Sparkles size={10} className="text-indigo-500" />
                    <span className="text-[9px] font-bold text-indigo-600">{t('dashboard.badge')}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {t('dashboard.greeting')} <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{userName}</span> 👋
                  </h1>
                  <p className="text-slate-500 font-medium text-[11px] max-w-md">
                    {t('dashboard.subtitle')}
                  </p>
                </div>

                <LoadingButton
                  onClick={handleNavigateToNewGallery}
                  disabled={isGalleryLimitReached}
                  isLoading={isNavigating}
                  className={`group flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-xl transition-all ${
                    isGalleryLimitReached
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5'
                  }`}
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  <span>{t('dashboard.newGallery')}</span>
                  {!isGalleryLimitReached && (
                    <kbd className="hidden sm:inline px-1 py-0.5 bg-white/20 rounded text-[9px] font-mono">N</kbd>
                  )}
                </LoadingButton>
              </div>

              {isGalleryLimitReached && (
                <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                  <AlertCircle size={12} />
                  <span className="text-[10px] font-bold">{t('common.galleryLimitReached')}</span>
                </div>
              )}
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Plan Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${currentPlan.gradient} text-white shadow-md`}>
                    <Zap size={14} />
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-${currentPlan.color}-50 text-${currentPlan.color}-600 border border-${currentPlan.color}-100`}>
                    {currentPlanLabel}
                  </span>
                </div>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{t('common.offer')}</p>
                <p className="text-base font-black text-slate-900">{currentPlanLabel}</p>
              </div>

              {/* Storage Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <HardDrive size={14} />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    {storagePercent.toFixed(0)}%
                  </span>
                </div>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{t('common.storage')}</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-black text-slate-900">{stats.storageUsed.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 font-medium">/ {formatStorage(stats.storageLimit)}</span>
                </div>
                <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${storagePercent > 85 ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, storagePercent)}%` }}
                  />
                </div>
              </div>

              {/* Galleries Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <FolderOpen size={14} />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    {stats.maxGalleries >= 9999 ? '∞' : `${galleriesPercent.toFixed(0)}%`}
                  </span>
                </div>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{t('common.galleries')}</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-black text-slate-900">{stats.totalGalleries}</span>
                  <span className="text-[10px] text-slate-400 font-medium">/ {stats.maxGalleries >= 9999 ? '∞' : stats.maxGalleries}</span>
                </div>
                <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${galleriesPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${stats.maxGalleries >= 9999 ? 0 : Math.min(100, galleriesPercent)}%` }}
                  />
                </div>
              </div>

              {/* Views Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-3 shadow-lg relative overflow-hidden">
                <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-indigo-500/20 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-white/10 text-indigo-400">
                      <Eye size={14} />
                    </div>
                    <span className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[8px] font-bold ${
                      viewsTrend.trend.positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      <TrendingUp size={8} />
                      {viewsTrend.trend.value}
                    </span>
                  </div>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{t('common.totalViews')}</p>
                  <p className="text-base font-black text-white">{stats.totalViews.toLocaleString()}</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">{t('dashboard.stats.vsLastMonth', { count: viewsTrend.previousMonthViews.toLocaleString() })}</p>
                </div>
              </div>
            </div>

            {/* Galleries Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">{t('common.myGalleries')}</h2>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">
                    {galleries.length}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-52 group">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={t('common.searchPlaceholder')}
                      className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono text-slate-400">S</kbd>
                  </div>

                  {/* View Toggle */}
                  <div className="flex p-0.5 bg-slate-100 rounded-lg">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <List size={14} />
                    </button>
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <button
                      onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      <ArrowUpDown size={12} />
                      <span className="hidden sm:inline">{t(SORT_KEYS[sortBy].labelKey)}</span>
                      <ChevronDown size={10} className={`transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSortMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in slide-in-from-top-2">
                        {(Object.keys(SORT_KEYS) as SortOption[]).map((option) => (
                          <button
                            key={option}
                            onClick={() => { setSortBy(option); setIsSortMenuOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                              sortBy === option ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {SORT_KEYS[option].icon}
                            {t(SORT_KEYS[option].labelKey)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gallery Grid/List */}
              <div className="p-4">
                {sortedAndFilteredGalleries.length > 0 ? (
                  <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-2.5"}>
                    {sortedAndFilteredGalleries.map((gallery, index) => (
                      <GalleryCard
                        key={gallery.id}
                        id={gallery.id}
                        title={gallery.title}
                        slug={gallery.unique_slug}
                        expiresAt={gallery.expires_at}
                        viewsCount={gallery.views_count}
                        isActive={gallery.is_active}
                        imageUrl={gallery.imageUrl}
                        imageCount={gallery.image_count}
                        createdAt={gallery.created_at}
                        isListView={viewMode === "list"}
                        priority={index < 4}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                      <UploadCloud size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1.5">
                      {searchQuery ? t('dashboard.galleriesSection.noResults') : t('dashboard.galleriesSection.emptyState')}
                    </h3>
                    <p className="text-slate-500 font-medium text-xs mb-5 max-w-xs">
                      {searchQuery
                        ? t('dashboard.galleriesSection.noResultsQuery', { query: searchQuery })
                        : galleries.length === 0 
                          ? t('dashboard.galleriesSection.emptyState')
                          : t('dashboard.galleriesSection.noResults')}
                    </p>
                    {!searchQuery && !isGalleryLimitReached && (
                      <LoadingButton
                        onClick={handleNavigateToNewGallery}
                        isLoading={isNavigating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
                      >
                        <Plus size={16} />
                        {t('dashboard.galleriesSection.createFirst')}
                      </LoadingButton>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3">
            <SidebarSection activities={activities} userPlan={profile?.subscription_plan || "free"} />
          </div>
        </div>
      </div>
    </div>
  );
}
