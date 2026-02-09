"use client";

import { useState } from "react";
import { EmailLogsFilters } from "./email-logs-filters";
import { EmailLogsTable } from "./email-logs-table";
import { EmailDetailModal } from "./email-detail-modal";
import type { PaginatedEmailLogs, EmailLogWithEvents } from "@/lib/repositories/email-log.repository";

interface EmailLogsContentProps {
  initialData: PaginatedEmailLogs;
}

/**
 * Email Logs Content Component
 * 
 * Client-side wrapper that manages state for email logs
 * and coordinates filtering, searching, sorting, and pagination
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
export function EmailLogsContent({ initialData }: EmailLogsContentProps) {
  const [data, setData] = useState<PaginatedEmailLogs>(initialData);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLogWithEvents | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"recipient" | "sender">("recipient");

  // Sorting states
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  /**
   * Fetch logs with current filters
   */
  const fetchLogs = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "20");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (dateRange !== "all") {
        const days = parseInt(dateRange);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        params.set("dateFrom", dateFrom.toISOString());
      }

      if (searchQuery.trim()) {
        params.set(searchType, searchQuery.trim());
      }

      const response = await fetch(`/api/emails/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (
    status: string,
    range: string,
    search: string,
    type: "recipient" | "sender"
  ) => {
    setStatusFilter(status);
    setDateRange(range);
    setSearchQuery(search);
    setSearchType(type);
    // Fetch will be triggered by useEffect or manual button click
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  /**
   * Handle view log details
   */
  const handleViewDetails = async (logId: string) => {
    try {
      const response = await fetch(`/api/emails/logs/${logId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch log details");
      }

      const log = await response.json();
      setSelectedLog(log);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Error fetching log details:", error);
    }
  };

  /**
   * Handle retry failed email
   */
  const handleRetry = async (logId: string) => {
    try {
      const response = await fetch(`/api/emails/logs/${logId}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to retry email");
      }

      // Refresh the logs
      await fetchLogs(data.page);
    } catch (error) {
      console.error("Error retrying email:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Email Logs
        </h1>
        <p className="text-slate-500 mt-0.5 text-sm">
          View and manage all email delivery logs with detailed tracking
        </p>
      </div>

      {/* Filters */}
      <EmailLogsFilters
        statusFilter={statusFilter}
        dateRange={dateRange}
        searchQuery={searchQuery}
        searchType={searchType}
        onFilterChange={handleFilterChange}
        onApplyFilters={() => fetchLogs(1)}
        totalCount={data.total}
      />

      {/* Logs Table */}
      <EmailLogsTable
        logs={data.logs}
        currentPage={data.page}
        totalPages={data.totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onViewDetails={handleViewDetails}
        onRetry={handleRetry}
      />

      {/* Detail Modal */}
      {selectedLog && (
        <EmailDetailModal
          log={selectedLog}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedLog(null);
          }}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
