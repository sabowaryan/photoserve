/**
 * Domain Verification API Endpoint
 * POST /api/domain/verify - Verify domain ownership
 * 
 * @module app/api/domain/verify/route
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4
 */

import { NextRequest } from 'next/server';
import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { createDomainVerificationService } from '@/lib/services/domain-verification.service';
import { isValidDomain, normalizeDomain } from '@/lib/utils/domain';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from '@/lib/errors';
import type { DomainVerificationResult } from '@/lib/services/domain-verification.service';

/**
 * Request body schema for domain verification
 */
interface VerifyDomainRequest {
  domain: string;
}

/**
 * Response schema for domain verification
 */
interface VerifyDomainResponse {
  status: 'verified' | 'pending' | 'failed';
  token?: string;
  instructions?: string;
  error?: string;
}

/**
 * POST /api/domain/verify
 * Verify domain ownership through DNS records
 * 
 * Process:
 * 1. Authenticate user (Requirement 6.1)
 * 2. Validate Pro plan subscription (Requirement 8.1)
 * 3. Validate domain format (Requirement 6.3)
 * 4. Check domain uniqueness (Requirement 8.3)
 * 5. Call DomainVerificationService.verifyDomain() (Requirement 6.5)
 * 6. Update database with verification status and token (Requirement 1.8)
 * 7. Return verification result (Requirement 6.6)
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (Requirement 6.1)
    const { supabase, userId } = await requireSupabaseClient();

    // 2. Get user profile to check subscription plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan, branding')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new AuthenticationError('Failed to fetch user profile');
    }

    // 3. Validate Pro plan subscription (Requirement 8.1, 8.2)
    if (profile.subscription_plan !== 'pro') {
      throw new AuthorizationError(
        'Custom domain feature requires Pro plan subscription'
      );
    }

    // 4. Parse and validate request body
    const body: VerifyDomainRequest = await request.json();

    if (!body.domain || typeof body.domain !== 'string') {
      throw new ValidationError('Domain is required', {
        field: 'domain',
        message: 'Domain must be a non-empty string',
      });
    }

    // 5. Validate domain format (Requirement 6.3, 6.4)
    const normalized = normalizeDomain(body.domain);
    if (!normalized || !isValidDomain(normalized)) {
      throw new ValidationError(
        'Invalid domain format. Please enter a valid domain (e.g., photos.example.com)',
        {
          field: 'domain',
          message: 'Domain format is invalid',
        }
      );
    }

    // 6. Check domain uniqueness - ensure not already claimed by another user (Requirement 8.3, 8.4)
    const { data: existingDomain, error: domainCheckError } = await supabase
      .from('profiles')
      .select('id, branding')
      .neq('id', userId) // Exclude current user
      .not('branding', 'is', null);

    if (domainCheckError) {
      console.error('[DomainVerify] Error checking domain uniqueness:', domainCheckError);
      throw new Error('Failed to check domain availability');
    }

    // Check if any other user has claimed this domain
    if (existingDomain && existingDomain.length > 0) {
      for (const otherProfile of existingDomain) {
        const otherBranding = otherProfile.branding as any;
        if (
          otherBranding?.customDomain &&
          normalizeDomain(otherBranding.customDomain) === normalized
        ) {
          throw new ValidationError(
            'This domain is already claimed by another user',
            {
              field: 'domain',
              message: 'Domain already in use',
            }
          );
        }
      }
    }

    // 7. Call DomainVerificationService.verifyDomain() (Requirement 6.5)
    const verificationService = createDomainVerificationService(supabase);
    const result: DomainVerificationResult = await verificationService.verifyDomain(
      normalized,
      userId
    );

    // 8. Update database with verification status and token (Requirement 1.8, 7.1, 7.2, 7.3, 7.5)
    const currentBranding = (profile.branding as any) || {};
    const updatedBranding = {
      ...currentBranding,
      customDomain: normalized,
      domainVerified: result.status === 'verified',
      verificationToken: result.token || currentBranding.verificationToken,
      domainVerifiedAt:
        result.status === 'verified'
          ? new Date().toISOString()
          : currentBranding.domainVerifiedAt,
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        branding: updatedBranding,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId);

    if (updateError) {
      console.error('[DomainVerify] Error updating profile:', updateError);
      throw new Error('Failed to update domain verification status');
    }

    // 9. Return verification result (Requirement 6.6)
    const response: VerifyDomainResponse = {
      status: result.status,
      token: result.token,
      instructions: result.instructions,
      error: result.error,
    };

    return createApiResponse(response);
  } catch (error) {
    // Handle authentication errors (Requirement 6.2)
    if (error instanceof Error && error.message === 'Authentication required') {
      return handleApiError(new AuthenticationError());
    }

    return handleApiError(error);
  }
}
