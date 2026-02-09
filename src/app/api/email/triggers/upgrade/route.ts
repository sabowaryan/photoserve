/**
 * Upgrade Email Trigger API Route
 * Sends confirmation email when user upgrades
 * Requirement: 18.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailTriggersService } from '@/lib/services/email-triggers.service';

export async function POST(request: NextRequest) {
  try {
    const { userId, planName, price } = await request.json();
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (!planName || typeof planName !== 'string') {
      return NextResponse.json(
        { error: 'Plan name is required' },
        { status: 400 }
      );
    }
    
    if (typeof price !== 'number') {
      return NextResponse.json(
        { error: 'Price is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    const emailTriggersService = new EmailTriggersService(supabase);
    
    await emailTriggersService.handleUpgradeEvent(userId, planName, price);
    
    return NextResponse.json({
      success: true,
      message: 'Upgrade confirmation email sent successfully',
    });
  } catch (error) {
    console.error('Error triggering upgrade email:', error);
    return NextResponse.json(
      { error: 'Failed to trigger upgrade email' },
      { status: 500 }
    );
  }
}
