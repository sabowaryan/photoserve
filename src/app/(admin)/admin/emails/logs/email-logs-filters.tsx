"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

interface EmailLogsFiltersProps {
  statusFilter: string;
  dateRange: string;
  searchQuery: string;
  searchType: "recipient" | "sender";
  onFilterChange: (
    status: string,
    range: string,
    search: string,
    type: "recipient" | "sender"
  ) => void;
  onApplyFilters: () => void;
  totalCount: number;
}

/**
 * Email Logs Filters Component
 * 
 * Provides filtering controls for email logs:
 * - Status filter (all, queued, sent, delivered, opened, clicked, bounced, failed)
 * - Date range picker (7, 30, 90 days, all)
 * - Search by recipient or sender
 * 
 * Requirements: 8.1, 8.2
 */
export function EmailLogsFilters({
  statusFilter,
  dateRange,
  searchQuery,
  searchType,
  onFilterChange,
  onApplyFilters,
  totalCount,
}: EmailLogsFiltersProps) {
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [localRange, setLocalRange] = useState(dateRange);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localSearchType, setLocalSearchType] = useState(searchType);

  const handleApply = () => {
    onFilterChange(localStatus, localRange, localSearch, localSearchType);
    onApplyFilters();
  };

  const handleReset = () => {
    setLocalStatus("all");
    setLocalRange("7");
    setLocalSearch("");
    setLocalSearchType("recipient");
    onFilterChange("all", "7", "", "recipient");
    onApplyFilters();
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-800">Filters</h2>
        <span className="text-xs text-slate-500 ml-auto">
          {totalCount} {totalCount === 1 ? "log" : "logs"} found
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Status
          </label>
          <select
            value={localStatus}
            onChange={(e) => setLocalStatus(e.target.value)}
            className="w-full h-10 px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="opened">Opened</option>
            <option value="clicked">Clicked</option>
            <option value="bounced">Bounced</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Date Range
          </label>
          <select
            value={localRange}
            onChange={(e) => setLocalRange(e.target.value)}
            className="w-full h-10 px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Search Type */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Search By
          </label>
          <select
            value={localSearchType}
            onChange={(e) => setLocalSearchType(e.target.value as "recipient" | "sender")}
            className="w-full h-10 px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recipient">Recipient</option>
            <option value="sender">Sender</option>
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Search Email
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder={`Search by ${localSearchType}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApply();
                }
              }}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <Button onClick={handleApply} size="sm">
          Apply Filters
        </Button>
        <Button onClick={handleReset} variant="outline" size="sm">
          Reset
        </Button>
      </div>
    </div>
  );
}
