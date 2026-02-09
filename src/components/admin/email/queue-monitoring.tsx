"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  RefreshCw,
  Play,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Queue statistics structure
 */
interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  scheduled: number;
  byPriority: {
    high: number;
    normal: number;
    low: number;
  };
}

/**
 * Queue health structure
 */
interface QueueHealth {
  status: "healthy" | "degraded" | "unhealthy";
  queueDepth: number;
  processingRate: number;
  errorRate: number;
  oldestPendingAge: number;
  issues: string[];
  recommendations: string[];
}

/**
 * Scheduled email structure
 */
interface ScheduledEmail {
  id: string;
  to_address: string;
  subject: string;
  scheduled_at: string;
  priority: string;
}

/**
 * Props for QueueMonitoring component
 */
interface QueueMonitoringProps {
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Refresh interval in milliseconds (default: 30000 = 30s) */
  refreshInterval?: number;
}

/**
 * Health status badge component
 */
function HealthBadge({ status }: { status: "healthy" | "degraded" | "unhealthy" }) {
  const config = {
    healthy: {
      icon: CheckCircle,
      label: "Sain",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    degraded: {
      icon: AlertCircle,
      label: "Dégradé",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    unhealthy: {
      icon: XCircle,
      label: "Critique",
      className: "bg-rose-100 text-rose-700 border-rose-200",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

/**
 * Priority badge component
 */
function PriorityBadge({ priority }: { priority: string }) {
  const defaultConfig = { label: "Normale", className: "bg-blue-100 text-blue-700" };
  
  const config: Record<string, { label: string; className: string }> = {
    high: { label: "Haute", className: "bg-rose-100 text-rose-700" },
    normal: defaultConfig,
    low: { label: "Basse", className: "bg-slate-100 text-slate-700" },
  };

  const badgeConfig = config[priority] || defaultConfig;

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeConfig.className}`}>
      {badgeConfig.label}
    </span>
  );
}

/**
 * Loading skeleton for queue monitoring
 */
function QueueMonitoringSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-lg" />
      {!compact && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <Skeleton className="h-32 rounded-lg" />
        </>
      )}
    </div>
  );
}

/**
 * Queue Monitoring Component
 * 
 * Displays comprehensive queue status including:
 * - Pending emails count with breakdown by priority
 * - Failed emails count with retry status
 * - Scheduled emails list (next 10 scheduled)
 * - Queue health indicators (processing rate, error rate)
 * - Manual queue processing trigger button
 * 
 * Requirements: 9.3, 9.4
 */
export function QueueMonitoring({ compact = false, refreshInterval = 30000 }: QueueMonitoringProps) {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [health, setHealth] = useState<QueueHealth | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  /**
   * Fetch queue data
   */
  const fetchQueueData = async () => {
    try {
      setError(null);

      // Fetch all data in parallel
      const [statsRes, healthRes, statusRes] = await Promise.all([
        fetch("/api/emails/queue/stats"),
        fetch("/api/emails/queue/health"),
        fetch("/api/emails/queue/status"),
      ]);

      if (!statsRes.ok || !healthRes.ok || !statusRes.ok) {
        throw new Error("Failed to fetch queue data");
      }

      const [statsData, healthData, statusData] = await Promise.all([
        statsRes.json(),
        healthRes.json(),
        statusRes.json(),
      ]);

      setStats(statsData.stats);
      setHealth(healthData.health);
      setScheduled(statusData.scheduled || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manually trigger queue processing
   */
  const processQueue = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const response = await fetch("/api/emails/queue/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batchSize: 10 }),
      });

      if (!response.ok) {
        throw new Error("Failed to process queue");
      }

      const result = await response.json();

      // Refresh data after processing
      await fetchQueueData();

      // Show success message (you could use a toast notification here)
      console.log(`Processed ${result.processed} emails: ${result.successful} successful, ${result.failed} failed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du traitement");
    } finally {
      setIsProcessing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchQueueData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchQueueData, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [refreshInterval]);

  if (isLoading) {
    return <QueueMonitoringSkeleton compact={compact} />;
  }

  if (error && !stats) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <p className="text-sm font-medium text-rose-700">Erreur de chargement</p>
        </div>
        <p className="text-xs text-rose-600 mb-3">{error}</p>
        <Button onClick={fetchQueueData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with health status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Statut de la file</h3>
            <p className="text-xs text-slate-500">
              Dernière mise à jour: {lastRefresh.toLocaleTimeString("fr-FR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {health && <HealthBadge status={health.status} />}
          <Button
            onClick={fetchQueueData}
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Queue counts by status */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-500">En attente</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats?.pending || 0}</p>
          {stats && stats.byPriority && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
              <span className="text-rose-600 font-medium">{stats.byPriority.high}</span>
              <span>/</span>
              <span className="text-blue-600 font-medium">{stats.byPriority.normal}</span>
              <span>/</span>
              <span className="text-slate-600 font-medium">{stats.byPriority.low}</span>
            </div>
          )}
        </div>

        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <Loader2 className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-600">Traitement</span>
          </div>
          <p className="text-2xl font-bold text-amber-800">{stats?.processing || 0}</p>
        </div>

        <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="h-4 w-4 text-rose-600" />
            <span className="text-xs font-medium text-rose-600">Échoués</span>
          </div>
          <p className="text-2xl font-bold text-rose-800">{stats?.failed || 0}</p>
        </div>
      </div>

      {!compact && (
        <>
          {/* Queue health indicators */}
          {health && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                Indicateurs de santé
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-600">Taux de traitement</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {health.processingRate.toFixed(1)} <span className="text-xs font-normal text-slate-500">emails/min</span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-600">Taux d'erreur</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {health.errorRate.toFixed(1)} <span className="text-xs font-normal text-slate-500">%</span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-600">Profondeur de la file</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{health.queueDepth}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-600">Email le plus ancien</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {health.oldestPendingAge} <span className="text-xs font-normal text-slate-500">min</span>
                  </p>
                </div>
              </div>

              {/* Issues and recommendations */}
              {(health.issues.length > 0 || health.recommendations.length > 0) && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  {health.issues.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-rose-600 mb-1.5">Problèmes détectés</p>
                      <ul className="space-y-1">
                        {health.issues.map((issue, index) => (
                          <li key={index} className="text-xs text-rose-700 flex items-start gap-1.5">
                            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {health.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-1.5">Recommandations</p>
                      <ul className="space-y-1">
                        {health.recommendations.map((rec, index) => (
                          <li key={index} className="text-xs text-amber-700 flex items-start gap-1.5">
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Scheduled emails */}
          {scheduled.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                Emails programmés ({scheduled.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scheduled.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {email.to_address}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {email.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <PriorityBadge priority={email.priority} />
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(email.scheduled_at).toLocaleString("fr-FR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual processing button */}
          <div className="flex items-center justify-between bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <div>
              <p className="text-sm font-medium text-indigo-900">Traitement manuel</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Traiter immédiatement les 10 prochains emails en attente
              </p>
            </div>
            <Button
              onClick={processQueue}
              disabled={isProcessing || (stats?.pending || 0) === 0}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Traiter maintenant
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Error message */}
      {error && stats && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700">{error}</p>
        </div>
      )}
    </div>
  );
}
