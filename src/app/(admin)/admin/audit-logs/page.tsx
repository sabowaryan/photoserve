"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Shield, Activity } from "lucide-react";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { AuditLogFilters } from "@/components/admin/audit-log-filters";
import type { AuditLogWithAdmin, AuditLogFilters as AuditLogFiltersType, AdminUser } from "@/types/admin";

/**
 * Admin Audit Logs Page
 * 
 * Displays a list of all audit logs with filtering and pagination.
 * Requirements: 7.1, 7.2, 7.3
 */
export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogWithAdmin[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFiltersType>({
    page: 1,
    limit: 20,
  });

  // Fetch admin users for filter dropdown
  const fetchAdmins = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users?limit=100&status=active");
      if (response.ok) {
        const data = await response.json();
        // Filter to only admin users
        const adminUsers = (data.users || []).filter((u: AdminUser & { is_admin?: boolean }) => u.is_admin);
        setAdmins(adminUsers);
      }
    } catch {
      // Silently fail - admins filter will just be empty
    }
  }, []);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (filters.adminId) params.set("adminId", filters.adminId);
      if (filters.actionType) params.set("actionType", filters.actionType);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.page) params.set("page", filters.page.toString());
      if (filters.limit) params.set("limit", filters.limit.toString());

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du chargement des logs");
      }

      const data = await response.json();
      setLogs(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFiltersChange = (newFilters: AuditLogFiltersType) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Calculate stats from current data
  const stats = {
    total: total,
    today: logs.filter((log) => {
      const logDate = new Date(log.created_at).toDateString();
      const today = new Date().toDateString();
      return logDate === today;
    }).length,
    modifications: logs.filter((log) => 
      log.action_type.includes("update") || 
      log.action_type.includes("delete") || 
      log.action_type.includes("suspend") ||
      log.action_type.includes("cancel") ||
      log.action_type.includes("deactivate")
    ).length,
  };

  if (error && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Journal d&apos;audit
          </h1>
          <p className="text-slate-500 mt-1">
            Historique des actions administratives
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <p className="text-rose-700">{error}</p>
          <button
            onClick={fetchLogs}
            className="mt-4 text-sm text-rose-600 hover:text-rose-800 underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl">
              <FileText className="h-6 w-6 text-slate-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Journal d&apos;audit
            </h1>
          </div>
          <p className="text-slate-500 mt-1 ml-12">
            Historique des actions administratives
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FileText className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-sm text-slate-500">Total entrées</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Shield className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.today}</p>
              <p className="text-sm text-slate-500">Aujourd&apos;hui</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Activity className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.modifications}</p>
              <p className="text-sm text-slate-500">Modifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AuditLogFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        admins={admins}
        isLoading={isLoading}
      />

      {/* Table */}
      <AuditLogTable
        logs={logs}
        total={total}
        page={filters.page || 1}
        limit={filters.limit || 20}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
