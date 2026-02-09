"use client";

import { useState } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SuppressionsFiltersProps {
  reasonFilter: string;
  bounceTypeFilter: string;
  searchQuery: string;
  onFilterChange: (reason: string, bounceType: string, search: string) => void;
  onApplyFilters: () => void;
  onAddSuppression: () => void;
  onRemoveSelected: () => void;
  selectedCount: number;
  totalCount: number;
}

/**
 * Suppressions Filters Component
 * 
 * Provides filtering controls for suppressions list
 * 
 * Requirements: 8.7, 8.8
 */
export function SuppressionsFilters({
  reasonFilter,
  bounceTypeFilter,
  searchQuery,
  onFilterChange,
  onApplyFilters,
  onAddSuppression,
  onRemoveSelected,
  selectedCount,
  totalCount,
}: SuppressionsFiltersProps) {
  const [localReason, setLocalReason] = useState(reasonFilter);
  const [localBounceType, setLocalBounceType] = useState(bounceTypeFilter);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleApply = () => {
    onFilterChange(localReason, localBounceType, localSearch);
    onApplyFilters();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by email address..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
        </div>

        {/* Reason Filter */}
        <div className="w-full lg:w-48">
          <Select value={localReason} onValueChange={setLocalReason}>
            <SelectTrigger>
              <SelectValue placeholder="All Reasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              <SelectItem value="bounce">Bounces</SelectItem>
              <SelectItem value="complaint">Complaints</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bounce Type Filter */}
        <div className="w-full lg:w-48">
          <Select
            value={localBounceType}
            onValueChange={setLocalBounceType}
            disabled={localReason === "complaint"}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="hard">Hard Bounce</SelectItem>
              <SelectItem value="soft">Soft Bounce</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Apply Button */}
        <Button onClick={handleApply}>Apply Filters</Button>
      </div>

      {/* Actions Row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        <div className="text-sm text-slate-500">
          {selectedCount > 0 ? (
            <span>
              {selectedCount} of {totalCount} selected
            </span>
          ) : (
            <span>{totalCount} total suppressions</span>
          )}
        </div>

        <div className="flex gap-2">
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemoveSelected}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Selected ({selectedCount})
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onAddSuppression}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Suppression
          </Button>
        </div>
      </div>
    </div>
  );
}
