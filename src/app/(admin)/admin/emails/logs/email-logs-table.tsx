"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import type { EmailLogWithEvents } from "@/lib/repositories/email-log.repository";

interface EmailLogsTableProps {
  logs: EmailLogWithEvents[];
  currentPage: number;
  totalPages: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  loading: boolean;
  onPageChange: (page: number) => void;
  onSortChange: (column: string) => void;
  onViewDetails: (logId: string) => void;
  onRetry: (logId: string) => void;
}

/**
 * Get status badge variant and label
 */
function getStatusBadge(log: EmailLogWithEvents) {
  if (log.failed_at) {
    return { variant: "destructive" as const, label: "Failed" };
  }
  if (log.bounced_at) {
    return { variant: "destructive" as const, label: "Bounced" };
  }
  if (log.complained_at) {
    return { variant: "destructive" as const, label: "Complained" };
  }
  if (log.clicked_at) {
    return { variant: "default" as const, label: "Clicked" };
  }
  if (log.opened_at) {
    return { variant: "default" as const, label: "Opened" };
  }
  if (log.delivered_at) {
    return { variant: "secondary" as const, label: "Delivered" };
  }
  if (log.sent_at) {
    return { variant: "secondary" as const, label: "Sent" };
  }
  return { variant: "outline" as const, label: "Queued" };
}

/**
 * Format date for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Email Logs Table Component
 * 
 * Displays email logs in a sortable table with pagination
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
export function EmailLogsTable({
  logs,
  currentPage,
  totalPages,
  sortBy,
  sortOrder,
  loading,
  onPageChange,
  onSortChange,
  onViewDetails,
  onRetry,
}: EmailLogsTableProps) {
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400" />;
    }
    return (
      <ArrowUpDown
        className={`h-3 w-3 ${sortOrder === "asc" ? "rotate-180" : ""} text-blue-600`}
      />
    );
  };

  if (loading && logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Loading email logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-sm text-slate-500">No email logs found</p>
        <p className="text-xs text-slate-400 mt-1">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onSortChange("created_at")}
              >
                <div className="flex items-center gap-1">
                  Date {renderSortIcon("created_at")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onSortChange("to_address")}
              >
                <div className="flex items-center gap-1">
                  Recipient {renderSortIcon("to_address")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onSortChange("from_address")}
              >
                <div className="flex items-center gap-1">
                  Sender {renderSortIcon("from_address")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onSortChange("subject")}
              >
                <div className="flex items-center gap-1">
                  Subject {renderSortIcon("subject")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onSortChange("status")}
              >
                <div className="flex items-center gap-1">
                  Status {renderSortIcon("status")}
                </div>
              </TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const statusBadge = getStatusBadge(log);
              const canRetry = log.failed_at !== null;

              return (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-800">
                    {log.to_address}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {log.from_address}
                  </TableCell>
                  <TableCell className="text-xs text-slate-800 max-w-xs truncate">
                    {log.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 capitalize">
                    {log.provider}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(log.id)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canRetry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRetry(log.id)}
                          title="Retry failed email"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
