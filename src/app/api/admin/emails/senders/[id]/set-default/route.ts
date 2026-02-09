/**
 * Set Default Sender Address API Route
 * 
 * Endpoint:
 * - POST /api/admin/emails/senders/[id]/set-default - Set sender as default
 * 
 * Requirements: 6.5
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSenderAddressRepository } from '@/lib/repositories/sender-address.repository';

/**
 * POST /api/admin/emails/senders/[id]/set-default
 * Set a sender address as the default
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createAdminClient();
    const repository = createSenderAddressRepository(supabase);

    // Set as default (repository handles validation)
    await repository.setDefault(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting default sender:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('unverified')) {
        return NextResponse.json(
          { error: 'Cannot set unverified sender as default' },
          { status: 400 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Sender address not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to set default sender' },
      { status: 500 }
    );
  }
}
