/**
 * Domain Removal API Endpoint
 * DELETE /api/domain/remove - Remove custom domain configuration
 * 
 * @module app/api/domain/remove/route
 * Requirements: 6.11, 6.12
 */

import { handleApiError, createApiResponse } from '@/lib/api/error-handler';
import { requireSupabaseClient } from '@/lib/auth';
import { AuthenticationError } from '@/lib/errors';
import type { ProfileBranding } from '@/types';

// Cloudflare API configuration
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

/**
 * Response schema for domain removal
 */
interface RemoveDomainResponse {
  success: boolean;
  message: string;
}

/**
 * DELETE /api/domain/remove
 * Remove custom domain configuration and clean up all associated resources
 * 
 * Process:
 * 1. Authenticate user (Requirement 6.1)
 * 2. Fetch current domain configuration from database
 * 3. Clean up SSL certificates via Cloudflare API (Requirement 6.12)
 * 4. Clean up DNS records (Requirement 6.12)
 * 5. Remove domain configuration from database (Requirement 6.11)
 * 6. Invalidate cache entries for the domain (Requirement 9.3)
 * 7. Return success response
 * 
 * Requirements: 6.11, 6.12, 9.3
 */
export async function DELETE() {
  try {
    // 1. Authenticate user (Requirement 6.1)
    const { supabase, userId } = await requireSupabaseClient();

    // 2. Fetch current domain configuration from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('branding')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new AuthenticationError('Failed to fetch user profile');
    }

    const branding = (profile.branding as ProfileBranding) || {};

    // Check if domain is configured
    if (!branding.customDomain) {
      return createApiResponse({
        success: true,
        message: 'No custom domain configured',
      });
    }

    const domain = branding.customDomain;
    const cloudflareZoneId = branding.cloudflareZoneId;
    const sslProvider = branding.sslProvider;

    console.log(`[DomainRemove] Starting domain removal for ${domain}`);

    // 3. Clean up SSL certificates via Cloudflare API (Requirement 6.12)
    if (sslProvider === 'cloudflare' && cloudflareZoneId) {
      try {
        await cleanupCloudflareZone(cloudflareZoneId);
        console.log(`[DomainRemove] Cleaned up Cloudflare zone ${cloudflareZoneId}`);
      } catch (cloudflareError) {
        // Log error but don't fail the entire operation
        console.error('[DomainRemove] Error cleaning up Cloudflare zone:', cloudflareError);
        // Continue with database cleanup even if Cloudflare cleanup fails
      }
    } else if (sslProvider === 'letsencrypt') {
      // For Let's Encrypt, certificates are stored locally
      // In production, you would delete certificate files here
      console.log(`[DomainRemove] Let's Encrypt certificate cleanup (no-op in current implementation)`);
    }

    // 4. Clean up DNS records (Requirement 6.12)
    // DNS records are cleaned up as part of the Cloudflare zone deletion above
    // For Let's Encrypt or manual DNS, no additional cleanup needed

    // 5. Remove domain configuration from database (Requirement 6.11)
    const updatedBranding: ProfileBranding = {
      ...branding,
      customDomain: undefined,
      domainVerified: undefined,
      verificationToken: undefined,
      domainVerifiedAt: undefined,
      sslCertificateId: undefined,
      sslProvider: undefined,
      sslExpiresAt: undefined,
      cloudflareZoneId: undefined,
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        branding: updatedBranding,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId);

    if (updateError) {
      console.error('[DomainRemove] Error updating profile:', updateError);
      throw new Error('Failed to remove domain configuration from database');
    }

    // 6. Invalidate cache entries for the domain (Requirement 9.3)
    // Note: In production, this would call a cache invalidation service
    // For now, we'll log the cache invalidation
    await invalidateDomainCache(domain);

    console.log(`[DomainRemove] Successfully removed domain ${domain}`);

    // 7. Return success response
    const response: RemoveDomainResponse = {
      success: true,
      message: `Custom domain ${domain} has been successfully removed`,
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

/**
 * Clean up Cloudflare zone and associated resources
 * 
 * This function deletes the Cloudflare zone, which automatically removes:
 * - SSL certificates
 * - DNS records
 * - All zone settings
 * 
 * Requirements: 6.12
 * 
 * @param zoneId - Cloudflare zone ID
 */
async function cleanupCloudflareZone(zoneId: string): Promise<void> {
  if (!CLOUDFLARE_API_TOKEN) {
    console.warn('[DomainRemove] Cloudflare API token not configured, skipping zone cleanup');
    return;
  }

  try {
    const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.success) {
      const errorMessage = data.errors?.[0]?.message || 'Failed to delete Cloudflare zone';
      throw new Error(`Cloudflare API error: ${errorMessage}`);
    }

    console.log(`[DomainRemove] Successfully deleted Cloudflare zone ${zoneId}`);
  } catch (error) {
    console.error('[DomainRemove] Error deleting Cloudflare zone:', error);
    throw error;
  }
}

/**
 * Invalidate cache entries for the removed domain
 * 
 * This function invalidates the domain-to-photographer mapping cache
 * to ensure that requests to the removed domain no longer route to
 * the photographer's galleries.
 * 
 * Requirements: 9.3
 * 
 * @param domain - The custom domain to invalidate
 */
async function invalidateDomainCache(domain: string): Promise<void> {
  try {
    // Import domain cache module dynamically to avoid edge runtime issues
    const { invalidate } = await import('@/lib/cache/domain-cache');
    
    // Invalidate the domain cache entry
    invalidate(domain);
    
    console.log(`[DomainRemove] Successfully invalidated cache for domain: ${domain}`);
    console.log(`[DomainRemove] Cache key invalidated: domain:${domain}`);
    
  } catch (error) {
    // Don't fail the entire operation if cache invalidation fails
    console.error('[DomainRemove] Error invalidating cache:', error);
  }
}
