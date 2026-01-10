"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UserDetailCard } from "@/components/admin/user-detail-card";
import { UserActions } from "@/components/admin/user-actions";
import type { UserDetails, AuditLogWithAdmin } from "@/types/admin";

/**
 * Loading skeleton for the user detail page
 */
function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-[500px] rounded-2xl" />
        </div>
        <div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Format action type for display
 */
function formatActionType(actionType: string): string {
  const actionLabels: Record<string, string> = {
    user_view: "Consultation",
    user_update: "Modification",
    user_suspend: "Suspension",
    user_reactivate: "Réactivation",
    subscription_update: "Mise à jour abonnement",
    subscription_cancel: "Annulation abonnement",
  };
  return actionLabels[actionType] || actionType;
}

/**
 * Get badge class for action type
 */
function getActionBadgeClass(actionType: string): string {
  switch (actionType) {
    case "user_suspend":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "user_reactivate":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "user_update":
    case "subscription_update":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

/**
 * Admin User Detail Page
 * 
 * Displays detailed user information with actions for:
 * - Viewing account details, subscription status, storage usage
 * - Updating subscription plan
 * - Suspending/reactivating account
 * 
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */
export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du chargement de l'utilisateur");
      }

      const result = await response.json();
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return <UserDetailSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux utilisateurs
        </Link>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <p className="text-rose-700 font-medium">
            {error || "Utilisateur non trouvé"}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/users")}
            className="mt-4"
          >
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux utilisateurs
        </Link>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Details */}
        <div className="lg:col-span-2 space-y-6">
          <UserDetailCard user={user} />

          {/* Audit History */}
          {user.audit_history && user.audit_history.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" />
                Historique des actions
              </h3>
              <div className="space-y-3">
                {user.audit_history.slice(0, 10).map((log: AuditLogWithAdmin) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={getActionBadgeClass(log.action_type)}
                        >
                          {formatActionType(log.action_type)}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          par {log.admin_email || "Admin"}
                        </span>
                      </div>
                      {log.details && typeof log.details === "object" && (
                        <p className="text-sm text-slate-600">
                          {(log.details as Record<string, unknown>).reason as string ||
                            (log.details as Record<string, unknown>).action as string ||
                            JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
                {user.audit_history.length > 10 && (
                  <p className="text-sm text-slate-500 text-center py-2">
                    +{user.audit_history.length - 10} autres actions
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions Sidebar */}
        <div>
          <UserActions user={user} onUpdate={fetchUser} />
        </div>
      </div>
    </div>
  );
}
