'use client';

import useSWR from 'swr';

/**
 * Profile data structure from the API
 */
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  subscription_plan: 'free' | 'premium' | 'pro';
  storage_used_mb: number;
  storage_limit_mb: number;
  max_galleries: number;
  onboarding_completed: boolean | null;
}

/**
 * Gallery data structure from the API
 */
export interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  expires_at: string;
  views_count: number;
  is_active: boolean;
  created_at: string;
  image_count?: number;
  imageUrl?: string;
  images?: { cloudinary_url?: string; order_index?: number }[];
}

/**
 * Return type for the useDashboardData hook
 */
export interface UseDashboardDataReturn {
  profile: Profile | null;
  galleries: Gallery[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

/**
 * Generic fetcher for SWR
 */
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error('Failed to fetch data');
    (error as any).status = response.status;
    throw error;
  }
  const json = await response.json();
  return json.data ?? json;
};

/**
 * Transform galleries to include image_count and preview image
 */
function transformGalleries(galleries: Gallery[]): Gallery[] {
  return galleries.map((gallery) => {
    const images = gallery.images || [];
    const sortedImages = [...images].sort(
      (a, b) => (a.order_index || 0) - (b.order_index || 0)
    );
    const firstImage = sortedImages[0];

    return {
      ...gallery,
      image_count: images.length,
      imageUrl: firstImage?.cloudinary_url || undefined,
    };
  });
}

/**
 * Custom hook for fetching dashboard data (profile and galleries)
 * Uses SWR for caching, revalidation, and error handling
 * 
 * @returns {UseDashboardDataReturn} Dashboard data with loading and error states
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export function useDashboardData(): UseDashboardDataReturn {
  // Fetch profile data
  const {
    data: profileData,
    error: profileError,
    isLoading: profileLoading,
    mutate: mutateProfile,
  } = useSWR<Profile>('/api/profile', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      // Don't retry on 401/403
      if (error.status === 401 || error.status === 403) return;
      // Only retry up to 3 times
      if (retryCount >= 3) return;
      // Retry after 5 seconds
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
  });

  // Fetch galleries data
  const {
    data: galleriesResponse,
    error: galleriesError,
    isLoading: galleriesLoading,
    mutate: mutateGalleries,
  } = useSWR<{ galleries: Gallery[] }>('/api/galleries', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      // Don't retry on 401/403
      if (error.status === 401 || error.status === 403) return;
      // Only retry up to 3 times
      if (retryCount >= 3) return;
      // Retry after 5 seconds
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
  });

  // Combined loading state
  const isLoading = profileLoading || galleriesLoading;

  // Combined error (prioritize profile error)
  const error = profileError || galleriesError || null;

  // Transform galleries data
  const galleries = galleriesResponse?.galleries
    ? transformGalleries(galleriesResponse.galleries)
    : [];

  // Combined mutate function
  const mutate = () => {
    mutateProfile();
    mutateGalleries();
  };

  return {
    profile: profileData || null,
    galleries,
    isLoading,
    error,
    mutate,
  };
}
