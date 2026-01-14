import webpush from 'web-push';

// VAPID keys should be stored in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@piksend.com';

// Configure web-push with VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Send a push notification to a subscriber
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured. Push notifications disabled.');
    return;
  }

  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send notification for new comment
 */
export async function sendCommentNotification(
  subscription: PushSubscription,
  galleryTitle: string,
  imageId: string
): Promise<void> {
  const payload: NotificationPayload = {
    title: 'Nouveau commentaire',
    body: `Un nouveau commentaire a été ajouté sur votre galerie "${galleryTitle}"`,
    icon: '/icons/web-app-manifest-192x192.png',
    badge: '/icons/icon-32.png',
    tag: `comment-${imageId}`,
    data: {
      type: 'comment',
      imageId,
      url: `/dashboard`,
    },
  };

  await sendPushNotification(subscription, payload);
}

/**
 * Send notification for new favorite
 */
export async function sendFavoriteNotification(
  subscription: PushSubscription,
  galleryTitle: string,
  galleryId: string,
  favoriteCount: number
): Promise<void> {
  const payload: NotificationPayload = {
    title: 'Nouvelle photo favorite',
    body: `${favoriteCount} photo(s) marquée(s) comme favorite dans "${galleryTitle}"`,
    icon: '/icons/web-app-manifest-192x192.png',
    badge: '/icons/icon-32.png',
    tag: `favorite-${galleryId}`,
    data: {
      type: 'favorite',
      galleryId,
      url: `/dashboard/gallery/${galleryId}`,
    },
  };

  await sendPushNotification(subscription, payload);
}

/**
 * Send notification for gallery expiration warning
 */
export async function sendExpirationNotification(
  subscription: PushSubscription,
  galleryTitle: string,
  galleryId: string,
  daysRemaining: number
): Promise<void> {
  const payload: NotificationPayload = {
    title: 'Galerie bientôt expirée',
    body: `Votre galerie "${galleryTitle}" expire dans ${daysRemaining} jour(s)`,
    icon: '/icons/web-app-manifest-192x192.png',
    badge: '/icons/icon-32.png',
    tag: `expiration-${galleryId}`,
    requireInteraction: true,
    data: {
      type: 'expiration',
      galleryId,
      url: `/dashboard/gallery/${galleryId}`,
    },
  };

  await sendPushNotification(subscription, payload);
}

/**
 * Generate VAPID keys (run once to generate keys for your app)
 * Store the output in your environment variables
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}
