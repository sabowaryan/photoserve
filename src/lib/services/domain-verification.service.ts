/**
 * Domain Verification Service
 * Handles domain ownership verification through DNS records (CNAME/A/TXT)
 * 
 * @module lib/services/domain-verification.service
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.10
 */

import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { isValidDomain, normalizeDomain } from '@/lib/utils/domain';

// Google DNS-over-HTTPS API endpoint
const GOOGLE_DNS_API = 'https://dns.google/resolve';

// Primary domain for CNAME/A record verification
const PRIMARY_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'piksend.com';

// Rate limiting configuration
const MAX_VERIFICATION_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Domain verification result
 */
export interface DomainVerificationResult {
  status: 'verified' | 'pending' | 'failed';
  token?: string;
  instructions?: string;
  error?: string;
}

/**
 * DNS record types
 */
type DNSRecordType = 'A' | 'AAAA' | 'CNAME' | 'TXT';

/**
 * DNS query response from Google DNS API
 */
interface DNSResponse {
  Status: number;
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
}

/**
 * Rate limit entry for verification attempts
 */
interface VerificationRateLimit {
  userId: string;
  attempts: number;
  firstAttemptAt: Date;
  expiresAt: Date;
}

/**
 * Domain Verification Service Interface
 */
export interface IDomainVerificationService {
  verifyDomain(domain: string, userId: string): Promise<DomainVerificationResult>;
  generateVerificationToken(userId: string): string;
  checkDNSRecords(domain: string): Promise<boolean>;
  verifyTXTRecord(domain: string, token: string): Promise<boolean>;
}

/**
 * Domain Verification Service Implementation
 */
export class DomainVerificationService implements IDomainVerificationService {
  private rateLimitCache: Map<string, VerificationRateLimit> = new Map();

  constructor(_supabase: SupabaseClient<Database>) {
    // Supabase client reserved for future use
    void _supabase;
  }

  /**
   * Verify domain ownership via CNAME/A or TXT records
   * 
   * Process:
   * 1. Validate domain format
   * 2. Check rate limiting
   * 3. Check CNAME/A records pointing to primary domain
   * 4. If CNAME/A fails, generate token and check TXT record
   * 5. Return verification result with status and instructions
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.10
   */
  async verifyDomain(domain: string, userId: string): Promise<DomainVerificationResult> {
    // Validate domain format (Requirement 1.1)
    const normalized = normalizeDomain(domain);
    if (!normalized || !isValidDomain(normalized)) {
      return {
        status: 'failed',
        error: 'Invalid domain format. Please enter a valid domain (e.g., photos.example.com)',
      };
    }

    // Development mode: simulate verification for testing
    // Set ENABLE_DOMAIN_VERIFICATION_SIMULATION=true in .env.local to enable
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DOMAIN_VERIFICATION_SIMULATION === 'true') {
      console.warn('[DomainVerification] Running in SIMULATION mode - domain will be auto-verified');
      return {
        status: 'verified',
        instructions: 'Domain verified successfully (SIMULATION MODE for development).',
      };
    }

