"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, User, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserListItem, UserFilters } from "@/types/admin";
import type { SubscriptionPlan } from "@/types/index";

interface UserTableProps {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  isLoading?: boolean;
}

/**
 * Format storage size for display
 */
function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
}

/**
 * Get badge variant for subscription plan
 */
function getPlanBadgeClass(plan: SubscriptionPlan): string {
  switch (plan) {
    case "pro":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "premium":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

/**
 * Get badge variant for user status
 */
function getStatusBadgeClass(isSuspended: boolean): string {
  return isSuspended
    ? "bg-rose-100 text-rose-700 border-rose-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";
}

/**
 * User Table Component
 * 
 * Displays a list of users with search, filtering, and pagination.
 * Requirements: 3.1, 3.2
 */
export function UserTable({
  users,
  total,
  page,
  limit,
  totalPages,
  filters,
  onFiltersChange,
  isLoading = false,
}: UserTableProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  const handleSearch = () => {
    onFiltersChange({ ...filters, search: searchValue || undefined, page: 1 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePlanChange = (value: string) => {
    onFiltersChange({
      ...filters,
      plan: value === "all" ? undefined : (value as SubscriptionPlan),
      page: 1,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : (value as "active" | "suspended"),
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par email ou nom..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            Rechercher
          </Button>
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.plan || "all"}
            onValueChange={handlePlanChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Stockage
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Galeries
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Inscription
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          {user.is_admin ? (
                            <Shield className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <User className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {user.name || "Sans nom"}
                          </p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={getPlanBadgeClass(user.subscription_plan)}
                      >
                        {user.subscription_plan.charAt(0).toUpperCase() +
                          user.subscription_plan.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium text-slate-800">
                          {formatStorage(user.storage_used_mb)}
                        </span>
                        <span className="text-slate-400">
                          {" / "}
                          {formatStorage(user.storage_limit_mb)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              (user.storage_used_mb / user.storage_limit_mb) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-800 font-medium">
                        {user.gallery_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={getStatusBadgeClass(user.is_suspended)}
                      >
                        {user.is_suspended ? "Suspendu" : "Actif"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(user.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Affichage de {(page - 1) * limit + 1} à{" "}
            {Math.min(page * limit, total)} sur {total} utilisateurs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <span className="text-sm text-slate-600 px-2">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
