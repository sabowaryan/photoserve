# Implementation Plan: Lightroom Plugin Infrastructure

## Overview

This implementation plan breaks down the Lightroom Plugin Infrastructure into discrete, actionable tasks. The implementation follows a bottom-up approach: database schema → services → API endpoints → UI components → testing. Each task builds on previous work and includes references to specific requirements.

The infrastructure provides secure API key management, plugin version distribution, usage tracking, and administrative tools for the PikSend Lightroom plugin.

## Tasks

- [x] 1. Set up database schema and migrations
  - [x] 1.1 Create api_keys table with indexes and constraints
    - Create table with columns: id, user_id, name, key_hash, key_prefix, scopes, last_used_at, expires_at, created_at, updated_at, is_active
    - Add CHECK constraints for name length, prefix length, and expiration validation
    - Create indexes on user_id, key_hash, is_active, and expires_at
    - _Requirements: 3.1, 3.5_
  
  - [x] 1.2 Create plugin_versions table with indexes and constraints
    - Create table with columns: id, version, file_url, file_size, changelog, is_stable, min_lightroom_version, release_date, download_count, created_at
    - Add CHECK constraints for version format, file size, and download count
    - Create indexes on version, is_stable, and release_date
    - _Requirements: 3.2, 3.5_

  - [x] 1.3 Create plugin_downloads table with indexes
    - Create table with columns: id, user_id, version_id, ip_address, user_agent, downloaded_at
    - Add CHECK constraint for user_agent length
    - Create indexes on user_id, version_id, and downloaded_at
    - Add foreign key constraints with appropriate ON DELETE behavior
    - _Requirements: 3.3, 3.5_
  
  - [x] 1.4 Create plugin_usage_logs table with indexes
    - Create table with columns: id, user_id, api_key_id, action, plugin_version, lightroom_version, os_version, metadata, created_at
    - Add CHECK constraint for action length
    - Create indexes on user_id, action, created_at, and GIN index on metadata JSONB
    - Add foreign key constraints with CASCADE delete for user_id
    - _Requirements: 3.4, 3.5_
  
  - [x] 1.5 Implement Row Level Security policies
    - Enable RLS on all four tables
    - Create policy for users to view/manage only their own api_keys
    - Create policy for users to view only stable plugin_versions
    - Create policy for admin to access all records in all tables
    - Create policies for plugin_downloads and plugin_usage_logs
    - _Requirements: 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 2. Implement APIKeyService
  - [x] 2.1 Create TypeScript interfaces and types
    - Define APIKey, CreateAPIKeyParams, ValidationResult interfaces
    - Define IAPIKeyService interface with all methods
    - Create Zod schemas for validation
    - _Requirements: 1.1, 1.5, 1.6_

  - [x] 2.2 Implement API key generation logic
    - Generate 24 random bytes using crypto.randomBytes()
    - Encode as base64url and prefix with 'pk_live_'
    - Hash complete key with SHA-256
    - Extract first 12 characters as key_prefix
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 2.3 Write property test for API key uniqueness
    - **Property 1: API Key Uniqueness and Security**
    - Generate multiple keys and verify all are unique
    - Verify key format matches regex pattern
    - Verify hash is 64 hex characters
    - Verify prefix extraction is correct
    - **Validates: Requirements 1.1, 1.2, 1.3, 12.1, 12.2**
  
  - [x] 2.4 Implement createAPIKey method
    - Validate user has Pro plan
    - Generate API key and hash
    - Insert record into api_keys table
    - Return both full key and APIKey object
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.10_
  
  - [x] 2.5 Implement validateAPIKey method
    - Hash provided key with SHA-256
    - Query database for matching key_hash
    - Check is_active, expires_at, and user's Pro plan status
    - Update last_used_at timestamp on success
    - Return ValidationResult with user info or error
    - Use constant-time comparison for security
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 12.2_

  - [ ]* 2.6 Write property test for API key validation correctness
    - **Property 2: API Key Validation Correctness**
    - Test validation with various key states (valid, invalid, expired, revoked)
    - Test with various user plan types (free, pro)
    - Verify correct status codes (401, 403)
    - Test constant-time comparison
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.6, 2.7**
  
  - [x] 2.7 Implement listAPIKeys, revokeAPIKey, and deleteAPIKey methods
    - listAPIKeys: Query user's keys with RLS enforcement
    - revokeAPIKey: Set is_active=false, verify ownership
    - deleteAPIKey: Delete record, verify ownership
    - _Requirements: 1.7, 1.8, 1.9_
  
  - [ ]* 2.8 Write unit tests for APIKeyService
    - Test Pro plan requirement enforcement
    - Test expiration checking logic
    - Test last_used_at update
    - Test error cases (invalid input, non-existent keys)
    - _Requirements: 1.10, 2.6, 2.7_

