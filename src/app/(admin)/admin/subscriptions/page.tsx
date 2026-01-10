"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, TrendingUp, Users } from "lucide-react";
import { SubscriptionTable } from "@/components/admin/subscription-table";
import type { SubscriptionListItem } from "@/types/admin";

/**
 * Admin Subscriptions Page
 * 
 * Displays a list of all subscriptions with management capabilities.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats
  const stats = {
    total: subscriptions.length,
    premium: subscriptions.filter((s) => s.plan === "premium").length,
    pro: subscriptions.filter((s) => s.plan === "pro").length,
    active: subscriptions.filter((s) => s.status === "active").length,
  };

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/subscriptions");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du chargement des abonnements");
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  if (error && subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Abonnements
          </h1>
          <p className="text-slate-500 mt-1">
            Gérer les abonnements des utilisateurs
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <p className="text-rose-700">{error}</p>
          <button
            onClick={fetchSubscriptions}
            className="mt-4 text-sm text-rose-600 hover:text-rose-800 underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <CreditCard className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Abonnements
            </h1>
          </div>
          <p className="text-slate-500 mt-1 ml-12">
            Gérer les abonnements des utilisateurs
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-sm text-slate-500">Total abonnés</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.premium}</p>
              <p className="text-sm text-slate-500">Premium</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.pro}</p>
              <p className="text-sm text-slate-500">Pro</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
              <p className="text-sm text-slate-500">Actifs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Table */}
      <SubscriptionTable
        subscriptions={subscriptions}
        isLoading={isLoading}
        onActionComplete={fetchSubscriptions}
      />
    </div>
  );
}
