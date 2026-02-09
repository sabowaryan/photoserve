import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { SenderManagementContent } from "./sender-management-content";

/**
 * Loading skeleton for sender management page
 */
function SenderManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-64 mb-1.5" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

/**
 * Fetch sender addresses from database
 */
async function getSenderAddresses() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("sender_addresses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sender addresses:", error);
    return [];
  }

  return data || [];
}

/**
 * Sender management content component
 */
async function SenderManagementWrapper() {
  const senders = await getSenderAddresses();

  return <SenderManagementContent initialSenders={senders} />;
}

/**
 * Sender Address Management Page
 * 
 * Allows admins to:
 * - View all sender addresses with status badges
 * - Add new sender addresses
 * - View domain verification instructions
 * - Set default sender
 * - Delete sender addresses (with validation)
 * 
 * Requirements: 6.4, 6.5, 6.6
 */
export default function SenderManagementPage() {
  return (
    <Suspense fallback={<SenderManagementSkeleton />}>
      <SenderManagementWrapper />
    </Suspense>
  );
}
