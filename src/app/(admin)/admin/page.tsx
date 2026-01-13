import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { createAdminService } from "@/lib/services/admin.service";
import { AdminStatsCard } from "@/components/admin/stats-card";
import { PlanDistributionChart } from "@/components/admin/plan-distribution-chart";
import { RecentActivity } from "@/components/admin/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, RefreshCw, TrendingUp } from "lucide-react";

/**
 * Format storage size for display
 */
function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
}

/**
 * Loading skeleton for stats cards
 */
function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-16 mb-1.5" />
      <Skeleton className="h-7 w-20" />
    </div>
  );
}

/**
 * Loading skeleton for the dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-40 mb-1.5" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Dashboard content component that fetches and displays stats
 */
async function DashboardContent() {
  const supabase = createAdminClient();
  const adminService = createAdminService(supabase);
  
  const stats = await adminService.getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-slate-500 mt-0.5 text-sm">
          Vue d'ensemble de la plateforme PikSend
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          icon="users"
          label="Utilisateurs"
          value={stats.totalUsers}
          subtitle="Comptes enregistrés"
          variant="primary"
        />
        <AdminStatsCard
          icon="image"
          label="Galeries actives"
          value={stats.activeGalleries}
          subtitle={`${stats.totalGalleries} au total`}
          variant="success"
        />
        <AdminStatsCard
          icon="hard-drive"
          label="Stockage utilisé"
          value={formatStorage(stats.totalStorageUsedMb)}
          subtitle="Espace total consommé"
          variant="warning"
        />
        <AdminStatsCard
          icon="trending-up"
          label="Taux de conversion"
          value={`${((stats.planDistribution.premium + stats.planDistribution.pro) / Math.max(stats.totalUsers, 1) * 100).toFixed(1)}%`}
          subtitle="Utilisateurs payants"
          variant="default"
        />
      </div>

      {/* Guest Gallery Conversion Metrics - Requirements: 11.4 */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          Métriques Guest Galleries
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">
              Galeries Guest
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {stats.guestGalleryMetrics.totalGuestGalleries}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Total créées par visiteurs
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">
              Galeries Converties
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {stats.guestGalleryMetrics.convertedGalleries}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Guest → Utilisateur
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">
              Taux de Conversion
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {stats.guestGalleryMetrics.conversionRate}%
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Guest galleries converties
            </p>
          </div>
        </div>
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlanDistributionChart distribution={stats.planDistribution} />
        <RecentActivity
          recentSignups={stats.recentSignups}
          recentGalleries={stats.recentGalleries}
        />
      </div>
    </div>
  );
}

/**
 * Admin Dashboard Page
 * 
 * Main admin dashboard displaying key platform metrics:
 * - Total users count
 * - Active galleries count
 * - Total storage used
 * - Plan distribution
 * - Recent activity
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
