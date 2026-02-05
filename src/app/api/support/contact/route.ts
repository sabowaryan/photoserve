import { NextRequest, NextResponse } from 'next/server';
import { supportContactSchema } from '@/lib/validators/support.schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = supportContactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validationResult.data;

    // TODO: Implement actual email sending logic
    // For now, we'll just log the support request
    // In production, this should:
    // 1. Send an email to the support team
    // 2. Create a support ticket in a ticketing system
    // 3. Send a confirmation email to the user
    
    console.log('Support request received:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(
      {
        success: true,
        message: 'Your support request has been received. We will respond within 24 hours.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing support request:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
