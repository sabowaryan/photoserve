/**
 * Domain Status API Endpoint
 * GET /api/domain/status - Return current domain configuration
 * 
 * @module app/api/domain/status/route
 * Requirements: 6.10
 */

import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { AuthenticationError } from '@/lib/errors';
import type { ProfileBranding } from '@/types';

/**
 * Response schema for domain status
 */
interface DomainStatusResponse {
  domain: string | null;
  verified: boolean;
  sslProvisioned: boolean;
  sslExpiresAt: string | null;
  verifiedAt: string | null;
  sslProvider?: 'cloudflare' | 'letsencrypt' | null;
  verificationToken?: string | null;
}

/**
 * GET /api/domain/status
 * Return current domain configuration for the authenticated user
 * 
 * Process:
 * 1. Authenticate user (Requirement 6.1)
 * 2. Fetch user profile with branding data
 * 3. Extract domain configuration from branding
 * 4. Return domain status including:
 *    - domain: The custom domain (or null if not configured)
 *    - verified: Whether the domain is verified
 *    - sslProvisioned: Whether SSL certificate is provisioned
 *    - sslExpiresAt: SSL certificate expiration timestamp
 *    - verifiedAt: Domain verification timestamp
 *    - sslProvider: SSL certificate provider (cloudflare or letsencrypt)
 *    - verificationToken: Token for TXT record verification (if pending)
 * 
 * Requirements: 6.10, 1.9
 */
export async function GET() {
  try {
    // 1. Authenticate user (Requirement 6.1)
    const { supabase, userId } = await requireSupabaseClient();

    // 2. Fetch user profile with branding data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('branding')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new AuthenticationError('Failed to fetch user profile');
    }

    // 3. Extract domain configuration from branding
    const branding = (profile.branding as ProfileBranding) || {};

    // 4. Build and return domain status response (Requirement 6.10)
    const response: DomainStatusResponse = {
      domain: branding.customDomain || null,
      verified: branding.domainVerified || false,
      sslProvisioned: !!(branding.sslCertificateId && branding.sslProvider),
      sslExpiresAt: branding.sslExpiresAt || null,
      verifiedAt: branding.domainVerifiedAt || null,
      sslProvider: branding.sslProvider || null,
      // Include verification token if domain is not yet verified (for UI to show instructions)
      verificationToken: branding.domainVerified ? null : (branding.verificationToken || null),
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
