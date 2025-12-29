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
      updated_at: ''
    } : undefined 
  });
}

export default async function GalleryViewPage({ params }: GalleryViewPageProps) {
  const { slug } = await params;

  // Fetch basic gallery info (public data only)
  const supabase = createAdminClient();
  const { data: gallery, error } = await supabase
    .from('galleries')
    .select('id, title, expires_at, views_count, is_active')
    .eq('unique_slug', slug)
    .maybeSingle();

  if (error || !gallery) {
    notFound();
  }

  // Check if gallery is expired or inactive
  const isExpired = new Date(gallery.expires_at) < new Date();
  const isInactive = !gallery.is_active;

  return (
    <GalleryViewClient
      slug={slug}
      initialGallery={{
        id: gallery.id,
        title: gallery.title,
        expires_at: gallery.expires_at,
        views_count: gallery.views_count ?? 0,
        is_active: gallery.is_active ?? true,
      }}
      isExpired={isExpired}
      isInactive={isInactive}
    />
  );
}
