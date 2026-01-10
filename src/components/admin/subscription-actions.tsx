"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowUpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import type { SubscriptionPlan } from "@/types/index";

interface SubscriptionActionsProps {
  userId: string;
  userEmail: string;
  currentPlan: SubscriptionPlan;
  stripeSubscriptionId: string | null;
  isAdmin?: boolean;
  onUpdate?: () => void;
}

/**
 * Subscription Actions Component
 * 
 * Provides actions for managing a user's subscription:
 * - Manual upgrade to a different plan
 * - Cancel subscription (downgrade to free)
 * 
 * Requirements: 6.3, 6.4
 */
export function SubscriptionActions({
  userId,
  userEmail,
  currentPlan,
  stripeSubscriptionId,
  isAdmin = false,
  onUpdate,
}: SubscriptionActionsProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(currentPlan);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleManualUpgrade = async () => {
    if (selectedPlan === currentPlan) return;

    setIsUpgrading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/subscriptions/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      setSuccess(`Plan mis à jour vers ${selectedPlan}`);
      router.refresh();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) {
      setError("Veuillez indiquer une raison pour l'annulation");
      return;
    }

    setIsCancelling(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/subscriptions/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'annulation");
      }

      setShowCancelDialog(false);
      setCancelReason("");
      setSuccess("Abonnement annulé avec succès");
      setSelectedPlan("free");
      router.refresh();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsCancelling(false);
    }
  };

  // Don't show actions for admin users
  if (isAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">
            Les abonnements des administrateurs ne peuvent pas être modifiés
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-slate-800">
          Gestion de l'abonnement
        </h3>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {/* Current Plan Info */}
      <div className="bg-slate-50 rounded-lg p-4">
        <p className="text-sm text-slate-500">Plan actuel</p>
        <p className="text-lg font-semibold text-slate-800 capitalize">
          {currentPlan}
        </p>
        {stripeSubscriptionId && (
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Stripe: {stripeSubscriptionId}
          </p>
        )}
      </div>

      {/* Manual Upgrade */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">
          Mise à niveau manuelle
        </label>
        <p className="text-xs text-slate-500">
          Modifier le plan sans passer par Stripe (gratuit pour l'utilisateur)
        </p>
        <div className="flex gap-2">
          <Select
            value={selectedPlan}
            onValueChange={(value) => setSelectedPlan(value as SubscriptionPlan)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleManualUpgrade}
            disabled={selectedPlan === currentPlan || isUpgrading}
          >
            {isUpgrading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpCircle className="h-4 w-4" />
            )}
            Appliquer
          </Button>
        </div>
      </div>

      {/* Cancel Subscription */}
      {currentPlan !== "free" && (
        <div className="pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle className="h-4 w-4" />
            Annuler l'abonnement
          </Button>
          <p className="text-xs text-slate-500 mt-2 text-center">
            L'utilisateur sera rétrogradé au plan gratuit
          </p>
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler l'abonnement</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va annuler l'abonnement de {userEmail} et le
              rétrograder au plan gratuit. Les limites de stockage et de galeries
              seront réduites.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-slate-700">
              Raison de l'annulation
            </label>
            <Input
              className="mt-2"
              placeholder="Ex: Demande de l'utilisateur, problème de paiement..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling || !cancelReason.trim()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
