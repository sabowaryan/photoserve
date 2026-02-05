/**
 * API Key Management - Individual Key Operations
 * Handles deletion of specific API keys
 * 
 * Requirements:
 * - 1.9, 7.7, 7.8: API key deletion with ownership verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { handleApiError, createNoContentResponse } from '@/lib/api/error-handler';
import { apiKeyService } from '@/lib/services/api-key.service';
import { SecurityLogger, extractRequestMetadata } from '@/lib/utils/security-logger';

/**
 * DELETE /api/settings/api-keys/[id]
 * Deletes an API key
 * 
 * Requirements:
 * - Require session authentication
 * - Verify user owns the key
 * - Call APIKeyService.deleteAPIKey()
 * - Return 204 on success
 * - Return 404 if key not found or not owned
 */
export async function DELETE(
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
    
    // Call APIKeyService.deleteAPIKey() - it verifies ownership
    await apiKeyService.deleteAPIKey(userId, keyId);
    
    // Log API key deletion
    const requestMetadata = extractRequestMetadata(request);
    SecurityLogger.logApiKeyDeleted(userId, keyId, {
      ipAddress: requestMetadata.ipAddress,
    });
    
    // Return 204 on success
    return createNoContentResponse();
    
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
