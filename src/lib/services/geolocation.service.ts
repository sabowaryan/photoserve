/**
 * Geolocation Service
 * Provides IP geolocation functionality to determine visitor country
 * 
 * @module lib/services/geolocation.service
 */

export interface GeolocationResult {
  countryCode: string | null;
  countryName?: string;
  city?: string;
  error?: string;
}

export interface IGeolocationService {
  getCountryFromIP(ip: string): Promise<string | null>;
  getDetailedLocation(ip: string): Promise<GeolocationResult>;
}

/**
 * Geolocation Service using ip-api.com (free tier)
 * 
 * Free tier limits:
 * - 45 requests per minute
 * - No API key required
 * - HTTP only (HTTPS requires paid plan)
 * 
 * Alternative: ipapi.co (1000 requests/day free)
 */
export class GeolocationService implements IGeolocationService {
  private readonly API_URL = 'http://ip-api.com/json';
  private readonly TIMEOUT_MS = 3000; // 3 seconds timeout
  
  /**
   * Get country code from IP address
   * 
   * @param ip - IP address to geolocate
   * @returns ISO 3166-1 alpha-2 country code (e.g., "FR", "US") or null
   */
  async getCountryFromIP(ip: string): Promise<string | null> {
    try {
      // Validate IP format
      if (!this.isValidIP(ip)) {
        console.warn('Invalid IP address format:', ip);
        return null;
      }
      
      // Skip private/local IPs
      if (this.isPrivateIP(ip)) {
        console.log('Private IP detected, skipping geolocation:', ip);
        return null;
      }
      
      // Make API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
      
      const response = await fetch(
        `${this.API_URL}/${ip}?fields=status,countryCode`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('Geolocation API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.countryCode) {
        return data.countryCode;
      }
      
      console.warn('Geolocation failed:', data);
      return null;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Geolocation request timeout');
      } else {
        console.error('Geolocation error:', error);
      }
      return null;
    }
  }
  
  /**
   * Get detailed location information from IP address
   * 
   * @param ip - IP address to geolocate
   * @returns Detailed location data or error
   */
  async getDetailedLocation(ip: string): Promise<GeolocationResult> {
    try {
      // Validate IP format
      if (!this.isValidIP(ip)) {
        return { countryCode: null, error: 'Invalid IP format' };
      }
      
      // Skip private/local IPs
      if (this.isPrivateIP(ip)) {
        return { countryCode: null, error: 'Private IP address' };
      }
      
      // Make API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
      
      const response = await fetch(
        `${this.API_URL}/${ip}?fields=status,countryCode,country,city`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return { countryCode: null, error: `API error: ${response.status}` };
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          countryCode: data.countryCode || null,
          countryName: data.country || undefined,
          city: data.city || undefined,
        };
      }
      
      return { countryCode: null, error: data.message || 'Geolocation failed' };
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { countryCode: null, error: 'Request timeout' };
      }
      return { 
        countryCode: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Validate IP address format (IPv4 or IPv6)
   */
  private isValidIP(ip: string): boolean {
    // IPv4 regex
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 regex (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
  
  /**
   * Check if IP is private/local (not geolocatable)
   */
  private isPrivateIP(ip: string): boolean {
    // Localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return true;
    }
    
    // Private IPv4 ranges
    const privateRanges = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^169\.254\./,              // 169.254.0.0/16 (link-local)
    ];
    
    return privateRanges.some(regex => regex.test(ip));
  }
}

/**
 * Factory function to create a GeolocationService instance
 */
export function createGeolocationService(): IGeolocationService {
  return new GeolocationService();
}

/**
 * Singleton instance for convenience
 */
export const geolocationService = createGeolocationService();
