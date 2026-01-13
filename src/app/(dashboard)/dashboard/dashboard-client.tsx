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
} from "lucide-react";
import { GalleryCard } from "@/components/dashboard/gallery-card";
import { SidebarSection } from "@/components/dashboard/sidebar-section";
import { OnboardingGuide } from "@/components/dashboard/onboarding-guide";

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  expires_at: string;
  views_count: number;
  is_active: boolean;
  created_at: string;
  image_count?: number;
}

interface Profile {
  id: string;
  email: string;
  name: string | null;
  subscription_plan: "free" | "premium" | "pro";
  storage_used_mb: number;
  storage_limit_mb: number;
  max_galleries: number;
  onboarding_completed: boolean | null;
}

interface DashboardClientProps {
  profile: Profile | null;
  galleries: Gallery[];
  userName: string;
}

type SortOption = 'created_at_desc' | 'created_at_asc' | 'views_count_desc' | 'views_count_asc' | 'expires_at_desc' | 'expires_at_asc';

const SORT_LABELS: Record<SortOption, { label: string; icon: React.ReactNode }> = {
  created_at_desc: { label: 'Plus récentes', icon: <Calendar size={14} /> },
  created_at_asc: { label: 'Plus anciennes', icon: <Calendar size={14} /> },
  views_count_desc: { label: 'Plus de vues', icon: <Eye size={14} /> },
  views_count_asc: { label: 'Moins de vues', icon: <Eye size={14} /> },
  expires_at_desc: { label: 'Expiration lointaine', icon: <Clock size={14} /> },
  expires_at_asc: { label: 'Expiration proche', icon: <Clock size={14} /> },
};

export function DashboardClient({ profile, galleries, userName }: DashboardClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("created_at_desc");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const shouldShowOnboarding = 
      !profile?.onboarding_completed && 
      galleries.length === 0;
    setShowOnboarding(shouldShowOnboarding);
  }, [profile?.onboarding_completed, galleries.length]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed: true }),
      });
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
    } catch (error) {
      console.error("Failed to update onboarding status:", error);
    }
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
        router.push("/dashboard/gallery/new");
      } else if (key === "s") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

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

  const stats = {
    totalGalleries: galleries.length,
    totalImages: galleries.reduce((sum, g) => sum + (g.image_count || 0), 0),
    totalViews: galleries.reduce((sum, g) => sum + g.views_count, 0),
    storageUsed: profile?.storage_used_mb || 0,
    storageLimit: profile?.storage_limit_mb || 20,
    maxGalleries: profile?.max_galleries || 3,
  };

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

  let viewsTrend = { value: "+0%", positive: true };
  let previousMonthViews = Math.floor(stats.totalViews * 0.89);

  if (olderViews > 0) {
    const percentChange = ((recentViews - olderViews) / olderViews) * 100;
    const isPositive = percentChange >= 0;
    viewsTrend = {
      value: `${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`,
      positive: isPositive
    };
    previousMonthViews = olderViews;
  } else if (recentViews > 0) {
    viewsTrend = { value: "+100%", positive: true };
    previousMonthViews = 0;
  }

  const isGalleryLimitReached = stats.totalGalleries >= stats.maxGalleries;

  const activities = galleries.slice(0, 5).map((g) => ({
    id: g.id,
    type: "created" as const,
    title: `Galerie "${g.title}" créée`,
    timestamp: g.created_at,
  }));

  const planConfig = {
    free: { label: "Gratuit", color: "slate", gradient: "from-slate-500 to-slate-600" },
    premium: { label: "Premium", color: "indigo", gradient: "from-indigo-500 to-violet-600" },
    pro: { label: "Pro", color: "purple", gradient: "from-purple-500 to-pink-600" },
  };

  const currentPlan = planConfig[profile?.subscription_plan || "free"];

  const storagePercent = (stats.storageUsed / stats.storageLimit) * 100;
  const galleriesPercent = (stats.totalGalleries / stats.maxGalleries) * 100;

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
                    <span className="text-[9px] font-bold text-indigo-600">Tableau de bord</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Bonjour, <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{userName}</span> 👋
                  </h1>
                  <p className="text-slate-500 font-medium text-[11px] max-w-md">
                    Gérez vos galeries et suivez vos performances en temps réel.
                  </p>
                </div>

                <button
                  onClick={() => router.push("/dashboard/gallery/new")}
                  disabled={isGalleryLimitReached}
                  className={`group flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-xl transition-all ${
                    isGalleryLimitReached
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5'
                  }`}
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  <span>Nouvelle galerie</span>
                  {!isGalleryLimitReached && (
                    <kbd className="hidden sm:inline px-1 py-0.5 bg-white/20 rounded text-[9px] font-mono">N</kbd>
                  )}
                </button>
              </div>

              {isGalleryLimitReached && (
                <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                  <AlertCircle size={12} />
                  <span className="text-[10px] font-bold">Limite de galeries atteinte</span>
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
                    {currentPlan.label}
                  </span>
                </div>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Offre</p>
                <p className="text-base font-black text-slate-900">{currentPlan.label}</p>
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
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Stockage</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-black text-slate-900">{stats.storageUsed.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 font-medium">/ {stats.storageLimit} Mo</span>
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
                    {galleriesPercent.toFixed(0)}%
                  </span>
                </div>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Galeries</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-black text-slate-900">{stats.totalGalleries}</span>
                  <span className="text-[10px] text-slate-400 font-medium">/ {stats.maxGalleries}</span>
                </div>
                <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${galleriesPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, galleriesPercent)}%` }}
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
                      viewsTrend.positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      <TrendingUp size={8} />
                      {viewsTrend.value}
                    </span>
                  </div>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Vues totales</p>
                  <p className="text-base font-black text-white">{stats.totalViews.toLocaleString()}</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">vs {previousMonthViews.toLocaleString()} le mois dernier</p>
                </div>
              </div>
            </div>

            {/* Galleries Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">Mes galeries</h2>
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
                      placeholder="Rechercher..."
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
                      <span className="hidden sm:inline">{SORT_LABELS[sortBy].label}</span>
                      <ChevronDown size={10} className={`transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSortMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in slide-in-from-top-2">
                        {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                          <button
                            key={option}
                            onClick={() => { setSortBy(option); setIsSortMenuOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                              sortBy === option ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {SORT_LABELS[option].icon}
                            {SORT_LABELS[option].label}
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
                    {sortedAndFilteredGalleries.map((gallery) => (
                      <GalleryCard
                        key={gallery.id}
                        id={gallery.id}
                        title={gallery.title}
                        slug={gallery.unique_slug}
                        expiresAt={gallery.expires_at}
                        viewsCount={gallery.views_count}
                        isActive={gallery.is_active}
                        imageUrl={(gallery as any).imageUrl}
                        imageCount={gallery.image_count}
                        createdAt={gallery.created_at}
                        isListView={viewMode === "list"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                      <UploadCloud size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1.5">
                      {searchQuery ? 'Aucun résultat' : 'Aucune galerie'}
                    </h3>
                    <p className="text-slate-500 font-medium text-xs mb-5 max-w-xs">
                      {searchQuery
                        ? `Aucune galerie ne correspond à "${searchQuery}"`
                        : "Créez votre première galerie pour commencer à partager vos photos."}
                    </p>
                    {!searchQuery && !isGalleryLimitReached && (
                      <button
                        onClick={() => router.push("/dashboard/gallery/new")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
                      >
                        <Plus size={16} />
                        Créer une galerie
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3">
            <SidebarSection activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
