/**
 * Admin Dashboard TypeScript Type Definitions
 * Types for admin features including user management, gallery management,
 * analytics, subscriptions, and audit logging.
 */

import type { SubscriptionPlan } from './index';

// Audit Log Types
export type AuditActionType =
  | 'user_view'
  | 'user_update'
  | 'user_suspend'
  | 'user_reactivate'
  | 'gallery_view'
  | 'gallery_deactivate'
  | 'gallery_delete'
  | 'subscription_update'
  | 'subscription_cancel'
  | 'admin_login';

export type AuditEntityType = 'user' | 'gallery' | 'subscription' | 'system';

export interface AuditLog {
  id: string;
  admin_id: string;
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogWithAdmin extends AuditLog {
  admin_email?: string;
  admin_name?: string | null;
}

export interface AuditLogFilters {
  adminId?: string;
  actionType?: AuditActionType;
  entityType?: AuditEntityType;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Admin User Types
export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number;
  totalGalleries: number;
  activeGalleries: number;
  totalStorageUsedMb: number;
  planDistribution: {
    free: number;
    premium: number;
    pro: number;
  };
  recentSignups: number;
  recentGalleries: number;
}

// User Management Types
export interface UserListItem {
  id: string;
  email: string;
  name: string | null;
  subscription_plan: SubscriptionPlan;
  storage_used_mb: number;
  storage_limit_mb: number;
  gallery_count: number;
  is_suspended: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface UserFilters {
  search?: string;
  plan?: SubscriptionPlan;
  status?: 'active' | 'suspended';
  page?: number;
  limit?: number;
}

export interface UserDetails extends UserListItem {
  galleries: {
    id: string;
    title: string;
    is_active: boolean;
    views_count: number;
  }[];
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  audit_history: AuditLogWithAdmin[];
}

// Gallery Management Types
export interface GalleryListItem {
  id: string;
  title: string;
  unique_slug: string;
  owner_email: string;
  owner_name: string | null;
  owner_id: string;
  image_count: number;
  views_count: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export interface GalleryFilters {
  search?: string;
  status?: 'active' | 'expired' | 'inactive';
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface GalleryDetails extends GalleryListItem {
  images: {
    id: string;
    cloudinary_url: string;
    file_size_mb: number;
  }[];
  owner: {
    id: string;
    email: string;
    name: string | null;
    subscription_plan: SubscriptionPlan;
  };
  audit_history: AuditLogWithAdmin[];
}

// Analytics Types
export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface ConversionData {
  freeToPremiun: number;
  freeToPro: number;
  premiumToPro: number;
}

export interface TopUserData {
  id: string;
  email: string;
  name: string | null;
  gallery_count: number;
  storage_used_mb: number;
}

export interface AnalyticsData {
  userGrowth: TimeSeriesData[];
  storageGrowth: TimeSeriesData[];
  subscriptionConversions: ConversionData;
  topUsers: TopUserData[];
}

// Subscription Management Types
export interface SubscriptionListItem {
  userId: string;
  userEmail: string;
  userName: string | null;
  plan: SubscriptionPlan;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';
  currentPeriodEnd?: string;
  createdAt: string;
}

// Paginated Result Type
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
