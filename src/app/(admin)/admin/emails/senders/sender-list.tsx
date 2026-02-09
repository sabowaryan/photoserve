"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  Trash2,
  RefreshCw,
  Info,
} from "lucide-react";
import { VerificationInstructions } from "./verification-instructions";
import type { Database } from "@/lib/supabase/types";

type SenderAddress = Database["public"]["Tables"]["sender_addresses"]["Row"];

interface SenderListProps {
  senders: SenderAddress[];
  onSenderDeleted: (senderId: string) => void;
  onSenderUpdated?: (sender: SenderAddress) => void;
}

/**
 * Sender List Component
 * 
 * Displays list of sender addresses with:
 * - Status badges (verified, pending, failed)
 * - Default sender indicator
 * - Verification instructions
 * - Set default action
 * - Delete action (with validation)
 * - Refresh verification status
 * 
 * Requirements: 6.4, 6.5, 6.6
 */
export function SenderList({
  senders,
  onSenderDeleted,
}: SenderListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [checkingVerificationId, setCheckingVerificationId] = useState<
    string | null
  >(null);
  const [showInstructionsFor, setShowInstructionsFor] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle delete sender
   */
  const handleDelete = async (senderId: string) => {
    if (!confirm("Are you sure you want to delete this sender address?")) {
      return;
    }

    setDeletingId(senderId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/emails/senders/${senderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete sender address");
      }

      onSenderDeleted(senderId);
    } catch (error) {
      console.error("Error deleting sender:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete sender address"
      );
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Handle set default sender
   */
  const handleSetDefault = async (senderId: string) => {
    setSettingDefaultId(senderId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/emails/senders/${senderId}/set-default`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set default sender");
      }

      // Reload page to update all senders
      window.location.reload();
    } catch (error) {
      console.error("Error setting default sender:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to set default sender"
      );
      setSettingDefaultId(null);
    }
  };

  /**
   * Handle check verification status
   */
  const handleCheckVerification = async (senderId: string) => {
    setCheckingVerificationId(senderId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/emails/senders/${senderId}/verify`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to check verification status");
      }

      const result = await response.json();

      if (result.isVerified) {
        // Reload page to update sender status
        window.location.reload();
      } else {
        alert(
          `Verification status: ${result.status}. Please complete the DNS setup if not done yet.`
        );
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to check verification status"
      );
    } finally {
      setCheckingVerificationId(null);
    }
  };

  if (senders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
        <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          No sender addresses yet
        </h3>
        <p className="text-sm text-slate-500">
          Add your first sender address to start sending emails
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-base font-semibold text-slate-800">
          Sender Addresses
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your verified sender email addresses
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="divide-y divide-slate-200">
        {senders.map((sender) => (
          <div key={sender.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              {/* Sender Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-slate-800 truncate">
                    {sender.email}
                  </h3>
                  {sender.is_default && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex-shrink-0">
                      <Star className="h-3 w-3 fill-current" />
                      Default
                    </span>
                  )}
                  <VerificationStatusBadge
                    isVerified={sender.is_verified || false}
                  />
                </div>

                {sender.name && (
                  <p className="text-sm text-slate-500 mb-2">{sender.name}</p>
                )}

                <p className="text-xs text-slate-400">
                  Added {new Date(sender.created_at || "").toLocaleDateString()}
                </p>

                {/* Verification Instructions Toggle */}
                {!sender.is_verified && sender.domain_records && (
                  <button
                    onClick={() =>
                      setShowInstructionsFor(
                        showInstructionsFor === sender.id ? null : sender.id
                      )
                    }
                    className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <Info className="h-4 w-4" />
                    {showInstructionsFor === sender.id
                      ? "Hide"
                      : "Show"}{" "}
                    Verification Instructions
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Check Verification Button */}
                {!sender.is_verified && (
                  <LoadingButton
                    onClick={() => handleCheckVerification(sender.id)}
                    isLoading={checkingVerificationId === sender.id}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Check Status
                  </LoadingButton>
                )}

                {/* Set Default Button */}
                {sender.is_verified && !sender.is_default && (
                  <LoadingButton
                    onClick={() => handleSetDefault(sender.id)}
                    isLoading={settingDefaultId === sender.id}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    Set Default
                  </LoadingButton>
                )}

                {/* Delete Button */}
                <LoadingButton
                  onClick={() => handleDelete(sender.id)}
                  isLoading={deletingId === sender.id}
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </LoadingButton>
              </div>
            </div>

            {/* Verification Instructions */}
            {showInstructionsFor === sender.id &&
              !sender.is_verified &&
              sender.domain_records && (
                <div className="mt-4">
                  <VerificationInstructions
                    email={sender.email}
                    domainRecords={sender.domain_records as any}
                  />
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Verification Status Badge Component
 */
function VerificationStatusBadge({ isVerified }: { isVerified: boolean }) {
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex-shrink-0">
        <CheckCircle className="h-3 w-3" />
        Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex-shrink-0">
      <Clock className="h-3 w-3" />
      Pending Verification
    </span>
  );
}
