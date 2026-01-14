/**
 * Gallery View Page
 * Public page for viewing password-protected galleries
 * 
 * Requirements: 8.3 - Public gallery view page with password protection
 * Requirements: 7.8 - noindex meta tag for gallery pages
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { GalleryViewClient } from './gallery-view-client';
import { seoService } from '@/lib/services/seo.service';

interface GalleryViewPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for gallery page
 * Validates: Requirements 7.8 - noindex for gallery pages
 */
export async function generateMetadata({ params }: GalleryViewPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Fetch gallery info for title (without exposing sensitive data)
  const supabase = createAdminClient();
  const { data: gallery } = await supabase
    .from('galleries')
    .select('title')
    .eq('unique_slug', slug)
    .maybeSingle();

  return seoService.generateMetadata('gallery', { 
    gallery: gallery ? { 
      ...gallery, 
      id: '', 
      user_id: '', 
      unique_slug: slug,
      password_hash: '',
      expiration_days: 0,
      expires_at: '',
      views_count: 0,
      is_active: true,
      created_at: '',
      updated_at: '',
      guest_session_id: null,
      is_unlocked: false,
      payment_type: 'free',
      converted_at: null
    } : undefined 
  });
}

export default async function GalleryViewPage({ params }: GalleryViewPageProps) {
  const { slug } = await params;

  // Fetch basic gallery info (public data only)
  const supabase = createAdminClient();
  const { data: gallery, error } = await supabase
    .from('galleries')
    .select('id, title, expires_at, views_count, is_active, password_hash, is_unlocked, payment_type, guest_session_id, settings, user_id')
    .eq('unique_slug', slug)
    .maybeSingle();

  if (error || !gallery) {
    notFound();
  }

  // Check if gallery is expired or inactive
  const isExpired = new Date(gallery.expires_at) < new Date();
  const isInactive = !gallery.is_active;

  // Fetch images if gallery is accessible
  let images: { id: string; url: string }[] = [];
  if (!isExpired && !isInactive) {
    const { data: galleryImages } = await supabase
      .from('images')
      .select('id, cloudinary_url')
      .eq('gallery_id', gallery.id)
      .order('order_index');
    
    images = (galleryImages || []).map(img => ({
      id: img.id,
      url: img.cloudinary_url,
    }));
  }

  // Fetch owner's subscription plan and branding if gallery has an owner
  let brandColors = null;
  let ownerPlan: 'free' | 'premium' | 'pro' = 'free';
  
  if ((gallery as any).user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('branding, subscription_plan')
      .eq('id', (gallery as any).user_id)
      .maybeSingle();
    
    if (profile) {
      ownerPlan = (profile as any).subscription_plan || 'free';
      
      if ((profile as any).branding) {
        const branding = (profile as any).branding as { brandColors?: { primary?: string; secondary?: string; accent?: string } };
        brandColors = branding.brandColors || null;
      }
    }
  }

  // Parse gallery settings to get custom colors
  const settings = (gallery as any).settings as { customColors?: { primary?: string; secondary?: string; accent?: string } } | null;
  const customColors = settings?.customColors || brandColors;

  // Generate CSS variables for custom colors
  const cssVariables = customColors ? {
    '--brand-primary': customColors.primary || '#6366f1',
    '--brand-secondary': customColors.secondary || '#8b5cf6',
    '--brand-accent': customColors.accent || '#ec4899',
  } : undefined;

  return (
    <div style={cssVariables as React.CSSProperties}>
      <GalleryViewClient
        slug={slug}
        initialGallery={{
          id: gallery.id,
          title: gallery.title,
          expires_at: gallery.expires_at,
          views_count: gallery.views_count ?? 0,
          images,
          // has_password is true only if password_hash is non-empty
          has_password: !!gallery.password_hash && gallery.password_hash.length > 0,
          is_unlocked: gallery.is_unlocked ?? false,
          payment_type: (gallery.payment_type as 'free' | 'one_time' | 'subscription') ?? 'free',
          guest_session_id: gallery.guest_session_id ?? null,
          settings: (gallery as any).settings as any,
          owner_plan: ownerPlan,
        }}
        isExpired={isExpired}
        isInactive={isInactive}
      />
    </div>
  );
}
