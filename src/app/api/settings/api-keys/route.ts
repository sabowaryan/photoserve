/**
 * API Keys Management Endpoints
 * Handles creation and listing of API keys for authenticated users
 * 
 * Requirements:
 * - 1.1, 1.2, 1.3, 1.5, 1.6, 1.10: API key creation with Pro plan gating
 * - 1.7, 7.1, 7.2: API key listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { apiKeyService } from '@/lib/services/api-key.service';
import { createAPIKeySchema } from '@/lib/validators/plugin.schemas';
import { SecurityLogger, extractRequestMetadata } from '@/lib/utils/security-logger';

/**
 * POST /api/settings/api-keys
 * Creates a new API key for the authenticated user
 * 
 * Requirements:
 * - Require session authentication
 * - Verify user has Pro plan
 * - Validate request body (name, expiresAt)
 * - Call APIKeyService.createAPIKey()
 * - Return full key and APIKey object (201)
 * - Return 403 if not Pro user
 */
export async function POST(request: NextRequest) {
  try {
    // Require session authentication
    const { supabase, userId } = await requireSupabaseClient();
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createAPIKeySchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: 'api.errors.validationFailed', 
          code: 'VALIDATION_ERROR',
          details: validatedData.error.issues 
        },
        { status: 400 }
      );
    }
    
    // Verify user has Pro plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'api.errors.userNotFound', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    if (profile.subscription_plan !== 'pro') {
      return NextResponse.json(
        { 
          error: 'api.errors.proPlanRequired', 
          code: 'PRO_PLAN_REQUIRED',
          details: { 
            currentPlan: profile.subscription_plan,
            requiredPlan: 'pro'
          }
        },
        { status: 403 }
      );
    }
    
    // Call APIKeyService.createAPIKey()
    const params = {
      name: validatedData.data.name,
      scopes: validatedData.data.scopes,
      expiresAt: validatedData.data.expiresAt || undefined,
    };
    const result = await apiKeyService.createAPIKey(userId, params);
    
    // Log API key creation
    const requestMetadata = extractRequestMetadata(request);
    SecurityLogger.logApiKeyCreated(userId, result.apiKey.id, {
      keyName: result.apiKey.name,
      expiresAt: result.apiKey.expiresAt || undefined,
      ipAddress: requestMetadata.ipAddress,
    });
    
    // Return full key and APIKey object (201)
    return createApiResponse(result, 201);
    
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
      if (error.message.includes('Pro plan required')) {
        return NextResponse.json(
          { error: 'api.errors.proPlanRequired', code: 'PRO_PLAN_REQUIRED' },
          { status: 403 }
        );
      }
      if (error.message.includes('User not found')) {
        return NextResponse.json(
          { error: 'api.errors.userNotFound', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }
    }
    
    return handleApiError(error);
  }
}

/**
 * GET /api/settings/api-keys
 * Lists all API keys for the authenticated user
 * 
 * Requirements:
 * - Require session authentication
 * - Call APIKeyService.listAPIKeys()
 * - Return array of APIKey objects (200)
 */
export async function GET(_request: NextRequest) {
  try {
    // Require session authentication
    const { userId } = await requireSupabaseClient();
    
    // Call APIKeyService.listAPIKeys()
    const apiKeys = await apiKeyService.listAPIKeys(userId);
    
    // Return array of APIKey objects (200)
    return createApiResponse({ apiKeys });
    
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'api.errors.authenticationRequired', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }
    
    return handleApiError(error);
  }
}
