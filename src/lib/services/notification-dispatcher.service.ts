/**
 * Notification Dispatcher Service
 * Handles sending push notifications to users based on events
 * 
 * @module lib/services/notification-dispatcher.service
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import {
  sendCommentNotification,
  sendFavoriteNotification,
  sendExpirationNotification,
  type PushSubscription,
} from './push-notification.service';

export interface INotificationDispatcherService {
  notifyNewComment(imageId: string, galleryTitle: string): Promise<void>;
  notifyNewFavorite(galleryId: string, galleryTitle: string, favoriteCount: number): Promise<void>;
  notifyGalleryExpiration(galleryId: string, galleryTitle: string, daysRemaining: number): Promise<void>;
}

export class NotificationDispatcherService implements INotificationDispatcherService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get all push subscriptions for a user
   */
  private async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    const { data: subscriptions, error } = await this.supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      return [];
    }

    return (subscriptions || []).map(sub => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));
  }

  /**
   * Send push notification to all user's devices
   */
  private async sendToAllDevices(
    userId: string,
    sendFn: (subscription: PushSubscription) => Promise<void>
  ): Promise<void> {
    const subscriptions = await this.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      return; // User has no push subscriptions
    }

    // Send to all devices in parallel
    const results = await Promise.allSettled(
      subscriptions.map(sub => sendFn(sub))
    );

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send notification to device ${index}:`, result.reason);
        // Optionally: Remove invalid subscriptions from database
      }
    });
  }

  /**
   * Notify gallery owner about new comment
   */
  async notifyNewComment(imageId: string, galleryTitle: string): Promise<void> {
    try {
      // Get image and gallery info
      const { data: image, error: imageError } = await this.supabase
        .from('images')
        .select('gallery_id, galleries(user_id)')
        .eq('id', imageId)
        .single();

      if (imageError || !image) {
        console.error('Image not found for notification:', imageError);
        return;
      }

      const userId = (image.galleries as { user_id: string })?.user_id;
      if (!userId) {
        console.error('Gallery owner not found');
        return;
      }

      await this.sendToAllDevices(userId, (subscription) =>
        sendCommentNotification(subscription, galleryTitle, imageId)
      );
    } catch (error) {
      console.error('Error sending comment notification:', error);
    }
  }

  /**
   * Notify gallery owner about new favorite
   */
  async notifyNewFavorite(
    galleryId: string,
    galleryTitle: string,
    favoriteCount: number
  ): Promise<void> {
    try {
      // Get gallery owner
      const { data: gallery, error: galleryError } = await this.supabase
        .from('galleries')
        .select('user_id')
        .eq('id', galleryId)
        .single();

      if (galleryError || !gallery) {
        console.error('Gallery not found for notification:', galleryError);
        return;
      }

      await this.sendToAllDevices(gallery.user_id, (subscription) =>
        sendFavoriteNotification(subscription, galleryTitle, galleryId, favoriteCount)
      );
    } catch (error) {
      console.error('Error sending favorite notification:', error);
    }
  }

  /**
   * Notify gallery owner about upcoming expiration
   */
  async notifyGalleryExpiration(
    galleryId: string,
    galleryTitle: string,
    daysRemaining: number
  ): Promise<void> {
    try {
      // Get gallery owner
      const { data: gallery, error: galleryError } = await this.supabase
        .from('galleries')
        .select('user_id')
        .eq('id', galleryId)
        .single();

      if (galleryError || !gallery) {
        console.error('Gallery not found for notification:', galleryError);
        return;
      }

      await this.sendToAllDevices(gallery.user_id, (subscription) =>
        sendExpirationNotification(subscription, galleryTitle, galleryId, daysRemaining)
      );
    } catch (error) {
      console.error('Error sending expiration notification:', error);
    }
  }
}

/**
 * Factory function to create a NotificationDispatcherService instance
 */
export function createNotificationDispatcherService(
  supabase: SupabaseClient<Database>
): INotificationDispatcherService {
  return new NotificationDispatcherService(supabase);
}
