/**
 * SSL Provisioning API Endpoint
 * POST /api/domain/provision-ssl - Provision SSL certificate for verified domain
 * 
 * @module app/api/domain/provision-ssl/route
 * Requirements: 6.7, 6.8, 6.9, 2.8, 2.9
 */

import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createSSLProvisioningService } from '@/lib/services/ssl-provisioning.service';
import { sendPushNotification } from '@/lib/services/push-notification.service';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from '@/lib/errors';
import type { SSLProvisioningResult } from '@/lib/services/ssl-provisioning.service';
import type { PushSubscription, NotificationPayload } from '@/lib/services/push-notification.service';

/**
 * Request body schema for SSL provisioning
 */
interface ProvisionSSLRequest {
  domain: string;
}

/**
 * Response schema for SSL provisioning
 */
interface ProvisionSSLResponse {
  success: boolean;
  certificateId?: string;
  expiresAt?: string;
  provider: 'cloudflare' | 'letsencrypt';
  error?: string;
}

/**
 * POST /api/domain/provision-ssl
 * Provision SSL certificate for a verified custom domain
 * 
 * Process:
 * 1. Authenticate user (Requirement 6.1)
 * 2. Validate domain is already verified (Requirement 6.7, 6.8)
 * 3. Call SSLProvisioningService.provisionSSL() (Requirement 6.9)
 * 4. Update database with SSL certificate information (Requirement 2.5)
 * 5. Send notification to photographer on success/failure (Requirements 2.8, 2.9)
 * 6. Return SSL provisioning result
 * 
 * Requirements: 6.7, 6.8, 6.9, 2.8, 2.9
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (Requirement 6.1)
    const { supabase, userId } = await requireSupabaseClient();

    // 2. Get user profile to check domain verification status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan, branding')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new AuthenticationError('Failed to fetch user profile');
    }

    // 3. Parse and validate request body
    const body: ProvisionSSLRequest = await request.json();

    if (!body.domain || typeof body.domain !== 'string') {
      throw new ValidationError('Domain is required', {
        field: 'domain',
        message: 'Domain must be a non-empty string',
      });
    }

    // 4. Check if domain is verified (Requirement 6.7, 6.8)
    const branding = profile.branding as any;
    
    if (!branding?.customDomain) {
      throw new ValidationError('No custom domain configured', {
        field: 'domain',
        message: 'Please configure a custom domain first',
      });
    }

    if (branding.customDomain !== body.domain) {
      throw new ValidationError('Domain mismatch', {
        field: 'domain',
        message: 'The provided domain does not match your configured domain',
      });
    }

    if (!branding.domainVerified) {
      throw new AuthorizationError(
        'Domain must be verified before SSL provisioning. Please verify your domain first.'
      );
    }

    // 5. Call SSLProvisioningService.provisionSSL() (Requirement 6.9)
    console.log(`[ProvisionSSL] Starting SSL provisioning for ${body.domain}`);
    
    const sslService = createSSLProvisioningService(supabase);
    const result: SSLProvisioningResult = await sslService.provisionSSL(
      body.domain,
      userId
    );

    // 6. Send notification to photographer (Requirements 2.8, 2.9)
    try {
      // Get user's push subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId);

      if (subscriptions && subscriptions.length > 0) {
        // Convert to PushSubscription format
        const pushSubscriptions: PushSubscription[] = subscriptions.map((sub: any) => ({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }));

        // Send notification based on result
        if (result.success) {
          // Success notification (Requirement 2.8)
          const successPayload: NotificationPayload = {
            title: 'SSL Certificate Provisioned',
            body: `SSL certificate has been successfully provisioned for ${body.domain}`,
            icon: '/icons/web-app-manifest-192x192.png',
            badge: '/icons/icon-32.png',
            tag: `ssl-success-${body.domain}`,
            data: {
              type: 'ssl-provisioned',
              domain: body.domain,
              url: '/dashboard/settings',
            },
          };

          await Promise.allSettled(
            pushSubscriptions.map((sub) => sendPushNotification(sub, successPayload))
          );
        } else {
          // Failure notification (Requirement 2.9)
          const failurePayload: NotificationPayload = {
            title: 'SSL Provisioning Failed',
            body: `Failed to provision SSL certificate for ${body.domain}. Please try again or contact support.`,
            icon: '/icons/web-app-manifest-192x192.png',
            badge: '/icons/icon-32.png',
            tag: `ssl-failure-${body.domain}`,
            requireInteraction: true,
            data: {
              type: 'ssl-failed',
              domain: body.domain,
              error: result.error,
              url: '/dashboard/settings',
            },
          };

          await Promise.allSettled(
            pushSubscriptions.map((sub) => sendPushNotification(sub, failurePayload))
          );
        }
      }
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('[ProvisionSSL] Error sending notification:', notificationError);
    }

    // 7. Return SSL provisioning result
    const response: ProvisionSSLResponse = {
      success: result.success,
      certificateId: result.certificateId,
      expiresAt: result.expiresAt?.toISOString(),
      provider: result.provider,
      error: result.error,
    };

    console.log(
      `[ProvisionSSL] SSL provisioning ${result.success ? 'succeeded' : 'failed'} for ${body.domain}`
    );

    return createApiResponse(response, result.success ? 200 : 500);
  } catch (error) {
    // Handle authentication errors (Requirement 6.2)
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }

    return handleApiError(error);
  }
}
