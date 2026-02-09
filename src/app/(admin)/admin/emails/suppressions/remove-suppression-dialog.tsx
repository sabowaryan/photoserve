"use client";

import { useState } from "react";
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
import type { Database } from "@/lib/supabase/types";

type SuppressionRow = Database['public']['Tables']['email_suppressions']['Row'];

interface RemoveSuppressionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  suppression: SuppressionRow | null;
  count: number;
}

/**
 * Remove Suppression Dialog Component
 * 
 * Confirmation dialog for removing suppressions
 * 
 * Requirements: 8.8
 */
export function RemoveSuppressionDialog({
  isOpen,
  onClose,
  onConfirm,
  suppression,
  count,
}: RemoveSuppressionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to remove suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {suppression
              ? "Remove Suppression?"
              : `Remove ${count} Suppressions?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {suppression ? (
              <>
                Are you sure you want to remove <strong>{suppression.email}</strong> from
                the suppression list? This will allow emails to be sent to this
                address again.
              </>
            ) : (
              <>
                Are you sure you want to remove <strong>{count} suppressions</strong>?
                This will allow emails to be sent to these addresses again.
              </>
            )}
          </AlertDialogDescription>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mt-4">
              {error}
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
