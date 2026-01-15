# Implementation Plan: Custom Domain Implementation

## Overview

This implementation plan breaks down the custom domain feature into discrete, incremental coding tasks. The approach follows a layered implementation strategy: starting with core services (domain verification, SSL provisioning), then building the API layer, followed by middleware routing, and finally the UI components. Each task builds on previous work, with testing integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up domain utilities and validation
  - Create `src/lib/utils/domain.ts` with domain validation, normalization, and parsing functions
  - Implement `isValidDomain()`, `normalizeDomain()`, `extractSubdomain()`, `extractRootDomain()`
  - Add comprehensive input sanitization to prevent injection attacks
  - _Requirements: 1.1, 4.3, 8.7_

- [ ]* 1.1 Write property tests for domain validation
  - **Property 1: Valid domain format acceptance**
  - **Property 2: Invalid domain format rejection**
  - **Property 39: Input sanitization**
  - **Validates: Requirements 1.1, 4.3, 8.7**

- [ ] 2. Implement Domain Verification Service
  - [x] 2.1 Create `src/lib/services/domain-verification.service.ts`
    - Implement `DomainVerificationService` class with interface methods
    - Add `verifyDomain()` method that checks CNAME/A records via Google DNS API
    - Add `generateVerificationToken()` using crypto.randomBytes for secure tokens
    - Add `checkDNSRecords()` to query DNS via Google DNS-over-HTTPS
    - Add `verifyTXTRecord()` to check TXT records for verification token
    - Implement rate limiting logic (10 attempts per hour per user)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.10_

  - [ ]* 2.2 Write property tests for domain verification service
    - **Property 3: Verification token uniqueness**
    - **Property 4: DNS instructions presence**
    - **Property 5: DNS record verification correctness**
    - **Property 6: TXT record fallback verification**
    - **Property 7: Verification failure handling**
    - **Property 40: Rate limiting enforcement**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.7, 1.10**

  - [ ]* 2.3 Write unit tests for DNS verification edge cases
    - Test with various DNS response formats
    - Test network timeout handling
    - Test malformed DNS responses
    - _Requirements: 1.4, 1.5_

- [ ] 3. Implement SSL Provisioning Service
  - [x] 3.1 Create `src/lib/services/ssl-provisioning.service.ts`
    - Implement `SSLProvisioningService` class with Cloudflare integration
    - Add `provisionSSL()` method as main entry point
    - Add `addToCloudflare()` to create Cloudflare zone
    - Add `configureDNS()` to set up DNS records in Cloudflare
    - Add `enableSSL()` to activate SSL for the zone
    - Add `provisionLetsEncrypt()` as fallback using ACME protocol
    - Add `renewCertificate()` for automatic renewal logic
    - Store certificate metadata (not private keys) in database
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 3.2 Write property tests for SSL provisioning
    - **Property 10: Automatic SSL provisioning trigger**
    - **Property 11: SSL provisioning fallback**
    - **Property 12: SSL certificate persistence**
    - **Property 13: SSL renewal timing**
    - **Validates: Requirements 2.1, 2.5, 2.6, 2.7**

  - [ ]* 3.3 Write unit tests for SSL provisioning with mocked APIs
    - Mock Cloudflare API responses (success and failure)
    - Mock Let's Encrypt ACME protocol
    - Test certificate renewal logic with various expiration dates
    - _Requirements: 2.2, 2.3, 2.4, 2.6, 2.7_

- [x] 4. Extend database schema for domain configuration
  - Update `ProfileBranding` type in `src/types/index.ts` to include domain fields
  - Add fields: `customDomain`, `domainVerified`, `verificationToken`, `domainVerifiedAt`, `sslCertificateId`, `sslProvider`, `sslExpiresAt`, `cloudflareZoneId`
  - Document the schema changes in migration notes
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ]* 4.1 Write property tests for data storage
  - **Property 31: Branding field storage consistency**
  - **Property 32: Updated timestamp maintenance**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**

- [x] 5. Checkpoint - Verify core services
  - Ensure all tests pass for domain verification and SSL provisioning services
  - Verify database schema is correctly extended
  - Ask the user if questions arise

