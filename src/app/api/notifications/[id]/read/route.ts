/**
 * Mark Notification as Read API Route
 * POST - Mark a single notification as read
 * 
 * @module app/api/notifications/[id]/read/route
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createInAppNotificationService } from '@/lib/services/in-app-notification.service';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const notificationService = createInAppNotificationService(supabase);
    await notificationService.markAsRead(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NotificationsAPI] Error marking as read:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
