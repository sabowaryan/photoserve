# Requirements Document: Custom Domain Implementation

## Introduction

This document specifies the requirements for implementing a complete custom domain feature for PikSend, a photo gallery platform. The feature enables Pro plan photographers to use their own domain (e.g., photos.theirsite.com) to access their galleries, providing a fully white-labeled experience with custom branding, SSL certificates, and dynamic routing.

The custom domain feature builds upon the existing branding system (colors, logo) and extends it with domain verification, SSL provisioning, and intelligent routing middleware. This allows photographers to present a professional, branded experience to their clients while maintaining the security and reliability of the PikSend platform.

## Glossary

- **System**: The PikSend custom domain implementation
- **Photographer**: A Pro plan user who owns galleries and wants to use a custom domain
- **Client**: A visitor accessing a photographer's gallery
- **Custom_Domain**: A photographer's own domain name (e.g., photos.example.com)
- **Primary_Domain**: The main PikSend domain (piksend.com)
- **DNS_Record**: Domain Name System configuration entry (CNAME, A, or TXT)
- **Verification_Token**: A unique string used to verify domain ownership via TXT record
- **SSL_Certificate**: A digital certificate that enables HTTPS encryption
- **Middleware**: Next.js routing layer that intercepts and processes requests
- **Gallery_Slug**: A unique identifier for a gallery (e.g., abc123)
- **Cloudinary**: Image hosting service used for logo uploads
- **Cloudflare**: DNS and SSL provider for custom domains
- **Branding_Settings**: User configuration including logo, colors, and domain
- **Domain_Status**: Current state of domain verification (pending, verified, failed)

## Requirements

### Requirement 1: Domain Verification System

**User Story:** As a Pro plan photographer, I want to verify ownership of my custom domain, so that I can securely use it for my galleries.

#### Acceptance Criteria

1. WHEN a photographer enters a Custom_Domain, THE System SHALL validate the domain format
2. WHEN domain validation succeeds, THE System SHALL generate a unique Verification_Token
3. WHEN a Verification_Token is generated, THE System SHALL provide DNS configuration instructions
4. WHEN a photographer requests verification, THE System SHALL check for CNAME or A records pointing to Primary_Domain
5. WHEN CNAME/A verification fails, THE System SHALL check for TXT record containing Verification_Token
6. WHEN TXT record verification succeeds, THE System SHALL mark Domain_Status as verified
7. WHEN verification fails after checking both methods, THE System SHALL mark Domain_Status as failed
8. WHEN Domain_Status changes, THE System SHALL persist the status to the database
9. WHEN a photographer views their domain settings, THE System SHALL display current Domain_Status
10. IF verification is attempted more than 10 times in 1 hour, THEN THE System SHALL rate limit the requests

### Requirement 2: SSL Certificate Provisioning

**User Story:** As a Pro plan photographer, I want automatic SSL certificates for my custom domain, so that my galleries are secure and trusted by browsers.

#### Acceptance Criteria

1. WHEN a Custom_Domain is verified, THE System SHALL automatically initiate SSL provisioning
2. WHEN SSL provisioning starts, THE System SHALL use Cloudflare API to add the domain
3. WHEN domain is added to Cloudflare, THE System SHALL configure DNS records
4. WHEN DNS records are configured, THE System SHALL enable SSL for the domain
5. WHEN SSL is enabled, THE System SHALL store certificate information in the database
6. IF Cloudflare provisioning fails, THEN THE System SHALL attempt Let's Encrypt as fallback
7. WHEN SSL certificate is near expiration, THE System SHALL automatically renew it
8. WHEN SSL provisioning completes, THE System SHALL notify the photographer
9. WHEN SSL provisioning fails, THE System SHALL log the error and notify the photographer

### Requirement 3: Dynamic Routing Middleware

**User Story:** As a client, I want to access galleries via the photographer's custom domain, so that I have a seamless branded experience.

#### Acceptance Criteria

1. WHEN a request arrives, THE Middleware SHALL extract the hostname from request headers
2. WHEN hostname matches Primary_Domain, THE Middleware SHALL allow normal routing
3. WHEN hostname is a Custom_Domain, THE Middleware SHALL query the database for matching photographer
4. WHEN no photographer is found for Custom_Domain, THE Middleware SHALL return 404 error
5. WHEN photographer is found, THE Middleware SHALL extract Gallery_Slug from URL path
6. WHEN Gallery_Slug is present, THE Middleware SHALL verify gallery belongs to photographer
7. WHEN gallery verification succeeds, THE Middleware SHALL rewrite URL to internal route
8. WHEN URL rewrite occurs, THE Middleware SHALL preserve query parameters
9. WHEN Custom_Domain is accessed without Gallery_Slug, THE Middleware SHALL route to photographer's portfolio page
10. WHEN Middleware processes request, THE System SHALL add less than 50ms latency
11. WHEN Middleware encounters error, THE System SHALL log error and return appropriate HTTP status

