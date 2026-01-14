"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, Unlock, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  ExpiredView,
  PasswordForm,
  MasonryGrid,
  GalleryHeader,
  Lightbox,
  DownloadModal,
} from "@/components/gallery-view";
import { DeadlineTimer } from "@/components/gallery-view/deadline-timer";
import { LeadMagnetModal } from "@/components/gallery-view/lead-magnet-modal";
import { Slideshow } from "@/components/gallery-view/slideshow";
import { VideoCover } from "@/components/gallery-view/video-cover";
import { AudioPlayer } from "@/components/gallery-view/audio-player";
import { PricingModal } from "@/components/guest/pricing-modal";
import { UnlockSuccessModal } from "@/components/guest/unlock-success-modal";
import { UpgradeModal } from "@/components/shared/upgrade-modal";
import { clearPreservedUploadState } from "@/lib/guest/file-preservation";
import { GuestSessionManager } from "@/lib/guest/session";
import { useTranslation } from "@/lib/i18n/context";
import { hasFeatureAccess } from "@/config/plan-features";
import type { PaymentType, GallerySettings, SubscriptionPlan, PlanFeatures } from "@/types";

// Storage key for tracking pricing choices
const PRICING_CHOICE_KEY = 'piksend_pricing_choices';

interface PricingChoices {
  [galleryId: string]: {
    choice: 'free' | 'unlock' | 'subscribe' | 'pending';
    timestamp: number;
  };
}

/**
 * Get pricing choices from localStorage
 */