- [x] 3. Implement PluginVersionService
  - [x] 3.1 Create TypeScript interfaces and types
    - Define PluginVersion, CreateVersionParams, DownloadMetadata interfaces
    - Define IPluginVersionService interface
    - Create Zod schema for semantic version validation
    - _Requirements: 4.2, 4.4_

  - [x] 3.2 Implement semantic version comparison logic
    - Parse version strings (major.minor.patch)
    - Compare versions numerically
    - Handle pre-release tags (beta, alpha)
    - _Requirements: 4.7, 6.1_
  
  - [ ]* 3.3 Write property test for semantic version ordering
    - **Property 4: Semantic Version Ordering**
    - Test version comparison with random semantic versions
    - Verify 2.0.0 > 1.9.9, 1.1.0 > 1.0.9, etc.
    - Test pre-release versions < stable versions
    - Verify getLatestStableVersion returns correct version
    - **Validates: Requirements 4.7, 6.1**
  
  - [x] 3.4 Implement createVersion method
    - Validate version format (semantic versioning)
    - Validate admin permissions
    - Insert record into plugin_versions table
    - Return PluginVersion object
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 3.5 Implement getLatestStableVersion method
    - Query plugin_versions where is_stable=true
    - Order by version (semantic comparison)
    - Return highest version or null
    - Implement caching (5 minutes TTL)
    - _Requirements: 4.6, 4.7, 6.1, 14.3_

  - [x] 3.6 Implement recordDownload method
    - Insert record into plugin_downloads table
    - Increment download_count on plugin_versions atomically
    - Handle concurrent downloads without race conditions
    - _Requirements: 4.8, 5.3, 5.8_
  
  - [ ]* 3.7 Write property test for download tracking integrity
    - **Property 5: Download Tracking Integrity**
    - Simulate concurrent downloads
    - Verify download_count accuracy
    - Verify one record per download
    - Test sum of download records = download_count
    - **Validates: Requirements 5.3, 5.8, 5.10**
  
  - [x] 3.8 Implement getAllVersions and getVersionById methods
    - getAllVersions: Filter by stability based on user role
    - getVersionById: Return single version or null
    - Enforce RLS policies
    - _Requirements: 4.6, 4.9, 4.10_
  
  - [ ]* 3.9 Write unit tests for PluginVersionService
    - Test version filtering (stable vs unstable)
    - Test download count increment
    - Test admin vs non-admin access
    - Test cache behavior
    - _Requirements: 4.6, 4.9, 14.3_

- [x] 4. Implement UsageTrackingService
  - [x] 4.1 Create TypeScript interfaces and types
    - Define UsageLog, LogUsageParams, UsageStats interfaces
    - Define IUsageTrackingService interface
    - Create Zod schema for usage log validation
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 4.2 Implement logUsage method
    - Validate required fields (user_id, action, timestamp)
    - Allow optional fields (plugin_version, lightroom_version, os_version)
    - Validate metadata is valid JSON
    - Insert record into plugin_usage_logs table
    - Use asynchronous processing to avoid blocking
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 14.4_
  
  - [ ]* 4.3 Write property test for usage log completeness
    - **Property 6: Usage Log Completeness**
    - Log various actions and verify required fields present
    - Test with and without optional fields
    - Verify metadata JSON validity
    - Test querying with various filters
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
  
  - [x] 4.4 Implement getUserUsage and getGlobalStats methods
    - getUserUsage: Query logs for specific user with date range filter
    - getGlobalStats: Aggregate statistics (active users, action breakdown, version distribution)
    - Implement efficient queries with proper indexes
    - _Requirements: 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_
  
  - [ ]* 4.5 Write unit tests for UsageTrackingService
    - Test log creation with all fields
    - Test log creation with minimal fields
    - Test date range filtering
    - Test statistics aggregation
    - _Requirements: 11.5, 11.6, 11.7, 11.8_