### Requirement 4: Domain Management User Interface

**User Story:** As a Pro plan photographer, I want an intuitive interface to configure my custom domain, so that I can easily set up and manage my branded galleries.

#### Acceptance Criteria

1. WHEN a Pro plan photographer views settings, THE System SHALL display domain configuration section
2. WHEN a Free plan photographer views settings, THE System SHALL display upgrade prompt for custom domain
3. WHEN photographer enters Custom_Domain, THE System SHALL validate format in real-time
4. WHEN validation fails, THE System SHALL display specific error message
5. WHEN photographer clicks verify, THE System SHALL display DNS configuration instructions
6. WHEN DNS instructions are shown, THE System SHALL provide copy-to-clipboard buttons
7. WHEN verification is in progress, THE System SHALL display loading indicator
8. WHEN Domain_Status is pending, THE System SHALL show pending indicator with instructions
9. WHEN Domain_Status is verified, THE System SHALL show success indicator with green checkmark
10. WHEN Domain_Status is failed, THE System SHALL show error indicator with retry button
11. WHEN photographer clicks retry, THE System SHALL re-attempt verification
12. WHEN photographer wants to remove domain, THE System SHALL provide remove button
13. WHEN remove is clicked, THE System SHALL confirm action before deletion

### Requirement 5: Logo Upload and Display

**User Story:** As a Pro plan photographer, I want to upload my logo and have it displayed in galleries, so that my brand is consistently represented.

#### Acceptance Criteria

1. WHEN a Pro plan photographer uploads an image, THE System SHALL validate file type is image
2. WHEN file type validation succeeds, THE System SHALL validate file size is under 2MB
3. WHEN file size validation succeeds, THE System SHALL upload image to Cloudinary
4. WHEN upload to Cloudinary succeeds, THE System SHALL store Cloudinary URL in database
5. WHEN upload fails, THE System SHALL display error message to photographer
6. WHEN logo is uploaded, THE System SHALL display preview in settings
7. WHEN photographer views gallery, THE System SHALL display custom logo in header
8. WHEN no custom logo exists, THE System SHALL display PikSend logo as fallback
9. WHEN logo is displayed, THE System SHALL optimize image for web (WebP format)
10. WHEN photographer removes logo, THE System SHALL delete reference from database

### Requirement 6: API Endpoints for Domain Operations

**User Story:** As the System, I need secure API endpoints for domain operations, so that photographers can manage their domains programmatically.

#### Acceptance Criteria

1. WHEN POST /api/domain/verify is called, THE System SHALL authenticate the user
2. WHEN authentication fails, THE System SHALL return 401 Unauthorized
3. WHEN authentication succeeds, THE System SHALL validate domain format
4. WHEN domain format is invalid, THE System SHALL return 400 Bad Request with error details
5. WHEN domain format is valid, THE System SHALL perform DNS verification
6. WHEN verification succeeds, THE System SHALL return verification status and token
7. WHEN POST /api/domain/provision-ssl is called, THE System SHALL verify domain is verified
8. WHEN domain is not verified, THE System SHALL return 403 Forbidden
9. WHEN domain is verified, THE System SHALL initiate SSL provisioning
10. WHEN GET /api/domain/status is called, THE System SHALL return current domain configuration
11. WHEN DELETE /api/domain/remove is called, THE System SHALL remove domain configuration
12. WHEN domain is removed, THE System SHALL clean up SSL certificates and DNS records

### Requirement 7: Database Schema for Domain Configuration

**User Story:** As the System, I need to persist domain configuration data, so that custom domains work reliably across sessions.

#### Acceptance Criteria

1. THE System SHALL store Custom_Domain in profiles.branding.customDomain field
2. THE System SHALL store Domain_Status in profiles.branding.domainVerified field
3. THE System SHALL store Verification_Token in profiles.branding.verificationToken field
4. THE System SHALL store SSL certificate ID in profiles.branding.sslCertificateId field
5. THE System SHALL store verification timestamp in profiles.branding.domainVerifiedAt field
6. THE System SHALL store SSL expiration date in profiles.branding.sslExpiresAt field
7. WHEN domain data is updated, THE System SHALL update profiles.updated_at timestamp
8. WHEN querying by Custom_Domain, THE System SHALL use indexed lookup for performance

