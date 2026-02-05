"use client";

import { useState } from "react";
import { Download, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface PluginVersion {
  id: string;
  version: string;
  fileUrl: string;
  fileSize: number;
  changelog: string;
  isStable: boolean;
  minLightroomVersion: string;
  releaseDate: string;
  downloadCount: number;
  createdAt: string;
}

interface PluginVersionsTableProps {
  versions: PluginVersion[];
  isLoading?: boolean;
  onToggleStability?: (versionId: string, currentStability: boolean) => Promise<void>;
  onDelete?: (versionId: string) => Promise<void>;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Plugin Versions Table Component
 * 
 * Displays all plugin versions with actions to edit, mark stable/unstable, and delete.
 * Requirements: 10.1, 10.7, 10.10
 */
export function PluginVersionsTable({
  versions,
  isLoading = false,
  onToggleStability,
  onDelete,
}: PluginVersionsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleDeleteClick = (versionId: string) => {
    setVersionToDelete(versionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!versionToDelete || !onDelete) return;

    setActionLoading(versionToDelete);
    try {
      await onDelete(versionToDelete);
      setDeleteDialogOpen(false);
      setVersionToDelete(null);
    } catch (error) {
      console.error("Failed to delete version:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStability = async (versionId: string, currentStability: boolean) => {
    if (!onToggleStability) return;

    setActionLoading(versionId);
    try {
      await onToggleStability(versionId, currentStability);
    } catch (error) {
      console.error("Failed to toggle stability:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Release Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Downloads
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  File Size
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Min LR Version
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : versions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No plugin versions found
                  </td>
                </tr>
              ) : (
                versions.map((version) => (
                  <tr
                    key={version.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {version.version}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {version.changelog}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          version.isStable
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }
                      >
                        {version.isStable ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Stable
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Beta
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(version.releaseDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Download className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-800">
                          {version.downloadCount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatFileSize(version.fileSize)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {version.minLightroomVersion}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStability(version.id, version.isStable)}
                          disabled={actionLoading === version.id}
                          className="text-xs"
                        >
                          {actionLoading === version.id ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                          ) : version.isStable ? (
                            "Mark Beta"
                          ) : (
                            "Mark Stable"
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(version.id)}
                          disabled={actionLoading === version.id}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plugin Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this plugin version? This action cannot be undone.
              Users will no longer be able to download this version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