function getPricingChoices(): PricingChoices {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(PRICING_CHOICE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save pricing choice to localStorage
 */
function savePricingChoice(galleryId: string, choice: 'free' | 'unlock' | 'subscribe' | 'pending') {
  if (typeof window === 'undefined') return;
  try {
    const choices = getPricingChoices();
    choices[galleryId] = { choice, timestamp: Date.now() };
    localStorage.setItem(PRICING_CHOICE_KEY, JSON.stringify(choices));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if gallery has a pending pricing choice
 */
function hasPendingChoice(galleryId: string): boolean {
  const choices = getPricingChoices();
  return choices[galleryId]?.choice === 'pending';
}

/**
 * Check if gallery has made a final choice
 */
function hasFinalChoice(galleryId: string): boolean {
  const choices = getPricingChoices();
  const choice = choices[galleryId]?.choice;
  return choice === 'free' || choice === 'unlock' || choice === 'subscribe';
}

interface GalleryImage {
  id: string;
  url: string;
  cloudinary_url?: string;
  gallery_id?: string;
  cloudinary_public_id?: string;
  file_size_mb?: number;
  order_index?: number;
  created_at?: string;
}

interface GalleryInfo {
  id: string;
  title: string;
  expires_at: string;
  views_count: number;
  images: GalleryImage[];
  has_password: boolean;
  is_unlocked: boolean;
  payment_type: PaymentType;
  guest_session_id: string | null;
  settings?: GallerySettings;
  owner_plan?: SubscriptionPlan;
}

interface GalleryViewClientProps {
  slug: string;
  initialGallery: GalleryInfo;
  isExpired: boolean;
  isInactive: boolean;
}

export function GalleryViewClient({
  slug,
  initialGallery,
  isExpired,
  isInactive,
}: GalleryViewClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(!initialGallery.has_password);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadModalUrl, setDownloadModalUrl] = useState<string | null>(null);
  const [viewsCount, setViewsCount] = useState(initialGallery.views_count);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUnlockSuccessModal, setShowUnlockSuccessModal] = useState(false);
  const [isGalleryOwner, setIsGalleryOwner] = useState(false);
  const [showPricingReminder, setShowPricingReminder] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [showLeadMagnet, setShowLeadMagnet] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<keyof PlanFeatures | null>(null);
  const viewTracked = useRef(false);

  // Extract gallery settings and owner plan
  const settings: Partial<GallerySettings> = initialGallery.settings || {};
  const ownerPlan = initialGallery.owner_plan || 'free';
  
  // Check feature access based on owner's plan
  const canUseSlideshow = hasFeatureAccess(ownerPlan, 'slideshow');
  const canUseDeadlineTimer = hasFeatureAccess(ownerPlan, 'deadlineTimer');
  const canUseLeadMagnet = hasFeatureAccess(ownerPlan, 'leadMagnet');
  const canUseVideoCover = hasFeatureAccess(ownerPlan, 'videoCover');
  const canUseAudioGallery = hasFeatureAccess(ownerPlan, 'audioGallery');
  
  // Apply feature gating to settings
  const enableDeadline = canUseDeadlineTimer && settings.enableDeadline && settings.deadlineDate;
  const enableLeadMagnet = canUseLeadMagnet && settings.enableLeadMagnet;
  const videoCoverUrl = canUseVideoCover ? settings.videoCoverUrl : undefined;
  const audioUrl = canUseAudioGallery ? settings.audioUrl : undefined;

  // Check if current user is the gallery owner (for guest galleries)
  useEffect(() => {
    if (initialGallery.guest_session_id) {
      const sessionManager = new GuestSessionManager();
      const currentToken = sessionManager.getSessionToken();
      const isOwner = currentToken === initialGallery.guest_session_id;
      setIsGalleryOwner(isOwner);
      
      // Check if owner has a pending choice (didn't complete pricing modal)
      if (isOwner && !initialGallery.is_unlocked && initialGallery.payment_type === 'free') {
        const hasFinal = hasFinalChoice(initialGallery.id);
        const hasPending = hasPendingChoice(initialGallery.id);
        
        // Show reminder if they have a pending choice but no final choice
        if (hasPending && !hasFinal) {
          setShowPricingReminder(true);
        }
      }
    } else {
      setIsGalleryOwner(false);
    }
  }, [initialGallery.guest_session_id, initialGallery.id, initialGallery.is_unlocked, initialGallery.payment_type]);

  // Check if we should show lead magnet modal
  useEffect(() => {
    if (!isAuthenticated || !enableLeadMagnet || hasSubmittedEmail) {
      return;
    }
    
    // Check if user has already submitted email for this gallery
    const storageKey = `piksend_lead_${initialGallery.id}`;
    const hasSubmitted = sessionStorage.getItem(storageKey);
    
    if (hasSubmitted) {
      setHasSubmittedEmail(true);
      return;
    }
    
    // Show lead magnet after a short delay
    const timer = setTimeout(() => {
      setShowLeadMagnet(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, enableLeadMagnet, hasSubmittedEmail, initialGallery.id]);

  // Check if we should show pricing modal from URL params
  // Only show if user is the gallery owner
  useEffect(() => {
    if (searchParams.get('showPricing') === 'true') {
      // Only show pricing modal if user is the owner
      if (isGalleryOwner || !initialGallery.guest_session_id) {
        setShowPricingModal(true);
        // Mark as pending choice
        savePricingChoice(initialGallery.id, 'pending');
      }
      // Remove the query param from URL without reload
      router.replace(`/g/${slug}`, { scroll: false });
    }
    // Check if gallery was just unlocked - show success modal (only for owner)
    if (searchParams.get('unlocked') === 'true') {
      if (isGalleryOwner || !initialGallery.guest_session_id) {
        setShowUnlockSuccessModal(true);
        // Mark as unlock choice completed
        savePricingChoice(initialGallery.id, 'unlock');
      }
      // Remove the query param from URL without reload
      router.replace(`/g/${slug}`, { scroll: false });
    }
  }, [searchParams, slug, router, isGalleryOwner, initialGallery.guest_session_id, initialGallery.id]);

  // Track view when user accesses the gallery content
  // Use sessionStorage to prevent counting multiple times on page refresh
  useEffect(() => {
    const viewKey = `piksend_viewed_${initialGallery.id}`;
    const alreadyViewed = sessionStorage.getItem(viewKey);
    
    if (isAuthenticated && !viewTracked.current && !alreadyViewed && !isExpired && !isInactive) {
      viewTracked.current = true;
      sessionStorage.setItem(viewKey, 'true');
      
      // Increment view count
      fetch(`/api/galleries/${initialGallery.id}/view`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.views_count) {
            setViewsCount(data.views_count);
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated, isExpired, isInactive, initialGallery.id]);

  // Handle password verification
  const handlePasswordSubmit = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Handle download all
  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    toast.loading("Préparation de l'archive...", { id: "download-zip" });
    
    try {
      const response = await fetch(`/api/galleries/download/${slug}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${initialGallery.title}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success("Téléchargement démarré !", { id: "download-zip" });
      } else {
        toast.error("Erreur lors du téléchargement", { id: "download-zip" });
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erreur lors du téléchargement", { id: "download-zip" });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Handle single image download - show modal
  const handleDownloadSingle = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadModalUrl(url);
  };

  // Lightbox navigation
  const handleLightboxPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleLightboxNext = () => {
    if (lightboxIndex !== null && lightboxIndex < initialGallery.images.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  // Pricing modal handlers
  const handleSelectFree = () => {
    setShowPricingModal(false);
    setShowPricingReminder(false);
    savePricingChoice(initialGallery.id, 'free');
    clearPreservedUploadState();
    toast.success("Galerie créée avec succès !");
  };

  const handleSelectUnlock = async () => {
    try {
      const response = await fetch('/api/stripe/checkout/gallery-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          galleryId: initialGallery.id,
          successUrl: `${window.location.origin}/g/${slug}?unlocked=true`,
          cancelUrl: `${window.location.origin}/g/${slug}?showPricing=true`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Erreur lors du paiement. Veuillez réessayer.");
    }
  };

  const handleSelectSubscribe = () => {
    // Redirect to auth page with intent to subscribe
    // After account creation, user will be redirected to Stripe checkout
    setShowPricingModal(false);
    savePricingChoice(initialGallery.id, 'subscribe');
    const params = new URLSearchParams({
      intent: 'subscribe',
      plan: 'premium',
      gallery: slug,
    });
    router.push(`/auth?${params.toString()}`);
  };

  // Handle pricing modal close without choice
  const handlePricingModalClose = () => {
    setShowPricingModal(false);
    // Keep as pending - will show reminder banner
  };

  // Handle opening pricing modal from reminder
  const handleOpenPricingFromReminder = () => {
    setShowPricingReminder(false);
    setShowPricingModal(true);
  };

  // Handle lead magnet submission
  const handleLeadMagnetSubmit = async (email: string) => {
    try {
      const response = await fetch(`/api/galleries/${initialGallery.id}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to capture email');
      }

      // Mark as submitted
      const storageKey = `piksend_lead_${initialGallery.id}`;
      sessionStorage.setItem(storageKey, 'true');
      setHasSubmittedEmail(true);
      setShowLeadMagnet(false);
      toast.success("Merci ! Vous pouvez maintenant accéder à la galerie.");
    } catch (error) {
      console.error('Lead capture error:', error);
      throw error;
    }
  };

  // Handle lead magnet skip
  const handleLeadMagnetSkip = () => {
    setShowLeadMagnet(false);
    // Mark as submitted to not show again
    const storageKey = `piksend_lead_${initialGallery.id}`;
    sessionStorage.setItem(storageKey, 'skipped');
    setHasSubmittedEmail(true);
  };

  // Handle slideshow button click with feature gating
  const handleSlideshowClick = () => {
    if (!canUseSlideshow) {
      setBlockedFeature('slideshow');
      setShowUpgradeModal(true);
      return;
    }
    setShowSlideshow(true);
  };

  // Handle upgrade modal close
  const handleUpgradeModalClose = () => {
    setShowUpgradeModal(false);
    setBlockedFeature(null);
  };

  // Calculate hours remaining for reminder
  const hoursRemaining = Math.max(0, Math.ceil(
    (new Date(initialGallery.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)
  ));

  // Show expired/inactive view
  if (isExpired || isInactive) {
    return <ExpiredView isExpired={isExpired} />;
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <PasswordForm
        title={initialGallery.title}
        expiresAt={initialGallery.expires_at}
        backgroundImage={initialGallery.images[0]?.url}
        onSubmit={handlePasswordSubmit}
      />
    );
  }

  // Main gallery view
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 font-['Plus_Jakarta_Sans'] selection:bg-indigo-100 selection:text-indigo-900">
      {/* Video Cover Background */}
      {videoCoverUrl && (
        <VideoCover videoUrl={videoCoverUrl} />
      )}

      {/* Background decorations - use brand colors if available */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-5"
          style={{ backgroundColor: 'var(--brand-primary, rgb(99 102 241))' }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-5"
          style={{ backgroundColor: 'var(--brand-secondary, rgb(139 92 246))' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-3"
          style={{ 
            background: `linear-gradient(to bottom right, var(--brand-primary, rgb(99 102 241)), var(--brand-secondary, rgb(139 92 246)))` 
          }}
        />
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <AudioPlayer audioUrl={audioUrl} />
      )}

      {/* Slideshow */}
      {showSlideshow && (
        <Slideshow
          images={initialGallery.images.map(img => ({
            ...img,
            cloudinary_url: img.url,
            gallery_id: initialGallery.id,
            cloudinary_public_id: '',
            file_size_mb: 0,
            order_index: 0,
            created_at: '',
          }))}
          interval={5000}
          onClose={() => setShowSlideshow(false)}
          autoPlay={true}
          showWatermark={!initialGallery.is_unlocked && initialGallery.payment_type === 'free'}
        />
      )}

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={handlePricingModalClose}
        gallerySlug={slug}
        galleryTitle={initialGallery.title}
        expiresAt={initialGallery.expires_at}
        onSelectFree={handleSelectFree}
        onSelectUnlock={handleSelectUnlock}
        onSelectSubscribe={handleSelectSubscribe}
      />

      {/* Unlock Success Modal */}
      <UnlockSuccessModal
        isOpen={showUnlockSuccessModal}
        onClose={() => setShowUnlockSuccessModal(false)}
        gallerySlug={slug}
        galleryTitle={initialGallery.title}
        expiresAt={initialGallery.expires_at}
      />

      {/* Upgrade Modal for blocked features */}
      {showUpgradeModal && blockedFeature && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={handleUpgradeModalClose}
          limitType="gallery"
          currentPlan={ownerPlan}
        />
      )}

      {/* Lead Magnet Modal */}
      {showLeadMagnet && (
        <LeadMagnetModal
          galleryId={initialGallery.id}
          galleryTitle={initialGallery.title}
          onSubmit={handleLeadMagnetSubmit}
          onSkip={handleLeadMagnetSkip}
        />
      )}

      {/* Download Modal */}
      {downloadModalUrl && (
        <DownloadModal
          imageUrl={downloadModalUrl}
          imageName={initialGallery.title}
          onClose={() => setDownloadModalUrl(null)}
        />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={initialGallery.images.map(img => ({
            ...img,
            cloudinary_url: img.url,
            gallery_id: initialGallery.id,
            cloudinary_public_id: '',
            file_size_mb: 0,
            order_index: 0,
            created_at: '',
          }))}
          currentIndex={lightboxIndex}
          title={initialGallery.title}
          onClose={() => setLightboxIndex(null)}
          onPrev={handleLightboxPrev}
          onNext={handleLightboxNext}
          onDownload={handleDownloadSingle}
          showWatermark={!initialGallery.is_unlocked && initialGallery.payment_type === 'free'}
        />
      )}

      {/* Header */}
      <GalleryHeader
        title={initialGallery.title}
        viewsCount={viewsCount}
        imagesCount={initialGallery.images.length}
        expiresAt={initialGallery.expires_at}
        isDownloading={isDownloadingAll}
        isUnlocked={initialGallery.is_unlocked}
        onDownloadAll={handleDownloadAll}
      />

      {/* Pricing Reminder Banner */}
      {showPricingReminder && isGalleryOwner && !initialGallery.is_unlocked && (
        <div className="fixed top-24 md:top-28 left-0 right-0 z-40 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3 shadow-xl shadow-amber-500/20 flex items-center justify-between gap-3 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs">
                    {t('gallery.pricingReminder.title')}
                  </p>
                  <p className="text-white/80 text-[10px]">
                    {t('gallery.pricingReminder.subtitle').replace('{hours}', String(hoursRemaining))}
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenPricingFromReminder}
                className="px-3 py-1.5 bg-white text-amber-600 font-bold text-xs rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1.5 shadow-lg"
              >
                <Unlock className="w-3.5 h-3.5" />
                {t('gallery.pricingReminder.cta')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-32 md:pt-36 pb-16">
        {/* Deadline Timer */}
        {enableDeadline && settings.deadlineDate && (
          <div className="mb-8 max-w-2xl mx-auto">
            <DeadlineTimer
              deadline={new Date(settings.deadlineDate)}
              onExpired={() => {
                toast.info("Le délai de sélection est expiré");
              }}
            />
          </div>
        )}

        {/* Slideshow Button */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={handleSlideshowClick}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            <span>Lancer le diaporama</span>
          </button>
        </div>

        {/* Photo Grid */}
        <MasonryGrid
          images={initialGallery.images.map(img => ({
            ...img,
            cloudinary_url: img.url,
            gallery_id: initialGallery.id,
            cloudinary_public_id: '',
            file_size_mb: 0,
            order_index: 0,
            created_at: '',
          }))}
          onImageClick={setLightboxIndex}
          onDownload={handleDownloadSingle}
          showWatermark={!initialGallery.is_unlocked && initialGallery.payment_type === 'free'}
        />

        {/* Footer */}
        <footer className="mt-12 md:mt-16 pt-6 border-t border-slate-200/60">
          <div className="max-w-3xl mx-auto">
            {/* Compact CTA row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-1.5 group">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow border border-slate-100 group-hover:scale-105 transition-transform">
                    <Image 
                      src="/icons/logo.svg" 
                      alt="PikSend" 
                      width={16} 
                      height={16}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-700">PikSend</span>
                </Link>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] text-slate-400 font-medium">{t('gallery.publicFooter.tagline')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  href={isGalleryOwner 
                    ? `/auth?callbackUrl=${encodeURIComponent(`/dashboard/galleries/${initialGallery.id}`)}`
                    : "/dashboard"
                  }
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {t('gallery.publicFooter.accessDashboard')}
                </Link>
                <Link
                  href="/"
                  className="px-3 py-1.5 text-white text-[10px] font-bold rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--brand-primary, rgb(99 102 241))',
                  }}
                  onMouseEnter={(e) => {
                    const primary = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary') || 'rgb(99 102 241)';
                    e.currentTarget.style.backgroundColor = primary.replace(')', ' / 0.9)').replace('rgb', 'rgba');
                  }}
                  onMouseLeave={(e) => {
                    const primary = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary') || 'rgb(99 102 241)';
                    e.currentTarget.style.backgroundColor = primary;
                  }}
                >
                  {t('gallery.publicFooter.createGallery')}
                </Link>
              </div>
            </div>
            
            {/* Copyright */}
            <p className="text-center text-[9px] text-slate-400 font-medium">
              {t('gallery.publicFooter.poweredBy')} PikSend © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