- [x] 6. Implement domain verification API endpoint
  - [x] 6.1 Create `src/app/api/domain/verify/route.ts`
    - Implement POST handler with authentication check
    - Validate user has Pro plan subscription
    - Validate domain format using domain utils
    - Check domain uniqueness (not already claimed)
    - Call `DomainVerificationService.verifyDomain()`
    - Update database with verification status and token
    - Return verification result with status, token, and instructions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 6.2 Write property tests for verify endpoint
    - **Property 23: API authentication requirement**
    - **Property 24: Authentication failure response**
    - **Property 25: Domain format validation in API**
    - **Property 26: Invalid domain API response**
    - **Property 27: Verification response format**
    - **Property 33: Pro plan authorization**
    - **Property 34: Non-Pro plan rejection**
    - **Property 35: Domain uniqueness enforcement**
    - **Property 36: Claimed domain rejection**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.6, 8.1, 8.2, 8.3, 8.4**

  - [ ]* 6.3 Write integration tests for verify endpoint
    - Test complete verification flow with test database
    - Test rate limiting behavior
    - Test CSRF token validation
    - _Requirements: 6.1, 6.5, 8.6, 1.10_

- [x] 7. Implement SSL provisioning API endpoint
  - [x] 7.1 Create `src/app/api/domain/provision-ssl/route.ts`
    - Implement POST handler with authentication check
    - Verify domain is already verified before proceeding
    - Call `SSLProvisioningService.provisionSSL()`
    - Update database with SSL certificate information
    - Send notification to photographer on success/failure
    - Return SSL provisioning result
    - _Requirements: 6.7, 6.8, 6.9, 2.8, 2.9_

  - [ ]* 7.2 Write property tests for SSL provisioning endpoint
    - **Property 28: SSL provisioning precondition**
    - **Property 29: Unverified domain SSL rejection**
    - **Property 14: SSL provisioning notification**
    - **Validates: Requirements 6.7, 6.8, 2.8, 2.9**

- [x] 8. Implement domain status API endpoint
  - Create `src/app/api/domain/status/route.ts`
  - Implement GET handler to return current domain configuration
  - Include domain, verification status, SSL status, and timestamps
  - _Requirements: 6.10_

- [ ]* 8.1 Write property tests for status endpoint
  - **Property 9: Status display consistency**
  - **Validates: Requirements 6.10, 1.9**

- [x] 9. Implement domain removal API endpoint
  - [x] 9.1 Create `src/app/api/domain/remove/route.ts`
    - Implement DELETE handler with authentication check
    - Remove domain configuration from database
    - Clean up SSL certificates via Cloudflare API
    - Clean up DNS records
    - Invalidate cache entries for the domain
    - Return success response
    - _Requirements: 6.11, 6.12_

  - [ ]* 9.2 Write property tests for removal endpoint
    - **Property 30: Domain removal cleanup**
    - **Property 43: Cache invalidation on configuration change**
    - **Validates: Requirements 6.12, 9.3**

- [x] 10. Checkpoint - Verify API layer
  - Ensure all API endpoint tests pass
  - Test API endpoints manually with Postman or similar tool
  - Verify database updates are working correctly
  - Ask the user if questions arise

- [x] 11. Implement caching layer for domain lookups
  - [x] 11.1 Create `src/lib/cache/domain-cache.ts`
    - Implement in-memory cache with TTL support (5 minutes)
    - Add `get()`, `set()`, `invalidate()` methods
    - Add cache key generation: `domain:${domain}`
    - Implement automatic expiration based on TTL
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 11.2 Write property tests for caching
    - **Property 41: Domain lookup caching**
    - **Property 42: Cache TTL configuration**
    - **Property 43: Cache invalidation on configuration change**
    - **Property 44: Cache reuse across requests**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.8**

