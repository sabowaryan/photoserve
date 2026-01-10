"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserX,
  UserCheck,
  CreditCard,
  AlertTriangle,
  Loader2,
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
import type { UserDetails } from "@/types/admin";
import type { SubscriptionPlan } from "@/types/index";

interface UserActionsProps {
  user: UserDetails;
  onUpdate?: () => void;
}

/**
 * User Actions Component
 * 
 * Provides actions for managing a user:
 * - Update subscription plan
 * - Suspend user account
 * - Reactivate suspended account
 * 
 * Requirements: 3.4, 3.5, 3.6
 */
export function UserActions({ user, onUpdate }: UserActionsProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    user.subscription_plan
  );
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePlan = async () => {
    if (selectedPlan === user.subscription_plan) return;

    setIsUpdatingPlan(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      router.refresh();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      setError("Veuillez indiquer une raison pour la suspension");
      return;
    }

    setIsSuspending(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspendReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suspension");
      }

      setShowSuspendDialog(false);
      setSuspendReason("");
      router.refresh();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSuspending(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/reactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la réactivation");
      }

      setShowReactivateDialog(false);
      router.refresh();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsReactivating(false);
    }
  };

  // Don't show actions for admin users
  if (user.is_admin) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">
            Les comptes administrateurs ne peuvent pas être modifiés
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Actions</h3>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Update Plan */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">
          Modifier le plan
        </label>
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
            onClick={handleUpdatePlan}
            disabled={
              selectedPlan === user.subscription_plan || isUpdatingPlan
            }
          >
            {isUpdatingPlan ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Appliquer
          </Button>
        </div>
      </div>

      {/* Suspend / Reactivate */}
      <div className="pt-4 border-t border-slate-200">
        {user.is_suspended ? (
          <Button
            variant="outline"
            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => setShowReactivateDialog(true)}
          >
            <UserCheck className="h-4 w-4" />
            Réactiver le compte
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
            onClick={() => setShowSuspendDialog(true)}
          >
            <UserX className="h-4 w-4" />
            Suspendre le compte
          </Button>
        )}
      </div>

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspendre l'utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va suspendre le compte de {user.email} et désactiver
              toutes ses galeries. L'utilisateur ne pourra plus se connecter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-slate-700">
              Raison de la suspension
            </label>
            <Input
              className="mt-2"
              placeholder="Ex: Violation des conditions d'utilisation"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSuspending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={isSuspending || !suspendReason.trim()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isSuspending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Suspendre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Dialog */}
      <AlertDialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réactiver l'utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va réactiver le compte de {user.email} et restaurer
              l'accès à ses galeries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReactivating}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={isReactivating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isReactivating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Réactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
