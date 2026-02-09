"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Eye,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Mail,
} from "lucide-react";
import { TemplatePreviewModal } from "./template-preview-modal";
import { DeleteTemplateDialog } from "./delete-template-dialog";
import type { Database } from "@/lib/supabase/types";

type EmailTemplate = Database["public"]["Tables"]["email_templates"]["Row"];

interface TemplateTableProps {
  templates: EmailTemplate[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onTemplateDeleted: (templateId: string) => void;
  onTemplateDuplicated: (newTemplate: EmailTemplate) => void;
}

/**
 * Template Table Component
 * 
 * Displays email templates in a table with actions
 * 
 * Requirements: 7.1, 7.2
 */
export function TemplateTable({
  templates,
  currentPage,
  totalPages,
  onPageChange,
  onTemplateDeleted,
  onTemplateDuplicated,
}: TemplateTableProps) {
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [deleteTemplate, setDeleteTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  /**
   * Handle template duplication
   */
  const handleDuplicate = async (template: EmailTemplate) => {
    setDuplicatingId(template.id);
    try {
      const response = await fetch("/api/emails/templates/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate template");
      }

      const { template: newTemplate } = await response.json();
      onTemplateDuplicated(newTemplate);
    } catch (error) {
      console.error("Error duplicating template:", error);
      alert("Failed to duplicate template. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  /**
   * Get badge variant for template type
   */
  const getTypeBadgeVariant = (type: string) => {
    return type === "transactional" ? "default" : "secondary";
  };

  /**
   * Get badge variant for template status
   */
  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "outline";
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
        <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          No templates found
        </h3>
        <p className="text-slate-500 mb-6">
          Get started by creating your first email template
        </p>
        <Button asChild>
          <Link href="/admin/emails/templates/new">Create Template</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {templates.map((template) => (
                <tr
                  key={template.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">
                        {template.name}
                      </div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">
                        {template.subject}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={getTypeBadgeVariant(template.type)}
                      className="capitalize"
                    >
                      {template.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={getStatusBadgeVariant(template.is_active ?? true)}
                      className="capitalize"
                    >
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 capitalize">
                      {template.source.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      v{template.active_version || 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {formatDate(template.updated_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Preview Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                        title="Preview template"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        title="Edit template"
                      >
                        <Link href={`/admin/emails/templates/${template.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>

                      {/* Duplicate Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(template)}
                        disabled={duplicatingId === template.id}
                        title="Duplicate template"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTemplate(template)}
                        title="Delete template"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* Delete Dialog */}
      {deleteTemplate && (
        <DeleteTemplateDialog
          template={deleteTemplate}
          onClose={() => setDeleteTemplate(null)}
          onDeleted={onTemplateDeleted}
        />
      )}
    </>
  );
}