- [x] 12. Implement custom domain middleware
  - [x] 12.1 Create `src/middleware.ts` (or update existing)
    - Implement middleware function to intercept all requests
    - Extract hostname from request headers
    - Check if hostname is primary domain (piksend.com) - if yes, pass through
    - For custom domains, lookup photographer from cache or database
    - Return 404 if domain not configured
    - Extract gallery slug from URL path
    - Verify gallery belongs to photographer
    - Rewrite URL to internal route with custom domain query param
    - Handle root custom domain requests (route to portfolio)
    - Add error logging with context
    - Configure matcher to exclude API routes, static files, Next.js internals
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.11_

  - [ ]* 12.2 Write property tests for middleware
    - **Property 15: Hostname extraction**
    - **Property 16: Primary domain passthrough**
    - **Property 17: Custom domain photographer lookup**
    - **Property 18: Unconfigured domain 404**
    - **Property 19: Gallery ownership verification**
    - **Property 20: URL rewrite with query parameter preservation**
    - **Property 21: Root custom domain routing**
    - **Property 22: Middleware error logging**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 3.11**

  - [ ]* 12.3 Write integration tests for middleware routing
    - Test with mock database and cache
    - Test various URL patterns (/g/slug, /galerie/slug, root)
    - Test error scenarios (invalid slug, wrong photographer)
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 13. Update gallery page to support custom domain context
  - Modify `src/app/g/[slug]/page.tsx` to read customDomain query parameter
  - Use custom domain for canonical URL and Open Graph tags
  - Ensure branding (logo, colors) is applied correctly
  - Maintain noindex meta tag
  - Preserve structured data
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ]* 13.1 Write property tests for SEO metadata
  - **Property 61: Open Graph tag preservation**
  - **Property 62: Canonical URL correctness**
  - **Property 63: Noindex meta tag maintenance**
  - **Property 64: Structured data preservation**
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [x] 14. Checkpoint - Verify routing and middleware
  - Ensure middleware tests pass
  - Test custom domain routing manually with local hosts file
  - Verify gallery pages render correctly with custom domain
  - Ask the user if questions arise

- [x] 15. Implement logo upload service
  - [x] 15.1 Create `src/lib/services/logo-upload.service.ts`
    - Implement `LogoUploadService` class
    - Add `uploadLogo()` method to upload to Cloudinary
    - Add `validateImage()` to check file type and size
    - Add `deleteLogo()` to remove from Cloudinary
    - Configure Cloudinary transformations (auto format, quality optimization)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.9_

  - [ ]* 15.2 Write property tests for logo upload
    - **Property 45: Image file type validation**
    - **Property 46: Image file size validation**
    - **Property 47: Cloudinary URL persistence**
    - **Property 48: Upload error handling**
    - **Property 50: Logo format optimization**
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.9**

- [x] 16. Implement logo upload API endpoint
  - Create `src/app/api/profile/logo/route.ts`
  - Implement POST handler for logo upload
  - Validate file using `LogoUploadService.validateImage()`
  - Upload to Cloudinary using `LogoUploadService.uploadLogo()`
  - Update database with Cloudinary URL
  - Return upload result
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 16.1 Write integration tests for logo upload endpoint
  - Test with mock Cloudinary API
  - Test file validation errors
  - Test successful upload flow
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 17. Update gallery header to display custom logo
  - Modify gallery header component to check for custom logo
  - Display custom logo if present, otherwise show PikSend logo
  - Implement lazy loading for logo images
  - Use WebP format with fallback
  - _Requirements: 5.7, 5.8, 5.9, 9.4_

- [ ]* 17.1 Write property tests for logo display
  - **Property 49: Logo display with fallback**
  - **Property 50: Logo format optimization**
  - **Validates: Requirements 5.7, 5.8, 5.9**

- [x] 18. Enhance BrandingSection UI component
  - [x] 18.1 Update `src/components/settings/branding-section.tsx`
    - Add domain configuration section with conditional rendering based on plan
    - Add domain input field with real-time validation
    - Add verification status indicator (idle, verifying, verified, failed)
    - Add DNS instructions panel with copy-to-clipboard buttons
    - Add verification button that calls `/api/domain/verify`
    - Add SSL status badge showing provisioning status
    - Add remove domain button with confirmation dialog
    - Add loading states for async operations
    - Add error and success toast notifications
    - Integrate logo upload functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 5.6_

  - [ ]* 18.2 Write unit tests for BrandingSection UI
    - Test Pro vs Free plan rendering
    - Test domain input validation
    - Test verification flow UI states
    - Test DNS instructions display
    - Test logo upload preview
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

