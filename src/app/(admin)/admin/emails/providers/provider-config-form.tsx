"use client";

import { useState, useEffect } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Server,
  Key,
  Globe,
} from "lucide-react";

type ProviderName = "resend" | "aws-ses";

interface Provider {
  id: string;
  name: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ProviderConfigFormProps {
  providers: Provider[];
  activeProviderName: string | null;
}

interface ResendConfig {
  apiKey: string;
}

interface SESConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

/**
 * Provider Configuration Form Component
 * 
 * Client-side form for configuring email providers with:
 * - Provider selection (Resend or AWS SES)
 * - Provider-specific configuration forms
 * - Connection testing
 * - Provider switching
 * - Success/error feedback
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
export function ProviderConfigForm({
  providers,
  activeProviderName,
}: ProviderConfigFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderName>(
    (activeProviderName as ProviderName) || "resend"
  );
  const [isConfigured, setIsConfigured] = useState(
    providers.some((p) => p.name === selectedProvider)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Resend configuration
  const [resendConfig, setResendConfig] = useState<ResendConfig>({
    apiKey: "",
  });

  // AWS SES configuration
  const [sesConfig, setSesConfig] = useState<SESConfig>({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
  });

  // Debug: Log active provider
  useEffect(() => {
    console.log('[ProviderConfigForm] Active provider:', activeProviderName);
    console.log('[ProviderConfigForm] Selected provider:', selectedProvider);
    console.log('[ProviderConfigForm] Providers:', providers);
  }, [activeProviderName, selectedProvider, providers]);

  /**
   * Load existing configuration when provider changes
   */
  useEffect(() => {
    const loadProviderConfig = async () => {
      // Check if provider is configured
      const providerExists = providers.some((p) => p.name === selectedProvider);
      setIsConfigured(providerExists);

      if (!providerExists) {
        // Reset form if provider not configured
        if (selectedProvider === "resend") {
          setResendConfig({ apiKey: "" });
        } else {
          setSesConfig({ accessKeyId: "", secretAccessKey: "", region: "us-east-1" });
        }
        return;
      }

      // Load configuration from API
      setIsLoadingConfig(true);
      try {
        const response = await fetch(`/api/admin/emails/providers/${selectedProvider}/config`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (selectedProvider === "resend" && data.config) {
            setResendConfig({
              apiKey: data.config.apiKey || "",
            });
          } else if (selectedProvider === "aws-ses" && data.config) {
            setSesConfig({
              accessKeyId: data.config.accessKeyId || "",
              secretAccessKey: data.config.secretAccessKey || "",
              region: data.config.region || "us-east-1",
            });
          }
        }
      } catch (error) {
        console.error("Error loading provider config:", error);
        // Don't show error to user, just keep empty form
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadProviderConfig();
  }, [selectedProvider, providers]);

  /**
   * Handle provider selection change
   */
  const handleProviderChange = (provider: ProviderName) => {
    setSelectedProvider(provider);
    setIsConfigured(providers.some((p) => p.name === provider));
    setMessage(null);
  };

  /**
   * Handle save configuration
   */
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const config =
        selectedProvider === "resend" ? resendConfig : sesConfig;

      // Validate configuration
      if (selectedProvider === "resend" && !resendConfig.apiKey) {
        throw new Error("Resend API key is required");
      }

      if (selectedProvider === "aws-ses") {
        if (!sesConfig.accessKeyId || !sesConfig.secretAccessKey) {
          throw new Error("AWS credentials are required");
        }
        if (!sesConfig.region) {
          throw new Error("AWS region is required");
        }
      }

      console.log('[ProviderConfigForm] Saving config:', {
        provider: selectedProvider,
        hasApiKey: selectedProvider === 'resend' ? !!resendConfig.apiKey : undefined,
        hasAccessKey: selectedProvider === 'aws-ses' ? !!sesConfig.accessKeyId : undefined,
      });

      const response = await fetch("/api/admin/emails/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider,
          config,
        }),
      });

      console.log('[ProviderConfigForm] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ProviderConfigForm] Save failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          provider: selectedProvider,
        });
        
        let errorMessage = `Failed to save configuration (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // If not JSON, use the text as is
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      setIsConfigured(true);
      
      // Reload page to update provider list
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      // If no provider is currently active, offer to activate this one
      if (!activeProviderName) {
        setMessage({
          type: "info",
          text: "Configuration saved successfully. Reloading to show activation button...",
        });
      } else {
        setMessage({
          type: "success",
          text: "Configuration saved successfully. Reloading...",
        });
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to save configuration",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle test connection
   */
  const handleTestConnection = async () => {
    setIsTesting(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/emails/providers/${selectedProvider}/test`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Connection test failed");
      }

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: "Connection test successful! Provider is working correctly.",
        });
      } else {
        throw new Error(result.error || "Connection test failed");
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to test connection",
      });
    } finally {
      setIsTesting(false);
    }
  };

  /**
   * Handle activate provider
   */
  const handleActivateProvider = async () => {
    setIsActivating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/emails/providers/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to activate provider");
      }

      setMessage({
        type: "success",
        text: `${selectedProvider === "resend" ? "Resend" : "AWS SES"} is now the active email provider.`,
      });

      // Reload page to update active provider status
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error activating provider:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to activate provider",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const isActive = activeProviderName === selectedProvider;
  const isResendActive = activeProviderName === "resend";
  const isAwsSesActive = activeProviderName === "aws-ses";

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-6">
      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
          <p><strong>Debug:</strong></p>
          <p>Active Provider: {activeProviderName || 'none'}</p>
          <p>Selected Provider: {selectedProvider}</p>
          <p>Is Configured: {isConfigured ? 'yes' : 'no'}</p>
          <p>Is Active: {isActive ? 'yes' : 'no'}</p>
          <p>Show Activate Button: {(isConfigured && !isActive) ? 'yes' : 'no'}</p>
          <p>Configured Providers: {providers.map(p => `${p.name}${p.is_active ? ' (active)' : ''}`).join(', ')}</p>
        </div>
      )}
      
      {/* Provider Selection */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">
          Select Email Provider
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Choose which email service provider to configure
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resend Option */}
          <button
            onClick={() => handleProviderChange("resend")}
            className={`relative p-4 rounded-lg border-2 transition-all text-left ${
              selectedProvider === "resend"
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedProvider === "resend"
                    ? "bg-indigo-100"
                    : "bg-slate-100"
                }`}
              >
                <Mail
                  className={`h-5 w-5 ${
                    selectedProvider === "resend"
                      ? "text-indigo-600"
                      : "text-slate-600"
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  Resend
                </h3>
                <p className="text-xs text-slate-500">
                  Modern email API with simple setup
                </p>
              </div>
              {isResendActive && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                </div>
              )}
            </div>
          </button>

          {/* AWS SES Option */}
          <button
            onClick={() => handleProviderChange("aws-ses")}
            className={`relative p-4 rounded-lg border-2 transition-all text-left ${
              selectedProvider === "aws-ses"
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedProvider === "aws-ses"
                    ? "bg-indigo-100"
                    : "bg-slate-100"
                }`}
              >
                <Server
                  className={`h-5 w-5 ${
                    selectedProvider === "aws-ses"
                      ? "text-indigo-600"
                      : "text-slate-600"
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  AWS SES
                </h3>
                <p className="text-xs text-slate-500">
                  Amazon Simple Email Service
                </p>
              </div>
              {isAwsSesActive && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : message.type === "error"
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : message.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm font-medium ${
              message.type === "success"
                ? "text-green-800"
                : message.type === "error"
                  ? "text-red-800"
                  : "text-blue-800"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Configuration Form */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          {selectedProvider === "resend" ? "Resend" : "AWS SES"} Configuration
        </h3>

        {selectedProvider === "resend" ? (
          <ResendConfigForm
            config={resendConfig}
            onChange={setResendConfig}
            disabled={isSaving || isTesting || isActivating || isLoadingConfig}
            isLoading={isLoadingConfig}
          />
        ) : (
          <SESConfigForm
            config={sesConfig}
            onChange={setSesConfig}
            disabled={isSaving || isTesting || isActivating || isLoadingConfig}
            isLoading={isLoadingConfig}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <LoadingButton
            onClick={handleSaveConfig}
            isLoading={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Save Configuration
          </LoadingButton>

          {isConfigured && (
            <LoadingButton
              onClick={handleTestConnection}
              isLoading={isTesting}
              variant="outline"
              className="px-6 py-2 rounded-lg text-sm font-semibold"
            >
              Test Connection
            </LoadingButton>
          )}
        </div>

        {/* Activation Button - Only show if configured but not active */}
        {isConfigured && !isActive && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Ce provider est configuré mais pas actif
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Cliquez sur le bouton pour activer ce provider
              </p>
            </div>
            <LoadingButton
              onClick={handleActivateProvider}
              isLoading={isActivating}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
            >
              Activer ce Provider
            </LoadingButton>
          </div>
        )}

        {/* Info when provider is active */}
        {isActive && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                ✓ Ce provider est actuellement actif
              </p>
              <p className="text-xs text-green-700 mt-1">
                Pour le désactiver, configurez et activez un autre provider
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Resend Configuration Form
 */
function ResendConfigForm({
  config,
  onChange,
  disabled,
  isLoading,
}: {
  config: ResendConfig;
  onChange: (config: ResendConfig) => void;
  disabled: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="resend-api-key" className="text-slate-700 mb-2 block">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Key
            {isLoading && (
              <span className="text-xs text-slate-500">(Loading...)</span>
            )}
          </div>
        </Label>
        <Input
          id="resend-api-key"
          type="password"
          placeholder={isLoading ? "Loading..." : "re_..."}
          value={config.apiKey}
          onChange={(e) => onChange({ apiKey: e.target.value })}
          disabled={disabled}
          className="font-mono text-sm"
        />
        <p className="text-xs text-slate-500 mt-1.5">
          Get your API key from{" "}
          <a
            href="https://resend.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 underline"
          >
            Resend Dashboard
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * AWS SES Configuration Form
 */
function SESConfigForm({
  config,
  onChange,
  disabled,
  isLoading,
}: {
  config: SESConfig;
  onChange: (config: SESConfig) => void;
  disabled: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="ses-access-key"
          className="text-slate-700 mb-2 block"
        >
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Access Key ID
            {isLoading && (
              <span className="text-xs text-slate-500">(Loading...)</span>
            )}
          </div>
        </Label>
        <Input
          id="ses-access-key"
          type="text"
          placeholder={isLoading ? "Loading..." : "AKIA..."}
          value={config.accessKeyId}
          onChange={(e) =>
            onChange({ ...config, accessKeyId: e.target.value })
          }
          disabled={disabled}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <Label
          htmlFor="ses-secret-key"
          className="text-slate-700 mb-2 block"
        >
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Secret Access Key
            {isLoading && (
              <span className="text-xs text-slate-500">(Loading...)</span>
            )}
          </div>
        </Label>
        <Input
          id="ses-secret-key"
          type="password"
          placeholder={isLoading ? "Loading..." : "••••••••"}
          value={config.secretAccessKey}
          onChange={(e) =>
            onChange({ ...config, secretAccessKey: e.target.value })
          }
          disabled={disabled}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <Label htmlFor="ses-region" className="text-slate-700 mb-2 block">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            AWS Region
          </div>
        </Label>
        <Select
          value={config.region}
          onValueChange={(value) => onChange({ ...config, region: value })}
          disabled={disabled}
        >
          <SelectTrigger id="ses-region">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
            <SelectItem value="us-east-2">US East (Ohio)</SelectItem>
            <SelectItem value="us-west-1">US West (N. California)</SelectItem>
            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
            <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
            <SelectItem value="eu-west-2">EU (London)</SelectItem>
            <SelectItem value="eu-central-1">EU (Frankfurt)</SelectItem>
            <SelectItem value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
            <SelectItem value="ap-northeast-1">
              Asia Pacific (Tokyo)
            </SelectItem>
            <SelectItem value="ap-northeast-2">
              Asia Pacific (Seoul)
            </SelectItem>
            <SelectItem value="ap-southeast-1">
              Asia Pacific (Singapore)
            </SelectItem>
            <SelectItem value="ap-southeast-2">
              Asia Pacific (Sydney)
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-1.5">
          Select the AWS region where your SES service is configured
        </p>
      </div>
    </div>
  );
}
