"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type EmailTemplate = Database["public"]["Tables"]["email_templates"]["Row"];

interface DeleteTemplateDialogProps {
  template: EmailTemplate;
  onClose: () => void;
  onDeleted: (templateId: string) => void;
}

/**
 * Delete Template Dialog Component
 * 
 * Confirms template deletion (soft delete)
 * 
 * Requirements: 7.2
 */
export function DeleteTemplateDialog({
  template,
  onClose,
  onDeleted,
}: DeleteTemplateDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle template deletion
   */
  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/emails/templates/${template.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete template");
      }

      onDeleted(template.id);
      onClose();
    } catch (err) {
      console.error("Error deleting template:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete template"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Delete Template
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-600 mb-4">
            Are you sure you want to delete the template{" "}
            <span className="font-semibold">{template.name}</span>? This will
            mark the template as inactive and it will no longer be available for
            use.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete Template"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
