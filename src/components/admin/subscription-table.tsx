"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionListItem } from "@/types/admin";
import type { SubscriptionPlan } from "@/types/index";

interface SubscriptionTableProps {
  subscriptions: SubscriptionListItem[];
  isLoading?: boolean;
  onActionComplete?: () => void;
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
 * Get badge variant for subscription status
 */
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "trialing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "past_due":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "canceled":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

/**
 * Get status label in French
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Actif";
    case "trialing":
      return "Essai";
    case "past_due":
      return "En retard";
    case "canceled":
      return "Annulé";
    case "none":
      return "Aucun";
    default:
      return status;
  }
}

/**
 * Subscription Table Component
 * 
 * Displays a list of subscriptions with search and filtering.
 * Requirements: 6.1, 6.2
 */
export function SubscriptionTable({
  subscriptions,
  isLoading = false,
}: SubscriptionTableProps) {
  const [searchValue, setSearchValue] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Filter subscriptions based on search and plan filter
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      !searchValue ||
      sub.userEmail.toLowerCase().includes(searchValue.toLowerCase()) ||
      (sub.userName?.toLowerCase().includes(searchValue.toLowerCase()) ?? false);
    
    const matchesPlan = planFilter === "all" || sub.plan === planFilter;
    
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par email ou nom..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous les plans</option>
            <option value="premium">Premium</option>
            <option value="pro">Pro</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Stripe ID
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fin de période
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
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
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Aucun abonnement trouvé
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((subscription) => (
                  <tr
                    key={subscription.userId}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${subscription.userId}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {subscription.userName || "Sans nom"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {subscription.userEmail}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={getPlanBadgeClass(subscription.plan)}
                      >
                        {subscription.plan.charAt(0).toUpperCase() +
                          subscription.plan.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={getStatusBadgeClass(subscription.status)}
                      >
                        {getStatusLabel(subscription.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {subscription.stripeSubscriptionId ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-600">
                            {subscription.stripeSubscriptionId.slice(0, 20)}...
                          </code>
                          <a
                            href={`https://dashboard.stripe.com/subscriptions/${subscription.stripeSubscriptionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${subscription.userId}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Gérer
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-slate-500">
        {filteredSubscriptions.length} abonnement(s) affiché(s)
        {searchValue || planFilter !== "all"
          ? ` sur ${subscriptions.length} au total`
          : ""}
      </div>
    </div>
  );
}
