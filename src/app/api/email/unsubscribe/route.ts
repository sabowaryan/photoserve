/**
 * Email Unsubscribe API Route
 * Allows users to unsubscribe from marketing emails
 * Requirement: 18.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailTriggersService } from '@/lib/services/email-triggers.service';

export async function POST(request: NextRequest) {
  try {
    const { email, reason } = await request.json();
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    const emailTriggersService = new EmailTriggersService(supabase);
    
    await emailTriggersService.unsubscribe(email, reason);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from marketing emails',
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    const emailTriggersService = new EmailTriggersService(supabase);
    
    const isUnsubscribed = await emailTriggersService.isUnsubscribed(email);
    
    return NextResponse.json({
      email,
      isUnsubscribed,
    });
  } catch (error) {
    console.error('Error checking unsubscribe status:', error);
    return NextResponse.json(
      { error: 'Failed to check unsubscribe status' },
      { status: 500 }
    );
  }
}
