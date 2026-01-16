/**
 * Notifications API Route
 * GET - Get user notifications
 * 
 * @module app/api/notifications/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createInAppNotificationService } from '@/lib/services/in-app-notification.service';
import { AuthenticationError } from '@/lib/errors';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as any;
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const notificationService = createInAppNotificationService(supabase);
    
    const notifications = await notificationService.getNotifications(userId, {
      type: type || undefined,
      isRead: isRead !== null ? isRead === 'true' : undefined,
      limit,
      offset,
    });

    const unreadCount = await notificationService.getUnreadCount(userId);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }
    console.error('[NotificationsAPI] Error:', error);
    return handleApiError(error);
  }
}
