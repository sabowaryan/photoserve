"use client";

import { useState } from "react";
import { SenderList } from "./sender-list";
import { AddSenderForm } from "./add-sender-form";
import type { Database } from "@/lib/supabase/types";

type SenderAddress = Database["public"]["Tables"]["sender_addresses"]["Row"];

interface SenderManagementContentProps {
  initialSenders: SenderAddress[];
}

/**
 * Sender Management Content Component
 * 
 * Client-side wrapper that manages state for sender addresses
 * and coordinates between the list and form components
 * 
 * Requirements: 6.4, 6.5, 6.6
 */
export function SenderManagementContent({
  initialSenders,
}: SenderManagementContentProps) {
  const [senders, setSenders] = useState<SenderAddress[]>(initialSenders);

  /**
   * Handle new sender added
   */
  const handleSenderAdded = (newSender: SenderAddress) => {
    setSenders((prev) => [newSender, ...prev]);
  };

  /**
   * Handle sender deleted
   */
  const handleSenderDeleted = (senderId: string) => {
    setSenders((prev) => prev.filter((s) => s.id !== senderId));
  };

  /**
   * Handle sender updated (e.g., verification status changed)
   */
  const handleSenderUpdated = (updatedSender: SenderAddress) => {
    setSenders((prev) =>
      prev.map((s) => (s.id === updatedSender.id ? updatedSender : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Sender Address Management
        </h1>
        <p className="text-slate-500 mt-0.5 text-sm">
          Manage verified sender email addresses for your email campaigns
        </p>
      </div>

      {/* Add Sender Form */}
      <AddSenderForm onSenderAdded={handleSenderAdded} />

      {/* Sender List */}
      <SenderList
        senders={senders}
        onSenderDeleted={handleSenderDeleted}
        onSenderUpdated={handleSenderUpdated}
      />
    </div>
  );
}
