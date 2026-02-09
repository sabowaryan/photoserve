import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateEditorContent } from "../../template-editor-content";

/**
 * Loading skeleton for template editor
 */
function TemplateEditorSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-64 mb-1.5" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

/**
 * Fetch template data for editing
 */
async function getTemplate(id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Template editor wrapper component
 */
async function TemplateEditorWrapper({ id }: { id: string }) {
  const template = await getTemplate(id);

  if (!template) {
    notFound();
  }

  return <TemplateEditorContent mode="edit" template={template} />;
}

/**
 * Edit Email Template Page
 * 
 * Allows admins to edit an existing email template using the WYSIWYG editor.
 * 
 * Features:
 * - Load existing template data
 * - Template settings form (name, subject, type, category)
 * - Drag-and-drop WYSIWYG editor
 * - Variable insertion UI
 * - Save draft and publish functionality
 * - Version history
 * 
 * Requirements: 7.3, 7.4, 7.5
 */
export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<TemplateEditorSkeleton />}>
      <TemplateEditorWrapper id={id} />
    </Suspense>
  );
}
