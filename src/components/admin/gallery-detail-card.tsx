"use client";

import Link from "next/link";
import { Image, Calendar, Eye, Link as LinkIcon, User, HardDrive, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GalleryDetails } from "@/types/admin";
import type { SubscriptionPlan } from "@/types/index";

interface GalleryDetailCardProps {
  gallery: GalleryDetails;
}

/**
 * Format storage size for display
 */
function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(2)} MB`;
}

/**
 * Get status label for gallery
 */
function getStatusLabel(isActive: boolean, expiresAt: string): string {
  const isExpired = new Date(expiresAt) < new Date();
  
  if (!isActive) {
    return "Inactive";
  }
  if (isExpired) {
    return "Expirée";
  }
  return "Active";
}

/**
 * Get badge class for subscription plan
 */
function getPlanBadgeClass(plan: SubscriptionPlan): string {
  switch (plan) {
    case "pro":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "premium":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

/**
 * Gallery Detail Card Component
 * 
 * Displays detailed gallery information including images, owner info,
 * and view statistics.
 * Requirements: 4.3
 */
export function GalleryDetailCard({ gallery }: GalleryDetailCardProps) {
  const totalStorageMb = gallery.images.reduce((sum, img) => sum + img.file_size_mb, 0);
  const isExpired = new Date(gallery.expires_at) < new Date();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
            <Image className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">
              {gallery.title}
            </h2>
            <p className="text-indigo-100 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              {gallery.unique_slug}
            </p>
          </div>
          <a
            href={`/g/${gallery.unique_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm hover:bg-white/30 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Voir
          </a>
        </div>
        <div className="flex gap-2 mt-4">
          <Badge
            variant="outline"
            className={`${
              gallery.is_active && !isExpired
                ? "bg-emerald-500/20 text-white border-emerald-300/30"
                : isExpired
                ? "bg-amber-500/20 text-white border-amber-300/30"
                : "bg-slate-500/20 text-white border-slate-300/30"
            }`}
          >
            {getStatusLabel(gallery.is_active, gallery.expires_at)}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
              <Image className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{gallery.image_count}</p>
            <p className="text-xs text-slate-500">Images</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
              <Eye className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{gallery.views_count}</p>
            <p className="text-xs text-slate-500">Vues</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
              <HardDrive className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatStorage(totalStorageMb)}</p>
            <p className="text-xs text-slate-500">Stockage</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
              <Calendar className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-slate-800">
              {new Date(gallery.expires_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </p>
            <p className="text-xs text-slate-500">Expiration</p>
          </div>
        </div>

        {/* Owner Info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Propriétaire
          </h3>
          <Link
            href={`/admin/users/${gallery.owner.id}`}
            className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="h-6 w-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">
                {gallery.owner.name || "Sans nom"}
              </p>
              <p className="text-sm text-slate-500">{gallery.owner.email}</p>
            </div>
            <Badge
              variant="outline"
              className={getPlanBadgeClass(gallery.owner.subscription_plan)}
            >
              {gallery.owner.subscription_plan.charAt(0).toUpperCase() +
                gallery.owner.subscription_plan.slice(1)}
            </Badge>
          </Link>
        </div>

        {/* Dates */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Dates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Création</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(gallery.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Expiration</p>
                <p className={`text-sm font-medium ${isExpired ? "text-amber-600" : "text-slate-800"}`}>
                  {new Date(gallery.expires_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Images ({gallery.images.length})
          </h3>
          {gallery.images.length === 0 ? (
            <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">
              Aucune image dans cette galerie
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {gallery.images.slice(0, 12).map((image) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-lg overflow-hidden bg-slate-100 relative group"
                >
                  <img
                    src={image.cloudinary_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-xs text-white">
                      {formatStorage(image.file_size_mb)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {gallery.images.length > 12 && (
            <p className="text-sm text-slate-500 text-center py-3">
              +{gallery.images.length - 12} autres images
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
