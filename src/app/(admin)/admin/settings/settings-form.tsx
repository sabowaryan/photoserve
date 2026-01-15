"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { LoadingButton } from "@/components/ui/loading-button";
import { CreditCard, Sparkles, AlertCircle, CheckCircle } from "lucide-react";

interface SettingsFormProps {
  initialSettings: {
    stripe_enabled: boolean;
    ai_features_enabled: boolean;
  };
}

/**
 * Settings Form Component
 * 
 * Client-side form for toggling admin settings with:
 * - Stripe payment processing toggle
 * - AI features toggle
 * - Real-time updates via API
 * - Success/error feedback
 * 
 * Requirements: A.1.1, A.1.2
 */
export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /**
   * Handle settings update
   */
  const handleUpdate = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update settings");
      }

      setMessage({
        type: "success",
        text: "Paramètres mis à jour avec succès",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating settings:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle toggle change
   */
  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">
          Fonctionnalités Globales
        </h2>
        <p className="text-sm text-slate-500">
          Activer ou désactiver les fonctionnalités de la plateforme
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm font-medium ${
              message.type === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Settings Toggles */}
      <div className="space-y-4">
        {/* Stripe Toggle */}
        <div className="flex items-start justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Paiements Stripe
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Active les fonctionnalités de paiement (paywall, vente de galeries).
                Lorsque désactivé, les utilisateurs verront un message indiquant que
                les paiements sont temporairement indisponibles.
              </p>
              {!settings.stripe_enabled && (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  ⚠️ Les fonctionnalités paywall sont actuellement désactivées
                </p>
              )}
            </div>
          </div>
          <Switch
            checked={settings.stripe_enabled}
            onCheckedChange={(checked) => handleToggle("stripe_enabled", checked)}
            disabled={isLoading}
          />
        </div>

        {/* AI Features Toggle */}
        <div className="flex items-start justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Fonctionnalités IA
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Active les fonctionnalités d'intelligence artificielle (reconnaissance
                faciale, génération automatique de descriptions, tri intelligent).
                Désactiver pour économiser les coûts API.
              </p>
              {!settings.ai_features_enabled && (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  ⚠️ Les fonctionnalités IA sont actuellement désactivées
                </p>
              )}
            </div>
          </div>
          <Switch
            checked={settings.ai_features_enabled}
            onCheckedChange={(checked) =>
              handleToggle("ai_features_enabled", checked)
            }
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end pt-4 border-t border-slate-200">
        <LoadingButton
          onClick={handleUpdate}
          isLoading={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Enregistrer les modifications
        </LoadingButton>
      </div>
    </div>
  );
}
