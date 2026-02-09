"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import type { EmailLogWithEvents } from "@/lib/repositories/email-log.repository";

interface EmailDetailModalProps {
  log: EmailLogWithEvents;
  isOpen: boolean;
  onClose: () => void;
  onRetry: (logId: string) => void;
}

/**
 * Format date for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "Not yet";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

/**
 * Get status icon
 */
function getStatusIcon(hasDate: boolean) {
  if (hasDate) {
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
  return <Clock className="h-4 w-4 text-slate-400" />;
}

/**
 * Email Detail Modal Component
 * 
 * Displays detailed information about an email log including:
 * - Email metadata (recipient, sender, subject, etc.)
 * - Delivery timeline
 * - Full event history
 * - Error messages (if any)
 * - Retry functionality for failed emails
 * 
 * Requirements: 8.3
 */
export function EmailDetailModal({
  log,
  isOpen,
  onClose,
  onRetry,
}: EmailDetailModalProps) {
  if (!isOpen) return null;

  const canRetry = log.failed_at !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Email Details
              </h2>
              <p className="text-xs text-slate-500">
                ID: {log.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onRetry(log.id);
                  onClose();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Email Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Email Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Recipient
                </p>
                <p className="text-sm text-slate-800">{log.to_address}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Sender
                </p>
                <p className="text-sm text-slate-800">{log.from_address}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Subject
                </p>
                <p className="text-sm text-slate-800">{log.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Provider
                </p>
                <p className="text-sm text-slate-800 capitalize">
                  {log.provider}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Status
                </p>
                <Badge variant="outline">{log.status}</Badge>
              </div>
              {log.provider_message_id && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    Provider Message ID
                  </p>
                  <p className="text-xs text-slate-600 font-mono">
                    {log.provider_message_id}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Delivery Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {getStatusIcon(!!log.sent_at)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Sent</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(log.sent_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {getStatusIcon(!!log.delivered_at)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    Delivered
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(log.delivered_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {getStatusIcon(!!log.opened_at)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Opened</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(log.opened_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {getStatusIcon(!!log.clicked_at)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Clicked</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(log.clicked_at)}
                  </p>
                </div>
              </div>
              {log.bounced_at && (
                <div className="flex items-start gap-3">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Bounced</p>
                    <p className="text-xs text-red-600">
                      {formatDate(log.bounced_at)}
                    </p>
                  </div>
                </div>
              )}
              {log.complained_at && (
                <div className="flex items-start gap-3">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Complained
                    </p>
                    <p className="text-xs text-red-600">
                      {formatDate(log.complained_at)}
                    </p>
                  </div>
                </div>
              )}
              {log.failed_at && (
                <div className="flex items-start gap-3">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Failed</p>
                    <p className="text-xs text-red-600">
                      {formatDate(log.failed_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {log.error_message && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Error Message
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-mono">
                  {log.error_message}
                </p>
              </div>
            </div>
          )}

          {/* Event History */}
          {log.events && log.events.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Event History
              </h3>
              <div className="space-y-2">
                {log.events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-800 capitalize">
                        {event.event_type}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(event.created_at)}
                      </p>
                    </div>
                    {event.event_data && typeof event.event_data === 'object' && (
                      <pre className="text-xs text-slate-600 font-mono overflow-x-auto">
                        {JSON.stringify(event.event_data, null, 2)}
                      </pre>
                    )}
                    {event.ip_address !== null && event.ip_address !== undefined && (
                      <p className="text-xs text-slate-500 mt-1">
                        IP: {String(event.ip_address)}
                      </p>
                    )}
                    {event.user_agent && (
                      <p className="text-xs text-slate-500 truncate">
                        User Agent: {event.user_agent}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Metadata
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <pre className="text-xs text-slate-600 font-mono overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
