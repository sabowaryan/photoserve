/**
 * Verify Sender Address API Route
 * 
 * Endpoint:
 * - POST /api/admin/emails/senders/[id]/verify - Check verification status
 * 
 * Requirements: 6.5
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSenderAddressRepository } from '@/lib/repositories/sender-address.repository';
import { EmailProviderService } from '@/lib/services/email-provider.service';

/**
 * POST /api/admin/emails/senders/[id]/verify
 * Check verification status with the email provider
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supabase = createAdminClient();
    const repository = createSenderAddressRepository(supabase);

    // Get sender address
    const sender = await repository.findById(id);
    if (!sender) {
      return NextResponse.json(
        { error: 'Sender address not found' },
        { status: 404 }
      );
    }

    // Get active provider
    const providerService = new EmailProviderService(supabase);
    const provider = await providerService.getActiveProvider();

    if (!provider) {
      return NextResponse.json(
        { error: 'No active email provider configured' },
        { status: 400 }
      );
    }

    // Check verification status
    const status = await provider.getVerificationStatus(sender.email);

    // Update sender if verified
    if (status === 'verified' && !sender.is_verified) {
      await repository.updateVerificationStatus(id, true);
    }

    return NextResponse.json({ 
      status,
      isVerified: status === 'verified'
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 }
    );
  }
}
