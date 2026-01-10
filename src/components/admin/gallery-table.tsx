"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Image, Calendar, Eye } from "lucide-react";
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
import type { GalleryListItem, GalleryFilters } from "@/types/admin";

interface GalleryTableProps {
  galleries: GalleryListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: GalleryFilters;
  onFiltersChange: (filters: GalleryFilters) => void;
  isLoading?: boolean;
}

/**
 * Get badge class for gallery status
 */
function getStatusBadgeClass(isActive: boolean, expiresAt: string): string {
  const isExpired = new Date(expiresAt) < new Date();
  
  if (!isActive) {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }
  if (isExpired) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

/**
 * Get status label for gallery
 */
function getStatusLabel(isActive: boolean, expiresAt: string): string {
  const isExpired = new Date(expiresAt) < new Date();
  
  if (!isActive) {
    return "Inactive";
  }
  if (isExpired) {
    return "Expirée";
  }
  return "Active";
}

/**
 * Gallery Table Component
 * 
 * Displays a list of galleries with search, filtering, and pagination.
 * Requirements: 4.1, 4.2
 */
export function GalleryTable({
  galleries,
  total,
  page,
  limit,
  totalPages,
  filters,
  onFiltersChange,
  isLoading = false,
}: GalleryTableProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || "");
  const [dateTo, setDateTo] = useState(filters.dateTo || "");

  const handleSearch = () => {
    onFiltersChange({ 
      ...filters, 
      search: searchValue || undefined, 
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: 1 
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : (value as "active" | "expired" | "inactive"),
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  const handleClearFilters = () => {
    setSearchValue("");
    setDateFrom("");
    setDateTo("");
    onFiltersChange({ page: 1, limit: filters.limit });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par titre ou slug..."
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
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expirée</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Range Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex gap-2 items-center">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Input
              type="date"
              placeholder="Date début"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
            />
            <span className="text-slate-400">à</span>
            <Input
              type="date"
              placeholder="Date fin"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[160px]"
            />
          </div>
          {(filters.search || filters.status || filters.dateFrom || filters.dateTo) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Effacer les filtres
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Galerie
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Propriétaire
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Images
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Vues
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Création
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : galleries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Aucune galerie trouvée
                  </td>
                </tr>
              ) : (
                galleries.map((gallery) => (
                  <tr
                    key={gallery.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/galleries/${gallery.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Image className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {gallery.title}
                          </p>
                          <p className="text-sm text-slate-500">{gallery.unique_slug}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${gallery.owner_id}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-800">
                          {gallery.owner_name || "Sans nom"}
                        </p>
                        <p className="text-xs text-slate-500">{gallery.owner_email}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-800 font-medium">
                        {gallery.image_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Eye className="h-4 w-4" />
                        <span>{gallery.views_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={getStatusBadgeClass(gallery.is_active, gallery.expires_at)}
                      >
                        {getStatusLabel(gallery.is_active, gallery.expires_at)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(gallery.expires_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(gallery.created_at).toLocaleDateString("fr-FR", {
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
            {Math.min(page * limit, total)} sur {total} galeries
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
