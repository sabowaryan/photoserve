"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  FileText,
  BarChart3,
  Users,
  Ban,
  ArrowRight,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueueMonitoring } from "@/components/admin/email/queue-monitoring";

/**
 * Email stats data structure
 */
interface EmailStats {
  sentToday: number;
  queueSize: number;
  deliveryRate: number;
  bounceRate: number;
}

/**
 * Recent email log structure
 */
interface RecentLog {
  id: string;
  to_address: string;
  subject: string;
  status: string;
  created_at: string;
  template_id: string | null;
}

/**
 * Provider status structure
 */
interface ProviderStatus {
  provider: {
    name: string;
    isActive: boolean;
  } | null;
  status: "connected" | "not_configured" | "unknown";
}

/**
 * Stats card component
 */
function StatsCard({
  icon: Icon,
  label,
  value,
  subtitle,
  variant = "default",
}: {
  icon: any;
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}) {
  const variantStyles: Record<string, string> = {
    default: "bg-slate-100 text-slate-600",
    primary: "bg-indigo-100 text-indigo-600",
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-amber-100 text-amber-600",
    danger: "bg-rose-100 text-rose-600",
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <h4 className="text-xl font-bold text-slate-800 tracking-tight">
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        </h4>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Navigation card component
 */
function NavigationCard({
  icon: Icon,
  title,
  description,
  href,
  variant = "default",
}: {
  icon: any;
  title: string;
  description: string;
  href: string;
  variant?: "default" | "primary" | "success" | "warning";
}) {
  const variantStyles: Record<string, string> = {
    default: "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
    primary: "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200",
    success: "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200",
    warning: "bg-amber-100 text-amber-600 group-hover:bg-amber-200",
  };

  return (
    <Link
      href={href}
      className="group bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg transition-colors ${variantStyles[variant]}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 mb-0.5 group-hover:text-indigo-600 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { label: string; className: string }
  > = {
    sent: { label: "Envoyé", className: "bg-blue-100 text-blue-700" },
    delivered: { label: "Délivré", className: "bg-emerald-100 text-emerald-700" },
    opened: { label: "Ouvert", className: "bg-purple-100 text-purple-700" },
    clicked: { label: "Cliqué", className: "bg-indigo-100 text-indigo-700" },
    bounced: { label: "Rebond", className: "bg-orange-100 text-orange-700" },
    failed: { label: "Échoué", className: "bg-rose-100 text-rose-700" },
    pending: { label: "En attente", className: "bg-slate-100 text-slate-700" },
    processing: { label: "Traitement", className: "bg-amber-100 text-amber-700" },
  };

  const config = statusConfig[status] || {
    label: status,
    className: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

/**
 * Loading skeleton for dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-64 mb-1.5" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Email Management Main Dashboard
 * 
 * Displays:
 * - Quick stats cards (emails sent today, queue size, delivery rate, bounce rate)
 * - Recent email logs widget (last 10 emails)
 * - Queue status widget (pending, processing, failed)
 * - Provider status indicator (active provider, connection status)
 * - Quick actions (send test email, view templates, view logs)
 * - Navigation cards to sub-pages
 * 
 * Requirements: 9.1, 9.2
 */
export default function EmailDashboardPage() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [statsRes, logsRes, providerRes] = await Promise.all([
        fetch("/api/emails/stats"),
        fetch("/api/emails/recent"),
        fetch("/api/emails/providers/status"),
      ]);

      if (!statsRes.ok || !logsRes.ok || !providerRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [statsData, logsData, providerData] = await Promise.all([
        statsRes.json(),
        logsRes.json(),
        providerRes.json(),
      ]);

      setStats(statsData.stats);
      setRecentLogs(logsData.logs);
      setProviderStatus(providerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Gestion des emails
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">
            Tableau de bord du système d'emails
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <p className="text-rose-700 font-medium mb-2">Erreur de chargement</p>
          <p className="text-rose-600 text-sm mb-4">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Mail className="h-4 w-4 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Gestion des emails
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">
            Tableau de bord du système d'emails
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Provider Status Banner */}
      {providerStatus && (
        <div
          className={`rounded-xl p-4 border ${
            providerStatus.status === "connected"
              ? "bg-emerald-50 border-emerald-200"
              : providerStatus.status === "not_configured"
              ? "bg-amber-50 border-amber-200"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {providerStatus.status === "connected" ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : providerStatus.status === "not_configured" ? (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              ) : (
                <Clock className="h-5 w-5 text-slate-600" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {providerStatus.status === "connected"
                    ? `Fournisseur actif: ${providerStatus.provider?.name || "N/A"}`
                    : providerStatus.status === "not_configured"
                    ? "Aucun fournisseur configuré"
                    : `Fournisseur: ${providerStatus.provider?.name || "N/A"} (statut inconnu)`}
                </p>
                <p className="text-xs text-slate-600">
                  {providerStatus.status === "connected"
                    ? "Le système d'emails est opérationnel"
                    : providerStatus.status === "not_configured"
                    ? "Configurez un fournisseur d'emails pour commencer"
                    : "Vérifiez la configuration du fournisseur"}
                </p>
              </div>
            </div>
            {providerStatus.status !== "connected" && (
              <Link href="/admin/emails/providers">
                <Button size="sm" variant="outline">
                  Configurer
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Send}
          label="Emails envoyés aujourd'hui"
          value={stats?.sentToday || 0}
          variant="primary"
        />
        <StatsCard
          icon={Clock}
          label="File d'attente"
          value={stats?.queueSize || 0}
          subtitle="Emails en attente"
          variant="warning"
        />
        <StatsCard
          icon={CheckCircle}
          label="Taux de livraison"
          value={`${stats?.deliveryRate || 0}%`}
          subtitle="7 derniers jours"
          variant="success"
        />
        <StatsCard
          icon={AlertCircle}
          label="Taux de rebond"
          value={`${stats?.bounceRate || 0}%`}
          subtitle="7 derniers jours"
          variant={stats && stats.bounceRate > 5 ? "danger" : "default"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Emails Widget */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">
              Emails récents
            </h2>
            <Link href="/admin/emails/logs">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Aucun email récent</p>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {log.to_address}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {log.subject}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(log.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Queue Monitoring Widget */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <QueueMonitoring compact={false} refreshInterval={30000} />
        </div>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          Gestion
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NavigationCard
            icon={Settings}
            title="Fournisseurs"
            description="Configurer Resend ou AWS SES"
            href="/admin/emails/providers"
            variant="primary"
          />
          <NavigationCard
            icon={Users}
            title="Adresses d'envoi"
            description="Gérer les expéditeurs vérifiés"
            href="/admin/emails/senders"
            variant="success"
          />
          <NavigationCard
            icon={FileText}
            title="Templates"
            description="Créer et modifier les templates"
            href="/admin/emails/templates"
            variant="default"
          />
          <NavigationCard
            icon={Mail}
            title="Logs"
            description="Historique des emails envoyés"
            href="/admin/emails/logs"
            variant="default"
          />
          <NavigationCard
            icon={BarChart3}
            title="Analytics"
            description="Statistiques et performances"
            href="/admin/emails/analytics"
            variant="warning"
          />
          <NavigationCard
            icon={Ban}
            title="Suppressions"
            description="Gérer les rebonds et plaintes"
            href="/admin/emails/suppressions"
            variant="default"
          />
          <NavigationCard
            icon={Activity}
            title="Monitoring"
            description="Surveillance et alertes système"
            href="/admin/emails/monitoring"
            variant="warning"
          />
        </div>
      </div>
    </div>
  );
}
