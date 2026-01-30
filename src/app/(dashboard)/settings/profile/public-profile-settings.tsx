'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  ChevronRight,
  User, 
  Eye, 
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Image as ImageIcon,
  Star,
  Settings,
  ImagePlus,
  Mail,
  Images,
  MessageSquare,
  Search,
  BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/types';
import { GeneralTab, type GeneralTabData } from './components/general-tab';
import { MediaTab, type MediaTabData } from './components/media-tab';
import { ContactTab, type ContactTabData } from './components/contact-tab';
import { GalleriesTab, type GalleriesTabData } from './components/galleries-tab';
import { TestimonialsTab, type TestimonialsTabData } from './components/testimonials-tab';
import { SeoTab, type SeoTabData } from './components/seo-tab';

import { DeleteProfileDialog } from '@/components/public-profile/delete-profile-dialog';

interface PublicProfileSettingsProps {
  currentPlan: SubscriptionPlan;
  initialProfile: any;
}

export function PublicProfileSettings({
  currentPlan,
  initialProfile: initialProfileProp,
}: PublicProfileSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(initialProfileProp?.is_enabled || false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileSlug, setProfileSlug] = useState(initialProfileProp?.slug || '');
  const [activeTab, setActiveTab] = useState('general');
  const [initialProfile, setInitialProfile] = useState(initialProfileProp);
  const [profileUrl, setProfileUrl] = useState(profileSlug ? `/p/${profileSlug}` : '');
  const [copied, setCopied] = useState(false);
  const [totalGalleries, setTotalGalleries] = useState(0);

  const isPro = currentPlan === 'pro';

  // Fetch total galleries count
  useEffect(() => {
    const fetchGalleriesCount = async () => {
      try {
        const response = await fetch('/api/galleries');
        if (response.ok) {
          const data = await response.json();
          setTotalGalleries(data.galleries?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching galleries count:', error);
      }
    };
    
    fetchGalleriesCount();
  }, []);

  // Update profile URL when slug changes (client-side only for full URL)
  useEffect(() => {
    if (profileSlug) {
      setProfileUrl(`${window.location.origin}/p/${profileSlug}`);
    } else {
      setProfileUrl('');
    }
  }, [profileSlug]);

  // Calculate profile completion
  const calculateCompletion = () => {
    if (!initialProfile) return 0;
    let completed = 0;
    const total = 8;
    
    if (initialProfile.slug) completed++;
    if (initialProfile.display_name) completed++;
    if (initialProfile.bio) completed++;
    if (initialProfile.avatar_url) completed++;
    if (initialProfile.cover_image_url) completed++;
    if (initialProfile.public_email || initialProfile.phone) completed++;
    if (initialProfile.social_links && Object.keys(initialProfile.social_links).length > 0) completed++;
    if (initialProfile.meta_title || initialProfile.meta_description) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const completion = calculateCompletion();

  const handleSaveGeneral = async (data: GeneralTabData) => {
    try {
      const response = await fetch('/api/public-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          isEnabled: isEnabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la mise à jour');
      }

      const result = await response.json();
      
      // Update local state with new data
      if (result.data) {
        // Map camelCase response to snake_case for initialProfile
        setInitialProfile({
          id: result.data.id,
          user_id: result.data.userId,
          is_enabled: result.data.isEnabled,
          slug: result.data.slug,
          display_name: result.data.displayName,
          tagline: result.data.tagline,
          bio: result.data.bio,
          location: result.data.location,
          avatar_url: result.data.avatarUrl,
          cover_image_url: result.data.coverImageUrl,
          specialties: result.data.specialties,
          years_of_experience: result.data.yearsOfExperience,
          awards: result.data.awards,
          public_email: result.data.publicEmail,
          phone: result.data.phone,
          website: result.data.website,
          address: result.data.address,
          social_links: result.data.socialLinks,
          cta_button: result.data.ctaButton,
          testimonials: result.data.testimonials,
          featured_galleries: result.data.featuredGalleries,
          hidden_galleries: result.data.hiddenGalleries,
          meta_title: result.data.metaTitle,
          meta_description: result.data.metaDescription,
          meta_keywords: result.data.metaKeywords,
          views_count: result.data.viewsCount,
          last_viewed_at: result.data.lastViewedAt,
          created_at: result.data.createdAt,
          updated_at: result.data.updatedAt,
        });
        
        setProfileSlug(result.data.slug);
      }

      // Don't show toast here - GeneralTab will show it
    } catch (error) {
      throw error; // Re-throw to let GeneralTab handle the error display
    }
  };

  const handleSaveMedia = async (data: MediaTabData) => {
    try {
      // Ensure required fields are present
      if (!initialProfile?.slug && !profileSlug) {
        toast.error('Veuillez d\'abord configurer votre slug dans l\'onglet Général');
        setActiveTab('general');
        return;
      }

      if (!initialProfile?.display_name) {
        toast.error('Veuillez d\'abord configurer votre nom dans l\'onglet Général');
        setActiveTab('general');
        return;
      }

      // Map database fields (snake_case) to API fields (camelCase)
      // Use nullish coalescing to properly handle empty strings
      const profileData = {
        isEnabled: isEnabled,
        slug: initialProfile.slug || profileSlug,
        displayName: initialProfile.display_name,
        tagline: initialProfile?.tagline ?? undefined,
        bio: initialProfile?.bio ?? undefined,
        location: initialProfile?.location ?? undefined,
        avatarUrl: data.avatarUrl ?? initialProfile?.avatar_url ?? undefined,
        coverImageUrl: data.coverImageUrl ?? initialProfile?.cover_image_url ?? undefined,
        specialties: initialProfile?.specialties ?? undefined,
        yearsOfExperience: initialProfile?.years_of_experience ?? undefined,
        awards: initialProfile?.awards ?? undefined,
        publicEmail: initialProfile?.public_email ?? undefined,
        phone: initialProfile?.phone ?? undefined,
        website: initialProfile?.website ?? undefined,
        address: initialProfile?.address ?? undefined,
        socialLinks: initialProfile?.social_links ?? undefined,
        ctaButton: initialProfile?.cta_button ?? undefined,
        testimonials: initialProfile?.testimonials ?? undefined,
        featuredGalleries: initialProfile?.featured_galleries ?? undefined,
        hiddenGalleries: initialProfile?.hidden_galleries ?? undefined,
        metaTitle: initialProfile?.meta_title ?? undefined,
        metaDescription: initialProfile?.meta_description ?? undefined,
        metaKeywords: initialProfile?.meta_keywords ?? undefined,
      };

      const response = await fetch('/api/public-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Display validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((err: any) => 
            `${err.path?.join('.') || 'Champ'}: ${err.message}`
          ).join(', ');
          throw new Error(errorMessages);
        }
        
        throw new Error(errorData.message || 'Échec de la mise à jour');
      }

      const result = await response.json();
      
      // Update local state with new data
      if (result.data) {
        setInitialProfile({
          id: result.data.id,
          user_id: result.data.userId,
          is_enabled: result.data.isEnabled,
          slug: result.data.slug,
          display_name: result.data.displayName,
          tagline: result.data.tagline,
          bio: result.data.bio,
          location: result.data.location,
          avatar_url: result.data.avatarUrl,
          cover_image_url: result.data.coverImageUrl,
          specialties: result.data.specialties,
          years_of_experience: result.data.yearsOfExperience,
          awards: result.data.awards,
          public_email: result.data.publicEmail,
          phone: result.data.phone,
          website: result.data.website,
          address: result.data.address,
          social_links: result.data.socialLinks,
          cta_button: result.data.ctaButton,
          testimonials: result.data.testimonials,
          featured_galleries: result.data.featuredGalleries,
          hidden_galleries: result.data.hiddenGalleries,
          meta_title: result.data.metaTitle,
          meta_description: result.data.metaDescription,
          meta_keywords: result.data.metaKeywords,
          views_count: result.data.viewsCount,
          last_viewed_at: result.data.lastViewedAt,
          created_at: result.data.createdAt,
          updated_at: result.data.updatedAt,
        });
      }

      // Don't show toast here - MediaTab will show it
    } catch (error) {
      // Don't show toast here - MediaTab will show it
      throw error;
    }
  };

  const handleSaveContact = async (data: ContactTabData) => {
    try {
      // Ensure required fields are present
      if (!initialProfile?.slug && !profileSlug) {
        toast.error('Veuillez d\'abord configurer votre slug dans l\'onglet Général');
        setActiveTab('general');
        return;
      }

      if (!initialProfile?.display_name) {
        toast.error('Veuillez d\'abord configurer votre nom dans l\'onglet Général');
        setActiveTab('general');
        return;
      }

      // Map database fields (snake_case) to API fields (camelCase)
      // Use nullish coalescing to properly handle empty strings
      const profileData = {
        isEnabled: isEnabled,
        slug: initialProfile.slug || profileSlug,
        displayName: initialProfile.display_name,
        tagline: initialProfile?.tagline ?? undefined,
        bio: initialProfile?.bio ?? undefined,
        location: initialProfile?.location ?? undefined,
        avatarUrl: initialProfile?.avatar_url ?? undefined,
        coverImageUrl: initialProfile?.cover_image_url ?? undefined,
        specialties: initialProfile?.specialties ?? undefined,
        yearsOfExperience: initialProfile?.years_of_experience ?? undefined,
        awards: initialProfile?.awards ?? undefined,
        publicEmail: data.publicEmail ?? initialProfile?.public_email ?? undefined,
        phone: data.phone ?? initialProfile?.phone ?? undefined,
        website: data.website ?? initialProfile?.website ?? undefined,
        address: data.address ?? initialProfile?.address ?? undefined,
        socialLinks: data.socialLinks ?? initialProfile?.social_links ?? undefined,
        ctaButton: data.ctaButton ?? initialProfile?.cta_button ?? undefined,
        testimonials: initialProfile?.testimonials ?? undefined,
        featuredGalleries: initialProfile?.featured_galleries ?? undefined,
        hiddenGalleries: initialProfile?.hidden_galleries ?? undefined,
        metaTitle: initialProfile?.meta_title ?? undefined,
        metaDescription: initialProfile?.meta_description ?? undefined,
        metaKeywords: initialProfile?.meta_keywords ?? undefined,
      };

      const response = await fetch('/api/public-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Display validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((err: any) => 
            `${err.path?.join('.') || 'Champ'}: ${err.message}`
          ).join(', ');
          throw new Error(errorMessages);
        }
        
        throw new Error(errorData.message || 'Échec de la mise à jour');
      }

      const result = await response.json();
      
      // Update local state with new data
      if (result.data) {
        setInitialProfile({
          id: result.data.id,
          user_id: result.data.userId,
          is_enabled: result.data.isEnabled,
          slug: result.data.slug,
          display_name: result.data.displayName,
          tagline: result.data.tagline,
          bio: result.data.bio,
          location: result.data.location,
          avatar_url: result.data.avatarUrl,
          cover_image_url: result.data.coverImageUrl,
          specialties: result.data.specialties,
          years_of_experience: result.data.yearsOfExperience,
          awards: result.data.awards,
          public_email: result.data.publicEmail,
          phone: result.data.phone,
          website: result.data.website,
          address: result.data.address,
          social_links: result.data.socialLinks,
          cta_button: result.data.ctaButton,
          testimonials: result.data.testimonials,
          featured_galleries: result.data.featuredGalleries,
          hidden_galleries: result.data.hiddenGalleries,
          meta_title: result.data.metaTitle,
          meta_description: result.data.metaDescription,
          meta_keywords: result.data.metaKeywords,
          views_count: result.data.viewsCount,
          last_viewed_at: result.data.lastViewedAt,
          created_at: result.data.createdAt,
          updated_at: result.data.updatedAt,
        });
      }

      // Don't show toast here - ContactTab will show it
    } catch (error) {
      // Don't show toast here - ContactTab will show it
      throw error;
    }
  };

  const handleSaveGalleries = async (data: GalleriesTabData) => {
    try {
      // Ensure required fields are present
      if (!initialProfile?.slug && !profileSlug) {
        toast.error('Veuillez d\'abord configurer votre slug dans l\'onglet Général');
        setActiveTab('general');
        return;
      }

      if (!initialProfile?.display_name) {
        toast.error('Veuillez d\'abord configurer votre nom dans l\'onglet Général');
        setActiveTab('general');
        return;
      }

      // Map database fields (snake_case) to API fields (camelCase)
      // Use nullish coalescing to properly handle empty strings
      const profileData = {
        isEnabled: isEnabled,
        slug: initialProfile.slug || profileSlug,
        displayName: initialProfile.display_name,
        tagline: initialProfile?.tagline ?? undefined,
        bio: initialProfile?.bio ?? undefined,
        location: initialProfile?.location ?? undefined,
        avatarUrl: initialProfile?.avatar_url ?? undefined,
        coverImageUrl: initialProfile?.cover_image_url ?? undefined,
        specialties: initialProfile?.specialties ?? undefined,
        yearsOfExperience: initialProfile?.years_of_experience ?? undefined,
        awards: initialProfile?.awards ?? undefined,
        publicEmail: initialProfile?.public_email ?? undefined,
        phone: initialProfile?.phone ?? undefined,
        website: initialProfile?.website ?? undefined,
        address: initialProfile?.address ?? undefined,
        socialLinks: initialProfile?.social_links ?? undefined,
        ctaButton: initialProfile?.cta_button ?? undefined,
        testimonials: initialProfile?.testimonials ?? undefined,
        featuredGalleries: data.featuredGalleries ?? initialProfile?.featured_galleries ?? undefined,
        hiddenGalleries: data.hiddenGalleries ?? initialProfile?.hidden_galleries ?? undefined,
        metaTitle: initialProfile?.meta_title ?? undefined,
        metaDescription: initialProfile?.meta_description ?? undefined,
        metaKeywords: initialProfile?.meta_keywords ?? undefined,
      };

      const response = await fetch('/api/public-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Display validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((err: any) => 
            `${err.path?.join('.') || 'Champ'}: ${err.message}`
          ).join(', ');
          throw new Error(errorMessages);
        }
        
        throw new Error(errorData.message || 'Échec de la mise à jour');
      }

      const result = await response.json();
      
      // Update local state with new data
      if (result.data) {
        setInitialProfile({
          id: result.data.id,
          user_id: result.data.userId,
          is_enabled: result.data.isEnabled,
          slug: result.data.slug,
          display_name: result.data.displayName,
          tagline: result.data.tagline,
          bio: result.data.bio,
          location: result.data.location,
          avatar_url: result.data.avatarUrl,
          cover_image_url: result.data.coverImageUrl,
          specialties: result.data.specialties,
          years_of_experience: result.data.yearsOfExperience,
          awards: result.data.awards,
          public_email: result.data.publicEmail,
          phone: result.data.phone,
          website: result.data.website,
          address: result.data.address,
          social_links: result.data.socialLinks,
          cta_button: result.data.ctaButton,
          testimonials: result.data.testimonials,
          featured_galleries: result.data.featuredGalleries,
          hidden_galleries: result.data.hiddenGalleries,
          meta_title: result.data.metaTitle,
          meta_description: result.data.metaDescription,
          meta_keywords: result.data.metaKeywords,
          views_count: result.data.viewsCount,
          last_viewed_at: result.data.lastViewedAt,
          created_at: result.data.createdAt,
          updated_at: result.data.updatedAt,
        });
      }

      // Don't show toast here - GalleriesTab will show it
    } catch (error) {
      // Don't show toast here - GalleriesTab will show it
      throw error;
    }
  };

  const handleSaveTestimonials = async (data: TestimonialsTabData) => {
    try {
      // Ensure required fields are present
      if (!initialProfile?.slug && !profileSlug) {
        toast.error('Veuillez d\'abord configurer votre slug dans l\'onglet Général');
        setActiveTab('general');
        return;
      }

      if (!initialProfile?.display_name) {
        toast.error('Veuillez d\'abord configurer votre nom dans l\'onglet Général');
        setActiveTab('general');
        return;
      }

      // Map database fields (snake_case) to API fields (camelCase)
      // Use nullish coalescing to properly handle empty strings
      const profileData = {
        isEnabled: isEnabled,
        slug: initialProfile.slug || profileSlug,
        displayName: initialProfile.display_name,
        tagline: initialProfile?.tagline ?? undefined,
        bio: initialProfile?.bio ?? undefined,
        location: initialProfile?.location ?? undefined,
        avatarUrl: initialProfile?.avatar_url ?? undefined,
        coverImageUrl: initialProfile?.cover_image_url ?? undefined,
        specialties: initialProfile?.specialties ?? undefined,
        yearsOfExperience: initialProfile?.years_of_experience ?? undefined,
        awards: initialProfile?.awards ?? undefined,
        publicEmail: initialProfile?.public_email ?? undefined,
        phone: initialProfile?.phone ?? undefined,
        website: initialProfile?.website ?? undefined,
        address: initialProfile?.address ?? undefined,
        socialLinks: initialProfile?.social_links ?? undefined,
        ctaButton: initialProfile?.cta_button ?? undefined,
        testimonials: data.testimonials ?? initialProfile?.testimonials ?? undefined,
        featuredGalleries: initialProfile?.featured_galleries ?? undefined,
        hiddenGalleries: initialProfile?.hidden_galleries ?? undefined,
        metaTitle: initialProfile?.meta_title ?? undefined,
        metaDescription: initialProfile?.meta_description ?? undefined,
        metaKeywords: initialProfile?.meta_keywords ?? undefined,
      };

      const response = await fetch('/api/public-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Display validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((err: any) => 
            `${err.path?.join('.') || 'Champ'}: ${err.message}`
          ).join(', ');
          throw new Error(errorMessages);
        }
        
        throw new Error(errorData.message || 'Échec de la mise à jour');
      }

      const result = await response.json();
      
      // Update local state with new data
      if (result.data) {
        setInitialProfile({
          id: result.data.id,
          user_id: result.data.userId,
          is_enabled: result.data.isEnabled,
          slug: result.data.slug,
          display_name: result.data.displayName,
          tagline: result.data.tagline,
          bio: result.data.bio,
          location: result.data.location,
          avatar_url: result.data.avatarUrl,
          cover_image_url: result.data.coverImageUrl,
          specialties: result.data.specialties,
          years_of_experience: result.data.yearsOfExperience,
          awards: result.data.awards,
          public_email: result.data.publicEmail,
          phone: result.data.phone,
          website: result.data.website,
          address: result.data.address,
          social_links: result.data.socialLinks,
          cta_button: result.data.ctaButton,
          testimonials: result.data.testimonials,
          featured_galleries: result.data.featuredGalleries,
          hidden_galleries: result.data.hiddenGalleries,
          meta_title: result.data.metaTitle,
          meta_description: result.data.metaDescription,
          meta_keywords: result.data.metaKeywords,
          views_count: result.data.viewsCount,
          last_viewed_at: result.data.lastViewedAt,
          created_at: result.data.createdAt,
          updated_at: result.data.updatedAt,
        });
      }

      // Don't show toast here - TestimonialsTab will show it
    } catch (error) {
      // Don't show toast here - TestimonialsTab will show it
      throw error;
    }
  };

  const handleSaveSeo = async (data: SeoTabData) => {
    try {
      // Ensure required fields are present
      if (!initialProfile?.slug && !profileSlug) {
        toast.error('Veuillez d\'abord configurer votre slug dans l\'onglet Général');
        setActiveTab('general');
        return;
      }

      if (!initialProfile?.display_name) {
        toast.error('Veuillez d\'abord configurer votre nom dans l\'onglet Général');
        setActiveTab('general');
        return;
      }

      // Map database fields (snake_case) to API fields (camelCase)
      // Use nullish coalescing to properly handle empty strings
      const profileData = {
        isEnabled: isEnabled,
        slug: initialProfile.slug || profileSlug,
        displayName: initialProfile.display_name,
        tagline: initialProfile?.tagline ?? undefined,
        bio: initialProfile?.bio ?? undefined,
        location: initialProfile?.location ?? undefined,
        avatarUrl: initialProfile?.avatar_url ?? undefined,
        coverImageUrl: initialProfile?.cover_image_url ?? undefined,
        specialties: initialProfile?.specialties ?? undefined,
        yearsOfExperience: initialProfile?.years_of_experience ?? undefined,
        awards: initialProfile?.awards ?? undefined,
        publicEmail: initialProfile?.public_email ?? undefined,
        phone: initialProfile?.phone ?? undefined,
        website: initialProfile?.website ?? undefined,
        address: initialProfile?.address ?? undefined,
        socialLinks: initialProfile?.social_links ?? undefined,
        ctaButton: initialProfile?.cta_button ?? undefined,
        testimonials: initialProfile?.testimonials ?? undefined,
        featuredGalleries: initialProfile?.featured_galleries ?? undefined,
        hiddenGalleries: initialProfile?.hidden_galleries ?? undefined,
        metaTitle: data.metaTitle ?? initialProfile?.meta_title ?? undefined,
        metaDescription: data.metaDescription ?? initialProfile?.meta_description ?? undefined,
        metaKeywords: data.metaKeywords ?? initialProfile?.meta_keywords ?? undefined,
      };

      const response = await fetch('/api/public-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Display validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((err: any) => 
            `${err.path?.join('.') || 'Champ'}: ${err.message}`
          ).join(', ');
          throw new Error(errorMessages);
        }
        
        throw new Error(errorData.message || 'Échec de la mise à jour');
      }

      const result = await response.json();
      
      // Update local state with new data
      if (result.data) {
        setInitialProfile({
          id: result.data.id,
          user_id: result.data.userId,
          is_enabled: result.data.isEnabled,
          slug: result.data.slug,
          display_name: result.data.displayName,
          tagline: result.data.tagline,
          bio: result.data.bio,
          location: result.data.location,
          avatar_url: result.data.avatarUrl,
          cover_image_url: result.data.coverImageUrl,
          specialties: result.data.specialties,
          years_of_experience: result.data.yearsOfExperience,
          awards: result.data.awards,
          public_email: result.data.publicEmail,
          phone: result.data.phone,
          website: result.data.website,
          address: result.data.address,
          social_links: result.data.socialLinks,
          cta_button: result.data.ctaButton,
          testimonials: result.data.testimonials,
          featured_galleries: result.data.featuredGalleries,
          hidden_galleries: result.data.hiddenGalleries,
          meta_title: result.data.metaTitle,
          meta_description: result.data.metaDescription,
          meta_keywords: result.data.metaKeywords,
          views_count: result.data.viewsCount,
          last_viewed_at: result.data.lastViewedAt,
          created_at: result.data.createdAt,
          updated_at: result.data.updatedAt,
        });
      }

      // Don't show toast here - SeoTab will show it
    } catch (error) {
      // Don't show toast here - SeoTab will show it
      throw error;
    }
  };

  const handleToggleProfile = async (enabled: boolean) => {
    if (!isPro) {
      toast.error('Cette fonctionnalité est réservée aux utilisateurs Pro');
      return;
    }

    if (enabled && !profileSlug) {
      toast.error('Veuillez d\'abord configurer votre profil dans l\'onglet Général');
      setActiveTab('general');
      return;
    }

    try {
      setIsLoading(true);
      
      // Ensure required fields are present
      if (!initialProfile?.slug && !profileSlug) {
        toast.error('Veuillez d\'abord configurer votre slug dans l\'onglet Général');
        setActiveTab('general');
        setIsLoading(false);
        return;
      }

      if (!initialProfile?.display_name) {
        toast.error('Veuillez d\'abord configurer votre nom dans l\'onglet Général');
        setActiveTab('general');
        setIsLoading(false);
        return;
      }
      
      // Map database fields (snake_case) to API fields (camelCase)
      // Use nullish coalescing to properly handle empty strings
      const profileData = {
        isEnabled: enabled,
        slug: initialProfile.slug || profileSlug,
        displayName: initialProfile.display_name,
        tagline: initialProfile?.tagline ?? undefined,
        bio: initialProfile?.bio ?? undefined,
        location: initialProfile?.location ?? undefined,
        avatarUrl: initialProfile?.avatar_url ?? undefined,
        coverImageUrl: initialProfile?.cover_image_url ?? undefined,
        specialties: initialProfile?.specialties ?? undefined,
        yearsOfExperience: initialProfile?.years_of_experience ?? undefined,
        awards: initialProfile?.awards ?? undefined,
        publicEmail: initialProfile?.public_email ?? undefined,
        phone: initialProfile?.phone ?? undefined,
        website: initialProfile?.website ?? undefined,
        address: initialProfile?.address ?? undefined,
        socialLinks: initialProfile?.social_links ?? undefined,
        ctaButton: initialProfile?.cta_button ?? undefined,
        testimonials: initialProfile?.testimonials ?? undefined,
        featuredGalleries: initialProfile?.featured_galleries ?? undefined,
        hiddenGalleries: initialProfile?.hidden_galleries ?? undefined,
        metaTitle: initialProfile?.meta_title ?? undefined,
        metaDescription: initialProfile?.meta_description ?? undefined,
        metaKeywords: initialProfile?.meta_keywords || undefined,
      };

      const response = await fetch('/api/public-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Échec de la mise à jour');
      }

      const result = await response.json();
      
      // Update local state with new data
      if (result.data) {
        setInitialProfile({
          id: result.data.id,
          user_id: result.data.userId,
          is_enabled: result.data.isEnabled,
          slug: result.data.slug,
          display_name: result.data.displayName,
          tagline: result.data.tagline,
          bio: result.data.bio,
          location: result.data.location,
          avatar_url: result.data.avatarUrl,
          cover_image_url: result.data.coverImageUrl,
          specialties: result.data.specialties,
          years_of_experience: result.data.yearsOfExperience,
          awards: result.data.awards,
          public_email: result.data.publicEmail,
          phone: result.data.phone,
          website: result.data.website,
          address: result.data.address,
          social_links: result.data.socialLinks,
          cta_button: result.data.ctaButton,
          testimonials: result.data.testimonials,
          featured_galleries: result.data.featuredGalleries,
          hidden_galleries: result.data.hiddenGalleries,
          meta_title: result.data.metaTitle,
          meta_description: result.data.metaDescription,
          meta_keywords: result.data.metaKeywords,
          views_count: result.data.viewsCount,
          last_viewed_at: result.data.lastViewedAt,
          created_at: result.data.createdAt,
          updated_at: result.data.updatedAt,
        });
      }

      setIsEnabled(enabled);
      toast.success(enabled ? 'Profil public activé !' : 'Profil public désactivé');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de la mise à jour');
      setIsEnabled(!enabled);
    } finally {
      setIsLoading(false);
    }
  };

  const copyProfileUrl = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Échec de la copie');
    }
  };

  const openPreview = () => {
    if (!profileSlug) {
      toast.error('Aucun profil à prévisualiser');
      return;
    }
    window.open('/settings/profile/preview', '_blank');
  };

  const handleDeleteSuccess = () => {
    // Reset the profile state
    setInitialProfile(null);
    setProfileSlug('');
    setProfileUrl('');
    setIsEnabled(false);
    
    // Optionally redirect or show a message
    toast.success('Votre profil public a été supprimé');
  };

  return (
    <div className="space-y-5">
      {/* Navigation / Breadcrumb */}
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
        <Link 
          href="/settings"
          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-bold text-xs transition-all group"
        >
          <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md group-active:scale-95 transition-all">
            <ArrowLeft size={14} />
          </div>
          <span className="hidden sm:inline">Paramètres</span>
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-xs font-bold text-slate-400">Profil Public</span>
      </div>

      {/* Hero Section */}
      <div className="relative animate-in slide-in-from-top-4 duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>

        <div className="relative z-10 p-4 sm:p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2.5 flex-1 min-w-0">
              {/* Status Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md ${
                  isEnabled 
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' 
                    : 'bg-slate-500/20 text-slate-200 border border-slate-400/30'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${
                    isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                  }`} />
                  {isEnabled ? 'Actif' : 'Inactif'}
                </div>
                {profileSlug && (
                  <div className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-[9px] font-bold uppercase tracking-wider border border-white/10 backdrop-blur-md">
                    /{profileSlug}
                  </div>
                )}
                {!isPro && (
                  <div className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 text-[9px] font-black uppercase tracking-wider border border-amber-400/30 backdrop-blur-md">
                    Fonctionnalité Pro
                  </div>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                Profil Public
              </h1>
              
              <p className="text-indigo-100/60 text-xs sm:text-sm font-medium max-w-xl leading-relaxed hidden sm:block">
                Créez votre vitrine professionnelle en ligne et partagez votre portfolio avec le monde.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="shrink-0 flex gap-2">
              {profileSlug && (
                <>
                  <Link href="/settings/profile/analytics">
                    <button 
                      className="group relative px-4 py-2.5 backdrop-blur-md font-bold text-sm rounded-xl transition-all border hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      <BarChart3 size={16} />
                      <span className="hidden sm:inline">Analytics</span>
                    </button>
                  </Link>
                  <button 
                    onClick={openPreview}
                    className="group relative px-4 py-2.5 backdrop-blur-md font-bold text-sm rounded-xl transition-all border hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                  >
                    <Eye size={16} />
                    <span className="hidden sm:inline">Prévisualiser</span>
                  </button>
                </>
              )}
              {profileUrl && (
                <button 
                  onClick={copyProfileUrl}
                  className="group relative px-4 py-2.5 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none" />
                  {copied ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={16} className="text-indigo-600" />}
                  <span>{copied ? 'Copié !' : 'Copier le lien'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
            {/* Completion Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg text-white group-hover/stat:scale-110 transition-transform">
                  <User size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Complété</p>
                  <p className="text-base font-black tracking-tight">{completion}%</p>
                </div>
              </div>
            </div>

            {/* Views Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg text-white group-hover/stat:scale-110 transition-transform">
                  <Eye size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Vues</p>
                  <p className="text-base font-black tracking-tight">{initialProfile?.views_count?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>

            {/* Galleries Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg text-white group-hover/stat:scale-110 transition-transform">
                  <ImageIcon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Galeries</p>
                  <p className="text-base font-black tracking-tight">{totalGalleries}</p>
                </div>
              </div>
            </div>

            {/* Testimonials Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 hover:bg-white/15 transition-all group/stat">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg text-white group-hover/stat:scale-110 transition-transform">
                  <Star size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Témoignages</p>
                  <p className="text-base font-black tracking-tight">{initialProfile?.testimonials?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Plan Notice */}
      {!isPro && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                Fonctionnalité Pro
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                Le profil public est une fonctionnalité exclusive du plan Pro. 
                Passez au plan Pro pour créer votre vitrine professionnelle.
              </p>
              <Link href="/pricing">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  Passer au plan Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Activation Toggle */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 animate-in fade-in slide-in-from-top-3 duration-500">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="profile-enabled" className="text-base font-semibold text-slate-900">
                Activer le profil public
              </Label>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                isEnabled 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                  : 'bg-slate-100 text-slate-600 border border-slate-300'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`} />
                {isEnabled ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Rendez votre profil accessible publiquement via une URL personnalisée
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              disabled={!isPro || isLoading}
              onClick={() => !(!isPro || isLoading) && handleToggleProfile(!isEnabled)}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                isEnabled 
                  ? "bg-emerald-500 border-emerald-600" 
                  : "bg-slate-300 border-slate-400"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200",
                  isEnabled ? "translate-x-6" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Profile URL Display */}
        {isEnabled && profileSlug && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Lien de votre profil public
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                >
                  <Globe size={14} />
                  {profileUrl}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs Header with gradient background */}
          <div className="relative border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-3 sm:p-4">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="relative">
              {/* Scroll indicator for mobile */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden z-10 rounded-r-xl" />
              
              <TabsList className="inline-flex w-auto h-auto p-1.5 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm gap-1 overflow-x-auto scrollbar-hide">
                <TabsTrigger
                  value="general"
                  className={cn(
                    "relative px-3 sm:px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2",
                    "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 hover:scale-105",
                    "data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-700 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-300/50 data-[state=active]:scale-105"
                  )}
                >
                  <Settings size={14} className="shrink-0 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Général</span>
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className={cn(
                    "relative px-3 sm:px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2",
                    "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 hover:scale-105",
                    "data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-700 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-300/50 data-[state=active]:scale-105"
                  )}
                >
                  <ImagePlus size={14} className="shrink-0 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Médias</span>
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className={cn(
                    "relative px-3 sm:px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2",
                    "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 hover:scale-105",
                    "data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-700 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-300/50 data-[state=active]:scale-105"
                  )}
                >
                  <Mail size={14} className="shrink-0 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Contact</span>
                </TabsTrigger>
                <TabsTrigger
                  value="galleries"
                  className={cn(
                    "relative px-3 sm:px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2",
                    "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 hover:scale-105",
                    "data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-700 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-300/50 data-[state=active]:scale-105"
                  )}
                >
                  <Images size={14} className="shrink-0 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Galeries</span>
                </TabsTrigger>
                <TabsTrigger
                  value="testimonials"
                  className={cn(
                    "relative px-3 sm:px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2",
                    "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 hover:scale-105",
                    "data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-700 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-300/50 data-[state=active]:scale-105"
                  )}
                >
                  <MessageSquare size={14} className="shrink-0 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Témoignages</span>
                </TabsTrigger>
                <TabsTrigger
                  value="seo"
                  className={cn(
                    "relative px-3 sm:px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2",
                    "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 hover:scale-105",
                    "data-[state=active]:text-white data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-700 data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-300/50 data-[state=active]:scale-105"
                  )}
                >
                  <Search size={14} className="shrink-0 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">SEO</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content with improved padding and background */}
          <div className="p-5 sm:p-7 bg-gradient-to-br from-white to-slate-50/30">
            <TabsContent value="general" className="mt-0">
              <GeneralTab
                initialData={{
                  slug: initialProfile?.slug,
                  displayName: initialProfile?.display_name,
                  tagline: initialProfile?.tagline,
                  bio: initialProfile?.bio,
                }}
                onSave={handleSaveGeneral}
                disabled={!isPro}
              />
            </TabsContent>

            <TabsContent value="media" className="mt-0">
              <MediaTab
                initialData={{
                  avatarUrl: initialProfile?.avatar_url,
                  coverImageUrl: initialProfile?.cover_image_url,
                }}
                onSave={handleSaveMedia}
                disabled={!isPro}
              />
            </TabsContent>

            <TabsContent value="contact" className="mt-0">
              <ContactTab
                initialData={{
                  publicEmail: initialProfile?.public_email,
                  phone: initialProfile?.phone,
                  website: initialProfile?.website,
                  address: initialProfile?.address,
                  socialLinks: initialProfile?.social_links,
                  ctaButton: initialProfile?.cta_button,
                }}
                onSave={handleSaveContact}
                disabled={!isPro}
              />
            </TabsContent>

            <TabsContent value="galleries" className="mt-0">
              <GalleriesTab
                initialData={{
                  featuredGalleries: initialProfile?.featured_galleries,
                  hiddenGalleries: initialProfile?.hidden_galleries,
                }}
                onSave={handleSaveGalleries}
                disabled={!isPro}
              />
            </TabsContent>

            <TabsContent value="testimonials" className="mt-0">
              <TestimonialsTab
                initialData={{
                  testimonials: initialProfile?.testimonials,
                }}
                onSave={handleSaveTestimonials}
                disabled={!isPro}
              />
            </TabsContent>

            <TabsContent value="seo" className="mt-0">
              <SeoTab
                initialData={{
                  metaTitle: initialProfile?.meta_title,
                  metaDescription: initialProfile?.meta_description,
                  metaKeywords: initialProfile?.meta_keywords,
                  displayName: initialProfile?.display_name,
                  bio: initialProfile?.bio,
                }}
                onSave={handleSaveSeo}
                disabled={!isPro}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Danger Zone - Delete Profile */}
      {initialProfile && isPro && (
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-5 duration-500">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Zone de danger
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Actions irréversibles sur votre profil public
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 mb-1">
                  Supprimer le profil public
                </h4>
                <p className="text-sm text-slate-600">
                  Supprime définitivement votre profil public et toutes les données analytics associées. 
                  Cette action respecte le droit à l'oubli (RGPD) et ne peut pas être annulée.
                </p>
              </div>
              <div className="shrink-0">
                <DeleteProfileDialog 
                  onDeleteSuccess={handleDeleteSuccess}
                  disabled={!isPro}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-slate-900 font-medium">Mise à jour en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
}
