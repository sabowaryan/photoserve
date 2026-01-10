"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Image,
  CreditCard,
  Shield,
  Eye,
  Pencil,
  Ban,
  CheckCircle,
  Trash2,
  XCircle,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuditLogWithAdmin, AuditActionType, AuditEntityType } from "@/types/admin";

interface AuditLogTableProps {
  logs: AuditLogWithAdmin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Get icon for action type
 */
function getActionIcon(actionType: AuditActionType) {
  switch (actionType) {
    case "user_view":
      return <Eye className="h-4 w-4" />;
    case "user_update":
      return <Pencil className="h-4 w-4" />;
    case "user_suspend":
      return <Ban className="h-4 w-4" />;
    case "user_reactivate":
      return <CheckCircle className="h-4 w-4" />;
    case "gallery_view":
      return <Eye className="h-4 w-4" />;
    case "gallery_deactivate":
      return <XCircle className="h-4 w-4" />;
    case "gallery_delete":
      return <Trash2 className="h-4 w-4" />;
    case "subscription_update":
      return <Pencil className="h-4 w-4" />;
    case "subscription_cancel":
      return <XCircle className="h-4 w-4" />;
    case "admin_login":
      return <LogIn className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
}

/**
 * Get icon for entity type
 */
function getEntityIcon(entityType: AuditEntityType) {
  switch (entityType) {
    case "user":
      return <User className="h-4 w-4" />;
    case "gallery":
      return <Image className="h-4 w-4" />;
    case "subscription":
      return <CreditCard className="h-4 w-4" />;
    case "system":
      return <Shield className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
}

/**
 * Get badge class for action type
 */
function getActionBadgeClass(actionType: AuditActionType): string {
  if (actionType.includes("delete") || actionType.includes("suspend") || actionType.includes("cancel")) {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  if (actionType.includes("view") || actionType.includes("login")) {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }
  if (actionType.includes("reactivate")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  return "bg-amber-100 text-amber-700 border-amber-200";
}

/**
 * Action type labels in French
 */
const ACTION_TYPE_LABELS: Record<AuditActionType, string> = {
  user_view: "Consultation",
  user_update: "Modification",
  user_suspend: "Suspension",
  user_reactivate: "Réactivation",
  gallery_view: "Consultation",
  gallery_deactivate: "Désactivation",
  gallery_delete: "Suppression",
  subscription_update: "Modification",
  subscription_cancel: "Annulation",
  admin_login: "Connexion",
};

/**
 * Entity type labels in French
 */
const ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  user: "Utilisateur",
  gallery: "Galerie",
  subscription: "Abonnement",
  system: "Système",
};

/**
 * Get link for entity
 */
function getEntityLink(entityType: AuditEntityType, entityId: string | null): string | null {
  if (!entityId) return null;
  
  switch (entityType) {
    case "user":
      return `/admin/users/${entityId}`;
    case "gallery":
      return `/admin/galleries/${entityId}`;
    default:
      return null;
  }
}

/**
 * Format details for display
 */
function formatDetails(details: Record<string, unknown>): string {
  if (!details || Object.keys(details).length === 0) return "-";
  
  const parts: string[] = [];
  
  if (details.reason) {
    parts.push(`Raison: ${details.reason}`);
  }
  if (details.previous_value !== undefined && details.new_value !== undefined) {
    parts.push(`${details.previous_value} → ${details.new_value}`);
  }
  if (details.plan) {
    parts.push(`Plan: ${details.plan}`);
  }
  if (details.email) {
    parts.push(`Email: ${details.email}`);
  }
  
  return parts.length > 0 ? parts.join(" | ") : JSON.stringify(details).slice(0, 50);
}

/**
 * Audit Log Table Component
 * 
 * Displays a list of audit logs with pagination.
 * Requirements: 7.1, 7.2
 */
export function AuditLogTable({
  logs,
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  isLoading = false,
}: AuditLogTableProps) {
  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Administrateur
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Entité
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Détails
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Aucune entrée trouvée
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const entityLink = getEntityLink(log.entity_type, log.entity_id);
                  
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-slate-800">
                            {new Date(log.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-slate-500">
                            {new Date(log.created_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {log.admin_name || "Admin"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {log.admin_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`${getActionBadgeClass(log.action_type)} flex items-center gap-1.5 w-fit`}
                        >
                          {getActionIcon(log.action_type)}
                          {ACTION_TYPE_LABELS[log.action_type]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            {getEntityIcon(log.entity_type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {ENTITY_TYPE_LABELS[log.entity_type]}
                            </p>
                            {log.entity_id && (
                              entityLink ? (
                                <Link
                                  href={entityLink}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-mono"
                                >
                                  {log.entity_id.slice(0, 8)}...
                                </Link>
                              ) : (
                                <p className="text-xs text-slate-400 font-mono">
                                  {log.entity_id.slice(0, 8)}...
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 max-w-xs truncate" title={formatDetails(log.details)}>
                          {formatDetails(log.details)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-600">
                          {log.ip_address || "-"}
                        </code>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Affichage de {(page - 1) * limit + 1} à{" "}
            {Math.min(page * limit, total)} sur {total} entrées
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <span className="text-sm text-slate-600 px-2">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