- [x] 5. Checkpoint - Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement plugin API endpoints
  - [x] 6.1 Create POST /api/plugin/auth/validate endpoint
    - Extract Bearer token from Authorization header
    - Call APIKeyService.validateAPIKey()
    - Return user info on success (200)
    - Return 401 for invalid/expired keys
    - Return 403 for non-Pro users
    - Log failed authentication attempts
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  
  - [x] 6.2 Create GET /api/plugin/version endpoint
    - Call PluginVersionService.getLatestStableVersion()
    - Return version info (version, downloadUrl, fileSize, changelog, releaseDate, minLightroomVersion)
    - Return 404 if no stable version exists
    - Implement response caching (5 minutes)
    - No authentication required
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9_
  
  - [x] 6.3 Create GET /api/plugin/download endpoint
    - Require authentication
    - Verify user has Pro plan
    - Get version (from query param or latest stable)
    - Call PluginVersionService.recordDownload()
    - Redirect to Cloudinary URL (302)
    - Return 401 if not authenticated
    - Return 403 if not Pro user
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7, 5.8, 5.10_

  - [x] 6.4 Create POST /api/plugin/usage endpoint
    - Extract Bearer token from Authorization header
    - Validate API key and get user info
    - Parse request body (action, pluginVersion, lightroomVersion, osVersion, metadata)
    - Call UsageTrackingService.logUsage()
    - Return success response (200)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ]* 6.5 Write integration tests for plugin API endpoints
    - Test complete authentication flow
    - Test version checking flow
    - Test download flow with authentication
    - Test usage logging flow
    - Test error cases (401, 403, 404)
    - _Requirements: 2.1-2.8, 5.1-5.10, 6.1-6.10_

- [x] 7. Implement dashboard API key management endpoints
  - [x] 7.1 Create POST /api/settings/api-keys endpoint
    - Require session authentication
    - Verify user has Pro plan
    - Validate request body (name, expiresAt)
    - Call APIKeyService.createAPIKey()
    - Return full key and APIKey object (201)
    - Return 403 if not Pro user
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.10_
  
  - [x] 7.2 Create GET /api/settings/api-keys endpoint
    - Require session authentication
    - Call APIKeyService.listAPIKeys()
    - Return array of APIKey objects (200)
    - _Requirements: 1.7, 7.1, 7.2_

  - [x] 7.3 Create DELETE /api/settings/api-keys/[id] endpoint
    - Require session authentication
    - Verify user owns the key
    - Call APIKeyService.deleteAPIKey()
    - Return 204 on success
    - Return 404 if key not found or not owned
    - _Requirements: 1.9, 7.7, 7.8_
  
  - [x] 7.4 Create PATCH /api/settings/api-keys/[id]/revoke endpoint
    - Require session authentication
    - Verify user owns the key
    - Call APIKeyService.revokeAPIKey()
    - Return success response (200)
    - Return 404 if key not found or not owned
    - _Requirements: 1.8, 7.6, 7.7, 7.8_
  
  - [ ]* 7.5 Write integration tests for dashboard API endpoints
    - Test complete API key lifecycle (create, list, revoke, delete)
    - Test Pro plan gating
    - Test ownership verification
    - Test error cases
    - _Requirements: 1.1-1.10, 7.1-7.11_

- [x] 8. Implement admin plugin management endpoints
  - [x] 8.1 Create GET /api/admin/plugin/versions endpoint
    - Require session authentication
    - Verify user has admin role
    - Call PluginVersionService.getAllVersions()
    - Support includeUnstable query parameter
    - Return array of PluginVersion objects (200)
    - Return 403 if not admin
    - _Requirements: 4.6, 4.9, 4.10, 10.1, 10.7, 10.11_

  - [x] 8.2 Create POST /api/admin/plugin/upload endpoint
    - Require session authentication
    - Verify user has admin role
    - Accept multipart/form-data file upload
    - Validate file extension is .lrplugin
    - Upload to Cloudinary
    - Return URL and file size (200)
    - Return 403 if not admin
    - _Requirements: 4.1, 10.2, 10.3, 10.4_
  
  - [x] 8.3 Create POST /api/admin/plugin/versions endpoint
    - Require session authentication
    - Verify user has admin role
    - Validate request body (version, fileUrl, fileSize, changelog, isStable, minLightroomVersion)
    - Call PluginVersionService.createVersion()
    - Return PluginVersion object (201)
    - Return 403 if not admin
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 10.5, 10.6_
  
  - [x] 8.4 Create GET /api/admin/plugin/stats endpoint
    - Require session authentication
    - Verify user has admin role
    - Support startDate and endDate query parameters
    - Call UsageTrackingService.getGlobalStats()
    - Return statistics object (200)
    - Return 403 if not admin
    - _Requirements: 10.8, 10.9, 11.5, 11.6, 11.7, 11.8_
  
  - [ ]* 8.5 Write integration tests for admin API endpoints
    - Test admin-only access enforcement
    - Test file upload flow
    - Test version creation flow
    - Test statistics retrieval
    - Test non-admin access returns 403
    - _Requirements: 4.1-4.10, 10.1-10.11_

