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
  Clock,
  Image as ImageIcon
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

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'failed';
type SSLStatus = 'idle' | 'provisioning' | 'provisioned' | 'failed';

export function BrandingSection({ initialBranding, userPlan, onUpdate }: BrandingSectionProps) {
  const [branding, setBranding] = useState<ProfileBranding>(initialBranding || {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialBranding?.customLogo || null);
  const [previewDark, setPreviewDark] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationToken, setVerificationToken] = useState<string | null>(initialBranding?.verificationToken || null);
  const [sslStatus, setSSLStatus] = useState<SSLStatus>('idle');
  const [showDNSInstructions, setShowDNSInstructions] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  useEffect(() => {
    if (initialBranding?.domainVerified) setVerificationStatus('verified');
    if (initialBranding?.sslCertificateId && initialBranding?.sslProvider) setSSLStatus('provisioned');
    if (initialBranding?.customDomain && !initialBranding?.domainVerified) setShowDNSInstructions(true);
  }, [initialBranding]);

  const hasWhiteLabel = hasFeatureAccess(userPlan, 'whiteLabel');
  const hasCustomDomain = hasFeatureAccess(userPlan, 'customDomain');
  const hasBrandColors = hasFeatureAccess(userPlan, 'brandColors');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Veuillez télécharger une image'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Le logo doit faire moins de 2MB'); return; }
    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append('logo', file);
      const response = await fetch('/api/profile/logo', { method: 'POST', body: formData });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Échec du téléchargement'); }
      const data = await response.json();
      setLogoPreview(data.url);
      setBranding((prev) => ({ ...prev, customLogo: data.url }));
      toast.success('Logo téléchargé avec succès !');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec du téléchargement');
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
    if (value) {
      const normalized = normalizeDomain(value);
      if (!normalized || !isValidDomain(normalized)) {
        setDomainError('Format invalide. Exemple: photos.example.com');
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
    if (branding.customDomain) {
      const normalized = normalizeDomain(branding.customDomain);
      if (normalized && normalized !== branding.customDomain) {
        setBranding((prev) => ({ ...prev, customDomain: normalized }));
      }
    }
  };
  
  const handleVerifyDomain = async () => {
    if (!branding.customDomain) { toast.error('Veuillez entrer un domaine'); return; }
    const normalized = normalizeDomain(branding.customDomain);
    if (!normalized || !isValidDomain(normalized)) { toast.error('Format de domaine invalide'); return; }
    try {
      setVerificationStatus('verifying');
      setDomainError(null);
      const response = await fetch('/api/domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: normalized }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Échec de la vérification');
      if (data.status === 'verified') {
        setVerificationStatus('verified');
        setVerificationToken(null);
        toast.success('Domaine vérifié avec succès !');
        handleProvisionSSL();
      } else if (data.status === 'pending') {
        setVerificationStatus('idle');
        setVerificationToken(data.token);
        setShowDNSInstructions(true);
        toast.info('Vérification en attente. Configurez vos enregistrements DNS.');
      } else {
        setVerificationStatus('failed');
        toast.error(data.error || 'Échec de la vérification');
      }
    } catch (err) {
      setVerificationStatus('failed');
      toast.error(err instanceof Error ? err.message : 'Échec de la vérification');
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
      if (!response.ok) throw new Error(data.error || 'Échec du provisionnement SSL');
      if (data.success) {
        setSSLStatus('provisioned');
        toast.success('Certificat SSL provisionné !');
      } else {
        setSSLStatus('failed');
        toast.error(data.error || 'Échec du provisionnement SSL');
      }
    } catch (err) {
      setSSLStatus('failed');
      toast.error(err instanceof Error ? err.message : 'Échec du provisionnement SSL');
    }
  };
  
  const handleRemoveDomain = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/domain/remove', { method: 'DELETE' });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Échec de la suppression'); }
      setBranding((prev) => ({
        ...prev,
        customDomain: undefined, domainVerified: undefined, verificationToken: undefined,
        domainVerifiedAt: undefined, sslCertificateId: undefined, sslProvider: undefined,
        sslExpiresAt: undefined, cloudflareZoneId: undefined,
      }));
      setVerificationStatus('idle');
      setVerificationToken(null);
      setSSLStatus('idle');
      setShowDNSInstructions(false);
      toast.success('Domaine supprimé avec succès');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de la suppression');
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copié !`);
    } catch { toast.error('Échec de la copie'); }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (branding.customDomain && !isValidDomain(branding.customDomain)) {
        setError('Format de domaine invalide');
        toast.error('Format de domaine invalide');
        return;
      }
      const normalizedBranding = {
        ...branding,
        customDomain: branding.customDomain ? (normalizeDomain(branding.customDomain) || undefined) : undefined,
      };
      const response = await fetch('/api/profile/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedBranding),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Échec de la sauvegarde'); }
      await onUpdate(normalizedBranding);
      setError(null);
      toast.success('Paramètres de branding sauvegardés !');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Échec de la sauvegarde';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const FeatureLockedCard = ({ title, description }: { title: string; description: string }) => (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{title}</span>
        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          Pro requis
        </span>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
          <Palette size={18} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900">Branding</h2>
          <p className="text-xs text-slate-500">Personnalisez votre identité visuelle</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Custom Logo */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-slate-600" />
            <Label className="text-sm font-medium text-slate-700">Logo personnalisé</Label>
            {!hasWhiteLabel && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">
                Pro requis
              </span>
            )}
          </div>
          
          {hasWhiteLabel ? (
            <div className="space-y-3">
              {logoPreview ? (
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-auto max-w-[160px] object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      disabled={isUploadingLogo}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Logo actuel</p>
                    <p className="text-xs text-slate-500">Cliquez sur × pour supprimer</p>
                  </div>
                </div>
              ) : (
                <label className={cn(
                  "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-all cursor-pointer",
                  isUploadingLogo 
                    ? "border-slate-300 bg-slate-50 cursor-not-allowed" 
                    : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30"
                )}>
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="w-8 h-8 text-indigo-500 mb-2 animate-spin" />
                      <span className="text-sm text-slate-600">Téléchargement...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Cliquez pour télécharger</span>
                      <span className="text-xs text-slate-500 mt-1">PNG, JPG, WebP • Max 2MB</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={isUploadingLogo} />
                </label>
              )}
            </div>
          ) : (
            <FeatureLockedCard 
              title="Logo personnalisé" 
              description="Téléchargez votre logo et supprimez le branding PikSend." 
            />
          )}
        </div>

        {/* Custom Domain */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-slate-600" />
            <Label className="text-sm font-medium text-slate-700">Domaine personnalisé</Label>
            {!hasCustomDomain && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">
                Pro requis
              </span>
            )}
          </div>
          
          {hasCustomDomain ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={branding.customDomain || ''}
                  onChange={handleDomainChange}
                  onBlur={handleDomainBlur}
                  placeholder="photos.votredomaine.com"
                  disabled={isLoading || verificationStatus === 'verifying'}
                  className={cn("flex-1", domainError && 'border-red-300 focus-visible:ring-red-500')}
                />
                <Button
                  onClick={handleVerifyDomain}
                  disabled={!branding.customDomain || !!domainError || verificationStatus === 'verifying' || verificationStatus === 'verified'}
                  variant="outline"
                  className="shrink-0 gap-2"
                >
                  {verificationStatus === 'verifying' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Vérification...</>
                  ) : verificationStatus === 'verified' ? (
                    <><CheckCircle2 className="w-4 h-4 text-green-600" />Vérifié</>
                  ) : (
                    'Vérifier'
                  )}
                </Button>
              </div>
              
              {domainError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />{domainError}
                </p>
              )}
              
              {branding.customDomain && (
                <div className={cn(
                  "p-4 rounded-xl border",
                  verificationStatus === 'verified' ? "bg-green-50/50 border-green-200" :
                  verificationStatus === 'failed' ? "bg-red-50/50 border-red-200" : "bg-blue-50/50 border-blue-200"
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      verificationStatus === 'verified' ? "bg-green-100 text-green-600" :
                      verificationStatus === 'failed' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {verificationStatus === 'verified' ? <CheckCircle2 size={16} /> :
                       verificationStatus === 'failed' ? <AlertCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {verificationStatus === 'verified' ? 'Domaine vérifié' :
                         verificationStatus === 'failed' ? 'Vérification échouée' : 'Vérification en attente'}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {verificationStatus === 'verified' ? 'Votre domaine est prêt à être utilisé' :
                         verificationStatus === 'failed' ? 'Vérifiez votre configuration DNS' : 'Configurez vos enregistrements DNS'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              
              {showDNSInstructions && branding.customDomain && verificationStatus !== 'verified' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink size={14} className="text-slate-600" />
                    <h4 className="text-sm font-medium text-slate-900">Configuration DNS</h4>
                  </div>
                  <p className="text-xs text-slate-600">Ajoutez l'un des enregistrements DNS suivants :</p>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-700">Option 1 : CNAME (Recommandé)</p>
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <div><span className="text-slate-500">Type:</span> <code className="bg-slate-100 px-1.5 py-0.5 rounded">CNAME</code></div>
                        <div><span className="text-slate-500">Nom:</span> <code className="bg-slate-100 px-1.5 py-0.5 rounded">{branding.customDomain?.split('.')[0] || '@'}</code></div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Valeur:</span> <code className="bg-slate-100 px-1.5 py-0.5 rounded">piksend.com</code>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard('piksend.com', 'Valeur CNAME')} className="h-6 w-6 p-0">
                            <Copy size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {verificationToken && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-700">Option 2 : TXT</p>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <div><span className="text-slate-500">Type:</span> <code className="bg-slate-100 px-1.5 py-0.5 rounded">TXT</code></div>
                          <div><span className="text-slate-500">Nom:</span> <code className="bg-slate-100 px-1.5 py-0.5 rounded">_piksend-verify</code></div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Valeur:</span> 
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[120px]">{verificationToken}</code>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(verificationToken, 'Valeur TXT')} className="h-6 w-6 p-0">
                              <Copy size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 italic">La propagation DNS peut prendre jusqu'à 48h.</p>
                </div>
              )}
              
              {verificationStatus === 'verified' && (
                <div className={cn(
                  "p-4 rounded-xl border",
                  sslStatus === 'provisioned' ? "bg-green-50/50 border-green-200" :
                  sslStatus === 'provisioning' ? "bg-blue-50/50 border-blue-200" : "bg-red-50/50 border-red-200"
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      sslStatus === 'provisioned' ? "bg-green-100 text-green-600" :
                      sslStatus === 'provisioning' ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
                    )}>
                      <Shield size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {sslStatus === 'provisioned' ? 'Certificat SSL actif' :
                         sslStatus === 'provisioning' ? 'Provisionnement SSL...' : 'Échec SSL'}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {sslStatus === 'provisioned' ? 'Votre domaine est sécurisé avec HTTPS' :
                         sslStatus === 'provisioning' ? 'Cela peut prendre quelques minutes' : 'Contactez le support'}
                      </p>
                      {branding.sslExpiresAt && sslStatus === 'provisioned' && (
                        <p className="text-xs text-green-600 mt-1">Expire: {new Date(branding.sslExpiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {branding.customDomain && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2" disabled={isLoading}>
                      <Trash2 size={14} />Supprimer le domaine
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le domaine personnalisé ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action supprimera votre configuration de domaine et le certificat SSL. 
                        Vos galeries ne seront plus accessibles via {branding.customDomain}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRemoveDomain} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ) : (
            <FeatureLockedCard 
              title="Domaine personnalisé" 
              description="Utilisez votre propre domaine pour vos liens de galerie." 
            />
          )}
        </div>

        {/* Brand Colors */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-slate-600" />
            <Label className="text-sm font-medium text-slate-700">Couleurs de marque</Label>
            {!hasBrandColors && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">
                Pro requis
              </span>
            )}
          </div>

          {hasBrandColors ? (
            <div className="space-y-4">
              <ColorPicker label="Couleur primaire" value={branding.brandColors?.primary || '#6366f1'} onChange={(c) => handleColorChange('primary', c)} />
              <ColorPicker label="Couleur secondaire" value={branding.brandColors?.secondary || '#8b5cf6'} onChange={(c) => handleColorChange('secondary', c)} />
              <ColorPicker label="Couleur d'accent" value={branding.brandColors?.accent || '#ec4899'} onChange={(c) => handleColorChange('accent', c)} />
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">Aperçu</Label>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Clair</span>
                    <button
                      type="button"
                      onClick={() => setPreviewDark(!previewDark)}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                      style={{ backgroundColor: previewDark ? '#6366f1' : '#cbd5e1' }}
                    >
                      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', previewDark ? 'translate-x-5' : 'translate-x-0.5')} />
                    </button>
                    <span>Sombre</span>
                  </div>
                </div>
                <div className={cn("p-4 rounded-lg transition-colors", previewDark ? "bg-slate-900" : "bg-white")}>
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
                  <p className={cn("mt-3 text-xs", previewDark ? "text-slate-400" : "text-slate-600")}>
                    {previewDark ? "En mode sombre, vos couleurs sont automatiquement ajustées." : "Vos couleurs seront appliquées aux boutons et éléments interactifs."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <FeatureLockedCard 
              title="Couleurs de marque" 
              description="Personnalisez les couleurs de vos galeries pour correspondre à votre marque." 
            />
          )}
        </div>

        {/* Save Button */}
        {(hasWhiteLabel || hasCustomDomain || hasBrandColors) && (
          <div className="pt-6 border-t border-slate-200">
            <Button 
              onClick={handleSave} 
              disabled={isLoading} 
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Sauvegarder les paramètres
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
