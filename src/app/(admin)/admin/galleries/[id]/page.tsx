"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { GalleryDetailCard } from "@/components/admin/gallery-detail-card";
import { GalleryActions } from "@/components/admin/gallery-actions";
import type { GalleryDetails, AuditLogWithAdmin } from "@/types/admin";

/**
 * Loading skeleton for the gallery detail page
 */
function GalleryDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-[600px] rounded-2xl" />
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
    gallery_view: "Consultation",
    gallery_deactivate: "Désactivation",
    gallery_delete: "Suppression",
  };
  return actionLabels[actionType] || actionType;
}

/**
 * Get badge class for action type
 */
function getActionBadgeClass(actionType: string): string {
  switch (actionType) {
    case "gallery_delete":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "gallery_deactivate":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

/**
 * Admin Gallery Detail Page
 * 
 * Displays detailed gallery information with actions for:
 * - Viewing gallery details, images, owner info
 * - Deactivating gallery
 * - Deleting gallery
 * 
 * Requirements: 4.3, 4.4, 4.5
 */
export default function AdminGalleryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const galleryId = params.id as string;

  const [gallery, setGallery] = useState<GalleryDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGallery = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/galleries/${galleryId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du chargement de la galerie");
      }

      const result = await response.json();
      setGallery(result.gallery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }, [galleryId]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  if (isLoading) {
    return <GalleryDetailSkeleton />;
  }

  if (error || !gallery) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/galleries"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux galeries
        </Link>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <p className="text-rose-700 font-medium">
            {error || "Galerie non trouvée"}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/galleries")}
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
          href="/admin/galleries"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux galeries
        </Link>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gallery Details */}
        <div className="lg:col-span-2 space-y-6">
          <GalleryDetailCard gallery={gallery} />

          {/* Audit History */}
          {gallery.audit_history && gallery.audit_history.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" />
                Historique des actions
              </h3>
              <div className="space-y-3">
                {gallery.audit_history.slice(0, 10).map((log: AuditLogWithAdmin) => (
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
                {gallery.audit_history.length > 10 && (
                  <p className="text-sm text-slate-500 text-center py-2">
                    +{gallery.audit_history.length - 10} autres actions
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions Sidebar */}
        <div>
          <GalleryActions gallery={gallery} onUpdate={fetchGallery} />
        </div>
      </div>
    </div>
  );
}
