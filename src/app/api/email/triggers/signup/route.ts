/**
 * Signup Email Trigger API Route
 * Triggers all signup-related emails
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
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
    
    // Trigger all signup emails (welcome + scheduled follow-ups)
    await emailTriggersService.handleSignupEvent(userId);
    
    return NextResponse.json({
      success: true,
      message: 'Signup emails triggered successfully',
    });
  } catch (error) {
    console.error('Error triggering signup emails:', error);
    return NextResponse.json(
      { error: 'Failed to trigger signup emails' },
      { status: 500 }
    );
  }
}
