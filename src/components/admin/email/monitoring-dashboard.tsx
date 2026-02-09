'use client';

/**
 * Email Monitoring Dashboard Component
 * 
 * Displays real-time monitoring metrics and alerts for the email system.
 * Shows queue size, failure rate, bounce rate, provider health, and performance metrics.
 * 
 * Requirements: 12.5, 12.6
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Mail,
  XCircle,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface MonitoringMetrics {
  queueSize: number;
  failureRate: number;
  bounceRate: number;
  providerHealthy: boolean;
  avgLatency: number;
  timestamp: string;
}

interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: string;
}

interface AlertSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  byType: Record<string, number>;
  recent: Alert[];
}

interface PerformanceMetrics {
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  totalProcessed: number;
  periodMinutes: number;
}

// ============================================================================
// Component
// ============================================================================

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch metrics
      const metricsResponse = await fetch('/api/emails/monitoring');
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch monitoring metrics');
      }
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.metrics);
      setAlertSummary(metricsData.summary);

      // Fetch performance metrics
      const performanceResponse = await fetch('/api/emails/monitoring?action=performance&period=60');
      if (!performanceResponse.ok) {
        throw new Error('Failed to fetch performance metrics');
      }
      const performanceData = await performanceResponse.json();
      setPerformance(performanceData.performance);
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Trigger threshold check
  const triggerThresholdCheck = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/emails/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger threshold check');
      }

      // Refresh data after check
      await fetchMonitoringData();
    } catch (err) {
      console.error('Error triggering threshold check:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger threshold check');
    } finally {
      setRefreshing(false);
    }
  };

  // Clear alerts
  const clearAlerts = async () => {
    try {
      const response = await fetch('/api/emails/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear alerts');
      }

      // Refresh data after clearing
      await fetchMonitoringData();
    } catch (err) {
      console.error('Error clearing alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear alerts');
    }
  };

  // Initial load and auto-refresh every 30 seconds
  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to get severity badge
  const getSeverityBadge = (severity: 'info' | 'warning' | 'critical') => {
    const variants = {
      info: { icon: AlertCircle, className: 'bg-blue-100 text-blue-800' },
      warning: { icon: AlertTriangle, className: 'bg-yellow-100 text-yellow-800' },
      critical: { icon: XCircle, className: 'bg-red-100 text-red-800' },
    };
    const { icon: Icon, className } = variants[severity];
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {severity.toUpperCase()}
      </Badge>
    );
  };

  // Helper function to format latency
  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email System Monitoring</h2>
          <p className="text-sm text-gray-500">
            Real-time monitoring and alerting for email operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMonitoringData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerThresholdCheck}
            disabled={refreshing}
          >
            <Activity className="w-4 h-4 mr-2" />
            Check Thresholds
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Queue Size */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Queue Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics?.queueSize ?? 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Threshold: 1,000
                </p>
              </div>
              <Mail className={`w-8 h-8 ${(metrics?.queueSize ?? 0) > 1000 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Failure Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Failure Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics?.failureRate.toFixed(1) ?? 0}%</div>
                <p className="text-xs text-gray-500 mt-1">
                  Threshold: 5%
                </p>
              </div>
              <XCircle className={`w-8 h-8 ${(metrics?.failureRate ?? 0) > 5 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Bounce Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics?.bounceRate.toFixed(1) ?? 0}%</div>
                <p className="text-xs text-gray-500 mt-1">
                  Threshold: 10%
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${(metrics?.bounceRate ?? 0) > 10 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Provider Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Provider Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {metrics?.providerHealthy ? 'Healthy' : 'Unhealthy'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Checked every 5 min
                </p>
              </div>
              {metrics?.providerHealthy ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Average Latency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {formatLatency(metrics?.avgLatency ?? 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Threshold: 5s
                </p>
              </div>
              <Clock className={`w-8 h-8 ${(metrics?.avgLatency ?? 0) > 5000 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics (Last {performance.periodMinutes} minutes)</CardTitle>
            <CardDescription>
              Detailed latency statistics for {performance.totalProcessed} emails processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Average</p>
                <p className="text-xl font-bold">{formatLatency(performance.avgLatency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">P50 (Median)</p>
                <p className="text-xl font-bold">{formatLatency(performance.p50Latency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">P95</p>
                <p className="text-xl font-bold">{formatLatency(performance.p95Latency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">P99</p>
                <p className="text-xl font-bold">{formatLatency(performance.p99Latency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Summary */}
      {alertSummary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>
                  {alertSummary.total} total alert(s) - {alertSummary.critical} critical, {alertSummary.warning} warning
                </CardDescription>
              </div>
              {alertSummary.total > 0 && (
                <Button variant="outline" size="sm" onClick={clearAlerts}>
                  Clear All Alerts
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {alertSummary.total === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No active alerts - all systems operational</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertSummary.recent.map((alert) => (
                  <div
                    key={alert.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeverityBadge(alert.severity)}
                          <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Current: {alert.currentValue.toFixed(1)}</span>
                          <span>Threshold: {alert.threshold}</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      {metrics && (
        <p className="text-xs text-gray-500 text-center">
          Last updated: {new Date(metrics.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default MonitoringDashboard;