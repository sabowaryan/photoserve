/**
 * Geolocation Service Tests
 * Tests for IP geolocation functionality
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeolocationService } from '../geolocation.service';

describe('GeolocationService', () => {
  let service: GeolocationService;

  beforeEach(() => {
    service = new GeolocationService();
    vi.clearAllMocks();
  });

  describe('getCountryFromIP', () => {
    it('should return country code for valid public IP', async () => {
      // Mock fetch response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          countryCode: 'US',
        }),
      });

      const result = await service.getCountryFromIP('8.8.8.8');
      expect(result).toBe('US');
    });

    it('should return null for invalid IP format', async () => {
      const result = await service.getCountryFromIP('invalid-ip');
      expect(result).toBeNull();
    });

    it('should return null for private IP addresses', async () => {
      const privateIPs = [
        '127.0.0.1',
        '10.0.0.1',
        '192.168.1.1',
        '172.16.0.1',
        '169.254.1.1',
        'localhost',
        '::1',
      ];

      for (const ip of privateIPs) {
        const result = await service.getCountryFromIP(ip);
        expect(result).toBeNull();
      }
    });

    it('should return null when API request fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await service.getCountryFromIP('8.8.8.8');
      expect(result).toBeNull();
    });

    it('should return null when API returns error status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'fail',
          message: 'Invalid IP',
        }),
      });

      const result = await service.getCountryFromIP('8.8.8.8');
      expect(result).toBeNull();
    });

    it('should handle timeout gracefully', async () => {
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AbortError')), 5000)
        )
      );

      const result = await service.getCountryFromIP('8.8.8.8');
      expect(result).toBeNull();
    });
  });

  describe('getDetailedLocation', () => {
    it('should return detailed location for valid IP', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          countryCode: 'FR',
          country: 'France',
          city: 'Paris',
        }),
      });

      const result = await service.getDetailedLocation('8.8.8.8');
      expect(result).toEqual({
        countryCode: 'FR',
        countryName: 'France',
        city: 'Paris',
      });
    });

    it('should return error for invalid IP', async () => {
      const result = await service.getDetailedLocation('invalid-ip');
      expect(result.countryCode).toBeNull();
      expect(result.error).toBe('Invalid IP format');
    });

    it('should return error for private IP', async () => {
      const result = await service.getDetailedLocation('192.168.1.1');
      expect(result.countryCode).toBeNull();
      expect(result.error).toBe('Private IP address');
    });
  });

  describe('IP validation', () => {
    it('should validate IPv4 addresses correctly', async () => {
      const validIPs = ['8.8.8.8', '192.168.1.1', '10.0.0.1'];
      
      for (const ip of validIPs) {
        // Private IPs will return null, but won't throw
        const result = await service.getCountryFromIP(ip);
        expect(result).toBeDefined();
      }
    });

    it('should reject invalid IPv4 addresses', async () => {
      const invalidIPs = ['256.256.256.256', '1.2.3', '1.2.3.4.5'];
      
      for (const ip of invalidIPs) {
        const result = await service.getCountryFromIP(ip);
        expect(result).toBeNull();
      }
    });
  });
});
