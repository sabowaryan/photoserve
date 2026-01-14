'use client';

import { useState } from 'react';
import { Palette, Upload, X, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ColorPicker } from './color-picker';
import type { ProfileBranding, SubscriptionPlan } from '@/types';
import { hasFeatureAccess } from '@/config/plan-features';

interface BrandingSectionProps {
  initialBranding?: ProfileBranding;
  userPlan: SubscriptionPlan;
  onUpdate: (branding: ProfileBranding) => Promise<void>;
}

export function BrandingSection({ initialBranding, userPlan, onUpdate }: BrandingSectionProps) {
  const [branding, setBranding] = useState<ProfileBranding>(initialBranding || {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialBranding?.customLogo || null
  );

  // Check feature access
  const hasWhiteLabel = hasFeatureAccess(userPlan, 'whiteLabel');
  const hasCustomDomain = hasFeatureAccess(userPlan, 'customDomain');
  const hasBrandColors = hasFeatureAccess(userPlan, 'brandColors');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be less than 2MB');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // TODO: Upload to Cloudinary
      // For now, we'll use the data URL
      // In production, this should upload to Cloudinary and get a URL
      const dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });

      setBranding((prev) => ({ ...prev, customLogo: dataUrl }));
    } catch (err) {
      setError('Failed to upload logo');
      console.error(err);
    } finally {
      setIsLoading(false);
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
    setBranding((prev) => ({ ...prev, customDomain: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call API to update branding
      const response = await fetch('/api/profile/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save branding');
      }

      // Call the onUpdate callback if provided
      await onUpdate(branding);
      
      // Show success message
      setError(null);
      alert('Branding settings saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save branding settings';
      setError(errorMessage);
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
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">Click to upload logo</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isLoading}
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
            <Label className="text-sm font-medium text-slate-700">Custom Domain</Label>
            {!hasCustomDomain && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Pro Plan Required
              </span>
            )}
          </div>
          
          {hasCustomDomain ? (
            <div className="space-y-2">
              <Input
                type="text"
                value={branding.customDomain || ''}
                onChange={handleDomainChange}
                placeholder="photos.yourdomain.com"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                Configure your DNS to point to PikSend servers. Contact support for setup instructions.
              </p>
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
