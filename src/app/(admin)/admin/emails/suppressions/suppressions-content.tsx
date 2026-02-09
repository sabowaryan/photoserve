"use client";

import { useState } from "react";
import { SuppressionsStats } from "./suppressions-stats";
import { SuppressionsFilters } from "./suppressions-filters";
import { SuppressionsTable } from "./suppressions-table";
import { AddSuppressionDialog } from "./add-suppression-dialog";
import { RemoveSuppressionDialog } from "./remove-suppression-dialog";

import type { PaginatedSuppressions, SuppressionStats } from "@/lib/repositories/suppression.repository";
import type { Database } from "@/lib/supabase/types";

type SuppressionRow = Database['public']['Tables']['email_suppressions']['Row'];

interface SuppressionsContentProps {
  initialData: {
    suppressions: PaginatedSuppressions;
    stats: SuppressionStats;
  };
}

/**
 * Suppressions Content Component
 * 
 * Client-side wrapper that manages state for suppressions
 * and coordinates filtering, searching, and bulk actions
 * 
 * Requirements: 8.7, 8.8
 */
export function SuppressionsContent({ initialData }: SuppressionsContentProps) {
  const [data, setData] = useState<PaginatedSuppressions>(initialData.suppressions);
  const [stats, setStats] = useState<SuppressionStats>(initialData.stats);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [bounceTypeFilter, setBounceTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [suppressionToRemove, setSuppressionToRemove] = useState<SuppressionRow | null>(null);

  /**
   * Fetch suppressions with current filters
   */
  const fetchSuppressions = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "20");

      if (reasonFilter !== "all") {
        params.set("reason", reasonFilter);
      }

      if (bounceTypeFilter !== "all") {
        params.set("bounceType", bounceTypeFilter);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const response = await fetch(`/api/emails/suppressions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch suppressions");
      }

      const result = await response.json();
      setData(result);
      setSelectedIds([]); // Clear selection when data changes
    } catch (error) {
      console.error("Error fetching suppressions:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch stats
   */
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/emails/suppressions/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const result = await response.json();
      setStats(result);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (
    reason: string,
    bounceType: string,
    search: string
  ) => {
    setReasonFilter(reason);
    setBounceTypeFilter(bounceType);
    setSearchQuery(search);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    fetchSuppressions(page);
  };

  /**
   * Handle add suppression
   */
  const handleAddSuppression = async (email: string, reason: string, bounceType?: string) => {
    try {
      const response = await fetch("/api/emails/suppressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason, bounceType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add suppression");
      }

      // Refresh data
      await Promise.all([fetchSuppressions(data.page), fetchStats()]);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding suppression:", error);
      throw error;
    }
  };

  /**
   * Handle remove single suppression
   */
  const handleRemoveSingle = async (suppression: SuppressionRow) => {
    setSuppressionToRemove(suppression);
    setIsRemoveDialogOpen(true);
  };

  /**
   * Handle remove selected suppressions (bulk)
   */
  const handleRemoveSelected = () => {
    if (selectedIds.length === 0) return;
    setSuppressionToRemove(null);
    setIsRemoveDialogOpen(true);
  };

  /**
   * Confirm removal
   */
  const confirmRemoval = async () => {
    try {
      if (suppressionToRemove) {
        // Remove single suppression
        const response = await fetch(`/api/emails/suppressions/${suppressionToRemove.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to remove suppression");
        }
      } else if (selectedIds.length > 0) {
        // Bulk remove
        const response = await fetch("/api/emails/suppressions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove suppressions");
        }
      }

      // Refresh data
      await Promise.all([fetchSuppressions(data.page), fetchStats()]);
      setIsRemoveDialogOpen(false);
      setSuppressionToRemove(null);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error removing suppression:", error);
      throw error;
    }
  };

  /**
   * Handle selection change
   */
  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Email Suppressions
        </h1>
        <p className="text-slate-500 mt-0.5 text-sm">
          Manage bounced and complained email addresses
        </p>
      </div>

      {/* Stats */}
      <SuppressionsStats stats={stats} />

      {/* Filters */}
      <SuppressionsFilters
        reasonFilter={reasonFilter}
        bounceTypeFilter={bounceTypeFilter}
        searchQuery={searchQuery}
        onFilterChange={handleFilterChange}
        onApplyFilters={() => fetchSuppressions(1)}
        onAddSuppression={() => setIsAddDialogOpen(true)}
        onRemoveSelected={handleRemoveSelected}
        selectedCount={selectedIds.length}
        totalCount={data.total}
      />

      {/* Suppressions Table */}
      <SuppressionsTable
        suppressions={data.suppressions}
        currentPage={data.page}
        totalPages={data.totalPages}
        loading={loading}
        selectedIds={selectedIds}
        onPageChange={handlePageChange}
        onSelectionChange={handleSelectionChange}
        onRemove={handleRemoveSingle}
      />

      {/* Add Suppression Dialog */}
      <AddSuppressionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddSuppression}
      />

      {/* Remove Suppression Dialog */}
      <RemoveSuppressionDialog
        isOpen={isRemoveDialogOpen}
        onClose={() => {
          setIsRemoveDialogOpen(false);
          setSuppressionToRemove(null);
        }}
        onConfirm={confirmRemoval}
        suppression={suppressionToRemove}
        count={selectedIds.length}
      />
    </div>
  );
}