"use client";

import { useState } from "react";
import { Trash2, XCircle, Key, Clock, AlertTriangle } from "lucide-react";
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
import type { APIKey } from "@/lib/services/api-key.service";

interface APIKeyListProps {
  apiKeys: APIKey[];
  onRevoke: (keyId: string) => Promise<void>;
  onDelete: (keyId: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Format date for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Check if a key is expiring soon (within 7 days)
 */
function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
}

/**
 * Check if a key is expired
 */
function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  
  return expiryDate < now;
}

/**
 * Get status badge for API key
 */
function getStatusBadge(apiKey: APIKey) {
  if (!apiKey.isActive) {
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
        Revoked
      </Badge>
    );
  }
  
  if (isExpired(apiKey.expiresAt)) {
    return (
      <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200">
        Expired
      </Badge>
    );
  }
  
  if (isExpiringSoon(apiKey.expiresAt)) {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Expiring Soon
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
      Active
    </Badge>
  );
}

/**
 * API Key List Component
 * 
 * Displays table of user's API keys with status indicators and actions
 * Requirements: 7.1, 7.2, 7.6, 7.7, 7.10, 7.11
 */
export function APIKeyList({ apiKeys, onRevoke, onDelete, isLoading = false }: APIKeyListProps) {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleRevokeClick = (keyId: string) => {
    setSelectedKeyId(keyId);
    setRevokeDialogOpen(true);
  };

  const handleDeleteClick = (keyId: string) => {
    setSelectedKeyId(keyId);
    setDeleteDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!selectedKeyId) return;
    
    setActionLoading(true);
    try {
      await onRevoke(selectedKeyId);
      setRevokeDialogOpen(false);
      setSelectedKeyId(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedKeyId) return;
    
    setActionLoading(true);
    try {
      await onDelete(selectedKeyId);
      setDeleteDialogOpen(false);
      setSelectedKeyId(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          Loading API keys...
        </div>
      </div>
    );
  }

  if (apiKeys.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Key className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No API Keys</h3>
        <p className="text-slate-500">
          You haven't created any API keys yet. Create one to get started with the Lightroom plugin.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Prefix
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apiKeys.map((apiKey) => (
                <tr key={apiKey.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-800">{apiKey.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">
                      {apiKey.keyPrefix}...
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(apiKey.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    {apiKey.lastUsedAt ? (
                      <span className="text-sm text-slate-600">{formatDate(apiKey.lastUsedAt)}</span>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                        Never used
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {apiKey.expiresAt ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatDate(apiKey.expiresAt)}
                      </div>
                    ) : (
                      <span className="text-slate-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(apiKey)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {apiKey.isActive && !isExpired(apiKey.expiresAt) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeClick(apiKey.id)}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(apiKey.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this API key? This action will immediately prevent the key from being used for authentication. You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {actionLoading ? "Revoking..." : "Revoke Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this API key? This action cannot be undone and will remove all records of this key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {actionLoading ? "Deleting..." : "Delete Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