    // Check rate limiting (Requirement 1.10)
    const rateLimitCheck = await this.checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return {
        status: 'failed',
        error: `Too many verification attempts. Please try again in ${Math.ceil(rateLimitCheck.retryAfterSeconds! / 60)} minutes.`,
      };
    }

    // Increment rate limit counter
    await this.incrementRateLimit(userId);

    try {
      // Check CNAME/A records (Requirement 1.4)
      const dnsRecordsValid = await this.checkDNSRecords(normalized);
      
      if (dnsRecordsValid) {
        // DNS records are correctly configured
        return {
          status: 'verified',
          instructions: 'Domain verified successfully via DNS records.',
        };
      }

      // CNAME/A verification failed, fall back to TXT record verification
      // Generate verification token (Requirement 1.2)
      const token = this.generateVerificationToken(userId);

      // Check if TXT record already exists with the token (Requirement 1.5)
      const txtRecordValid = await this.verifyTXTRecord(normalized, token);

      if (txtRecordValid) {
        // TXT record verification succeeded (Requirement 1.6)
        return {
          status: 'verified',
          token,
          instructions: 'Domain verified successfully via TXT record.',
        };
      }

      // Neither CNAME/A nor TXT verification succeeded
      // Return pending status with instructions (Requirement 1.3, 1.7)
      return {
        status: 'pending',
        token,
        instructions: this.generateDNSInstructions(normalized, token),
      };
    } catch (error) {
      console.error('[DomainVerification] Error verifying domain:', error);
      return {
        status: 'failed',
        error: 'Failed to verify domain. Please check your DNS configuration and try again.',
      };
    }
  }

  /**
   * Generate unique verification token for TXT record
   * Uses crypto.randomBytes for cryptographically secure tokens
   * 
   * Format: piksend-verify-{userId-hash}-{random-hex}
   * 
   * Requirement: 1.2
   */
  generateVerificationToken(userId: string): string {
    // Create a hash of the user ID for uniqueness
    const userHash = crypto
      .createHash('sha256')
      .update(userId)
      .digest('hex')
      .substring(0, 8);

    // Generate random bytes for additional security
    const randomBytes = crypto.randomBytes(16).toString('hex');

    // Combine into verification token
    return `piksend-verify-${userHash}-${randomBytes}`;
  }

  /**
   * Check if domain points to PikSend via CNAME or A record
   * Uses Google DNS-over-HTTPS API for DNS lookups
   * 
   * Requirement: 1.4
   */
  async checkDNSRecords(domain: string): Promise<boolean> {
    try {
      // Check CNAME record first (most common for subdomains)
      const cnameValid = await this.checkCNAMERecord(domain);
      if (cnameValid) {
        return true;
      }

      // Check A record (for root domains or alternative setup)
      const aRecordValid = await this.checkARecord(domain);
      if (aRecordValid) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('[DomainVerification] Error checking DNS records:', error);
      return false;
    }
  }

  /**
   * Verify TXT record contains the verification token
   * 
   * Requirement: 1.5
   */
  async verifyTXTRecord(domain: string, token: string): Promise<boolean> {
    try {
      const txtRecords = await this.queryDNS(domain, 'TXT');
      
      if (!txtRecords || txtRecords.length === 0) {
        return false;
      }

      // Check if any TXT record contains the verification token
      return txtRecords.some(record => {
        // TXT records are often quoted, so we need to handle that
        const cleanedData = record.data.replace(/^"|"$/g, '');
        return cleanedData.includes(token);
      });
    } catch (error) {
      console.error('[DomainVerification] Error verifying TXT record:', error);
      return false;
    }
  }

  /**
   * Check CNAME record points to primary domain
   */
  private async checkCNAMERecord(domain: string): Promise<boolean> {
    try {
      const cnameRecords = await this.queryDNS(domain, 'CNAME');
      
      if (!cnameRecords || cnameRecords.length === 0) {
        return false;
      }

      // Check if CNAME points to primary domain
      return cnameRecords.some(record => {
        const target = record.data.toLowerCase().replace(/\.$/, ''); // Remove trailing dot
        return target === PRIMARY_DOMAIN || target.endsWith(`.${PRIMARY_DOMAIN}`);
      });
    } catch (error) {
      console.error('[DomainVerification] Error checking CNAME record:', error);
      return false;
    }
  }

  /**
   * Check A record points to PikSend IP addresses
   * Note: This requires knowing the actual IP addresses of the PikSend infrastructure
   */
  private async checkARecord(domain: string): Promise<boolean> {
    try {
      // First, get the A records for the primary domain
      const primaryARecords = await this.queryDNS(PRIMARY_DOMAIN, 'A');
      
      if (!primaryARecords || primaryARecords.length === 0) {
        return false;
      }

      // Get the A records for the custom domain
      const customARecords = await this.queryDNS(domain, 'A');
      
      if (!customARecords || customARecords.length === 0) {
        return false;
      }

      // Extract IP addresses
      const primaryIPs = new Set(primaryARecords.map(r => r.data));
      const customIPs = customARecords.map(r => r.data);

      // Check if any custom domain IP matches primary domain IPs
      return customIPs.some(ip => primaryIPs.has(ip));
    } catch (error) {
      console.error('[DomainVerification] Error checking A record:', error);
      return false;
    }
  }

  /**
   * Query DNS via Google DNS-over-HTTPS API
   */
  private async queryDNS(
    domain: string,
    type: DNSRecordType
  ): Promise<Array<{ name: string; type: number; data: string }> | null> {
    try {
      const url = new URL(GOOGLE_DNS_API);
      url.searchParams.set('name', domain);
      url.searchParams.set('type', type);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/dns-json',
        },
      });

      if (!response.ok) {
        console.error('[DomainVerification] DNS query failed:', response.statusText);
        return null;
      }

      const data: DNSResponse = await response.json();

      // Status 0 means NOERROR (successful query)
      if (data.Status !== 0) {
        return null;
      }

      return data.Answer || null;
    } catch (error) {
      // In development, SSL certificate errors are common
      // Log a helpful message but continue gracefully
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DomainVerification] DNS query failed in development (this is normal):', 
          error instanceof Error ? error.message : 'Unknown error');
        console.warn('[DomainVerification] To test domain verification, use production environment or configure SSL certificates');
      } else {
        console.error('[DomainVerification] Error querying DNS:', error);
      }
      return null;
    }
  }

  /**
   * Generate DNS configuration instructions
   * 
   * Requirement: 1.3
   */
  private generateDNSInstructions(domain: string, token: string): string {
    return `
To verify ownership of ${domain}, please add one of the following DNS records:

**Option 1: CNAME Record (Recommended for subdomains)**
- Type: CNAME
- Name: ${domain}
- Value: ${PRIMARY_DOMAIN}
- TTL: 3600 (or default)

**Option 2: A Record (For root domains)**
- Type: A
- Name: ${domain}
- Value: [Contact support for IP address]
- TTL: 3600 (or default)

**Option 3: TXT Record (Alternative verification)**
- Type: TXT
- Name: ${domain}
- Value: ${token}
- TTL: 3600 (or default)

After adding the DNS record, it may take up to 48 hours to propagate. Click "Verify Domain" to check the status.
    `.trim();
  }

  /**
   * Check rate limiting for verification attempts
   * Requirement: 1.10
   */
  private async checkRateLimit(userId: string): Promise<{
    allowed: boolean;
    retryAfterSeconds?: number;
  }> {
    const now = new Date();
    const cached = this.rateLimitCache.get(userId);

    if (cached) {
      // Check if rate limit window has expired
      if (cached.expiresAt <= now) {
        // Window expired, remove from cache
        this.rateLimitCache.delete(userId);
        return { allowed: true };
      }

      // Check if max attempts reached
      if (cached.attempts >= MAX_VERIFICATION_ATTEMPTS) {
        const retryAfterSeconds = Math.ceil(
          (cached.expiresAt.getTime() - now.getTime()) / 1000
        );
        return { allowed: false, retryAfterSeconds };
      }

      return { allowed: true };
    }

    // No cached entry, allow the request
    return { allowed: true };
  }

  /**
   * Increment rate limit counter
   */
  private async incrementRateLimit(userId: string): Promise<void> {
    const now = new Date();
    const cached = this.rateLimitCache.get(userId);

    if (cached) {
      // Increment attempts
      cached.attempts += 1;
    } else {
      // Create new rate limit entry
      const expiresAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);
      this.rateLimitCache.set(userId, {
        userId,
        attempts: 1,
        firstAttemptAt: now,
        expiresAt,
      });
    }

    // Clean up expired entries periodically
    this.cleanupExpiredRateLimits();
  }

  /**
   * Clean up expired rate limit entries from cache
   */
  private cleanupExpiredRateLimits(): void {
    const now = new Date();
    for (const [userId, entry] of this.rateLimitCache.entries()) {
      if (entry.expiresAt <= now) {
        this.rateLimitCache.delete(userId);
      }
    }
  }
}

/**
 * Factory function to create a DomainVerificationService instance
 */
export function createDomainVerificationService(
  supabase: SupabaseClient<Database>
): IDomainVerificationService {
  return new DomainVerificationService(supabase);
}
