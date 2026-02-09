"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Upload,
  Loader2,
  Braces,
} from "lucide-react";
import Link from "next/link";
import { EmailEditor } from "./email-editor";
import { VariableInserter } from "./variable-inserter";
import { VersionHistory } from "./version-history";
import { VersionComparison } from "./version-comparison";
import type { Database } from "@/lib/supabase/types";

type TemplateRow = Database["public"]["Tables"]["email_templates"]["Row"];

interface TemplateEditorContentProps {
  mode: "create" | "edit";
  template?: TemplateRow;
}

/**
 * Template Editor Content Component
 * 
 * Main component for creating and editing email templates.
 * Integrates the WYSIWYG editor with template settings.
 * 
 * Requirements: 7.3, 7.4, 7.5
 */
export function TemplateEditorContent({
  mode,
  template,
}: TemplateEditorContentProps) {
  const router = useRouter();
  const emailEditorRef = useRef<any>(null);

  // Form state
  const [name, setName] = useState(template?.name || "");
  const [slug, setSlug] = useState(template?.slug || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [type, setType] = useState<"transactional" | "marketing">(
    (template?.type as "transactional" | "marketing") || "transactional"
  );
  const [variables, setVariables] = useState<string[]>(
    Array.isArray(template?.variables) 
      ? (template.variables as string[]).filter((v): v is string => typeof v === 'string')
      : []
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showVariableInserter, setShowVariableInserter] = useState(false);

  /**
   * Auto-generate slug from name
   */
  const handleNameChange = (value: string) => {
    setName(value);
    if (mode === "create") {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  };

  /**
   * Export design from email editor
   */
  const exportHtml = useCallback(
    () =>
      new Promise<{ html: string; design: any }>((resolve, reject) => {
        if (!emailEditorRef.current) {
          reject(new Error("Email editor not initialized"));
          return;
        }

        emailEditorRef.current.exportHtml((data: any) => {
          const { design, html } = data;
          resolve({ html, design });
        });
      }),
    []
  );

  /**
   * Save template as draft
   */
  const handleSaveDraft = async () => {
    if (!name || !slug || !subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);

    try {
      const { html, design } = await exportHtml();

      const templateData = {
        name,
        slug,
        subject,
        type,
        source: "custom" as const,
        content: { html, design },
        variables,
        is_active: template?.is_active ?? false,
      };

      const url =
        mode === "create"
          ? "/api/emails/templates"
          : `/api/emails/templates/${template?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save template");
      }

      const result = await response.json();

      toast.success(
        mode === "create"
          ? "Template created successfully"
          : "Template saved successfully"
      );

      if (mode === "create") {
        router.push(`/admin/emails/templates/${result.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save template"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Publish template (save and activate)
   */
  const handlePublish = async () => {
    if (!name || !slug || !subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsPublishing(true);

    try {
      const { html, design } = await exportHtml();

      const templateData = {
        name,
        slug,
        subject,
        type,
        source: "custom" as const,
        content: { html, design },
        variables,
        is_active: true,
      };

      const url =
        mode === "create"
          ? "/api/emails/templates"
          : `/api/emails/templates/${template?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to publish template");
      }

      const result = await response.json();

      toast.success("Template published successfully");

      if (mode === "create") {
        router.push(`/admin/emails/templates/${result.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error publishing template:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to publish template"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * Insert variable into editor
   */
  const handleInsertVariable = (variable: string) => {
    if (!variables.includes(variable)) {
      setVariables([...variables, variable]);
    }
    setShowVariableInserter(false);
    toast.success(`Variable {{${variable}}} added to template`);
  };

  /**
   * Remove variable from list
   */
  const handleRemoveVariable = (variable: string) => {
    setVariables(variables.filter((v) => v !== variable));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <Link href="/admin/emails/templates">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-slate-900">
              {mode === "create" ? "Create Email Template" : "Edit Email Template"}
            </h1>
          </div>
          <p className="text-sm text-slate-600 ml-11">
            {mode === "create"
              ? "Design a new email template using the drag-and-drop editor"
              : "Update your email template design and settings"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {mode === "edit" && template && (
            <>
              <VersionHistory
                templateId={template.id}
                currentVersion={template.active_version ?? 1}
                onVersionChange={() => router.refresh()}
              />
              <VersionComparison
                templateId={template.id}
                currentVersion={template.active_version ?? 1}
              />
            </>
          )}
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Draft
              </>
            )}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isSaving || isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Template Settings */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Template Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Welcome Email"
                required
              />
            </div>

            {/* Template Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Template Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., welcome-email"
                required
                disabled={mode === "edit"}
              />
              {mode === "edit" && (
                <p className="text-xs text-slate-500">
                  Slug cannot be changed after creation
                </p>
              )}
            </div>

            {/* Subject Line */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="subject">
                Subject Line <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Welcome to {{appName}}!"
                required
              />
              <p className="text-xs text-slate-500">
                Use {"{{"} and {"}"} for variables, e.g., {"{{photographerName}}"}
              </p>
            </div>

            {/* Template Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Template Type <span className="text-red-500">*</span>
              </Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {type === "transactional"
                  ? "Sent automatically based on user actions"
                  : "Promotional emails sent to multiple recipients"}
              </p>
            </div>

            {/* Variables */}
            <div className="space-y-2">
              <Label>Template Variables</Label>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-slate-200 rounded-md">
                {variables.length === 0 ? (
                  <span className="text-sm text-slate-400">
                    No variables added yet
                  </span>
                ) : (
                  variables.map((variable) => (
                    <Badge
                      key={variable}
                      variant="secondary"
                      className="cursor-pointer hover:bg-slate-200"
                      onClick={() => handleRemoveVariable(variable)}
                    >
                      <Braces className="h-3 w-3 mr-1" />
                      {variable}
                      <span className="ml-1 text-xs">×</span>
                    </Badge>
                  ))
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowVariableInserter(true)}
                className="mt-2"
              >
                <Braces className="h-4 w-4" />
                Add Variable
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Editor */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">
            Email Design
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Drag and drop components to build your email template
          </p>
        </div>
        <EmailEditor
          ref={emailEditorRef}
          initialDesign={
            template?.content && typeof template.content === "object"
              ? (template.content as any).design
              : undefined
          }
        />
      </div>

      {/* Variable Inserter Modal */}
      {showVariableInserter && (
        <VariableInserter
          onInsert={handleInsertVariable}
          onClose={() => setShowVariableInserter(false)}
          existingVariables={variables}
        />
      )}
    </div>
  );
}
