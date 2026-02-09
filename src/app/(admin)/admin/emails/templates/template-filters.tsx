"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface TemplateFiltersProps {
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
  onFilterChange: (type: string, status: string, search: string) => void;
  totalCount: number;
}

/**
 * Template Filters Component
 * 
 * Provides search and filter controls for email templates
 * 
 * Requirements: 7.1, 7.2
 */
export function TemplateFilters({
  searchQuery,
  typeFilter,
  statusFilter,
  onFilterChange,
  totalCount,
}: TemplateFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange(typeFilter, statusFilter, value);
  };

  const handleTypeChange = (value: string) => {
    onFilterChange(value, statusFilter, searchQuery);
  };

  const handleStatusChange = (value: string) => {
    onFilterChange(typeFilter, value, searchQuery);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name or subject..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="transactional">Transactional</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="mt-3 text-sm text-slate-500">
        Showing {totalCount} {totalCount === 1 ? "template" : "templates"}
      </div>
    </div>
  );
}
