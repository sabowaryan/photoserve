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
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { GalleryCard } from "@/components/dashboard/gallery-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SidebarSection } from "@/components/dashboard/sidebar-section";

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
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

  // Calculate stats
  const stats = {
    totalGalleries: galleries.length,
    totalImages: galleries.reduce((sum, g) => sum + (g.image_count || 0), 0),
    totalViews: galleries.reduce((sum, g) => sum + g.views_count, 0),
    storageUsed: profile?.storage_used_mb || 0,
    storageLimit: profile?.storage_limit_mb || 20,
    maxGalleries: profile?.max_galleries || 3,
  };

  // Calculate views trend (comparing last 30 days vs previous 30 days)
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

  // Calculate percentage change
  let viewsTrend = { value: "+0%", positive: true };
  let previousMonthViews = Math.floor(stats.totalViews * 0.89); // Fallback

  if (olderViews > 0) {
    const percentChange = ((recentViews - olderViews) / olderViews) * 100;
    const isPositive = percentChange >= 0;
    viewsTrend = {
      value: `${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`,
      positive: isPositive
    };
    previousMonthViews = olderViews;
  } else if (recentViews > 0) {
    // If no older data, show as positive growth
    viewsTrend = { value: "+100%", positive: true };
    previousMonthViews = 0;
  }

  const isGalleryLimitReached = stats.totalGalleries >= stats.maxGalleries;

  // Generate activities from galleries
  const activities = galleries.slice(0, 5).map((g) => ({
    id: g.id,
    type: "created" as const,
    title: `Galerie "${g.title}" créée`,
    timestamp: g.created_at,
  }));

  // Plan badge
  const getPlanBadge = () => {
    const plan = profile?.subscription_plan || "free";
    const colors = {
      free: "bg-slate-100 text-slate-900 border-slate-200",
      premium: "bg-indigo-100 text-indigo-900 border-indigo-200",
      pro: "bg-purple-100 text-purple-900 border-purple-200",
    };

    return (
      <div className={`px-3 py-1 rounded-lg border font-black text-xs uppercase tracking-wider ${colors[plan]}`}>
        {plan === "free" ? "Gratuit" : plan === "premium" ? "Premium" : "Pro"}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content - 9/12 */}
        <div className="lg:col-span-9 space-y-10">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <Sparkles size={16} />
                </div>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                  Tableau de bord
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
                Bonjour, <span className="gradient-text">{userName}</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
                Voici un aperçu de vos performances et de la gestion de vos galeries sécurisées.
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <button
                onClick={() => router.push("/dashboard/gallery/new")}
                disabled={isGalleryLimitReached}
                className={`flex items-center justify-center gap-3 px-8 py-5 font-black rounded-[1.8rem] transition-all active:scale-95 group overflow-hidden relative shadow-2xl ${
                  isGalleryLimitReached
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1.5 shadow-indigo-500/30'
                }`}
              >
                {!isGalleryLimitReached && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                )}
                <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                <span className="text-base">Nouvelle Galerie</span>
                <span className="hidden sm:flex items-center justify-center w-6 h-6 bg-white/20 rounded-lg text-[10px] ml-2 border border-white/20 group-hover:bg-white/30">
                  N
                </span>
              </button>

              {isGalleryLimitReached && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 animate-in shake-in">
                  <AlertCircle size={14} strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Quota atteint</span>
                </div>
              )}
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={Zap}
              label="Offre actuelle"
              value={profile?.subscription_plan === "free" ? "Gratuit" : profile?.subscription_plan === "premium" ? "Premium" : "Pro"}
              badge={getPlanBadge()}
            />
            <StatsCard
              icon={HardDrive}
              label="Stockage"
              value={stats.storageUsed.toFixed(1)}
              subtitle={`${stats.storageLimit} Mo`}
              badgeText="Usage"
              progress={stats.storageUsed}
              progressMax={stats.storageLimit}
            />
            <StatsCard
              icon={FolderOpen}
              label="Galeries"
              value={stats.totalGalleries}
              subtitle={`${stats.maxGalleries}`}
              badgeText="Volume"
              progress={stats.totalGalleries}
              progressMax={stats.maxGalleries}
            />
            <StatsCard
              icon={Eye}
              label="Vues totales"
              value={stats.totalViews.toLocaleString()}
              subtitle={`vs ${previousMonthViews.toLocaleString()} le mois dernier`}
              trend={viewsTrend}
              variant="dark"
            />
          </div>

          {/* Galleries Section Container */}
          <div className="bg-white rounded-[3rem] p-4 sm:p-10 border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.03)] min-h-[600px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-100/60">
              <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Galeries</h2>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-slate-200 uppercase">
                    {galleries.length}
                  </span>
                </div>

                <div className="relative flex-1 lg:w-80 group">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Rechercher une galerie..."
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-black text-slate-300 pointer-events-none border border-slate-200 px-1.5 py-0.5 rounded-md bg-white">
                    S
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* View Switcher */}
                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "grid"
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "list"
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <List size={18} />
                  </button>
                </div>

                {/* Sort Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <ArrowUpDown size={16} />
                    <span className="hidden sm:inline">{SORT_LABELS[sortBy].label}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${isSortMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isSortMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-[100] animate-in slide-in-from-top-2">
                      {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSortBy(option);
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors ${
                            sortBy === option
                              ? 'text-indigo-600 bg-indigo-50'
                              : 'text-slate-600 hover:bg-slate-50'
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

            {/* Galleries Grid/List */}
            {sortedAndFilteredGalleries.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
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
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6 shadow-inner">
                  <UploadCloud size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Aucune galerie trouvée</h3>
                <p className="text-slate-500 font-medium mb-8 max-w-xs">
                  {searchQuery
                    ? `Aucun résultat pour "${searchQuery}"`
                    : "Commencez par créer votre première galerie photo."}
                </p>
                {!searchQuery && !isGalleryLimitReached && (
                  <button
                    onClick={() => router.push("/dashboard/gallery/new")}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                  >
                    <Plus size={20} />
                    Créer ma première galerie
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 3/12 */}
        <div className="lg:col-span-3">
          <SidebarSection activities={activities} />
        </div>
      </div>
    </div>
  );
}
