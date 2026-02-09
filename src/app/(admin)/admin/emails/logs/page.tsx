import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { createEmailLogRepository } from "@/lib/repositories/email-log.repository";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailLogsContent } from "./email-logs-content";

/**
 * Loading skeleton for email logs page
 */
function EmailLogsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-64 mb-1.5" />
        <Skeleton className="h-4 w-96" />
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
 * Fetch initial email logs data
 */
async function getInitialLogs() {
  const supabase = createAdminClient();
  const repository = createEmailLogRepository(supabase);

  try {
    const result = await repository.listLogs(
      undefined,
      1,
      20,
      'created_at',
      'desc'
    );
    return result;
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return {
      logs: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
  }
}

/**
 * Email logs content wrapper
 */
async function EmailLogsWrapper() {
  const initialData = await getInitialLogs();

  return <EmailLogsContent initialData={initialData} />;
}

/**
 * Email Logs Page
 * 
 * Allows admins to:
 * - View all email logs with sortable columns
 * - Filter by status (queued, sent, delivered, opened, clicked, bounced, failed)
 * - Filter by date range (last 7 days, 30 days, 90 days, custom)
 * - Search by recipient or sender email
 * - View email detail modal with full event history
 * - Retry failed emails
 * - Paginate and sort results
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
export default function EmailLogsPage() {
  return (
    <Suspense fallback={<EmailLogsSkeleton />}>
      <EmailLogsWrapper />
    </Suspense>
  );
}
