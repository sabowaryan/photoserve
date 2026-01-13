"use client";

import { useState, useEffect, useCallback } from "react";
import { Image } from "lucide-react";
import { GalleryTable } from "@/components/admin/gallery-table";
import type { GalleryListItem, GalleryFilters, PaginatedResult } from "@/types/admin";

/**
 * Admin Galleries List Page
 * 
 * Displays a paginated list of galleries with search and filtering capabilities.
 * Requirements: 4.1, 4.2
 */
export default function AdminGalleriesPage() {
  const [galleries, setGalleries] = useState<GalleryListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GalleryFilters>({
    page: 1,
    limit: 20,
  });

  const fetchGalleries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.page) params.set("page", filters.page.toString());
      if (filters.limit) params.set("limit", filters.limit.toString());

      const response = await fetch(`/api/admin/galleries?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du chargement des galeries");
      }

      const result: PaginatedResult<GalleryListItem> = await response.json();
      setGalleries(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

  const handleFiltersChange = (newFilters: GalleryFilters) => {
    setFilters(newFilters);
  };

  if (error && galleries.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Galeries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérer les galeries de la plateforme
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-center">
          <p className="text-sm text-rose-700">{error}</p>
          <button
            onClick={fetchGalleries}
            className="mt-3 text-xs text-rose-600 hover:text-rose-800 underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Image className="h-4 w-4 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Galeries
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">
            Gérer les galeries de la plateforme
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-800">{total}</p>
          <p className="text-[10px] text-slate-500">galeries au total</p>
        </div>
      </div>

      {/* Gallery Table */}
      <GalleryTable
        galleries={galleries}
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
