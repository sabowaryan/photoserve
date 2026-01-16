/**
 * Mark All Notifications as Read API Route
 * POST - Mark all notifications as read for the current user
 * 
 * @module app/api/notifications/read-all/route
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInAppNotificationService } from '@/lib/services/in-app-notification.service';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notificationService = createInAppNotificationService(supabase);
    await notificationService.markAllAsRead(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NotificationsAPI] Error marking all as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