### Requirement 8: Security and Access Control

**User Story:** As the System, I need to enforce security measures, so that custom domains cannot be hijacked or misused.

#### Acceptance Criteria

1. WHEN a photographer attempts domain operations, THE System SHALL verify Pro plan subscription
2. WHEN subscription is not Pro plan, THE System SHALL return 403 Forbidden
3. WHEN domain verification is requested, THE System SHALL validate domain is not already claimed
4. WHEN domain is already claimed by another user, THE System SHALL return error
5. WHEN domain verification succeeds, THE System SHALL prevent other users from claiming it
6. WHEN API endpoints are called, THE System SHALL validate CSRF tokens
7. WHEN domain input is received, THE System SHALL sanitize input to prevent injection attacks
8. WHEN verification attempts exceed rate limit, THE System SHALL block further attempts
9. WHEN SSL certificates are stored, THE System SHALL encrypt sensitive certificate data

### Requirement 9: Performance and Caching

**User Story:** As a client, I want fast gallery loading times, so that I have a smooth browsing experience.

#### Acceptance Criteria

1. WHEN Middleware looks up Custom_Domain, THE System SHALL cache domain-to-photographer mapping
2. WHEN cache is used, THE System SHALL set cache TTL to 5 minutes
3. WHEN domain configuration changes, THE System SHALL invalidate relevant cache entries
4. WHEN logo is displayed, THE System SHALL use lazy loading
5. WHEN logo is served, THE System SHALL use WebP format with fallback
6. WHEN Middleware processes request, THE System SHALL complete in under 50ms
7. WHEN DNS verification is performed, THE System SHALL execute asynchronously
8. WHEN multiple galleries are accessed, THE System SHALL reuse cached domain lookups

### Requirement 10: Error Handling and User Feedback

**User Story:** As a photographer, I want clear error messages and feedback, so that I can troubleshoot domain configuration issues.

#### Acceptance Criteria

1. WHEN domain verification fails, THE System SHALL provide specific error reason
2. WHEN DNS records are incorrect, THE System SHALL show expected vs actual values
3. WHEN SSL provisioning fails, THE System SHALL display actionable error message
4. WHEN API errors occur, THE System SHALL log errors with request context
5. WHEN user operations succeed, THE System SHALL display success toast notification
6. WHEN user operations fail, THE System SHALL display error toast notification
7. WHEN domain is not configured, THE System SHALL return user-friendly 404 page
8. WHEN verification is pending, THE System SHALL show estimated wait time
9. WHEN SSL certificate expires soon, THE System SHALL warn photographer in advance

### Requirement 11: Internationalization Support

**User Story:** As a photographer, I want domain configuration UI in my language, so that I can understand the setup process.

#### Acceptance Criteria

1. WHEN UI is rendered, THE System SHALL use photographer's locale preference
2. WHEN locale is set, THE System SHALL display DNS instructions in that language
3. WHEN error messages are shown, THE System SHALL translate them to photographer's locale
4. WHEN success messages are shown, THE System SHALL translate them to photographer's locale
5. THE System SHALL support locales: en, fr, ar, da, fi, ja, ko, no, sv, zh-CN, zh-TW

### Requirement 12: SEO and Metadata Preservation

**User Story:** As a photographer, I want my custom domain galleries to maintain SEO optimization, so that my galleries are discoverable.

#### Acceptance Criteria

1. WHEN gallery is accessed via Custom_Domain, THE System SHALL preserve Open Graph tags
2. WHEN gallery is accessed via Custom_Domain, THE System SHALL set canonical URL correctly
3. WHEN gallery is accessed via Custom_Domain, THE System SHALL maintain noindex meta tag
4. WHEN gallery is accessed via Custom_Domain, THE System SHALL preserve structured data
5. WHEN Custom_Domain is used, THE System SHALL update sitemap to include custom domain URLs

### Requirement 13: Monitoring and Analytics

**User Story:** As the System, I need to track domain usage and errors, so that I can ensure reliability and identify issues.

#### Acceptance Criteria

1. WHEN domain verification occurs, THE System SHALL log verification attempts
2. WHEN SSL provisioning occurs, THE System SHALL log provisioning status
3. WHEN Middleware processes Custom_Domain request, THE System SHALL track latency metrics
4. WHEN errors occur, THE System SHALL log error details with stack traces
5. WHEN domain is accessed, THE System SHALL track usage analytics
6. WHEN SSL certificate is near expiration, THE System SHALL alert system administrators
