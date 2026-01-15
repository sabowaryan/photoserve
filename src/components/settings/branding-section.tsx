'use client';

import { useState, useEffect } from 'react';
import { 
  Palette, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Copy, 
  Globe, 
  Shield, 
  Trash2,
  ExternalLink,
  Clock
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ColorPicker } from './color-picker';
import { normalizeDomain, isValidDomain } from '@/lib/utils/domain';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ProfileBranding, SubscriptionPlan } from '@/types';
import { hasFeatureAccess } from '@/config/plan-features';

interface BrandingSectionProps {
  initialBranding?: ProfileBranding;
  userPlan: SubscriptionPlan;
  onUpdate: (branding: ProfileBranding) => Promise<void>;
}

// Domain verification status type
type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'failed';

// SSL provisioning status type
type SSLStatus = 'idle' | 'provisioning' | 'provisioned' | 'failed';

export function BrandingSection({ initialBranding, userPlan, onUpdate }: BrandingSectionProps) {
  const [branding, setBranding] = useState<ProfileBranding>(initialBranding || {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialBranding?.customLogo || null
  );
  const [previewDark, setPreviewDark] = useState(false);
  
  // Domain verification state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationToken, setVerificationToken] = useState<string | null>(
    initialBranding?.verificationToken || null
  );
  const [sslStatus, setSSLStatus] = useState<SSLStatus>('idle');
  const [showDNSInstructions, setShowDNSInstructions] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Initialize verification status from initial branding
  useEffect(() => {
    if (initialBranding?.domainVerified) {
      setVerificationStatus('verified');
    }
    if (initialBranding?.sslCertificateId && initialBranding?.sslProvider) {
      setSSLStatus('provisioned');
    }
    if (initialBranding?.customDomain && !initialBranding?.domainVerified) {
      setShowDNSInstructions(true);
    }
  }, [initialBranding]);

  // Check feature access
  const hasWhiteLabel = hasFeatureAccess(userPlan, 'whiteLabel');
  const hasCustomDomain = hasFeatureAccess(userPlan, 'customDomain');
  const hasBrandColors = hasFeatureAccess(userPlan, 'brandColors');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    try {
      setIsUploadingLogo(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to /api/profile/logo endpoint
      const response = await fetch('/api/profile/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload logo');
      }

      const data = await response.json();
      
      // Update logo preview and branding state
      setLogoPreview(data.url);
      setBranding((prev) => ({ ...prev, customLogo: data.url }));
      
      toast.success('Logo uploaded successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload logo';
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setBranding((prev) => ({ ...prev, customLogo: undefined }));
  };

  const handleColorChange = (field: 'primary' | 'secondary' | 'accent', color: string) => {
    setBranding((prev) => ({
      ...prev,
      brandColors: {
        primary: prev.brandColors?.primary || '#6366f1',
        secondary: prev.brandColors?.secondary || '#8b5cf6',
        accent: prev.brandColors?.accent || '#ec4899',
        [field]: color,
      },
    }));
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBranding((prev) => ({ ...prev, customDomain: value }));
    
    // Real-time validation
    if (value) {
      const normalized = normalizeDomain(value);
      if (!normalized || !isValidDomain(normalized)) {
        setDomainError('Invalid domain format. Expected: photos.example.com');
      } else {
        setDomainError(null);
        setShowDNSInstructions(true);
      }
    } else {
      setDomainError(null);
      setShowDNSInstructions(false);
    }
  };

  const handleDomainBlur = () => {
    // Normalize domain on blur
    if (branding.customDomain) {
      const normalized = normalizeDomain(branding.customDomain);
      if (normalized && normalized !== branding.customDomain) {
        setBranding((prev) => ({ ...prev, customDomain: normalized }));
      }
    }
  };
  
  const handleVerifyDomain = async () => {
    if (!branding.customDomain) {
      toast.error('Please enter a domain first');
      return;
    }
    
    const normalized = normalizeDomain(branding.customDomain);
    if (!normalized || !isValidDomain(normalized)) {
      toast.error('Invalid domain format');
      return;
    }
    
    try {
      setVerificationStatus('verifying');
      setDomainError(null);
      
      const response = await fetch('/api/domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: normalized }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify domain');
      }
      
      if (data.status === 'verified') {
        setVerificationStatus('verified');
        setVerificationToken(null);
        toast.success('Domain verified successfully!');
        
        // Automatically provision SSL
        handleProvisionSSL();
      } else if (data.status === 'pending') {
        setVerificationStatus('idle');
        setVerificationToken(data.token);
        setShowDNSInstructions(true);
        toast.info('Domain verification pending. Please configure DNS records.');
      } else {
        setVerificationStatus('failed');
        toast.error(data.error || 'Domain verification failed');
      }
    } catch (err) {
      setVerificationStatus('failed');
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify domain';
      toast.error(errorMessage);
      console.error(err);
    }
  };
  
  const handleProvisionSSL = async () => {
    if (!branding.customDomain) return;
    
    try {
      setSSLStatus('provisioning');
      
      const response = await fetch('/api/domain/provision-ssl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: branding.customDomain }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to provision SSL');
      }
      
      if (data.success) {
        setSSLStatus('provisioned');
        toast.success('SSL certificate provisioned successfully!');
      } else {
        setSSLStatus('failed');
        toast.error(data.error || 'SSL provisioning failed');
      }
    } catch (err) {
      setSSLStatus('failed');
      const errorMessage = err instanceof Error ? err.message : 'Failed to provision SSL';
      toast.error(errorMessage);
      console.error(err);
    }
  };
  
  const handleRemoveDomain = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/domain/remove', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove domain');
      }
      
      // Clear domain-related state
      setBranding((prev) => ({
        ...prev,
        customDomain: undefined,
        domainVerified: undefined,
        verificationToken: undefined,
        domainVerifiedAt: undefined,
        sslCertificateId: undefined,
        sslProvider: undefined,
        sslExpiresAt: undefined,
        cloudflareZoneId: undefined,
      }));
      setVerificationStatus('idle');
      setVerificationToken(null);
      setSSLStatus('idle');
      setShowDNSInstructions(false);
      
      toast.success('Domain removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove domain';
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate custom domain if provided
      if (branding.customDomain && !isValidDomain(branding.customDomain)) {
        setError('Invalid custom domain format. Expected: photos.example.com');
        toast.error('Invalid custom domain format');
        return;
      }
      
      // Normalize domain before saving
      const normalizedBranding = {
        ...branding,
        customDomain: branding.customDomain ? (normalizeDomain(branding.customDomain) || undefined) : undefined,
      };
      
      // Call API to update branding
      const response = await fetch('/api/profile/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedBranding),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save branding');
      }

      // Call the onUpdate callback if provided
      await onUpdate(normalizedBranding);
      
      // Show success message
      setError(null);
      toast.success('Branding settings saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save branding settings';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
          <Palette size={18} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Branding</h2>
          <p className="text-xs text-slate-500">Customize your brand identity</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Custom Logo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">Custom Logo</Label>
            {!hasWhiteLabel && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Pro Plan Required
              </span>
            )}
          </div>
          
          {hasWhiteLabel ? (
            <div className="space-y-3">
              {logoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-20 w-auto max-w-[200px] object-contain border border-slate-200 rounded-lg p-2"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    disabled={isUploadingLogo}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className={cn(
                  "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors",
                  isUploadingLogo 
                    ? "border-slate-300 bg-slate-50 cursor-not-allowed" 
                    : "border-slate-300 cursor-pointer hover:border-slate-400"
                )}>
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="w-8 h-8 text-slate-400 mb-2 animate-spin" />
                      <span className="text-sm text-slate-500">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500">Click to upload logo</span>
                      <span className="text-xs text-slate-400 mt-1">PNG, JPG, WebP up to 2MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploadingLogo}
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
              Upgrade to Pro to upload your custom logo and remove PikSend branding.
            </div>
          )}
        </div>

        {/* Custom Domain */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-slate-600" />
              <Label className="text-sm font-medium text-slate-700">Custom Domain</Label>
            </div>
            {!hasCustomDomain && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Pro Plan Required
              </span>
            )}
          </div>
          
          {hasCustomDomain ? (
            <div className="space-y-4">
              {/* Domain Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={branding.customDomain || ''}
                    onChange={handleDomainChange}
                    onBlur={handleDomainBlur}
                    placeholder="photos.yourdomain.com"
                    disabled={isLoading || verificationStatus === 'verifying'}
                    className={cn(
                      domainError && 'border-red-300 focus-visible:ring-red-500'
                    )}
                  />
                  <Button
                    onClick={handleVerifyDomain}
                    disabled={
                      !branding.customDomain || 
                      !!domainError || 
                      verificationStatus === 'verifying' ||
                      verificationStatus === 'verified'
                    }
                    variant="outline"
                    className="shrink-0"
                  >
                    {verificationStatus === 'verifying' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : verificationStatus === 'verified' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                        Verified
                      </>
                    ) : (
                      'Verify Domain'
                    )}
                  </Button>
                </div>
                
                {domainError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {domainError}
                  </p>
                )}
                
                {!domainError && branding.customDomain && (
                  <p className="text-xs text-slate-500">
                    Enter your domain without https:// (e.g., photos.johndoe.com)
                  </p>
                )}
              </div>
              
              {/* Verification Status Indicator */}
              {branding.customDomain && (
                <div className={cn(
                  "p-3 rounded-lg border flex items-start gap-3",
                  verificationStatus === 'verified' && "bg-green-50 border-green-200",
                  verificationStatus === 'failed' && "bg-red-50 border-red-200",
                  verificationStatus === 'idle' && "bg-blue-50 border-blue-200"
                )}>
                  {verificationStatus === 'verified' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">Domain Verified</p>
                        <p className="text-xs text-green-700 mt-1">
                          Your domain is verified and ready to use
                        </p>
                      </div>
                    </>
                  ) : verificationStatus === 'failed' ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Verification Failed</p>
                        <p className="text-xs text-red-700 mt-1">
                          Please check your DNS configuration and try again
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Verification Pending</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Configure your DNS records and click Verify Domain
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* DNS Instructions Panel */}
              {showDNSInstructions && branding.customDomain && verificationStatus !== 'verified' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink size={16} className="text-slate-600" />
                    <h4 className="text-sm font-medium text-slate-900">DNS Configuration</h4>
                  </div>
                  
                  <p className="text-xs text-slate-600">
                    Add one of the following DNS records to your domain:
                  </p>
                  
                  {/* CNAME Record Option */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-700">Option 1: CNAME Record (Recommended)</p>
                    <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500">Type</p>
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">CNAME</code>
                        </div>
                        <div className="space-y-1 flex-1 mx-4">
                          <p className="text-xs text-slate-500">Name</p>
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                            {branding.customDomain?.split('.')[0] || '@'}
                          </code>
                        </div>
                        <div className="space-y-1 flex-1">
                          <p className="text-xs text-slate-500">Value</p>
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">piksend.com</code>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard('piksend.com', 'CNAME value')}
                          className="ml-2"
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* TXT Record Option */}
                  {verificationToken && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-700">Option 2: TXT Record</p>
                      <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500">Type</p>
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">TXT</code>
                          </div>
                          <div className="space-y-1 flex-1 mx-4">
                            <p className="text-xs text-slate-500">Name</p>
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                              _piksend-verify
                            </code>
                          </div>
                          <div className="space-y-1 flex-1">
                            <p className="text-xs text-slate-500">Value</p>
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded truncate max-w-[200px]">
                              {verificationToken}
                            </code>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(verificationToken, 'TXT value')}
                            className="ml-2"
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500 italic">
                    DNS changes may take up to 48 hours to propagate. Click "Verify Domain" once configured.
                  </p>
                </div>
              )}
              
              {/* SSL Status Badge */}
              {verificationStatus === 'verified' && (
                <div className={cn(
                  "p-3 rounded-lg border flex items-start gap-3",
                  sslStatus === 'provisioned' && "bg-green-50 border-green-200",
                  sslStatus === 'provisioning' && "bg-blue-50 border-blue-200",
                  sslStatus === 'failed' && "bg-red-50 border-red-200"
                )}>
                  <Shield className={cn(
                    "w-5 h-5 shrink-0 mt-0.5",
                    sslStatus === 'provisioned' && "text-green-600",
                    sslStatus === 'provisioning' && "text-blue-600",
                    sslStatus === 'failed' && "text-red-600"
                  )} />
                  <div className="flex-1">
                    {sslStatus === 'provisioned' ? (
                      <>
                        <p className="text-sm font-medium text-green-900">SSL Certificate Active</p>
                        <p className="text-xs text-green-700 mt-1">
                          Your domain is secured with HTTPS
                        </p>
                        {branding.sslExpiresAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Expires: {new Date(branding.sslExpiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    ) : sslStatus === 'provisioning' ? (
                      <>
                        <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Provisioning SSL Certificate
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          This may take a few minutes...
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-red-900">SSL Provisioning Failed</p>
                        <p className="text-xs text-red-700 mt-1">
                          Please contact support for assistance
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Remove Domain Button */}
              {branding.customDomain && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={isLoading}
                    >
                      <Trash2 size={14} className="mr-2" />
                      Remove Domain
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Custom Domain?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove your custom domain configuration and SSL certificate. 
                        Your galleries will no longer be accessible via {branding.customDomain}.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRemoveDomain}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove Domain
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
              Upgrade to Pro to use your own domain for gallery links.
            </div>
          )}
        </div>

        {/* Brand Colors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">Brand Colors</Label>
            {!hasBrandColors && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Pro Plan Required
              </span>
            )}
          </div>

          {hasBrandColors ? (
            <div className="space-y-4">
              <ColorPicker
                label="Primary Color"
                value={branding.brandColors?.primary || '#6366f1'}
                onChange={(color) => handleColorChange('primary', color)}
              />
              <ColorPicker
                label="Secondary Color"
                value={branding.brandColors?.secondary || '#8b5cf6'}
                onChange={(color) => handleColorChange('secondary', color)}
              />
              <ColorPicker
                label="Accent Color"
                value={branding.brandColors?.accent || '#ec4899'}
                onChange={(color) => handleColorChange('accent', color)}
              />
              
              {/* Preview Section */}
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">Aperçu</Label>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Mode clair</span>
                    <button
                      type="button"
                      onClick={() => setPreviewDark(!previewDark)}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      style={{ backgroundColor: previewDark ? '#6366f1' : '#cbd5e1' }}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          previewDark ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                    <span>Mode sombre</span>
                  </div>
                </div>
                
                <div 
                  className={cn(
                    "p-4 rounded-lg transition-colors",
                    previewDark ? "bg-slate-900" : "bg-white"
                  )}
                >
                  {/* Preview Button */}
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg text-white font-medium text-sm shadow-lg transition-all hover:scale-105"
                    style={{
                      background: `linear-gradient(to right, ${branding.brandColors?.primary || '#6366f1'}, ${branding.brandColors?.secondary || '#8b5cf6'})`,
                      filter: previewDark ? 'brightness(1.1) saturate(1.1)' : 'none',
                    }}
                  >
                    Télécharger tout
                  </button>
                  
                  <p className={cn(
                    "mt-3 text-xs",
                    previewDark ? "text-slate-400" : "text-slate-600"
                  )}>
                    {previewDark 
                      ? "En mode sombre, vos couleurs sont automatiquement éclaircies pour garantir une bonne lisibilité."
                      : "Vos couleurs de marque seront appliquées aux boutons et éléments interactifs de la galerie."
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
              Upgrade to Pro to customize gallery colors to match your brand.
            </div>
          )}
        </div>

        {/* Save Button */}
        {(hasWhiteLabel || hasCustomDomain || hasBrandColors) && (
          <div className="pt-4 border-t border-slate-200">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Saving...' : 'Save Branding Settings'}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