- [x] 19. Implement internationalization for domain UI
  - [x] 19.1 Add translation keys to locale files
    - Add keys for domain configuration labels and instructions
    - Add keys for error messages (invalid domain, verification failed, etc.)
    - Add keys for success messages (domain verified, SSL provisioned)
    - Add keys for DNS setup instructions in all supported locales
    - Support locales: en, fr, ar, da, fi, ja, ko, no, sv, zh-CN, zh-TW
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 19.2 Write property tests for internationalization
    - **Property 57: Locale-based UI rendering**
    - **Property 58: Localized DNS instructions**
    - **Property 59: Localized error messages**
    - **Property 60: Localized success messages**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [x] 20. Implement error handling and user feedback
  - [x] 20.1 Create error handling utilities
    - Create `src/lib/utils/error-handling.ts` with error formatting functions
    - Implement specific error messages for domain verification failures
    - Implement DNS record comparison display (expected vs actual)
    - Implement actionable SSL error messages
    - Add error logging with context (user ID, domain, timestamp, stack trace)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 20.2 Write property tests for error handling
    - **Property 52: Specific error reasons**
    - **Property 53: DNS record comparison in errors**
    - **Property 54: Actionable SSL error messages**
    - **Property 55: Error logging with context**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [x] 21. Implement monitoring and analytics
  - [x] 21.1 Add logging for domain operations
    - Log domain verification attempts with timestamp and result
    - Log SSL provisioning operations with status
    - Log middleware latency metrics for custom domain requests
    - Log errors with stack traces
    - Track domain access analytics (timestamp, gallery, user agent)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 21.2 Write property tests for monitoring
    - **Property 66: Verification attempt logging**
    - **Property 67: SSL provisioning status logging**
    - **Property 68: Middleware latency tracking**
    - **Property 69: Error stack trace logging**
    - **Property 70: Domain access analytics**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

- [x] 22. Implement SSL certificate renewal automation
  - Create background job or cron task to check certificate expiration
  - Query all domains with SSL certificates expiring within 30 days
  - Call `SSLProvisioningService.renewCertificate()` for each
  - Send warnings to photographers for certificates expiring within 30 days
  - Send alerts to administrators for certificates expiring within 7 days
  - _Requirements: 2.7, 10.9, 13.6_

- [ ]* 22.1 Write property tests for SSL renewal
  - **Property 13: SSL renewal timing**
  - **Property 56: SSL expiration warning**
  - **Property 71: SSL expiration alerting**
  - **Validates: Requirements 2.7, 10.9, 13.6**

- [x] 23. Update sitemap generation for custom domains
  - Modify sitemap generation logic to include custom domain URLs
  - Query all verified custom domains
  - Generate sitemap entries for galleries accessible via custom domains
  - _Requirements: 12.5_

- [ ]* 23.1 Write property tests for sitemap
  - **Property 65: Sitemap custom domain inclusion**
  - **Validates: Requirements 12.5**

- [x] 24. Checkpoint - Verify complete feature
  - Run all tests (unit, property, integration)
  - Test complete user flow end-to-end manually
  - Verify domain verification works with real DNS
  - Verify SSL provisioning works with Cloudflare
  - Verify custom domain routing works correctly
  - Verify logo upload and display works
  - Verify all UI states and error handling
  - Ask the user if questions arise

- [x] 25. Add environment variables if not existe and configuration
  - Document required environment variables in `.env.example`
  - Add `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`
  - Add `NEXT_PUBLIC_APP_DOMAIN` for primary domain
  - Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - Update deployment documentation with configuration instructions
  - _Requirements: All_

- [ ]* 26. Write end-to-end tests for complete user journey
  - Test: User enters custom domain and sees DNS instructions
  - Test: User verifies domain and sees success message
  - Test: SSL is automatically provisioned after verification
  - Test: Client accesses gallery via custom domain
  - Test: Custom logo and branding are displayed correctly
  - Test: User removes custom domain and configuration is cleaned up
  - _Requirements: All_

- [x] 27. Final checkpoint - Production readiness
  - Ensure all tests pass (100% of property tests, unit tests, integration tests, E2E tests)
  - Verify performance metrics (middleware <50ms latency)
  - Verify security measures (rate limiting, CSRF protection, input sanitization)
  - Verify error handling and logging
  - Verify internationalization for all supported locales
  - Review code for best practices and optimization opportunities
  - Ask the user if questions arise before marking complete

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- End-to-end tests validate complete user workflows
- The implementation follows a bottom-up approach: services → API → middleware → UI
- External service integrations (Cloudflare, Cloudinary) should be mocked in tests
- Real integration testing should be done in staging environment before production
