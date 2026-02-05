/**
 * API Key Revocation Endpoint
 * Handles revoking (deactivating) specific API keys
 * 
 * Requirements:
 * - 1.8, 7.6, 7.7, 7.8: API key revocation with ownership verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { apiKeyService } from '@/lib/services/api-key.service';
import { SecurityLogger, extractRequestMetadata } from '@/lib/utils/security-logger';

/**
 * PATCH /api/settings/api-keys/[id]/revoke
 * Revokes an API key (sets is_active=false)
 * 
 * Requirements:
 * - Require session authentication
 * - Verify user owns the key
 * - Call APIKeyService.revokeAPIKey()
 * - Return success response (200)
 * - Return 404 if key not found or not owned
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require session authentication
    const { userId } = await requireSupabaseClient();
    
    // Get the key ID from params
    const { id: keyId } = await params;
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'api.errors.invalidKeyId', code: 'INVALID_KEY_ID' },
        { status: 400 }
      );
    }
    
    // Call APIKeyService.revokeAPIKey() - it verifies ownership
    await apiKeyService.revokeAPIKey(userId, keyId);
    
    // Log API key revocation
    const requestMetadata = extractRequestMetadata(request);
    SecurityLogger.logApiKeyRevoked(userId, keyId, {
      ipAddress: requestMetadata.ipAddress,
    });
    
    // Return success response (200)
    return createApiResponse({ success: true });
    
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'api.errors.authenticationRequired', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'api.errors.apiKeyNotFound', code: 'API_KEY_NOT_FOUND' },
          { status: 404 }
        );
      }
      if (error.message.includes('Unauthorized') || error.message.includes('do not own')) {
        return NextResponse.json(
          { error: 'api.errors.apiKeyNotFound', code: 'API_KEY_NOT_FOUND' },
          { status: 404 }
        );
      }
    }
    
    return handleApiError(error);
  }
}
