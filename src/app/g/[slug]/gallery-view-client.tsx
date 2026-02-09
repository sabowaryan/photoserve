"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, Unlock, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import "./gallery-theme.css";
import {
  ExpiredView,
  PasswordForm,
  MasonryGrid,
  GalleryHeader,
  Lightbox,
  DownloadModal,
  GuestGalleryBanner,
} from "@/components/gallery-view";
import { DeadlineTimer } from "@/components/gallery-view/deadline-timer";
import { LeadMagnetModal } from "@/components/gallery-view/lead-magnet-modal";
import { Slideshow } from "@/components/gallery-view/slideshow";
import { VideoCover } from "@/components/gallery-view/video-cover";
import { AudioPlayer } from "@/components/gallery-view/audio-player";
import { PricingModal } from "@/components/guest/pricing-modal";
import { UnlockSuccessModal } from "@/components/guest/unlock-success-modal";
import { SoftSignupModal } from "@/components/conversion/soft-signup-modal";
import { clearPreservedUploadState } from "@/lib/guest/file-preservation";
import { GuestSessionManager } from "@/lib/guest/session";
import { useTranslation } from "@/lib/i18n/context";
import { hasFeatureAccess } from "@/config/plan-features";
import { getDisplayDomain, getDomainUrl, getBrandName } from "@/lib/utils/domain";
import { useGalleryTheme } from "@/hooks/use-gallery-theme";
import { useVisitorFingerprint } from "@/hooks/use-visitor-fingerprint";
import { useEventTracker } from "@/hooks/use-event-tracker";
import { useSignupTrigger } from "@/hooks/use-signup-trigger";
import type { PaymentType, GallerySettings, SubscriptionPlan } from "@/types";

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
  custom_logo?: string | null;
  custom_domain?: string | null;
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
  
  // Ensure consistent boolean evaluation to prevent hydration mismatch
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(!initialGallery.has_password));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadModalUrl, setDownloadModalUrl] = useState<string | null>(null);
  const [downloadModalImageId, setDownloadModalImageId] = useState<string | null>(null);
  const [viewsCount, setViewsCount] = useState(initialGallery.views_count);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUnlockSuccessModal, setShowUnlockSuccessModal] = useState(false);
  const [isGalleryOwner, setIsGalleryOwner] = useState(false);
  const [showPricingReminder, setShowPricingReminder] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [showLeadMagnet, setShowLeadMagnet] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isDownloadingSelection, setIsDownloadingSelection] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isDownloadingFavorites, setIsDownloadingFavorites] = useState(false);
  const viewTracked = useRef(false);

  // Gallery-specific theme (doesn't affect rest of the app)
  const { containerRef, toggleTheme, isDark, resolvedTheme } = useGalleryTheme();
  
  // Visitor fingerprint for unique visitor tracking
  const visitorId = useVisitorFingerprint();
  
  // Event tracker for user interactions
  const eventTracker = useEventTracker({
    galleryId: initialGallery.id,
    visitorId,
  });

  // Progressive signup trigger - Requirements: 5.6, 6.8
  // Enable time-based trigger (2 minutes) for guest galleries viewed by non-owners
  const isGuestViewer = !!initialGallery.guest_session_id && !isGalleryOwner;
  const signupTrigger = useSignupTrigger({
    isAuthenticated: false, // Will be updated based on session
    enableTimeTrigger: isGuestViewer && isAuthenticated,
    triggerDelay: 2 * 60 * 1000, // 2 minutes
  });

  // Extract gallery settings and owner plan
  const settings: Partial<GallerySettings> = initialGallery.settings || {};
  const ownerPlan = initialGallery.owner_plan || 'free';
  
  // Check feature access based on owner's plan
  const canUseSlideshow = hasFeatureAccess(ownerPlan, 'slideshow');
  const canUseDeadlineTimer = hasFeatureAccess(ownerPlan, 'deadlineTimer');
  const canUseLeadMagnet = hasFeatureAccess(ownerPlan, 'leadMagnet');
  const canUseVideoCover = hasFeatureAccess(ownerPlan, 'videoCover');
  const canUseAudioGallery = hasFeatureAccess(ownerPlan, 'audioGallery');
  const canUseFavorites = hasFeatureAccess(ownerPlan, 'favorites');
  const canUseComments = hasFeatureAccess(ownerPlan, 'comments');
  
  // Apply feature gating to settings
  const enableDeadline = canUseDeadlineTimer && settings.enableDeadline && settings.deadlineDate;
  const enableLeadMagnet = canUseLeadMagnet && settings.enableLeadMagnet;
  const enableComments = canUseComments && settings.enableComments;
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

  // Load favorites from API if feature is enabled
  useEffect(() => {
    if (!canUseFavorites || !isAuthenticated) return;
    
    const loadFavorites = async () => {
      const sessionManager = new GuestSessionManager();
      const sessionId = sessionManager.getSessionToken();
      
      try {
        const response = await fetch(
          `/api/galleries/${initialGallery.id}/favorites?sessionId=${sessionId}`
        );
        
        if (response.ok) {
          const { favorites: favoriteIds } = await response.json();
          setFavorites(new Set(favoriteIds));
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    };
    
    loadFavorites();
  }, [canUseFavorites, isAuthenticated, initialGallery.id]);

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
      
      // Track view with analytics (includes IP geolocation, user agent, and updates view count)
      fetch(`/api/galleries/${initialGallery.id}/analytics`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          visitorId: visitorId || undefined, // Fingerprint ID
        })
      })
        .then(() => {
          // Update local view count for display
          setViewsCount(prev => prev + 1);
        })
        .catch(console.error);
    }
  }, [isAuthenticated, isExpired, isInactive, initialGallery.id]);

  // Track session start and end
  useEffect(() => {
    if (!isAuthenticated || isExpired || isInactive) return;

    // Check if session already started for this gallery
    const sessionKey = `piksend_session_started_${initialGallery.id}`;
    const alreadyStarted = sessionStorage.getItem(sessionKey);
    
    if (alreadyStarted) return; // Don't track again
    
    sessionStorage.setItem(sessionKey, 'true');
    
    const sessionStart = Date.now();
    let eventCount = 0;
    let sessionEnded = false;

    // Track session start
    fetch(`/api/galleries/${initialGallery.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: visitorId || undefined,
        eventType: 'session_start',
        eventData: {
          referrer: typeof document !== 'undefined' ? document.referrer : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      }),
    }).catch(console.error);

    // Increment event count on any user interaction
    const incrementEventCount = () => {
      eventCount++;
    };

    // Listen to various events
    window.addEventListener('click', incrementEventCount);
    window.addEventListener('keydown', incrementEventCount);

    // Track session end on page unload (only once)
    const trackSessionEnd = () => {
      if (sessionEnded) return;
      sessionEnded = true;
      
      const duration = Math.floor((Date.now() - sessionStart) / 1000);
      
      // Use sendBeacon for reliable delivery on page unload
      const data = JSON.stringify({
        visitorId: visitorId || undefined,
        eventType: 'session_end',
        eventData: { duration, eventsCount: eventCount },
      });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `/api/galleries/${initialGallery.id}/events`,
          new Blob([data], { type: 'application/json' })
        );
      } else {
        fetch(`/api/galleries/${initialGallery.id}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', trackSessionEnd);

    return () => {
      window.removeEventListener('click', incrementEventCount);
      window.removeEventListener('keydown', incrementEventCount);
      window.removeEventListener('beforeunload', trackSessionEnd);
      // Don't call trackSessionEnd here - only on actual page unload
    };
  }, [isAuthenticated, isExpired, isInactive, initialGallery.id, visitorId]);

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
        
        // Track download event
        eventTracker.trackDownloadAll(initialGallery.images.length);
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
  const handleDownloadSingle = (url: string, imageId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadModalUrl(url);
    setDownloadModalImageId(imageId || null);
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
  const handleLeadMagnetSubmit = async (email: string, gdprConsent: boolean) => {
    try {
      const response = await fetch(`/api/galleries/${initialGallery.id}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, gdprConsent }),
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

  // Handle slideshow button click
  const handleSlideshowClick = () => {
    setShowSlideshow(true);
  };

  // Handle image selection toggle
  const handleToggleSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  // Handle select all / deselect all
  const handleToggleSelectAll = () => {
    if (selectedImages.size === initialGallery.images.length) {
      // Deselect all
      setSelectedImages(new Set());
    } else {
      // Select all
      setSelectedImages(new Set(initialGallery.images.map(img => img.id)));
    }
  };

  // Handle download selection
  const handleDownloadSelection = async () => {
    if (selectedImages.size === 0) return;
    
    // Minimum 2 images required for ZIP download
    if (selectedImages.size < 2) {
      toast.error("Sélectionnez au moins 2 photos pour télécharger en ZIP");
      return;
    }
    
    setIsDownloadingSelection(true);
    toast.loading("Préparation de l'archive...", { id: "download-selection" });
    
    try {
      const imageIds = Array.from(selectedImages);
      const response = await fetch(`/api/galleries/${initialGallery.id}/download-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${initialGallery.title}_selection.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success("Téléchargement démarré !", { id: "download-selection" });
        setSelectedImages(new Set()); // Clear selection after download
        
        // Track download event
        eventTracker.trackDownloadSelection(imageIds);
      } else {
        toast.error("Erreur lors du téléchargement", { id: "download-selection" });
      }
    } catch (error) {
      console.error("Download selection error:", error);
      toast.error("Erreur lors du téléchargement", { id: "download-selection" });
    } finally {
      setIsDownloadingSelection(false);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (imageId: string) => {
    if (!canUseFavorites) return;
    
    // Get or create session ID for guest
    const sessionManager = new GuestSessionManager();
    const sessionId = sessionManager.getSessionToken();
    
    try {
      const response = await fetch(`/api/galleries/${initialGallery.id}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, sessionId }),
      });
      
      if (response.ok) {
        const { isFavorite } = await response.json();
        
        // Track favorite event
        if (isFavorite) {
          eventTracker.trackFavoriteAdd(imageId);
        } else {
          eventTracker.trackFavoriteRemove(imageId);
        }
        
        // Update local state
        setFavorites(prev => {
          const newSet = new Set(prev);
          if (isFavorite) {
            newSet.add(imageId);
          } else {
            newSet.delete(imageId);
          }
          return newSet;
        });
      } else {
        toast.error("Erreur lors de la mise à jour des favoris");
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
      toast.error("Erreur lors de la mise à jour des favoris");
    }
  };

  // Handle download favorites
  const handleDownloadFavorites = async () => {
    if (favorites.size === 0) return;
    
    // Minimum 2 images required for ZIP download
    if (favorites.size < 2) {
      toast.error("Ajoutez au moins 2 photos aux favoris pour télécharger en ZIP");
      return;
    }
    
    setIsDownloadingFavorites(true);
    toast.loading("Préparation de l'archive...", { id: "download-favorites" });
    
    try {
      const imageIds = Array.from(favorites);
      const response = await fetch(`/api/galleries/${initialGallery.id}/download-favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${initialGallery.title}_favoris.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success("Téléchargement démarré !", { id: "download-favorites" });
        
        // Track download event
        eventTracker.trackDownloadFavorites(imageIds);
      } else {
        toast.error("Erreur lors du téléchargement", { id: "download-favorites" });
      }
    } catch (error) {
      console.error("Download favorites error:", error);
      toast.error("Erreur lors du téléchargement", { id: "download-favorites" });
    } finally {
      setIsDownloadingFavorites(false);
    }
  };

  // Handle comment submission
  const handleComment = async (imageId: string, comment: string) => {
    if (!enableComments) return;
    
    // Get or create session ID for guest
    const sessionManager = new GuestSessionManager();
    const sessionId = sessionManager.getSessionToken();
    
    try {
      const response = await fetch(`/api/images/${imageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment, sessionId }),
      });
      
      if (response.ok) {
        toast.success("Commentaire ajouté avec succès !");
        // Track comment event
        eventTracker.trackComment(imageId);
      } else {
        toast.error("Erreur lors de l'ajout du commentaire");
      }
    } catch (error) {
      console.error("Comment error:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  // Calculate hours remaining for reminder
  const hoursRemaining = Math.max(0, Math.ceil(
    (new Date(initialGallery.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)
  ));

  // Normalize custom domain for display and links
  const displayDomain = getDisplayDomain(initialGallery.custom_domain);
  const domainUrl = getDomainUrl(initialGallery.custom_domain);
  const brandName = getBrandName(initialGallery.custom_domain);

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
        customLogo={initialGallery.custom_logo}
      />
    );
  }

  // Main gallery view
  return (
    <div ref={containerRef} data-gallery-theme={resolvedTheme} className="gallery-theme-wrapper min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 data-[gallery-theme=dark]:from-slate-950 data-[gallery-theme=dark]:via-slate-900 data-[gallery-theme=dark]:to-slate-950 font-['Plus_Jakarta_Sans'] selection:bg-indigo-100 selection:text-indigo-900 data-[gallery-theme=dark]:selection:bg-indigo-900 data-[gallery-theme=dark]:selection:text-indigo-100">
      {/* Video Cover Background */}
      {videoCoverUrl && (
        <VideoCover 
          videoUrl={videoCoverUrl} 
          hasBackgroundAudio={!!audioUrl} 
        />
      )}

      {/* Background decorations - use brand colors if available */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className={`absolute top-0 left-1/2 -translate-x-1/2 md:left-1/4 md:translate-x-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full transition-all duration-500 ${
            isDark 
              ? 'blur-[100px] md:blur-[150px] opacity-[0.12]' 
              : 'blur-[60px] md:blur-[100px] opacity-[0.40]'
          }`}
          style={{ backgroundColor: 'var(--brand-primary, rgb(147 197 253))' }}
        />
        <div 
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 md:left-auto md:right-1/4 md:translate-x-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] rounded-full transition-all duration-500 ${
            isDark 
              ? 'blur-[80px] md:blur-[120px] opacity-[0.10]' 
              : 'blur-[50px] md:blur-[80px] opacity-[0.35]'
          }`}
          style={{ backgroundColor: 'var(--brand-secondary, rgb(196 181 253))' }}
        />
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[800px] md:h-[800px] rounded-full transition-all duration-500 ${
            isDark 
              ? 'blur-[120px] md:blur-[200px] opacity-[0.12]' 
              : 'blur-[80px] md:blur-[120px] opacity-[0.30]'
          }`}
          style={{ 
            background: `linear-gradient(to bottom right, var(--brand-primary, rgb(147 197 253)), var(--brand-secondary, rgb(196 181 253)))` 
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
          customLogo={initialGallery.custom_logo}
          onSlideshowStart={(imageCount, interval) => {
            eventTracker.trackSlideshowStart(imageCount, interval);
          }}
          onSlideshowEnd={(duration, imagesViewed) => {
            eventTracker.trackSlideshowEnd(duration, imagesViewed);
          }}
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
          imageId={downloadModalImageId || undefined}
          imageName={initialGallery.title}
          onClose={() => {
            setDownloadModalUrl(null);
            setDownloadModalImageId(null);
          }}
          onDownloadComplete={(imageId, quality) => {
            eventTracker.trackDownloadSingle(imageId, quality);
          }}
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
          onFavorite={canUseFavorites ? handleToggleFavorite : undefined}
          onComment={enableComments ? handleComment : undefined}
          showFavorites={canUseFavorites}
          showComments={enableComments}
          favorites={favorites}
          showWatermark={!initialGallery.is_unlocked && initialGallery.payment_type === 'free'}
          customLogo={initialGallery.custom_logo}
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
        ownerPlan={ownerPlan}
        selectedCount={canUseFavorites ? selectedImages.size : 0}
        isDownloadingSelection={isDownloadingSelection}
        favoritesCount={canUseFavorites ? favorites.size : 0}
        isDownloadingFavorites={isDownloadingFavorites}
        onDownloadAll={handleDownloadAll}
        onDownloadSelection={canUseFavorites ? handleDownloadSelection : undefined}
        onDownloadFavorites={canUseFavorites ? handleDownloadFavorites : undefined}
        onToggleSelectAll={canUseFavorites ? handleToggleSelectAll : undefined}
        allSelected={selectedImages.size === initialGallery.images.length && initialGallery.images.length > 0}
        customLogo={initialGallery.custom_logo}
        onToggleTheme={toggleTheme}
        isDark={isDark}
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

        {/* Slideshow Button - Only show if owner has Premium or Pro plan */}
        {canUseSlideshow && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={handleSlideshowClick}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/10 flex items-center gap-2"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              <span>Lancer le diaporama</span>
            </button>
          </div>
        )}

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
          onImageClick={(index) => {
            // Track lightbox open event
            const image = initialGallery.images[index];
            if (image) {
              eventTracker.trackLightboxOpen(image.id, index);
            }
            setLightboxIndex(index);
          }}
          onDownload={handleDownloadSingle}
          onToggleSelection={canUseFavorites ? handleToggleSelection : undefined}
          selectedImages={selectedImages}
          onFavorite={canUseFavorites ? handleToggleFavorite : undefined}
          showFavorites={canUseFavorites}
          favorites={favorites}
          showWatermark={!initialGallery.is_unlocked && initialGallery.payment_type === 'free'}
        />

        {/* Footer */}
        <footer className="mt-12 md:mt-16 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
          <div className="max-w-3xl mx-auto">
            {/* Compact CTA row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              {/* Left side - Logo and branding */}
              <div className="flex items-center gap-2">
                {initialGallery.custom_logo && ownerPlan === 'pro' ? (
                  // White-label footer for Pro users with custom logo
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow border border-slate-100 dark:border-slate-700">
                      <img 
                        src={initialGallery.custom_logo} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                    {brandName ? (
                      // Show brand name extracted from domain (e.g., "JohnDoe" from johndoe.com)
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">{brandName}</span>
                    ) : displayDomain ? (
                      // Fallback to full domain if brand name extraction fails
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">{displayDomain}</span>
                    ) : (
                      // Final fallback to generic text
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">Galerie Professionnelle</span>
                    )}
                  </div>
                ) : (
                  // Standard PikSend branding
                  <>
                    <Link 
                      href="/" 
                      className="flex items-center gap-1.5 group"
                      onClick={() => {
                        eventTracker.trackCTAClick('piksend_logo', '/');
                      }}
                    >
                      <div className="w-7 h-7 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-transform">
                        <Image 
                          src="/icons/logo.svg" 
                          alt="PikSend" 
                          width={16} 
                          height={16}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300" dir="ltr">PikSend</span>
                    </Link>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t('gallery.publicFooter.tagline')}</span>
                  </>
                )}
              </div>
              
              {/* Right side - CTA buttons */}
              <div className="flex items-center gap-2">
                {/* Only show dashboard link if not white-labeled or if gallery owner */}
                {(ownerPlan !== 'pro' || !initialGallery.custom_logo || isGalleryOwner) && (
                  <Link
                    href={isGalleryOwner 
                      ? `/auth?callbackUrl=${encodeURIComponent(`/dashboard/galleries/${initialGallery.id}`)}`
                      : "/dashboard"
                    }
                    onClick={() => {
                      eventTracker.trackCTAClick('dashboard', isGalleryOwner ? '/dashboard/galleries' : '/dashboard');
                    }}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  >
                    {t('gallery.publicFooter.accessDashboard')}
                  </Link>
                )}
                
                {/* Create gallery CTA - Link to custom domain if available, otherwise PikSend */}
                <Link
                  href={domainUrl || "/"}
                  onClick={() => {
                    eventTracker.trackCTAClick('create_gallery', domainUrl || '/');
                  }}
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
                  {ownerPlan === 'pro' && initialGallery.custom_logo 
                    ? 'Créer ma galerie' 
                    : t('gallery.publicFooter.createGallery')
                  }
                </Link>
              </div>
            </div>
            
            {/* Copyright - Adapted based on plan */}
            <p className="text-center text-[9px] text-slate-400 dark:text-slate-500 font-medium">
              {ownerPlan === 'pro' && initialGallery.custom_logo ? (
                // White-label: Show custom domain or minimal text
                displayDomain ? (
                  <>© {new Date().getFullYear()} {displayDomain} - Tous droits réservés</>
                ) : (
                  <>© {new Date().getFullYear()} - Galerie sécurisée</>
                )
              ) : (
                // Standard: PikSend branding
                <>{t('gallery.publicFooter.poweredBy')} PikSend © {new Date().getFullYear()}</>
              )}
            </p>
          </div>
        </footer>
      </main>

      {/* Guest Gallery Banner - Requirements: 5.4, 5.5 */}
      <GuestGalleryBanner
        isGuestGallery={!!initialGallery.guest_session_id && !isGalleryOwner}
        isUnlocked={initialGallery.is_unlocked}
        gallerySlug={slug}
        onFeatureLocked={(feature) => signupTrigger.triggerSignup('feature_locked', feature)}
      />

      {/* Soft Signup Modal - Requirements: 5.6, 6.8 */}
      <SoftSignupModal
        isOpen={signupTrigger.isOpen}
        onClose={signupTrigger.closeModal}
        trigger={signupTrigger.trigger || 'guest_upload'}
        lockedFeature={signupTrigger.lockedFeature}
        callbackUrl={`/g/${slug}`}
      />
    </div>
  );
}