- [x] 9. Checkpoint - Ensure all API endpoint tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement dashboard UI components
  - [x] 10.1 Create APIKeyList component
    - Display table of user's API keys
    - Show columns: Name, Prefix, Created, Last Used, Expires, Status, Actions
    - Show "Never used" badge for null last_used_at
    - Show "Expired" badge for past expires_at
    - Show "Expiring soon" warning for keys expiring within 7 days
    - Implement revoke and delete actions with confirmation dialogs
    - _Requirements: 7.1, 7.2, 7.6, 7.7, 7.10, 7.11_
  
  - [x] 10.2 Create CreateAPIKeyDialog component
    - Modal dialog with form fields (name, optional expiration date)
    - Validate name (1-100 characters)
    - Call POST /api/settings/api-keys on submit
    - On success, show APIKeyCreatedDialog
    - _Requirements: 7.3, 7.4_
  
  - [x] 10.3 Create APIKeyCreatedDialog component
    - Display complete API key in monospace font
    - Copy button with visual feedback
    - Warning: "This key will only be shown once"
    - Cannot be dismissed until user acknowledges
    - _Requirements: 1.3, 7.4, 7.5_
  
  - [x] 10.4 Create ProPlanGate component
    - Check user's plan type
    - If not Pro, display upgrade prompt
    - If Pro, render children
    - Link to pricing page
    - _Requirements: 1.10, 7.9_

  - [x] 10.5 Create /settings/api-keys page
    - Wrap with ProPlanGate component
    - Render APIKeyList component
    - Add "Create API Key" button that opens CreateAPIKeyDialog
    - Use React Query for data fetching and mutations
    - Implement optimistic updates for revoke/delete
    - _Requirements: 7.1, 7.2, 7.3, 7.8, 7.9_
  
  - [ ]* 10.6 Write unit tests for dashboard UI components
    - Test APIKeyList rendering with various key states
    - Test CreateAPIKeyDialog form validation
    - Test APIKeyCreatedDialog copy functionality
    - Test ProPlanGate conditional rendering
    - _Requirements: 7.1-7.11_

- [x] 11. Implement public documentation pages
  - [x] 11.1 Create /docs/lightroom page structure
    - Create page layout with table of contents
    - Implement responsive design
    - Add breadcrumb navigation
    - Optimize for SEO with meta tags
    - _Requirements: 8.1, 8.7, 8.9, 8.10_
  
  - [x] 11.2 Write installation instructions section
    - Step-by-step instructions for Windows
    - Step-by-step instructions for macOS
    - Add screenshots for each step
    - Include troubleshooting for common installation issues
    - _Requirements: 8.1_

  - [x] 11.3 Write usage instructions section
    - How to generate an API key
    - How to enter API key in Lightroom
    - How to verify connection
    - Creating galleries from Lightroom
    - Uploading images
    - Managing gallery settings
    - _Requirements: 8.2_
  
  - [x] 11.4 Write troubleshooting section
    - Common errors and solutions
    - How to check logs
    - How to contact support
    - _Requirements: 8.3_
  
  - [x] 11.5 Add system requirements and changelog sections
    - Display system requirements and compatibility info
    - Display current plugin version
    - Display changelog with version history
    - Link to download page
    - _Requirements: 8.4, 8.5, 8.6_
  
  - [x] 11.6 Implement documentation search functionality
    - Add search input component
    - Implement client-side search across documentation content
    - Highlight search results
    - _Requirements: 8.8_

