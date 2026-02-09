/**
 * First Gallery Email Trigger API Route
 * Sends congratulations email when user creates first gallery
 * Requirement: 18.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailTriggersService } from '@/lib/services/email-triggers.service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    const emailTriggersService = new EmailTriggersService(supabase);
    
    await emailTriggersService.handleFirstGalleryEvent(userId);
    
    return NextResponse.json({
      success: true,
      message: 'First gallery email sent successfully',
    });
  } catch (error) {
    console.error('Error triggering first gallery email:', error);
    return NextResponse.json(
      { error: 'Failed to trigger first gallery email' },
      { status: 500 }
    );
  }
}
