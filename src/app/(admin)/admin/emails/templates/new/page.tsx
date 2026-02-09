import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateEditorContent } from "../template-editor-content";

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
 * New Email Template Page
 * 
 * Allows admins to create a new email template using the WYSIWYG editor.
 * 
 * Features:
 * - Template settings form (name, subject, type, category)
 * - Drag-and-drop WYSIWYG editor
 * - Variable insertion UI
 * - Save draft and publish functionality
 * 
 * Requirements: 7.3, 7.4, 7.5
 */
export default function NewTemplatePage() {
  return (
    <Suspense fallback={<TemplateEditorSkeleton />}>
      <TemplateEditorContent mode="create" />
    </Suspense>
  );
}
