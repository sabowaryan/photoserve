/**
 * Admin Service
 * Business logic for admin dashboard operations
 * 
 * Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, SubscriptionPlan } from '@/lib/supabase/types';
import {
  createAdminRepository,
  type IAdminRepository,
} from '@/lib/repositories/admin.repository';
import {
  createAuditLogService,
  type IAuditLogService,
} from '@/lib/services/audit-log.service';
import type {
  DashboardStats,
  UserListItem,
  UserFilters,
  UserDetails,
  GalleryListItem,
  GalleryFilters,
  GalleryDetails,
  AnalyticsData,
  SubscriptionListItem,
  PaginatedResult,
} from '@/types/admin';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { PLAN_LIMITS } from '@/config/plans';

export interface IAdminService {
  // Auth
  isAdmin(userId: string): Promise<boolean>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  
  // Users
  listUsers(filters: UserFilters): Promise<PaginatedResult<UserListItem>>;
  getUserDetails(id: string): Promise<UserDetails>;
  updateUserPlan(adminId: string, userId: string, plan: SubscriptionPlan, ipAddress?: string): Promise<void>;
  suspendUser(adminId: string, userId: string, reason: string, ipAddress?: string): Promise<void>;
  reactivateUser(adminId: string, userId: string, ipAddress?: string): Promise<void>;
  
  // Galleries
  listGalleries(filters: GalleryFilters): Promise<PaginatedResult<GalleryListItem>>;
  getGalleryDetails(id: string): Promise<GalleryDetails>;
  deactivateGallery(adminId: string, galleryId: string, reason: string, ipAddress?: string): Promise<void>;
  deleteGallery(adminId: string, galleryId: string, reason: string, ipAddress?: string): Promise<void>;
  
  // Analytics
  getAnalytics(dateFrom: string, dateTo: string): Promise<AnalyticsData>;
  
  // Subscriptions
  listSubscriptions(): Promise<SubscriptionListItem[]>;
  manualUpgrade(adminId: string, userId: string, plan: SubscriptionPlan, ipAddress?: string): Promise<void>;
  cancelSubscription(adminId: string, userId: string, reason: string, ipAddress?: string): Promise<void>;
}

export class AdminService implements IAdminService {
  private adminRepository: IAdminRepository;
  private auditLogService: IAuditLogService;
  private supabase: SupabaseClient<Database>;

  constructor(
    supabase: SupabaseClient<Database>,
    adminRepo?: IAdminRepository,
    auditLogSvc?: IAuditLogService
  ) {
    this.supabase = supabase;
    this.adminRepository = adminRepo || createAdminRepository(supabase);
    this.auditLogService = auditLogSvc || createAuditLogService(supabase);
  }

  /**
   * Check if a user has admin privileges
   * Requirements: 1.1, 1.2
   * 
   * @param userId - The ID of the user to check
   * @returns true if the user is an admin, false otherwise
   */
  async isAdmin(userId: string): Promise<boolean> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }

    return profile?.is_admin === true;
  }

  /**
   * Get dashboard statistics
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return this.adminRepository.getDashboardStats();
  }


  /**
   * List users with pagination and filtering
   * Requirements: 3.1, 3.2
   */
  async listUsers(filters: UserFilters): Promise<PaginatedResult<UserListItem>> {
    return this.adminRepository.listUsers(filters);
  }

  /**
   * Get detailed user information including galleries and audit history
   * Requirements: 3.3
   */
  async getUserDetails(id: string): Promise<UserDetails> {
    const user = await this.adminRepository.getUserById(id);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    // Get user's galleries
    const { data: galleries, error: galleriesError } = await this.supabase
      .from('galleries')
      .select('id, title, is_active, views_count')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (galleriesError) throw galleriesError;

    // Get user's Stripe info
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') throw profileError;

    // Get audit history for this user
    const auditHistory = await this.auditLogService.getByEntityId(id);

    return {
      ...user,
      galleries: (galleries || []).map(g => ({
        id: g.id,
        title: g.title,
        is_active: g.is_active || false,
        views_count: g.views_count || 0,
      })),
      stripe_customer_id: profile?.stripe_customer_id || null,
      stripe_subscription_id: profile?.stripe_subscription_id || null,
      audit_history: auditHistory,
    };
  }

  /**
   * Update a user's subscription plan
   * Requirements: 3.4, 6.3
   */
  async updateUserPlan(
    adminId: string,
    userId: string,
    plan: SubscriptionPlan,
    ipAddress?: string
  ): Promise<void> {
    // Get current user info for audit log
    const user = await this.adminRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Cannot modify admin users
    if (user.is_admin) {
      throw new ValidationError('Cannot modify admin users');
    }

    const previousPlan = user.subscription_plan;

    // Update the plan
    await this.adminRepository.updateUserPlan(userId, plan);

    // Log the action
    await this.auditLogService.log(
      adminId,
      'user_update',
      'user',
      userId,
      {
        action: 'plan_update',
        previous_plan: previousPlan,
        new_plan: plan,
        new_limits: PLAN_LIMITS[plan],
      },
      ipAddress
    );
  }

  /**
   * Suspend a user account and deactivate their galleries
   * Requirements: 3.5, 3.7
   */
  async suspendUser(
    adminId: string,
    userId: string,
    reason: string,
    ipAddress?: string
  ): Promise<void> {
    // Get current user info
    const user = await this.adminRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Cannot suspend admin users
    if (user.is_admin) {
      throw new ValidationError('Cannot suspend admin users');
    }

    // Cannot suspend already suspended users
    if (user.is_suspended) {
      throw new ValidationError('User is already suspended');
    }

    // Suspend the user
    await this.adminRepository.suspendUser(userId);

    // Log the action
    await this.auditLogService.log(
      adminId,
      'user_suspend',
      'user',
      userId,
      {
        reason,
        user_email: user.email,
        gallery_count: user.gallery_count,
      },
      ipAddress
    );
  }

  /**
   * Reactivate a suspended user account
   * Requirements: 3.6, 3.7
   */
  async reactivateUser(
    adminId: string,
    userId: string,
    ipAddress?: string
  ): Promise<void> {
    // Get current user info
    const user = await this.adminRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Cannot reactivate non-suspended users
    if (!user.is_suspended) {
      throw new ValidationError('User is not suspended');
    }

    // Reactivate the user
    await this.adminRepository.reactivateUser(userId);

    // Log the action
    await this.auditLogService.log(
      adminId,
      'user_reactivate',
      'user',
      userId,
      {
        user_email: user.email,
      },
      ipAddress
    );
  }


  /**
   * List galleries with pagination and filtering
   * Requirements: 4.1, 4.2
   */
  async listGalleries(filters: GalleryFilters): Promise<PaginatedResult<GalleryListItem>> {
    return this.adminRepository.listGalleries(filters);
  }

  /**
   * Get detailed gallery information including images and owner
   * Requirements: 4.3
   */
  async getGalleryDetails(id: string): Promise<GalleryDetails> {
    const gallery = await this.adminRepository.getGalleryById(id);
    
    if (!gallery) {
      throw new NotFoundError('Gallery');
    }

    // Get gallery images
    const { data: images, error: imagesError } = await this.supabase
      .from('images')
      .select('id, cloudinary_url, file_size_mb')
      .eq('gallery_id', id)
      .order('order_index', { ascending: true });

    if (imagesError) throw imagesError;

    // Get owner details
    const { data: owner, error: ownerError } = await this.supabase
      .from('profiles')
      .select('id, email, name, subscription_plan')
      .eq('id', gallery.owner_id)
      .single();

    if (ownerError && ownerError.code !== 'PGRST116') throw ownerError;

    // Get audit history for this gallery
    const auditHistory = await this.auditLogService.getByEntityId(id);

    return {
      ...gallery,
      images: (images || []).map(img => ({
        id: img.id,
        cloudinary_url: img.cloudinary_url,
        file_size_mb: img.file_size_mb || 0,
      })),
      owner: owner ? {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        subscription_plan: owner.subscription_plan || 'free',
      } : {
        id: gallery.owner_id,
        email: gallery.owner_email,
        name: gallery.owner_name,
        subscription_plan: 'free' as SubscriptionPlan,
      },
      audit_history: auditHistory,
    };
  }

  /**
   * Deactivate a gallery
   * Requirements: 4.4, 4.6
   */
  async deactivateGallery(
    adminId: string,
    galleryId: string,
    reason: string,
    ipAddress?: string
  ): Promise<void> {
    // Get current gallery info
    const gallery = await this.adminRepository.getGalleryById(galleryId);
    if (!gallery) {
      throw new NotFoundError('Gallery');
    }

    // Cannot deactivate already inactive galleries
    if (!gallery.is_active) {
      throw new ValidationError('Gallery is already inactive');
    }

    // Deactivate the gallery
    await this.adminRepository.deactivateGallery(galleryId);

    // Log the action
    await this.auditLogService.log(
      adminId,
      'gallery_deactivate',
      'gallery',
      galleryId,
      {
        reason,
        gallery_title: gallery.title,
        owner_email: gallery.owner_email,
      },
      ipAddress
    );
  }

  /**
   * Delete a gallery and its images, freeing storage
   * Requirements: 4.5, 4.6
   */
  async deleteGallery(
    adminId: string,
    galleryId: string,
    reason: string,
    ipAddress?: string
  ): Promise<void> {
    // Get current gallery info for audit log
    const gallery = await this.adminRepository.getGalleryById(galleryId);
    if (!gallery) {
      throw new NotFoundError('Gallery');
    }

    // Delete the gallery and get freed storage info
    const { deletedImageIds, freedStorageMb, ownerId } = await this.adminRepository.deleteGallery(galleryId);

    // Update owner's storage usage
    if (freedStorageMb > 0) {
      const { error: storageError } = await this.supabase.rpc('decrement_storage', {
        user_id: ownerId,
        size_mb: freedStorageMb,
      });

      if (storageError) {
        console.error('Failed to decrement storage:', storageError);
      }
    }

    // Log the action
    await this.auditLogService.log(
      adminId,
      'gallery_delete',
      'gallery',
      galleryId,
      {
        reason,
        gallery_title: gallery.title,
        owner_email: gallery.owner_email,
        owner_id: ownerId,
        deleted_image_count: deletedImageIds.length,
        freed_storage_mb: freedStorageMb,
      },
      ipAddress
    );
  }


  /**
   * Get analytics data with date range filtering
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  async getAnalytics(dateFrom: string, dateTo: string): Promise<AnalyticsData> {
    return this.adminRepository.getAnalytics(dateFrom, dateTo);
  }

  /**
   * List all active subscriptions
   * Requirements: 6.1, 6.2
   */
  async listSubscriptions(): Promise<SubscriptionListItem[]> {
    return this.adminRepository.listSubscriptions();
  }

  /**
   * Manually upgrade a user's plan without payment
   * Requirements: 6.3, 6.5
   */
  async manualUpgrade(
    adminId: string,
    userId: string,
    plan: SubscriptionPlan,
    ipAddress?: string
  ): Promise<void> {
    // Get current user info
    const user = await this.adminRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Cannot modify admin users
    if (user.is_admin) {
      throw new ValidationError('Cannot modify admin users');
    }

    const previousPlan = user.subscription_plan;

    // Update the plan
    await this.adminRepository.updateUserPlan(userId, plan);

    // Log the action
    await this.auditLogService.log(
      adminId,
      'subscription_update',
      'subscription',
      userId,
      {
        action: 'manual_upgrade',
        previous_plan: previousPlan,
        new_plan: plan,
        new_limits: PLAN_LIMITS[plan],
        user_email: user.email,
      },
      ipAddress
    );
  }

  /**
   * Cancel a user's subscription, scheduling downgrade to free plan
   * Requirements: 6.4, 6.5
   */
  async cancelSubscription(
    adminId: string,
    userId: string,
    reason: string,
    ipAddress?: string
  ): Promise<void> {
    // Get current user info
    const user = await this.adminRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Cannot cancel free plan
    if (user.subscription_plan === 'free') {
      throw new ValidationError('User is already on free plan');
    }

    const previousPlan = user.subscription_plan;

    // Mark user for downgrade to free plan
    // In a real implementation, this would interact with Stripe to cancel the subscription
    // For now, we directly downgrade to free
    await this.adminRepository.updateUserPlan(userId, 'free');

    // Clear Stripe subscription ID to mark as cancelled
    const { error: updateError } = await this.supabase
      .from('profiles')
      .update({
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log the action
    await this.auditLogService.log(
      adminId,
      'subscription_cancel',
      'subscription',
      userId,
      {
        reason,
        previous_plan: previousPlan,
        new_plan: 'free',
        user_email: user.email,
      },
      ipAddress
    );
  }
}

/**
 * Factory function to create an AdminService instance
 */
export function createAdminService(
  supabase: SupabaseClient<Database>,
  adminRepo?: IAdminRepository,
  auditLogSvc?: IAuditLogService
): IAdminService {
  return new AdminService(supabase, adminRepo, auditLogSvc);
}
