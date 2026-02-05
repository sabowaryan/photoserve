"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APIKeyList } from "./api-key-list";
import { CreateAPIKeyDialog } from "./create-api-key-dialog";
import { APIKeyCreatedDialog } from "./api-key-created-dialog";
import type { APIKey } from "@/lib/services/api-key.service";

interface APIKeysManagerProps {
  initialApiKeys: APIKey[];
}

/**
 * API Keys Manager Component
 * 
 * Manages API keys with create, revoke, and delete functionality
 * Uses optimistic updates for better UX
 * Requirements: 7.1, 7.2, 7.3, 7.8
 */
export function APIKeysManager({ initialApiKeys }: APIKeysManagerProps) {
  const [apiKeys, setApiKeys] = useState<APIKey[]>(initialApiKeys);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createdKeyDialogOpen, setCreatedKeyDialogOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<{ key: string; apiKey: any } | null>(null);

  // Refresh API keys from server
  const refreshApiKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch (error) {
      console.error("Error refreshing API keys:", error);
    }
  }, []);

  // Handle successful API key creation
  const handleCreateSuccess = useCallback((result: { key: string; apiKey: any }) => {
    setCreatedKey(result);
    setCreatedKeyDialogOpen(true);
    // Refresh the list to show the new key
    refreshApiKeys();
  }, [refreshApiKeys]);

  // Handle API key revocation
  const handleRevoke = useCallback(async (keyId: string) => {
    // Optimistic update
    setApiKeys((prev) =>
      prev.map((key) =>
        key.id === keyId ? { ...key, isActive: false } : key
      )
    );

    try {
      const response = await fetch(`/api/settings/api-keys/${keyId}/revoke`, {
        method: "PATCH",
      });

      if (!response.ok) {
        // Revert on error
        await refreshApiKeys();
        throw new Error("Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      // Refresh to get accurate state
      await refreshApiKeys();
    }
  }, [refreshApiKeys]);

  // Handle API key deletion
  const handleDelete = useCallback(async (keyId: string) => {
    // Optimistic update
    setApiKeys((prev) => prev.filter((key) => key.id !== keyId));

    try {
      const response = await fetch(`/api/settings/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Revert on error
        await refreshApiKeys();
        throw new Error("Failed to delete API key");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      // Refresh to get accurate state
      await refreshApiKeys();
    }
  }, [refreshApiKeys]);

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">API Keys</h2>
          <p className="text-slate-600 mt-1">
            Manage API keys for the Lightroom plugin integration
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* API Keys List */}
      <APIKeyList
        apiKeys={apiKeys}
        onRevoke={handleRevoke}
        onDelete={handleDelete}
      />

      {/* Create API Key Dialog */}
      <CreateAPIKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* API Key Created Dialog */}
      {createdKey && (
        <APIKeyCreatedDialog
          open={createdKeyDialogOpen}
          onOpenChange={setCreatedKeyDialogOpen}
          apiKey={createdKey.key}
          keyName={createdKey.apiKey.name}
        />
      )}
    </div>
  );
}
