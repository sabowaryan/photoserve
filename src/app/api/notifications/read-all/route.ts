/**
 * Mark All Notifications as Read API Route
 * POST - Mark all notifications as read for the current user
 * 
 * @module app/api/notifications/read-all/route
 */
import { NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createInAppNotificationService } from '@/lib/services/in-app-notification.service';

export async function POST() {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    const notificationService = createInAppNotificationService(supabase);
    await notificationService.markAllAsRead(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NotificationsAPI] Error marking all as read:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