- [x] 12. Implement plugin download page
  - [x] 12.1 Create VersionInfo component
    - Display latest stable version number
    - Display file size
    - Display release date
    - Display changelog (expandable)
    - _Requirements: 5.5, 6.2, 6.4_

  - [x] 12.2 Create SystemRequirements component
    - Display minimum Lightroom version
    - Display supported operating systems
    - Display disk space required
    - _Requirements: 5.6, 6.3_
  
  - [x] 12.3 Create DownloadButton component
    - Large, prominent download button
    - If not authenticated, redirect to login
    - If not Pro, show upgrade prompt
    - If Pro, call GET /api/plugin/download
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [x] 12.4 Create /download/lightroom page
    - Render VersionInfo component
    - Render SystemRequirements component
    - Render DownloadButton component
    - Add InstallationInstructions component with quick start guide
    - Link to full documentation
    - Allow unauthenticated users to view but not download
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.9_
  
  - [ ]* 12.5 Write unit tests for download page components
    - Test VersionInfo rendering
    - Test DownloadButton authentication flow
    - Test Pro plan gating
    - _Requirements: 5.1-5.10_

- [x] 13. Implement support page
  - [x] 13.1 Create FAQ component
    - Display FAQ items organized by category
    - Implement expandable/collapsible sections
    - Add search functionality for FAQ content
    - _Requirements: 9.1, 9.9, 9.10_

  - [x] 13.2 Create SupportContactForm component
    - Form fields for support requests (name, email, subject, message)
    - Validate all required fields
    - Submit to support endpoint
    - Display confirmation message with expected response time
    - _Requirements: 9.2, 9.3, 9.4, 9.5_
  
  - [x] 13.3 Create /support page
    - Render FAQ component
    - Render SupportContactForm component
    - Display links to documentation and tutorials
    - Display system status information
    - Display support hours and response time expectations
    - _Requirements: 9.1, 9.2, 9.6, 9.7, 9.8_

- [x] 14. Implement admin plugin management interface
  - [x] 14.1 Create PluginVersionsTable component
    - Display all plugin versions (stable and unstable)
    - Columns: Version, Status, Release Date, Downloads, Actions
    - Actions: Edit, Mark Stable/Unstable, Delete
    - _Requirements: 10.1, 10.7, 10.10_
  
  - [x] 14.2 Create PluginUploadForm component
    - Drag-and-drop file upload interface
    - Validate file is .lrplugin extension
    - Upload to Cloudinary with progress bar
    - Form fields: version number, changelog, minimum Lightroom version, stability status
    - Validate version number follows semantic versioning
    - Call POST /api/admin/plugin/upload then POST /api/admin/plugin/versions
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 14.3 Create PluginStatistics component
    - Display total downloads chart (line chart over time)
    - Display downloads by version (pie chart)
    - Display active users (last 30 days)
    - Display most common actions (bar chart)
    - Display version distribution (bar chart)
    - Display Lightroom version distribution (bar chart)
    - Fetch data from GET /api/admin/plugin/stats
    - _Requirements: 10.8, 11.5, 11.6, 11.7, 11.8_
  
  - [x] 14.4 Create UsageLogsTable component
    - Display usage logs with columns: Timestamp, User, Action, Plugin Version, LR Version, OS
    - Implement filters: Date range, User, Action type
    - Expandable rows show metadata JSON
    - Export to CSV button
    - _Requirements: 10.9_
  
  - [x] 14.5 Create /admin/plugin page with tabs
    - Tab 1: Versions (PluginVersionsTable + upload button)
    - Tab 2: Upload (PluginUploadForm)
    - Tab 3: Statistics (PluginStatistics)
    - Tab 4: Usage Logs (UsageLogsTable)
    - Require admin authentication (403 for non-admin)
    - _Requirements: 10.1-10.11_
  
  - [ ]* 14.6 Write unit tests for admin UI components
    - Test PluginVersionsTable rendering
    - Test PluginUploadForm validation
    - Test PluginStatistics data visualization
    - Test UsageLogsTable filtering
    - _Requirements: 10.1-10.11_

