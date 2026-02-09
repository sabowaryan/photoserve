"use client";

import { Trash2, AlertTriangle, XCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/lib/supabase/types";

type SuppressionRow = Database['public']['Tables']['email_suppressions']['Row'];

interface SuppressionsTableProps {
  suppressions: SuppressionRow[];
  currentPage: number;
  totalPages: number;
  loading: boolean;
  selectedIds: string[];
  onPageChange: (page: number) => void;
  onSelectionChange: (ids: string[]) => void;
  onRemove: (suppression: SuppressionRow) => void;
}

/**
 * Suppressions Table Component
 * 
 * Displays suppressions in a table with selection and actions
 * 
 * Requirements: 8.7, 8.8
 */
export function SuppressionsTable({
  suppressions,
  currentPage,
  totalPages,
  loading,
  selectedIds,
  onPageChange,
  onSelectionChange,
  onRemove,
}: SuppressionsTableProps) {
  const allSelected = suppressions.length > 0 && selectedIds.length === suppressions.length;

  /**
   * Toggle all selections
   */
  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(suppressions.map(s => s.id));
    }
  };

  /**
   * Toggle single selection
   */
  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Get reason badge
   */
  const getReasonBadge = (reason: string, bounceType: string | null) => {
    if (reason === "bounce") {
      if (bounceType === "hard") {
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            Hard Bounce
          </Badge>
        );
      } else if (bounceType === "soft") {
        return (
          <Badge className="flex items-center gap-1 w-fit bg-orange-100 text-orange-700 border-orange-200">
            <AlertTriangle className="w-3 h-3" />
            Soft Bounce
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" />
            Bounce
          </Badge>
        );
      }
    } else if (reason === "complaint") {
      return (
        <Badge className="flex items-center gap-1 w-fit bg-purple-100 text-purple-700 border-purple-200">
          <ShieldAlert className="w-3 h-3" />
          Complaint
        </Badge>
      );
    }
    return <Badge variant="outline">{reason}</Badge>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="text-center text-slate-500">Loading suppressions...</div>
      </div>
    );
  }

  if (suppressions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="text-center text-slate-500">
          No suppressions found. All email addresses are clear!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                First Occurred
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Last Occurred
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {suppressions.map((suppression) => (
              <tr
                key={suppression.id}
                className={`hover:bg-slate-50 transition-colors ${
                  selectedIds.includes(suppression.id) ? "bg-blue-50" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <Checkbox
                    checked={selectedIds.includes(suppression.id)}
                    onCheckedChange={() => handleSelectOne(suppression.id)}
                    aria-label={`Select ${suppression.email}`}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-800">
                    {suppression.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getReasonBadge(suppression.reason, suppression.bounce_type)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600">
                    {suppression.count || 1}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600">
                    {formatDate(suppression.first_occurred_at)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600">
                    {formatDate(suppression.last_occurred_at)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(suppression)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
