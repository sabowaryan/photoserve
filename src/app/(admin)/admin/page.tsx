import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { createAdminService } from "@/lib/services/admin.service";
import { AdminStatsCard } from "@/components/admin/stats-card";
import { PlanDistributionChart } from "@/components/admin/plan-distribution-chart";
import { RecentActivity } from "@/components/admin/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

/**
 * Loading skeleton for the dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-slate-500 mt-1">
          Vue d'ensemble de la plateforme PikSend
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
