"use client";

import { useState, useMemo } from "react";
import { TemplateFilters } from "./template-filters";
import { TemplateTable } from "./template-table";
import type { Database } from "@/lib/supabase/types";

type EmailTemplate = Database["public"]["Tables"]["email_templates"]["Row"];

interface TemplateListContentProps {
  initialTemplates: EmailTemplate[];
}

/**
 * Template List Content Component
 * 
 * Client-side wrapper that manages state for email templates
 * and coordinates filtering, searching, and pagination
 * 
 * Requirements: 7.1, 7.2
 */
export function TemplateListContent({
  initialTemplates,
}: TemplateListContentProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 20;

  /**
   * Filter and search templates
   */
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((t) => t.is_active === true);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((t) => t.is_active === false);
      }
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.subject.toLowerCase().includes(query) ||
          t.slug.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [templates, typeFilter, statusFilter, searchQuery]);

  /**
   * Paginate filtered templates
   */
  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTemplates.slice(startIndex, endIndex);
  }, [filteredTemplates, currentPage]);

  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE);

  /**
   * Handle template deleted
   */
  const handleTemplateDeleted = (templateId: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, is_active: false } : t))
    );
  };

  /**
   * Handle template duplicated
   */
  const handleTemplateDuplicated = (newTemplate: EmailTemplate) => {
    setTemplates((prev) => [newTemplate, ...prev]);
    setCurrentPage(1); // Reset to first page to show new template
  };

  /**
   * Reset to first page when filters change
   */
  const handleFilterChange = (
    type: string,
    status: string,
    search: string
  ) => {
    setTypeFilter(type);
    setStatusFilter(status);
    setSearchQuery(search);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Email Templates
        </h1>
        <p className="text-slate-500 mt-0.5 text-sm">
          Manage email templates for transactional and marketing emails
        </p>
      </div>

      {/* Filters */}
      <TemplateFilters
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onFilterChange={handleFilterChange}
        totalCount={filteredTemplates.length}
      />

      {/* Template Table */}
      <TemplateTable
        templates={paginatedTemplates}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onTemplateDeleted={handleTemplateDeleted}
        onTemplateDuplicated={handleTemplateDuplicated}
      />
    </div>
  );
}
