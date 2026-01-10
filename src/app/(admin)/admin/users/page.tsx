"use client";

import { useState, useEffect, useCallback } from "react";
import { Users } from "lucide-react";
import { UserTable } from "@/components/admin/user-table";
import type { UserListItem, UserFilters, PaginatedResult } from "@/types/admin";

/**
 * Admin Users List Page
 * 
 * Displays a paginated list of users with search and filtering capabilities.
 * Requirements: 3.1, 3.2
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.plan) params.set("plan", filters.plan);
      if (filters.status) params.set("status", filters.status);
      if (filters.page) params.set("page", filters.page.toString());
      if (filters.limit) params.set("limit", filters.limit.toString());

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du chargement des utilisateurs");
      }

      const result: PaginatedResult<UserListItem> = await response.json();
      setUsers(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
  };

  if (error && users.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Utilisateurs
          </h1>
          <p className="text-slate-500 mt-1">
            Gérer les comptes utilisateurs de la plateforme
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <p className="text-rose-700">{error}</p>
          <button
            onClick={fetchUsers}
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
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Utilisateurs
            </h1>
          </div>
          <p className="text-slate-500 mt-1 ml-12">
            Gérer les comptes utilisateurs de la plateforme
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-800">{total}</p>
          <p className="text-sm text-slate-500">utilisateurs au total</p>
        </div>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        total={total}
        page={filters.page || 1}
        limit={filters.limit || 20}
        totalPages={totalPages}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isLoading={isLoading}
      />
    </div>
  );
}
