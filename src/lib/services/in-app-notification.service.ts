/**
 * In-App Notification Service
 * Handles creating, retrieving, and managing in-app notifications
 * 
 * @module lib/services/in-app-notification.service
 * Requirements: 8.4 - Issue Alerts - Alerts SHALL be sent via email and in-app notification
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * Notification types
 */
export type NotificationType = 'sale' | 'payout' | 'dispute' | 'refund' | 'account_update';

/**
 * Related entity types
 */
export type RelatedEntityType = 'gallery' | 'purchase' | 'payout' | 'dispute';

/**
 * In-app notification interface
 */
export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create notification input
 */
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Notification filters
 */
export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * In-App Notification Service Interface
 */
export interface IInAppNotificationService {
  createNotification(input: CreateNotificationInput): Promise<InAppNotification>;
  getNotifications(userId: string, filters?: NotificationFilters): Promise<InAppNotification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(notificationId: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;
  
  // Convenience methods for specific notification types
  notifySale(userId: string, galleryName: string, amount: number, currency: string, purchaseId: string): Promise<InAppNotification>;
  notifyPayout(userId: string, amount: number, currency: string, status: string, payoutId?: string): Promise<InAppNotification>;
  notifyDispute(userId: string, galleryName: string, amount: number, currency: string, disputeId: string): Promise<InAppNotification>;
  notifyRefund(userId: string, galleryName: string, amount: number, currency: string, purchaseId: string): Promise<InAppNotification>;
  notifyAccountUpdate(userId: string, status: string, message: string): Promise<InAppNotification>;
}

/**
 * In-App Notification Service Implementation
 */
export class InAppNotificationService implements IInAppNotificationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new notification
   */
  async createNotification(input: CreateNotificationInput): Promise<InAppNotification> {
    const { data, error } = await (this.supabase as any)
      .from('in_app_notifications')
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        related_entity_type: input.relatedEntityType || null,
        related_entity_id: input.relatedEntityId || null,
        metadata: input.metadata || {},
      })
      .select('*')
      .single();

    if (error) {
      console.error('[InAppNotificationService] Failed to create notification:', error);
      throw new Error('Failed to create notification');
    }

    return this.mapToNotification(data);
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, filters?: NotificationFilters): Promise<InAppNotification[]> {
    try {
      let query = (this.supabase as any)
        .from('in_app_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[InAppNotificationService] Failed to get notifications:', error);
        // Return empty array instead of throwing to prevent blocking the UI
        return [];
      }

      return (data || []).map((n: any) => this.mapToNotification(n));
    } catch (error) {
      console.error('[InAppNotificationService] Exception in getNotifications:', error);
      // Return empty array instead of throwing to prevent blocking the UI
      return [];
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await (this.supabase as any)
        .from('in_app_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('[InAppNotificationService] Failed to get unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[InAppNotificationService] Exception in getUnreadCount:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('in_app_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('[InAppNotificationService] Failed to mark as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('in_app_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('[InAppNotificationService] Failed to mark all as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('in_app_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('[InAppNotificationService] Failed to delete notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Notify user of a new sale
   */
  async notifySale(
    userId: string,
    galleryName: string,
    amount: number,
    currency: string,
    purchaseId: string
  ): Promise<InAppNotification> {
    const formattedAmount = this.formatCurrency(amount, currency);
    return this.createNotification({
      userId,
      type: 'sale',
      title: 'Nouvelle vente !',
      message: `Vous avez vendu l'accès à "${galleryName}" pour ${formattedAmount}`,
      relatedEntityType: 'purchase',
      relatedEntityId: purchaseId,
      metadata: { galleryName, amount, currency },
    });
  }

  /**
   * Notify user of a payout
   */
  async notifyPayout(
    userId: string,
    amount: number,
    currency: string,
    status: string,
    payoutId?: string
  ): Promise<InAppNotification> {
    const formattedAmount = this.formatCurrency(amount, currency);
    const statusMessages: Record<string, { title: string; message: string }> = {
      pending: {
        title: 'Virement en cours',
        message: `Un virement de ${formattedAmount} est en cours de traitement`,
      },
      paid: {
        title: 'Virement reçu !',
        message: `Vous avez reçu un virement de ${formattedAmount}`,
      },
      failed: {
        title: 'Échec du virement',
        message: `Le virement de ${formattedAmount} a échoué. Veuillez vérifier vos informations bancaires.`,
      },
    };

    const defaultMessage = {
      title: 'Virement en cours',
      message: `Un virement de ${formattedAmount} est en cours de traitement`,
    };
    const statusInfo = statusMessages[status] ?? defaultMessage;
    const { title, message } = statusInfo;

    return this.createNotification({
      userId,
      type: 'payout',
      title,
      message,
      relatedEntityType: payoutId ? 'payout' : undefined,
      relatedEntityId: payoutId,
      metadata: { amount, currency, status },
    });
  }

  /**
   * Notify user of a dispute
   */
  async notifyDispute(
    userId: string,
    galleryName: string,
    amount: number,
    currency: string,
    disputeId: string
  ): Promise<InAppNotification> {
    const formattedAmount = this.formatCurrency(amount, currency);
    return this.createNotification({
      userId,
      type: 'dispute',
      title: '⚠️ Litige ouvert',
      message: `Un litige de ${formattedAmount} a été ouvert pour "${galleryName}". Action requise.`,
      relatedEntityType: 'dispute',
      relatedEntityId: disputeId,
      metadata: { galleryName, amount, currency },
    });
  }

  /**
   * Notify user of a refund
   */
  async notifyRefund(
    userId: string,
    galleryName: string,
    amount: number,
    currency: string,
    purchaseId: string
  ): Promise<InAppNotification> {
    const formattedAmount = this.formatCurrency(amount, currency);
    return this.createNotification({
      userId,
      type: 'refund',
      title: 'Remboursement effectué',
      message: `Un remboursement de ${formattedAmount} a été effectué pour "${galleryName}"`,
      relatedEntityType: 'purchase',
      relatedEntityId: purchaseId,
      metadata: { galleryName, amount, currency },
    });
  }

  /**
   * Notify user of account status update
   */
  async notifyAccountUpdate(
    userId: string,
    status: string,
    message: string
  ): Promise<InAppNotification> {
    const statusTitles: Record<string, string> = {
      verified: '✓ Compte vérifié',
      pending: 'Vérification en cours',
      action_required: '⚠️ Action requise',
      restricted: '⛔ Compte restreint',
    };

    return this.createNotification({
      userId,
      type: 'account_update',
      title: statusTitles[status] || 'Mise à jour du compte',
      message,
      metadata: { status },
    });
  }

  /**
   * Format currency amount
   */
  private formatCurrency(amountCents: number, currency: string): string {
    const amount = amountCents / 100;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  /**
   * Map database record to InAppNotification interface
   */
  private mapToNotification(data: any): InAppNotification {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type as NotificationType,
      title: data.title,
      message: data.message,
      relatedEntityType: data.related_entity_type as RelatedEntityType | undefined,
      relatedEntityId: data.related_entity_id,
      metadata: data.metadata || {},
      isRead: data.is_read,
      readAt: data.read_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

/**
 * Factory function to create an InAppNotificationService instance
 */
export function createInAppNotificationService(
  supabase: SupabaseClient<Database>
): IInAppNotificationService {
  return new InAppNotificationService(supabase);
}
