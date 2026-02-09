import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { createSuppressionRepository } from "@/lib/repositories/suppression.repository";
import { Skeleton } from "@/components/ui/skeleton";
import { SuppressionsContent } from "./suppressions-content";

/**
 * Loading skeleton for suppressions page
 */
function SuppressionsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-64 mb-1.5" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

/**
 * Fetch initial suppressions data
 */
async function getInitialData() {
  const supabase = createAdminClient();
  const repository = createSuppressionRepository(supabase);

  try {
    const [suppressions, stats] = await Promise.all([
      repository.listSuppressions(undefined, 1, 20, 'last_occurred_at', 'desc'),
      repository.getStats(),
    ]);

    return { suppressions, stats };
  } catch (error) {
    console.error("Error fetching suppressions:", error);
    return {
      suppressions: {
        suppressions: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      },
      stats: {
        total: 0,
        bounces: 0,
        hardBounces: 0,
        softBounces: 0,
        complaints: 0,
      },
    };
  }
}

/**
 * Suppressions content wrapper
 */
async function SuppressionsWrapper() {
  const initialData = await getInitialData();

  return <SuppressionsContent initialData={initialData} />;
}

/**
 * Email Suppressions Page
 * 
 * Allows admins to:
 * - View all suppressed email addresses (bounces and complaints)
 * - Filter by reason (bounce/complaint) and bounce type (hard/soft)
 * - Search for specific email addresses
 * - Add manual suppressions
 * - Remove suppressions with confirmation
 * - Bulk remove multiple suppressions
 * - View suppression statistics
 * 
 * Requirements: 8.7, 8.8
 */
export default function SuppressionsPage() {
  return (
    <Suspense fallback={<SuppressionsSkeleton />}>
      <SuppressionsWrapper />
    </Suspense>
  );
}
