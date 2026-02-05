"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CreateAPIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: { key: string; apiKey: any }) => void;
}

/**
 * Create API Key Dialog Component
 * 
 * Modal dialog for creating a new API key with name and optional expiration
 * Requirements: 7.3, 7.4
 */
export function CreateAPIKeyDialog({ open, onOpenChange, onSuccess }: CreateAPIKeyDialogProps) {
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name (1-100 characters)
    if (!name || name.trim().length === 0) {
      setError("Name is required");
      return;
    }

    if (name.length > 100) {
      setError("Name must be 100 characters or less");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare request body
      const requestBody: {
        name: string;
        expiresAt?: string;
        scopes?: string[];
      } = {
        name: name.trim(),
        scopes: ['plugin:read', 'plugin:write'], // Default scopes for plugin API keys
      };

      // Only include expiresAt if a date is selected
      if (expiresAt) {
        // Convert to ISO 8601 format
        requestBody.expiresAt = new Date(expiresAt).toISOString();
      }

      // Call POST /api/settings/api-keys
      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError("Pro plan required to create API keys");
        } else if (response.status === 400 && data.details) {
          // Display validation errors
          const validationErrors = data.details.map((issue: any) => issue.message).join(', ');
          setError(`Validation error: ${validationErrors}`);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("Failed to create API key");
        }
        return;
      }

      // On success, show APIKeyCreatedDialog
      onSuccess(data);
      
      // Reset form
      setName("");
      setExpiresAt("");
      onOpenChange(false);
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error creating API key:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setExpiresAt("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Create API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new API key for the Lightroom plugin. Give it a descriptive name to help you identify it later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Lightroom Desktop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-slate-500">
                {name.length}/100 characters
              </p>
            </div>

            {/* Expiration Date Field */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">
                Expiration Date <span className="text-slate-400">(optional)</span>
              </Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={isLoading}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-slate-500">
                Leave empty for a key that never expires
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create API Key"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
