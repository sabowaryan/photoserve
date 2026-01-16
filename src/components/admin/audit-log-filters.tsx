"use client";

import { useState, useEffect } from "react";
import { Calendar, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditLogFilters as AuditLogFiltersType, AuditActionType, AdminUser } from "@/types/admin";

interface AuditLogFiltersProps {
  filters: AuditLogFiltersType;
  onFiltersChange: (filters: AuditLogFiltersType) => void;
  admins: AdminUser[];
  isLoading?: boolean;
}

/**
 * Action type labels in French
 */
const ACTION_TYPE_LABELS: Record<AuditActionType, string> = {
  user_view: "Consultation utilisateur",
  user_update: "Modification utilisateur",
  user_suspend: "Suspension utilisateur",
  user_reactivate: "Réactivation utilisateur",
  gallery_view: "Consultation galerie",
  gallery_deactivate: "Désactivation galerie",
  gallery_delete: "Suppression galerie",
  subscription_update: "Modification abonnement",
  subscription_cancel: "Annulation abonnement",
  admin_login: "Connexion admin",
  settings_update: "Modification paramètres",
};

const ACTION_TYPES: AuditActionType[] = [
  "admin_login",
  "user_view",
  "user_update",
  "user_suspend",
  "user_reactivate",
  "gallery_view",
  "gallery_deactivate",
  "gallery_delete",
  "subscription_update",
  "subscription_cancel",
  "settings_update",
];

/**
 * Format date to YYYY-MM-DD for input fields
 */
function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

/**
 * Audit Log Filters Component
 * 
 * Provides filtering options for audit logs including admin, action type, and date range.
 * Requirements: 7.3
 */
export function AuditLogFilters({
  filters,
  onFiltersChange,
  admins,
  isLoading = false,
}: AuditLogFiltersProps) {
  const [localDateFrom, setLocalDateFrom] = useState(filters.dateFrom || "");
  const [localDateTo, setLocalDateTo] = useState(filters.dateTo || "");

  // Sync local state with props
  useEffect(() => {
    setLocalDateFrom(filters.dateFrom || "");
    setLocalDateTo(filters.dateTo || "");
  }, [filters.dateFrom, filters.dateTo]);

  const handleAdminChange = (value: string) => {
    onFiltersChange({
      ...filters,
      adminId: value === "all" ? undefined : value,
      page: 1,
    });
  };

  const handleActionTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      actionType: value === "all" ? undefined : (value as AuditActionType),
      page: 1,
    });
  };

  const handleDateApply = () => {
    if (localDateFrom && localDateTo && localDateFrom <= localDateTo) {
      onFiltersChange({
        ...filters,
        dateFrom: localDateFrom,
        dateTo: localDateTo,
        page: 1,
      });
    } else if (!localDateFrom && !localDateTo) {
      onFiltersChange({
        ...filters,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleDateApply();
    }
  };

  const handleClearFilters = () => {
    setLocalDateFrom("");
    setLocalDateTo("");
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const hasActiveFilters =
    filters.adminId ||
    filters.actionType ||
    filters.dateFrom ||
    filters.dateTo;

  // Quick date presets
  const applyPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    const fromStr = formatDateForInput(from);
    const toStr = formatDateForInput(to);
    
    setLocalDateFrom(fromStr);
    setLocalDateTo(toStr);
    onFiltersChange({
      ...filters,
      dateFrom: fromStr,
      dateTo: toStr,
      page: 1,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filtres</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Admin filter */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Administrateur
          </label>
          <Select
            value={filters.adminId || "all"}
            onValueChange={handleAdminChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les admins" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les admins</SelectItem>
              {admins.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.name || admin.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action type filter */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Type d&apos;action
          </label>
          <Select
            value={filters.actionType || "all"}
            onValueChange={handleActionTypeChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              {ACTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {ACTION_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date range */}
        <div className="flex-1 lg:flex-[2]">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Période
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <Input
                type="date"
                value={localDateFrom}
                onChange={(e) => setLocalDateFrom(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full"
                disabled={isLoading}
                placeholder="Du"
              />
              <span className="text-slate-400 shrink-0">-</span>
              <Input
                type="date"
                value={localDateTo}
                onChange={(e) => setLocalDateTo(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full"
                disabled={isLoading}
                placeholder="Au"
              />
            </div>
            <Button
              onClick={handleDateApply}
              disabled={isLoading}
              size="sm"
              variant="secondary"
            >
              OK
            </Button>
          </div>
        </div>
      </div>

      {/* Quick date presets */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500">Raccourcis :</span>
        <div className="flex gap-1">
          {[
            { label: "7j", days: 7 },
            { label: "30j", days: 30 },
            { label: "90j", days: 90 },
          ].map((preset) => (
            <button
              key={preset.days}
              onClick={() => applyPreset(preset.days)}
              disabled={isLoading}
              className="px-2 py-1 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
