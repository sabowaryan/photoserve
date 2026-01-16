'use client';

/**
 * Disputes Page Client Component
 * Client-side component for the disputes page with list and details
 * 
 * @module app/(dashboard)/revenue/disputes/disputes-page-client
 * Requirements: 7.2 - Dispute Handling
 */
import { useState } from 'react';
import { DisputeList } from '@/components/revenue/dispute-list';
import { DisputeDetails } from '@/components/revenue/dispute-details';

export function DisputesPageClient() {
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSelectDispute = (disputeId: string) => {
    setSelectedDisputeId(disputeId);
    setShowDetails(true);
  };

  const handleBack = () => {
    setShowDetails(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Desktop: Side by side layout */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6">
        <DisputeList 
          onSelectDispute={handleSelectDispute}
          selectedDisputeId={selectedDisputeId || undefined}
        />
        <DisputeDetails 
          disputeId={selectedDisputeId}
        />
      </div>

      {/* Mobile: Toggle between list and details */}
      <div className="lg:hidden">
        {!showDetails ? (
          <DisputeList 
            onSelectDispute={handleSelectDispute}
            selectedDisputeId={selectedDisputeId || undefined}
          />
        ) : (
          <DisputeDetails 
            disputeId={selectedDisputeId}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
