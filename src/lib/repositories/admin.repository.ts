/**
 * Admin Repository
 * Data access layer for admin dashboard operations
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { SubscriptionPlan } from '@/types';
import type {
  DashboardStats,
  UserListItem,
  UserFilters,
  GalleryListItem,
  GalleryFilters,
  GalleryType,
  AnalyticsData,
  TimeSeriesData,
  TopUserData,
  PaginatedResult,
  SubscriptionListItem,
} from '@/types/admin';
import { NotFoundError } from '@/lib/errors';
import { PLAN_LIMITS } from '@/config/plans';

export interface IAdminRepository {
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  
  // Users
  listUsers(filters: UserFilters): Promise<PaginatedResult<UserListItem>>;
  getUserById(id: string): Promise<UserListItem | null>;
  updateUserPlan(id: string, plan: SubscriptionPlan): Promise<void>;
  suspendUser(id: string): Promise<void>;
  reactivateUser(id: string): Promise<void>;
  
  // Galleries
  listGalleries(filters: GalleryFilters): Promise<PaginatedResult<GalleryListItem>>;
  getGalleryById(id: string): Promise<GalleryListItem | null>;
  deactivateGallery(id: string): Promise<void>;
  deleteGallery(id: string): Promise<{ deletedImageIds: string[]; freedStorageMb: number; ownerId: string }>;
  
  // Analytics
  getAnalytics(dateFrom: string, dateTo: string): Promise<AnalyticsData>;
  
  // Subscriptions
  listSubscriptions(): Promise<SubscriptionListItem[]>;
}

export class AdminRepository implements IAdminRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get dashboard statistics
   * Requirements: 2.1, 2.2, 2.3, 2.4, 11.4
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get total users count
    const { count: totalUsers, error: usersError } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get total galleries count
    const { count: totalGalleries, error: galleriesError } = await this.supabase
      .from('galleries')
      .select('*', { count: 'exact', head: true });

    if (galleriesError) throw galleriesError;

    // Get active galleries count (is_active = true AND not expired)
    const { count: activeGalleries, error: activeError } = await this.supabase
      .from('galleries')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gt('expires_at', now);

    if (activeError) throw activeError;

    // Get total storage used
    const { data: storageData, error: storageError } = await this.supabase
      .from('profiles')
      .select('storage_used_mb');

    if (storageError) throw storageError;

    const totalStorageUsedMb = (storageData || []).reduce(
      (sum, profile) => sum + (profile.storage_used_mb || 0),
      0
    );

    // Get plan distribution
    const { data: planData, error: planError } = await this.supabase
      .from('profiles')
      .select('subscription_plan');

    if (planError) throw planError;

    const planDistribution = {
      free: 0,
      premium: 0,
      pro: 0,
    };

    (planData || []).forEach((profile) => {
      const plan = profile.subscription_plan || 'free';
      planDistribution[plan]++;
    });

    // Get recent signups (last 7 days)
    const { count: recentSignups, error: signupsError } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);

    if (signupsError) throw signupsError;

    // Get recent galleries (last 7 days)
    const { count: recentGalleries, error: recentGalleriesError } = await this.supabase
      .from('galleries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);

    if (recentGalleriesError) throw recentGalleriesError;

    // Get guest gallery metrics - Requirements: 11.4
    const guestGalleryMetrics = await this.getGuestGalleryMetrics();

    return {
      totalUsers: totalUsers || 0,
      totalGalleries: totalGalleries || 0,
      activeGalleries: activeGalleries || 0,
      totalStorageUsedMb,
      planDistribution,
      recentSignups: recentSignups || 0,
      recentGalleries: recentGalleries || 0,
      guestGalleryMetrics,
    };
  }

  /**
   * Get guest gallery conversion metrics
   * Requirements: 11.4
   */
  private async getGuestGalleryMetrics(): Promise<{
    totalGuestGalleries: number;
    convertedGalleries: number;
    conversionRate: number;
  }> {
    // Get all galleries with guest-related fields
    const { data: galleries, error } = await this.supabase
      .from('galleries')
      .select('user_id, guest_session_id, is_unlocked, payment_type');

    if (error) throw error;

    let totalGuestGalleries = 0;
    let convertedGalleries = 0;

    (galleries || []).forEach((gallery) => {
      // Count current guest galleries (no user_id, has guest_session_id)
      if (!gallery.user_id && gallery.guest_session_id) {
        totalGuestGalleries++;
      }
      
      // Count converted galleries (has user_id AND was previously a guest - indicated by payment or unlock)
      if (gallery.user_id && (gallery.is_unlocked || (gallery.payment_type && gallery.payment_type !== 'free'))) {
        convertedGalleries++;
        // Also count these in total guest galleries for accurate conversion rate
        totalGuestGalleries++;
      }
    });

    // Calculate conversion rate
    const conversionRate = totalGuestGalleries > 0 
      ? (convertedGalleries / totalGuestGalleries) * 100 
      : 0;

    return {
      totalGuestGalleries,
      convertedGalleries,
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
    };
  }


  /**
   * List users with pagination and filtering
   * Requirements: 3.1, 3.2
   */
  async listUsers(filters: UserFilters): Promise<PaginatedResult<UserListItem>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Build base query
    let query = this.supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply search filter (email or name)
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
    }

    // Apply plan filter
    if (filters.plan) {
      query = query.eq('subscription_plan', filters.plan);
    }

    // Apply status filter
    if (filters.status === 'suspended') {
      query = query.eq('is_suspended', true);
    } else if (filters.status === 'active') {
      query = query.or('is_suspended.is.null,is_suspended.eq.false');
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Get gallery counts for each user
    const userIds = (data || []).map((u) => u.id);
    const galleryCounts = await this.getGalleryCountsForUsers(userIds);

    const users: UserListItem[] = (data || []).map((profile) => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      subscription_plan: profile.subscription_plan || 'free',
      storage_used_mb: profile.storage_used_mb || 0,
      storage_limit_mb: profile.storage_limit_mb || PLAN_LIMITS.free.storage_limit_mb,
      gallery_count: galleryCounts[profile.id] || 0,
      is_suspended: profile.is_suspended || false,
      is_admin: profile.is_admin || false,
      created_at: profile.created_at || new Date().toISOString(),
    }));

    const total = count || 0;

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Helper to get gallery counts for multiple users
   */
  private async getGalleryCountsForUsers(userIds: string[]): Promise<Record<string, number>> {
    if (userIds.length === 0) return {};

    const { data, error } = await this.supabase
      .from('galleries')
      .select('user_id')
      .in('user_id', userIds);

    if (error) throw error;

    const counts: Record<string, number> = {};
    (data || []).forEach((gallery) => {
      if (gallery.user_id) {
        counts[gallery.user_id] = (counts[gallery.user_id] || 0) + 1;
      }
    });

    return counts;
  }

  /**
   * Get user by ID with gallery count
   * Requirements: 3.3
   */
  async getUserById(id: string): Promise<UserListItem | null> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    // Get gallery count
    const { count: galleryCount, error: countError } = await this.supabase
      .from('galleries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if (countError) throw countError;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      subscription_plan: profile.subscription_plan || 'free',
      storage_used_mb: profile.storage_used_mb || 0,
      storage_limit_mb: profile.storage_limit_mb || PLAN_LIMITS.free.storage_limit_mb,
      gallery_count: galleryCount || 0,
      is_suspended: profile.is_suspended || false,
      is_admin: profile.is_admin || false,
      created_at: profile.created_at || new Date().toISOString(),
    };
  }

  /**
   * Update user subscription plan and limits
   * Requirements: 3.4
   */
  async updateUserPlan(id: string, plan: SubscriptionPlan): Promise<void> {
    const limits = PLAN_LIMITS[plan];

    const { error } = await this.supabase
      .from('profiles')
      .update({
        subscription_plan: plan,
        storage_limit_mb: limits.storage_limit_mb,
        max_galleries: limits.max_galleries,
        max_images_per_gallery: limits.max_images_per_gallery,
        max_image_size_mb: limits.max_image_size_mb,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Suspend a user account and deactivate their galleries
   * Requirements: 3.5
   */
  async suspendUser(id: string): Promise<void> {
    // Update user to suspended
    const { error: userError } = await this.supabase
      .from('profiles')
      .update({
        is_suspended: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (userError) throw userError;

    // Deactivate all user galleries
    const { error: galleriesError } = await this.supabase
      .from('galleries')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', id);

    if (galleriesError) throw galleriesError;
  }

  /**
   * Reactivate a suspended user account and their galleries
   * Requirements: 3.6
   */
  async reactivateUser(id: string): Promise<void> {
    // Update user to active
    const { error: userError } = await this.supabase
      .from('profiles')
      .update({
        is_suspended: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (userError) throw userError;

    // Reactivate all user galleries that haven't expired
    const now = new Date().toISOString();
    const { error: galleriesError } = await this.supabase
      .from('galleries')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', id)
      .gt('expires_at', now);

    if (galleriesError) throw galleriesError;
  }


  /**
   * List galleries with pagination and filtering
   * Requirements: 4.1, 4.2, 11.1, 11.2
   */
  async listGalleries(filters: GalleryFilters): Promise<PaginatedResult<GalleryListItem>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const now = new Date().toISOString();

    // Build query with join to get owner info
    let query = this.supabase
      .from('galleries')
      .select(`
        *,
        profiles!galleries_user_id_fkey (
          email,
          name
        )
      `, { count: 'exact' });

    // Apply search filter (title or slug)
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,unique_slug.ilike.%${filters.search}%`);
    }

    // Apply status filter
    if (filters.status === 'active') {
      query = query.eq('is_active', true).gt('expires_at', now);
    } else if (filters.status === 'expired') {
      query = query.lte('expires_at', now);
    } else if (filters.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply gallery type filter
    if (filters.galleryType === 'guest') {
      // Guest galleries: no user_id, has guest_session_id
      query = query.is('user_id', null).not('guest_session_id', 'is', null);
    } else if (filters.galleryType === 'user') {
      // User galleries: has user_id, no guest_session_id (never was a guest gallery)
      query = query.not('user_id', 'is', null).is('guest_session_id', null);
    } else if (filters.galleryType === 'converted') {
      // Converted galleries: has user_id AND was previously a guest (has payment record or specific markers)
      // For now, we identify converted galleries as those with user_id AND payment_type not 'free' OR is_unlocked
      query = query.not('user_id', 'is', null);
      // We'll filter converted galleries in post-processing since it requires checking payment history
    }

    // Apply user filter
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    // Apply date range filters
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Get image counts for each gallery
    const galleryIds = (data || []).map((g) => g.id);
    const imageCounts = await this.getImageCountsForGalleries(galleryIds);

    const galleries: GalleryListItem[] = (data || []).map((gallery) => {
      // Determine gallery type based on Requirements 9.4, 11.1
      const galleryType = this.determineGalleryType(gallery);
      
      return {
        id: gallery.id,
        title: gallery.title,
        unique_slug: gallery.unique_slug,
        owner_email: (gallery.profiles as { email: string; name: string | null } | null)?.email || '',
        owner_name: (gallery.profiles as { email: string; name: string | null } | null)?.name || null,
        owner_id: gallery.user_id || '',
        image_count: imageCounts[gallery.id] || 0,
        views_count: gallery.views_count || 0,
        is_active: gallery.is_active || false,
        expires_at: gallery.expires_at,
        created_at: gallery.created_at || new Date().toISOString(),
        gallery_type: galleryType,
        guest_session_id: gallery.guest_session_id || null,
        is_unlocked: gallery.is_unlocked || false,
        payment_type: (gallery.payment_type as 'free' | 'one_time' | 'subscription') || 'free',
      };
    });

    // Post-filter for converted type if needed
    let filteredGalleries = galleries;
    if (filters.galleryType === 'converted') {
      filteredGalleries = galleries.filter(g => g.gallery_type === 'converted');
    }

    const total = count || 0;

    return {
      data: filteredGalleries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Determine gallery type based on user_id, guest_session_id, and payment status
   * Requirements: 9.4, 11.1
   */
  private determineGalleryType(gallery: {
    user_id: string | null;
    guest_session_id: string | null;
    is_unlocked?: boolean | null;
    payment_type?: string | null;
  }): GalleryType {
    // If no user_id and has guest_session_id -> Guest
    if (!gallery.user_id && gallery.guest_session_id) {
      return 'guest';
    }
    
    // If has user_id and was previously a guest gallery (has payment or is_unlocked)
    // This indicates it was converted from guest to user
    if (gallery.user_id && (gallery.is_unlocked || (gallery.payment_type && gallery.payment_type !== 'free'))) {
      return 'converted';
    }
    
    // If has user_id and no guest indicators -> User
    if (gallery.user_id) {
      return 'user';
    }
    
    // Default to user if unclear
    return 'user';
  }

  /**
   * Helper to get image counts for multiple galleries
   */
  private async getImageCountsForGalleries(galleryIds: string[]): Promise<Record<string, number>> {
    if (galleryIds.length === 0) return {};

    const { data, error } = await this.supabase
      .from('images')
      .select('gallery_id')
      .in('gallery_id', galleryIds);

    if (error) throw error;

    const counts: Record<string, number> = {};
    (data || []).forEach((image) => {
      counts[image.gallery_id] = (counts[image.gallery_id] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get gallery by ID with owner info
   * Requirements: 4.3, 11.3
   */
  async getGalleryById(id: string): Promise<GalleryListItem | null> {
    const { data: gallery, error } = await this.supabase
      .from('galleries')
      .select(`
        *,
        profiles!galleries_user_id_fkey (
          email,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    // Get image count
    const { count: imageCount, error: countError } = await this.supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', id);

    if (countError) throw countError;

    // Determine gallery type
    const galleryType = this.determineGalleryType(gallery);

    return {
      id: gallery.id,
      title: gallery.title,
      unique_slug: gallery.unique_slug,
      owner_email: (gallery.profiles as { email: string; name: string | null } | null)?.email || '',
      owner_name: (gallery.profiles as { email: string; name: string | null } | null)?.name || null,
      owner_id: gallery.user_id || '',
      image_count: imageCount || 0,
      views_count: gallery.views_count || 0,
      is_active: gallery.is_active || false,
      expires_at: gallery.expires_at,
      created_at: gallery.created_at || new Date().toISOString(),
      gallery_type: galleryType,
      guest_session_id: gallery.guest_session_id || null,
      is_unlocked: gallery.is_unlocked || false,
      payment_type: (gallery.payment_type as 'free' | 'one_time' | 'subscription') || 'free',
    };
  }

  /**
   * Deactivate a gallery
   * Requirements: 4.4
   */
  async deactivateGallery(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('galleries')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete a gallery and its images, returning freed storage info
   * Requirements: 4.5
   */
  async deleteGallery(id: string): Promise<{ deletedImageIds: string[]; freedStorageMb: number; ownerId: string }> {
    // Get gallery to find owner
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('user_id')
      .eq('id', id)
      .single();

    if (galleryError) {
      if (galleryError.code === 'PGRST116') {
        throw new NotFoundError('Gallery');
      }
      throw galleryError;
    }

    // Get images to calculate freed storage
    const { data: images, error: imagesError } = await this.supabase
      .from('images')
      .select('id, file_size_mb')
      .eq('gallery_id', id);

    if (imagesError) throw imagesError;

    const deletedImageIds = (images || []).map((img) => img.id);
    const freedStorageMb = (images || []).reduce(
      (sum, img) => sum + (img.file_size_mb || 0),
      0
    );

    // Delete images first (due to foreign key constraint)
    if (deletedImageIds.length > 0) {
      const { error: deleteImagesError } = await this.supabase
        .from('images')
        .delete()
        .eq('gallery_id', id);

      if (deleteImagesError) throw deleteImagesError;
    }

    // Delete gallery
    const { error: deleteGalleryError } = await this.supabase
      .from('galleries')
      .delete()
      .eq('id', id);

    if (deleteGalleryError) throw deleteGalleryError;

    return {
      deletedImageIds,
      freedStorageMb,
      ownerId: gallery.user_id ?? '',
    };
  }


  /**
   * Get analytics data with date range filtering
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  async getAnalytics(dateFrom: string, dateTo: string): Promise<AnalyticsData> {
    // Get user growth over time
    const userGrowth = await this.getUserGrowth(dateFrom, dateTo);

    // Get storage growth over time
    const storageGrowth = await this.getStorageGrowth(dateFrom, dateTo);

    // Get subscription conversions (simplified - counts users who upgraded)
    const subscriptionConversions = await this.getSubscriptionConversions();

    // Get top users by gallery count and storage
    const topUsers = await this.getTopUsers();

    return {
      userGrowth,
      storageGrowth,
      subscriptionConversions,
      topUsers,
    };
  }

  /**
   * Get user growth time series data
   */
  private async getUserGrowth(dateFrom: string, dateTo: string): Promise<TimeSeriesData[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const grouped: Record<string, number> = {};
    (data || []).forEach((profile) => {
      if (profile.created_at) {
        const dateStr = profile.created_at.split('T')[0];
        if (dateStr) {
          grouped[dateStr] = (grouped[dateStr] || 0) + 1;
        }
      }
    });

    // Convert to time series with cumulative count
    const sortedDates = Object.keys(grouped).sort();
    let cumulative = 0;
    const userGrowthResult: TimeSeriesData[] = [];
    for (let i = 0; i < sortedDates.length; i++) {
      const dateKey = sortedDates[i]!;
      cumulative += grouped[dateKey] ?? 0;
      userGrowthResult.push({ date: dateKey, value: cumulative });
    }
    return userGrowthResult;
  }

  /**
   * Get storage growth time series data
   */
  private async getStorageGrowth(dateFrom: string, dateTo: string): Promise<TimeSeriesData[]> {
    // Get images created in date range with their sizes
    const { data, error } = await this.supabase
      .from('images')
      .select('created_at, file_size_mb')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const grouped: Record<string, number> = {};
    (data || []).forEach((image) => {
      if (image.created_at) {
        const dateStr = image.created_at.split('T')[0];
        if (dateStr) {
          grouped[dateStr] = (grouped[dateStr] ?? 0) + (image.file_size_mb || 0);
        }
      }
    });

    // Convert to time series with cumulative storage
    const sortedDates = Object.keys(grouped).sort();
    let cumulative = 0;
    const storageGrowthResult: TimeSeriesData[] = [];
    for (let i = 0; i < sortedDates.length; i++) {
      const dateKey = sortedDates[i]!;
      cumulative += grouped[dateKey] ?? 0;
      storageGrowthResult.push({ date: dateKey, value: Math.round(cumulative * 100) / 100 });
    }
    return storageGrowthResult;
  }

  /**
   * Get subscription conversion data
   */
  private async getSubscriptionConversions(): Promise<{ freeToPremiun: number; freeToPro: number; premiumToPro: number }> {
    // Count users by plan (simplified conversion tracking)
    const { data, error } = await this.supabase
      .from('profiles')
      .select('subscription_plan, stripe_subscription_id');

    if (error) throw error;

    // Count paid subscriptions as conversions
    let freeToPremiun = 0;
    let freeToPro = 0;
    let premiumToPro = 0;

    (data || []).forEach((profile) => {
      if (profile.stripe_subscription_id) {
        if (profile.subscription_plan === 'premium') {
          freeToPremiun++;
        } else if (profile.subscription_plan === 'pro') {
          // Assume some came from premium, some from free
          freeToPro++;
        }
      }
    });

    return { freeToPremiun, freeToPro, premiumToPro };
  }

  /**
   * Get top users by gallery count and storage usage
   */
  private async getTopUsers(): Promise<TopUserData[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, email, name, storage_used_mb')
      .order('storage_used_mb', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Get gallery counts for top users
    const userIds = (data || []).map((u) => u.id);
    const galleryCounts = await this.getGalleryCountsForUsers(userIds);

    return (data || []).map((profile) => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      gallery_count: galleryCounts[profile.id] || 0,
      storage_used_mb: profile.storage_used_mb || 0,
    }));
  }

  /**
   * List all active subscriptions
   * Requirements: 6.1, 6.2
   */
  async listSubscriptions(): Promise<SubscriptionListItem[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .not('subscription_plan', 'eq', 'free')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((profile) => ({
      userId: profile.id,
      userEmail: profile.email,
      userName: profile.name,
      plan: profile.subscription_plan || 'free',
      stripeSubscriptionId: profile.stripe_subscription_id,
      stripeCustomerId: profile.stripe_customer_id,
      status: profile.stripe_subscription_id ? 'active' : 'none',
      createdAt: profile.created_at || new Date().toISOString(),
    }));
  }
}

/**
 * Factory function to create an AdminRepository instance
 */
export function createAdminRepository(
  supabase: SupabaseClient<Database>
): IAdminRepository {
  return new AdminRepository(supabase);
}
