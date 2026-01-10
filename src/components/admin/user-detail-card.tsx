"use client";

import { User, Mail, Calendar, HardDrive, Image, CreditCard, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UserDetails } from "@/types/admin";
import type { SubscriptionPlan } from "@/types/index";

interface UserDetailCardProps {
  user: UserDetails;
}

/**
 * Format storage size for display
 */
function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
}

/**
 * Get badge variant for subscription plan
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
 * User Detail Card Component
 * 
 * Displays detailed user information including account details,
 * subscription status, storage usage, and gallery count.
 * Requirements: 3.3
 */
export function UserDetailCard({ user }: UserDetailCardProps) {
  const storagePercentage = Math.min(
    (user.storage_used_mb / user.storage_limit_mb) * 100,
    100
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
            {user.is_admin ? (
              <Shield className="h-8 w-8 text-white" />
            ) : (
              <User className="h-8 w-8 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {user.name || "Sans nom"}
            </h2>
            <p className="text-indigo-100">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Badge
            variant="outline"
            className="bg-white/20 text-white border-white/30"
          >
            {user.subscription_plan.charAt(0).toUpperCase() +
              user.subscription_plan.slice(1)}
          </Badge>
          <Badge
            variant="outline"
            className={`${
              user.is_suspended
                ? "bg-rose-500/20 text-white border-rose-300/30"
                : "bg-emerald-500/20 text-white border-emerald-300/30"
            }`}
          >
            {user.is_suspended ? "Suspendu" : "Actif"}
          </Badge>
          {user.is_admin && (
            <Badge
              variant="outline"
              className="bg-amber-500/20 text-white border-amber-300/30"
            >
              Admin
            </Badge>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-6">
        {/* Account Info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Informations du compte
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Mail className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-800">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Inscription</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(user.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Abonnement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Plan actuel</p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getPlanBadgeClass(user.subscription_plan)}
                  >
                    {user.subscription_plan.charAt(0).toUpperCase() +
                      user.subscription_plan.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="h-5 w-5 flex items-center justify-center">
                <div
                  className={`h-3 w-3 rounded-full ${
                    user.stripe_subscription_id
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">Stripe</p>
                <p className="text-sm font-medium text-slate-800">
                  {user.stripe_subscription_id
                    ? "Abonnement actif"
                    : "Pas d'abonnement"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Storage */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Stockage
          </h3>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-800">
                  {formatStorage(user.storage_used_mb)} utilisé
                </span>
              </div>
              <span className="text-sm text-slate-500">
                sur {formatStorage(user.storage_limit_mb)}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  storagePercentage > 90
                    ? "bg-rose-500"
                    : storagePercentage > 70
                    ? "bg-amber-500"
                    : "bg-indigo-500"
                }`}
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {storagePercentage.toFixed(1)}% utilisé
            </p>
          </div>
        </div>

        {/* Galleries */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Galeries ({user.galleries.length})
          </h3>
          {user.galleries.length === 0 ? (
            <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">
              Aucune galerie créée
            </p>
          ) : (
            <div className="space-y-2">
              {user.galleries.slice(0, 5).map((gallery) => (
                <div
                  key={gallery.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Image className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-800">
                      {gallery.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {gallery.views_count} vues
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        gallery.is_active
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }
                    >
                      {gallery.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
              {user.galleries.length > 5 && (
                <p className="text-sm text-slate-500 text-center py-2">
                  +{user.galleries.length - 5} autres galeries
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
