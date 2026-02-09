"use client";

import { useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";

interface DomainRecord {
  name: string;
  value: string;
  type: string;
}

interface DomainRecords {
  dkim: DomainRecord[];
  spf?: DomainRecord;
  dmarc?: DomainRecord;
}

interface VerificationInstructionsProps {
  email: string;
  domainRecords: DomainRecords;
}

/**
 * Verification Instructions Component
 * 
 * Displays DNS records that need to be added for domain verification:
 * - DKIM records
 * - SPF record
 * - DMARC record (optional)
 * - Copy to clipboard functionality
 * - Step-by-step instructions
 * 
 * Requirements: 6.5
 */
export function VerificationInstructions({
  email,
  domainRecords,
}: VerificationInstructionsProps) {
  const domain = email.split("@")[1];
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = async (text: string, recordId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecord(recordId);
      setTimeout(() => setCopiedRecord(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const hasDkim = domainRecords.dkim && domainRecords.dkim.length > 0;
  const hasSpf = !!domainRecords.spf;
  const hasDmarc = !!domainRecords.dmarc;

  if (!hasDkim && !hasSpf && !hasDmarc) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              No DNS records available
            </p>
            <p className="text-sm text-amber-700 mt-1">
              DNS records will be generated when you add this sender address.
              Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-slate-800 mb-2">
          Domain Verification Instructions
        </h4>
        <p className="text-sm text-slate-600">
          Add the following DNS records to your domain ({domain}) to verify
          ownership and enable email sending:
        </p>
      </div>

      {/* DKIM Records */}
      {hasDkim && (
        <div>
          <h5 className="text-sm font-semibold text-slate-800 mb-3">
            DKIM Records (Required)
          </h5>
          <p className="text-xs text-slate-600 mb-3">
            DKIM (DomainKeys Identified Mail) authenticates your emails and
            improves deliverability.
          </p>
          <div className="space-y-3">
            {domainRecords.dkim.map((record, index) => (
              <DNSRecordCard
                key={`dkim-${index}`}
                recordId={`dkim-${index}`}
                type={record.type}
                name={record.name}
                value={record.value}
                copiedRecord={copiedRecord}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>
      )}

      {/* SPF Record */}
      {hasSpf && domainRecords.spf && (
        <div>
          <h5 className="text-sm font-semibold text-slate-800 mb-3">
            SPF Record (Required)
          </h5>
          <p className="text-xs text-slate-600 mb-3">
            SPF (Sender Policy Framework) specifies which servers can send
            emails from your domain.
          </p>
          <DNSRecordCard
            recordId="spf"
            type={domainRecords.spf.type}
            name={domainRecords.spf.name}
            value={domainRecords.spf.value}
            copiedRecord={copiedRecord}
            onCopy={handleCopy}
          />
        </div>
      )}

      {/* DMARC Record */}
      {hasDmarc && domainRecords.dmarc && (
        <div>
          <h5 className="text-sm font-semibold text-slate-800 mb-3">
            DMARC Record (Recommended)
          </h5>
          <p className="text-xs text-slate-600 mb-3">
            DMARC (Domain-based Message Authentication) provides additional
            email authentication and reporting.
          </p>
          <DNSRecordCard
            recordId="dmarc"
            type={domainRecords.dmarc.type}
            name={domainRecords.dmarc.name}
            value={domainRecords.dmarc.value}
            copiedRecord={copiedRecord}
            onCopy={handleCopy}
          />
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-blue-900 mb-2">
          How to add DNS records:
        </h5>
        <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
          <li>Log in to your domain registrar or DNS provider</li>
          <li>Navigate to DNS settings for {domain}</li>
          <li>Add each DNS record shown above</li>
          <li>Wait for DNS propagation (can take up to 48 hours)</li>
          <li>Click "Check Status" button to verify</li>
        </ol>
      </div>
    </div>
  );
}

/**
 * DNS Record Card Component
 */
interface DNSRecordCardProps {
  recordId: string;
  type: string;
  name: string;
  value: string;
  copiedRecord: string | null;
  onCopy: (text: string, recordId: string) => void;
}

function DNSRecordCard({
  recordId,
  type,
  name,
  value,
  copiedRecord,
  onCopy,
}: DNSRecordCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Type */}
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
            Type
          </label>
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">
              {type}
            </code>
            <button
              onClick={() => onCopy(type, `${recordId}-type`)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Copy type"
            >
              {copiedRecord === `${recordId}-type` ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Name */}
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
            Name / Host
          </label>
          <div className="flex items-center justify-between gap-2">
            <code className="text-sm font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded truncate flex-1">
              {name}
            </code>
            <button
              onClick={() => onCopy(name, `${recordId}-name`)}
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              title="Copy name"
            >
              {copiedRecord === `${recordId}-name` ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Value */}
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
          Value / Data
        </label>
        <div className="flex items-start justify-between gap-2">
          <code className="text-xs font-mono text-slate-800 bg-slate-100 px-2 py-1.5 rounded break-all flex-1">
            {value}
          </code>
          <button
            onClick={() => onCopy(value, `${recordId}-value`)}
            className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mt-1"
            title="Copy value"
          >
            {copiedRecord === `${recordId}-value` ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
