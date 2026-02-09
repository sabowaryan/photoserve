import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateListContent } from "./template-list-content";

/**
 * Loading skeleton for template list page
 */
function TemplateListSkeleton() {
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
 * Fetch email templates from database
 */
async function getEmailTemplates() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching email templates:", error);
    return [];
  }

  return data || [];
}

/**
 * Template list content component
 */
async function TemplateListWrapper() {
  const templates = await getEmailTemplates();

  return <TemplateListContent initialTemplates={templates} />;
}

/**
 * Email Template List Page
 * 
 * Allows admins to:
 * - View all email templates with filters (type, status)
 * - Search templates by name or subject
 * - View template type badges (transactional, marketing)
 * - View template status indicators (draft, published)
 * - Perform template actions (edit, preview, delete, duplicate)
 * - Navigate through paginated results (20 per page)
 * 
 * Requirements: 7.1, 7.2
 */
export default function EmailTemplatesPage() {
  return (
    <Suspense fallback={<TemplateListSkeleton />}>
      <TemplateListWrapper />
    </Suspense>
  );
}