- [x] 15. Checkpoint - Ensure all UI components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement security and rate limiting
  - [x] 16.1 Implement rate limiting middleware
    - Use Redis or in-memory cache for rate limit tracking
    - Key by API key hash
    - Limit: 100 requests per minute per key
    - Burst: 10 requests per second
    - Return 429 with Retry-After header when exceeded
    - _Requirements: 12.3, 12.4_
  
  - [x] 16.2 Apply rate limiting to plugin endpoints
    - Apply to /api/plugin/auth/validate
    - Apply to /api/plugin/usage
    - Apply to /api/plugin/download
    - _Requirements: 12.3, 12.4_
  
  - [ ]* 16.3 Write property test for rate limiting and security
    - **Property 8: Rate Limiting and Security**
    - Send requests exceeding rate limits and verify 429 response
    - Verify rate limits are per-key, not global
    - Test exponential backoff behavior
    - Verify failed attempts are logged
    - **Validates: Requirements 12.3, 12.4, 12.5**
  
  - [x] 16.4 Implement input validation with Zod schemas
    - Create schemas for all API endpoints
    - Validate API key names (1-100 characters)
    - Validate version numbers (semantic versioning regex)
    - Validate dates (ISO 8601 format)
    - Validate file uploads (.lrplugin extension, max 50MB)
    - Validate metadata (valid JSON, max 10KB)
    - _Requirements: 13.4, 13.6_

  - [x] 16.5 Implement CORS configuration
    - Allow production domain (https://piksend.com)
    - Allow development (http://localhost:3000)
    - Allow all origins for plugin endpoints (desktop requests)
    - Configure allowed methods (GET, POST, PATCH, DELETE)
    - Configure allowed headers (Authorization, Content-Type)
    - _Requirements: 12.9_
  
  - [x] 16.6 Implement security logging
    - Log all authentication failures
    - Log all admin actions
    - Log sensitive operations (key creation, revocation)
    - Use structured logging format
    - _Requirements: 12.6, 13.6, 13.8_
  
  - [ ]* 16.7 Write unit tests for security features
    - Test input validation with invalid inputs
    - Test CORS configuration
    - Test security logging
    - _Requirements: 12.6, 12.8, 12.9, 13.4, 13.6_

- [x] 17. Implement error handling and logging
  - [x] 17.1 Create standardized error response format
    - Define JSON error format with status, error message, and optional details
    - Create error handler middleware
    - Map different error types to appropriate HTTP status codes
    - _Requirements: 13.1, 13.2_

  - [x] 17.2 Implement error logging with context
    - Log errors with stack trace and context information
    - Implement structured logging for easy parsing
    - Log all API requests with timestamp, endpoint, user_id, and response status
    - Maintain logs for at least 90 days
    - _Requirements: 13.3, 13.7, 13.8, 13.10_
  
  - [x] 17.3 Implement field-level validation errors
    - Return specific field-level error messages for validation failures
    - Use Zod error formatting
    - Return 400 Bad Request for validation errors
    - _Requirements: 13.4, 13.6_
  
  - [x] 17.4 Implement database error handling
    - Catch database errors and return generic error messages
    - Do not expose database details in error responses
    - Log database errors with full details
    - _Requirements: 13.5_
  
  - [x] 17.5 Implement critical error alerting
    - Set up alerting for critical errors
    - Send alerts to administrators
    - Define alert thresholds and conditions
    - _Requirements: 13.9_
  
  - [ ]* 17.6 Write unit tests for error handling
    - Test error response format
    - Test validation error messages
    - Test database error handling
    - Test error logging
    - _Requirements: 13.1-13.10_

- [x] 18. Checkpoint - Ensure all security and error handling tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Implement performance optimizations
  - [x] 19.1 Implement caching for plugin version queries
    - Cache getLatestStableVersion results for 5 minutes
    - Use in-memory cache or Redis
    - Implement cache invalidation on version updates
    - _Requirements: 14.3_
  
  - [x] 19.2 Implement database connection pooling
    - Configure connection pool with max 20 connections
    - Implement connection timeout and retry logic
    - Monitor connection pool usage
    - _Requirements: 14.6_
  
  - [x] 19.3 Optimize database queries with indexes
    - Verify all indexes are created correctly
    - Analyze query plans for frequently used queries
    - Add additional indexes if needed
    - _Requirements: 14.10_
  
  - [x] 19.4 Implement asynchronous usage logging
    - Use background job queue for usage log processing
    - Avoid blocking API requests
    - Implement retry logic for failed logs
    - _Requirements: 14.4_
  
  - [x] 19.5 Configure CDN for plugin file distribution
    - Set cache headers for plugin files (1 year)
    - Enable gzip compression
    - Use versioned URLs for cache busting
    - _Requirements: 5.7, 14.2_

  - [ ]* 19.6 Write property test for performance requirements
    - **Property 7: Performance Requirements**
    - Load test with 100 concurrent API key validations
    - Measure response times and verify 95th percentile < 100ms
    - Verify cache hit rates for version queries
    - Analyze query plans to ensure index usage
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.5**
  
  - [x] 19.7 Implement graceful degradation
    - Handle external service failures (Cloudinary, etc.)
    - Return appropriate error messages
    - Implement circuit breaker pattern
    - _Requirements: 14.8_
  
  - [ ]* 19.8 Write unit tests for performance optimizations
    - Test cache behavior
    - Test connection pooling
    - Test asynchronous processing
    - _Requirements: 14.3, 14.4, 14.6_

- [x] 20. Implement monitoring and observability
  - [x] 20.1 Set up metrics tracking
    - Track API key validation response time (p50, p95, p99)
    - Track API key validation success rate
    - Track plugin download count
    - Track active users (daily, weekly, monthly)
    - Track error rates by endpoint
    - Track database query performance
    - _Requirements: 14.9_

  - [x] 20.2 Configure alerting thresholds
    - Alert when API validation p95 > 100ms
    - Alert when error rate > 1%
    - Alert when download failures > 5%
    - Alert on database connection pool exhaustion
    - Alert on Cloudinary upload failures
    - _Requirements: 14.9_
  
  - [x] 20.3 Implement health check endpoints
    - Create /api/health endpoint for basic health check
    - Create /api/health/db endpoint for database connectivity
    - Create /api/health/cloudinary endpoint for Cloudinary connectivity
    - Return appropriate status codes and messages
    - _Requirements: 14.8, 14.9_

- [ ] 21. Write end-to-end tests
  - [ ]* 21.1 Write E2E test for API key creation and usage flow
    - Login as Pro user
    - Navigate to API keys page
    - Create new API key
    - Copy key from dialog
    - Use key to authenticate plugin request
    - Verify authentication succeeds
    - Verify last_used_at is updated
    - _Requirements: 1.1-1.10, 2.1-2.8, 7.1-7.11_
  
  - [ ]* 21.2 Write E2E test for plugin download flow
    - Login as Pro user
    - Navigate to download page
    - Click download button
    - Verify redirect to Cloudinary
    - Verify download record created
    - Verify download count incremented
    - _Requirements: 5.1-5.10_

  - [ ]* 21.3 Write E2E test for admin plugin upload flow
    - Login as admin
    - Navigate to plugin management
    - Upload .lrplugin file
    - Fill version form
    - Submit
    - Verify version appears in list
    - Verify file accessible via URL
    - _Requirements: 4.1-4.10, 10.1-10.11_
  
  - [ ]* 21.4 Write E2E test for Row Level Security
    - **Property 3: Row Level Security Enforcement**
    - Create multiple users with different roles
    - Attempt cross-user data access and verify it fails
    - Verify admin can access all data
    - Verify non-admin cannot access unstable versions
    - **Validates: Requirements 3.6, 3.7, 3.8, 3.9**

- [ ] 22. Final integration and deployment preparation
  - [ ] 22.1 Set up environment variables
    - Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
    - Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
    - Configure optional variables (rate limits, cache TTL)
    - Document all required environment variables
    - _Requirements: All_
  
  - [ ] 22.2 Create database migration scripts
    - Write migration for api_keys table
    - Write migration for plugin_versions table
    - Write migration for plugin_downloads table
    - Write migration for plugin_usage_logs table
    - Write migration for indexes and RLS policies
    - Test migrations in staging environment
    - Create rollback scripts
    - _Requirements: 3.1-3.10_

  - [ ] 22.3 Run all tests and verify coverage
    - Run all unit tests
    - Run all integration tests
    - Run all property-based tests
    - Run all E2E tests
    - Verify test coverage meets requirements
    - Fix any failing tests
    - _Requirements: All_
  
  - [ ] 22.4 Perform manual testing
    - Test complete user flow (create account, upgrade to Pro, create API key, download plugin)
    - Test admin flow (upload version, view statistics)
    - Test error cases (invalid keys, non-Pro users, expired keys)
    - Test on different browsers and devices
    - _Requirements: All_
  
  - [ ] 22.5 Create deployment documentation
    - Document deployment process
    - Document environment setup
    - Document database migration process
    - Document rollback procedures
    - Document monitoring and alerting setup
    - _Requirements: All_

- [ ] 23. Final checkpoint - Ensure all tests pass and system is ready for deployment
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation uses TypeScript with Next.js 15, Supabase, and Cloudinary
- All API keys are hashed with SHA-256 and never stored in plain text
- Row Level Security policies enforce data access controls
- Rate limiting protects against abuse
- Comprehensive error handling and logging for debugging
