# Implementation Plan: Email Management System

## Overview

This plan implements a comprehensive email management system with provider abstraction (Resend & AWS SES), template engine, queue processing, and admin UI. The implementation is divided into 4 phases: Foundation (database & dependencies), Core Services (providers, templates, queue), Admin UI (configuration & monitoring), and Deployment (testing & production).

## Tasks

### Phase 1: Foundation & Database Setup

- [x] 1. Create database schema and migrations
  - Create migration for `email_providers` table with encrypted configuration storage
  - Create migration for `sender_addresses` table with verification status tracking
  - Create migration for `email_templates` and `template_versions` tables with versioning support
  - Create migration for `email_queue` table with priority, retry logic, and scheduling
  - Create migration for `email_logs` and `email_events` tables for tracking
  - Create migration for `email_suppressions` and `email_unsubscribes` tables
  - Add performance indexes on frequently queried columns (status, created_at, provider_id, etc.)
  - Create RLS policies for admin-only access to email management tables
  - Test migration on development database
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Install required dependencies
  - Install `resend` SDK for Resend provider
  - Install `@aws-sdk/client-sesv2` for AWS SES provider
  - Install `react-email` and `@react-email/components` (if not present)
  - Install email editor library (`react-email-editor` or `unlayer`)
  - Install `juice` for CSS inlining
  - Install `html-to-text` for plain text conversion
  - Update package.json with type definitions
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Checkpoint - Verify foundation
  - Ensure all migrations execute successfully
  - Verify all dependencies are installed correctly
  - Check that database tables and indexes are created
  - Ask user if any questions arise

### Phase 2: Core Services - Provider Abstraction

- [x] 4. Create email provider interface and types
  - Create `src/lib/email/providers/types.ts` with `EmailProvider` interface
  - Define `SendEmailParams`, `SendEmailResult`, `EmailAttachment` types
  - Define `VerificationResult`, `DomainRecords`, `ProviderConfig` types
  - Create base `BaseEmailProvider` class with common functionality
  - Add provider factory pattern for instantiation
  - _Requirements: 2.1, 2.4_

- [x] 5. Implement Resend provider
  - Create `src/lib/email/providers/resend.provider.ts` implementing `EmailProvider`
  - Implement `sendEmail()` method with Resend API
  - Implement `sendBatch()` method for bulk emails
  - Implement `verifySender()` method for domain/email verification
  - Implement `getVerificationStatus()` method
  - Implement `getDomainRecords()` method for DNS records
  - Add error handling with retry logic (exponential backoff)
  - Write unit tests for ResendProvider
  - _Requirements: 2.1, 2.5, 2.6_

- [x] 6. Implement AWS SES provider
  - Create `src/lib/email/providers/ses.provider.ts` implementing `EmailProvider`
  - Implement `sendEmail()` method with SES v2 API
  - Implement `sendBatch()` method using SES batch operations
  - Implement `verifySender()` method with SES verification
  - Implement `getVerificationStatus()` method
  - Implement `getDomainRecords()` method for DKIM/SPF records
  - Add error handling with retry logic (exponential backoff)
  - Write unit tests for SESProvider
  - _Requirements: 2.1, 2.5, 2.6_

- [x] 7. Create provider configuration service
  - Create `src/lib/services/email-provider.service.ts` with `EmailProviderService` class
  - Implement `getActiveProvider()` method to retrieve current provider instance
  - Implement `setActiveProvider()` method with validation
  - Implement `saveProviderConfig()` method with credentials encryption
  - Implement `testProviderConnection()` method to verify configuration
  - Implement `listProviders()` method to get all configured providers
  - Write unit tests for provider service
  - _Requirements: 2.2, 2.3, 2.7_

- [x] 8. Create sender address repository
  - Create `src/lib/repositories/sender-address.repository.ts`
  - Implement `create()`, `update()`, `delete()`, `findById()`, `findByEmail()` methods
  - Implement `findByUserId()` to get all sender addresses for a user
  - Implement `updateVerificationStatus()` method
  - Implement `setDefault()` method to mark a sender as default
  - Write unit tests for sender address repository
  - _Requirements: 2.8, 2.9_

- [x] 9. Checkpoint - Verify provider abstraction
  - Test Resend provider with test API key
  - Test AWS SES provider with test credentialsa
  - Verify provider switching works correctly
  - Verify sender address management
  - Ensure all tests pass
  - Ask user if any questions arise

### Phase 3: Core Services - Template Engine

- [x] 10. Create template engine core
  - Create `src/lib/email/template-engine.ts` with `TemplateEngine` class
  - Implement `renderReactEmail()` method for existing React Email templates
  - Implement `renderCustomTemplate()` method for WYSIWYG templates
  - Implement `substituteVariables()` method with Handlebars-like syntax
  - Implement `validateVariables()` method to check required variables
  - Implement `generatePreview()` method with sample data
  - Implement `convertToPlainText()` method using html-to-text
  - Implement `inlineCSS()` method using juice
  - Write unit tests for template engine
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 11. Create template repository
  - Create `src/lib/repositories/template.repository.ts`
  - Implement `createTemplate()` method
  - Implement `updateTemplate()` method with automatic versioning
  - Implement `getTemplate()` method with version support
  - Implement `listTemplates()` method with filters (type, status, search)
  - Implement `deleteTemplate()` method (soft delete)
  - Implement `getTemplateVersions()` method
  - Implement `publishTemplateVersion()` method
  - Implement `rollbackToVersion()` method
  - Write unit tests for template repository
  - _Requirements: 3.6, 3.7, 3.8_

- [x] 12. Migrate existing React Email templates
  - Create migration script in `scripts/migrate-email-templates.ts`
  - Migrate `purchase-confirmation.tsx` template with metadata
  - Migrate `sale-notification.tsx` template with metadata
  - Migrate `payout-notification.tsx` template with metadata
  - Migrate `dispute-alert.tsx` template with metadata
  - Migrate `refund-confirmation.tsx` template with metadata
  - Add template metadata (variables, type, category, description)
  - Test all migrated templates render correctly
  - Update existing email sending code to use new system
  - _Requirements: 3.9, 3.10_

- [x] 13. Checkpoint - Verify template engine
  - Test rendering of all migrated templates
  - Verify variable substitution works correctly
  - Test template versioning and rollback
  - Verify CSS inlining and plain text conversion
  - Ensure all tests pass
  - Ask user if any questions arise

### Phase 4: Core Services - Queue & Processing

- [x] 14. Create queue manager
  - Create `src/lib/email/queue-manager.ts` with `QueueManager` class
  - Implement `enqueue()` method with priority handling (high, normal, low)
  - Implement `processBatch()` method to process multiple emails
  - Implement retry logic with exponential backoff (max 5 retries)
  - Implement `cancel()` method for scheduled emails
  - Implement `getStats()` method for queue monitoring
  - Implement `getQueueHealth()` method to check queue status
  - Write unit tests for queue manager
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 15. Create email sending service
  - Create `src/lib/services/email.service.ts` with `EmailService` class
  - Implement `sendTransactionalEmail()` method (immediate sending)
  - Implement `sendMarketingEmail()` method (with unsubscribe check)
  - Implement `scheduleEmail()` method for delayed sending
  - Implement `checkUnsubscribed()` method
  - Implement `checkSuppressed()` method
  - Implement `logEmail()` method to record email events
  - Write unit tests for email service
  - _Requirements: 4.6, 4.7, 4.8, 4.9_

- [x] 16. Create queue processing edge function
  - Create `supabase/functions/process-email-queue/index.ts`
  - Implement batch processing logic (process 10 emails per run)
  - Add error handling and logging
  - Configure cron trigger (every 1 minute)
  - Add monitoring and alerting for failures
  - Test edge function locally with `supabase functions serve`
  - Deploy edge function to Supabase
  - _Requirements: 4.10, 4.11_

- [x] 17. Checkpoint - Verify queue processing
  - Test email queueing with different priorities
  - Verify scheduled emails are sent at correct time
  - Test retry logic with failed emails
  - Verify edge function processes queue correctly
  - Ensure all tests pass
  - Ask user if any questions arise

### Phase 5: Core Services - Webhooks & Analytics

- [x] 18. Create webhook handler
  - Create `src/lib/email/webhook-handler.ts` with `WebhookHandler` class
  - Implement `handleResendWebhook()` method for Resend events
  - Implement `handleSESWebhook()` method for SNS notifications
  - Implement `verifySignature()` method for both providers
  - Implement `updateEmailLog()` method to record events
  - Implement bounce and complaint handling (add to suppression list)
  - Write unit tests for webhook handler
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 19. Create webhook API routes
  - Create `src/app/api/webhooks/email/resend/route.ts` for POST
  - Create `src/app/api/webhooks/email/ses/route.ts` for POST
  - Add signature verification middleware
  - Add rate limiting (100 requests per minute)
  - Add error handling and logging
  - Test webhook endpoints with mock data
  - Configure webhooks in Resend dashboard
  - Configure SNS topic for SES events
  - _Requirements: 5.5, 5.6_

- [x] 20. Create analytics service
  - Create `src/lib/services/email-analytics.service.ts` with `AnalyticsService` class
  - Implement `recordEvent()` method for tracking email events
  - Implement `getTemplateAnalytics()` method (sent, delivered, opened, clicked, bounced)
  - Implement `getSenderAnalytics()` method
  - Implement `getSystemAnalytics()` method (overall stats)
  - Implement `exportAnalytics()` method (CSV/JSON export)
  - Add analytics aggregation queries with proper indexes
  - Write unit tests for analytics service
  - _Requirements: 5.7, 5.8, 5.9_

- [x] 21. Checkpoint - Verify webhooks and analytics
  - Test webhook handling with mock events
  - Verify email events are logged correctly
  - Test analytics calculations
  - Verify bounce and complaint handling
  - Ensure all tests pass
  - Ask user if any questions arise

### Phase 6: Admin UI - Provider & Sender Management

- [x] 22. Create provider configuration page
  - Create `src/app/(admin)/admin/emails/providers/page.tsx`
  - Create provider selection component (Resend, AWS SES)
  - Create Resend configuration form (API key)
  - Create AWS SES configuration form (access key, secret key, region)
  - Add provider connection testing with visual feedback
  - Add provider switching functionality
  - Add success/error notifications
  - Test provider configuration flow end-to-end
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 23. Create sender address management page
  - Create `src/app/(admin)/admin/emails/senders/page.tsx`
  - Create sender address list component with status badges
  - Create add sender address form (email, name)
  - Create domain verification instructions component with DNS records
  - Add verification status display (pending, verified, failed)
  - Add default sender selection functionality
  - Add sender deletion with validation (prevent deleting default)
  - Test sender management flow end-to-end
  - _Requirements: 6.4, 6.5, 6.6_

- [x] 24. Checkpoint - Verify provider and sender UI
  - Test provider configuration with both Resend and AWS SES
  - Verify sender address verification flow
  - Test switching between providers
  - Ensure UI is responsive and accessible
  - Ask user if any questions arise

### Phase 7: Admin UI - Template Management

- [x] 25. Create template list page
  - Create `src/app/(admin)/admin/emails/templates/page.tsx`
  - Create template list component with filters (type, status)
  - Add template type badges (transactional, marketing)
  - Add template status indicators (draft, published)
  - Add template actions (edit, preview, delete, duplicate)
  - Add search functionality (by name, subject)
  - Add pagination (20 templates per page)
  - Test template list functionality
  - _Requirements: 7.1, 7.2_

- [x] 26. Create WYSIWYG template editor
  - Create `src/app/(admin)/admin/emails/templates/new/page.tsx`
  - Create `src/app/(admin)/admin/emails/templates/[id]/edit/page.tsx`
  - Integrate react-email-editor or Unlayer
  - Create template editor component with drag-and-drop
  - Add drag-and-drop components (text, image, button, divider, spacer, social)
  - Add variable insertion UI (dropdown with available variables)
  - Add template settings form (name, subject, type, category)
  - Add save draft and publish functionality
  - Test template creation and editing flow
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 27. Create template preview and testing
  - Create template preview modal component
  - Add sample data form for variables
  - Add desktop/mobile preview toggle
  - Add test email sending functionality (send to own email)
  - Add HTML/plain text view toggle
  - Add copy HTML functionality
  - Test preview functionality with different templates
  - _Requirements: 7.6, 7.7_

- [x] 28. Create template version history
  - Create version history component in template editor
  - Add version comparison view (side-by-side diff)
  - Add version preview functionality
  - Add version rollback functionality with confirmation
  - Add version metadata display (created by, created at, changes)
  - Test version management functionality
  - _Requirements: 7.8, 7.9_

- [x] 29. Checkpoint - Verify template management UI
  - Test creating a new template from scratch
  - Test editing an existing template
  - Verify template preview works correctly
  - Test version history and rollback
  - Test sending test emails
  - Ensure UI is responsive and accessible
  - Ask user if any questions arise

### Phase 8: Admin UI - Logs & Analytics

- [x] 30. Create email logs page
  - Create `src/app/(admin)/admin/emails/logs/page.tsx`
  - Create email logs table component with sortable columns
  - Add status filters (queued, sent, delivered, opened, clicked, bounced, failed)
  - Add date range picker (last 7 days, 30 days, 90 days, custom)
  - Add recipient/sender search functionality
  - Add email detail modal with full event history
  - Add retry failed email functionality
  - Add pagination and sorting (by date, status, recipient)
  - Test email logs functionality
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 31. Create analytics dashboard
  - Create `src/app/(admin)/admin/emails/analytics/page.tsx`
  - Create analytics summary cards (sent, delivered, opened, clicked, bounced)
  - Add email volume chart (time series with Chart.js or Recharts)
  - Add open rate and click rate charts
  - Add template performance comparison table
  - Add sender performance metrics
  - Add date range selector (last 7 days, 30 days, 90 days, custom)
  - Add export functionality (CSV, JSON)
  - Test analytics dashboard
  - _Requirements: 8.4, 8.5, 8.6_

- [x] 32. Create bounce and complaint management page
  - Create `src/app/(admin)/admin/emails/suppressions/page.tsx`
  - Create suppression list component with filters
  - Add bounce type indicators (hard bounce, soft bounce, complaint)
  - Add manual suppression addition form
  - Add suppression removal functionality with confirmation
  - Add complaint viewing with details
  - Add bulk actions (remove multiple suppressions)
  - Test suppression management
  - _Requirements: 8.7, 8.8_

- [x] 33. Checkpoint - Verify logs and analytics UI
  - Test email logs with different filters
  - Verify analytics calculations are correct
  - Test suppression management
  - Test export functionality
  - Ensure UI is responsive and accessible
  - Ask user if any questions arise

### Phase 9: Admin UI - Main Dashboard

- [x] 34. Create email management main dashboard
  - Create `src/app/(admin)/admin/emails/page.tsx`
  - Add quick stats cards (emails sent today, queue size, delivery rate, bounce rate)
  - Add recent email logs widget (last 10 emails)
  - Add queue status widget (pending, processing, failed)
  - Add provider status indicator (active provider, connection status)
  - Add quick actions (send test email, view templates, view logs)
  - Add navigation cards to sub-pages (providers, senders, templates, logs, analytics)
  - Test dashboard functionality
  - _Requirements: 9.1, 9.2_

- [x] 35. Create queue monitoring component
  - Create queue status component for dashboard
  - Add pending emails count with breakdown by priority
  - Add failed emails count with retry status
  - Add scheduled emails list (next 10 scheduled)
  - Add queue health indicators (processing rate, error rate)
  - Add manual queue processing trigger button
  - Test queue monitoring functionality
  - _Requirements: 9.3, 9.4_

- [x] 36. Add email management to admin navigation
  - Update admin navigation to include "Emails" menu item
  - Add sub-menu items (Dashboard, Providers, Senders, Templates, Logs, Analytics, Suppressions)
  - Add email notification badge for failed emails
  - Test navigation functionality
  - _Requirements: 9.5_

- [x] 37. Checkpoint - Verify main dashboard
  - Test all dashboard widgets
  - Verify queue monitoring works correctly
  - Test navigation to all sub-pages
  - Ensure UI is responsive and accessible
  - Ask user if any questions arise

### Phase 10: API Routes & Integration

- [x] 38. Create email API routes
  - Create `src/app/api/emails/send/route.ts` for POST (send immediate email)
  - Create `src/app/api/emails/schedule/route.ts` for POST (schedule email)
  - Create `src/app/api/emails/templates/route.ts` for GET (list) and POST (create)
  - Create `src/app/api/emails/templates/[id]/route.ts` for GET, PUT, DELETE
  - Create `src/app/api/emails/logs/route.ts` for GET (list with filters)
  - Create `src/app/api/emails/analytics/route.ts` for GET (analytics data)
  - Add authentication middleware (admin only)
  - Add rate limiting (100 requests per minute per user)
  - Add request validation with Zod schemas
  - Write API integration tests
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 39. Update existing email triggers
  - Update purchase confirmation email trigger in payment service
  - Update sale notification email trigger in payment service
  - Update payout notification email trigger in payout service
  - Update dispute alert email trigger in webhook service
  - Update refund confirmation email trigger in payment service
  - Update gallery expiration notification in edge function
  - Test all email triggers end-to-end
  - _Requirements: 10.4, 10.5_

- [x] 40. Checkpoint - Verify API and integration
  - Test all API routes with different scenarios
  - Verify existing email triggers use new system
  - Test rate limiting and authentication
  - Ensure all integration tests pass
  - Ask user if any questions arise

### Phase 11: Testing & Documentation

- [x] 41. Write comprehensive integration tests
  - Write tests for complete email sending flow (queue → process → send → webhook)
  - Write tests for queue processing with retries
  - Write tests for webhook handling (Resend and SES)
  - Write tests for template rendering with variables
  - Write tests for analytics tracking and calculations
  - Write tests for provider switching
  - Run full test suite and ensure 100% pass rate
  - _Requirements: 11.1, 11.2_

- [x] 42. Create comprehensive documentation
  - Write admin user guide for email management (`docs/user-guides/email-management.md`)
  - Write developer guide for email integration (`docs/development/email-integration.md`)
  - Write Resend setup guide (`docs/deployment/resend-setup.md`)
  - Write AWS SES setup guide (`docs/deployment/aws-ses-setup.md`)
  - Write template creation guide (`docs/user-guides/email-templates.md`)
  - Write troubleshooting guide (`docs/development/email-troubleshooting.md`)
  - Create API documentation with examples
  - Add inline code documentation (JSDoc comments)
  - _Requirements: 11.3, 11.4_

- [x] 43. Optimize system performance
  - Add database query optimization (analyze slow queries)
  - Add caching for templates (Redis or in-memory)
  - Add caching for provider configuration
  - Optimize queue processing batch size (benchmark different sizes)
  - Add connection pooling for database
  - Run performance tests (load testing with k6)
  - Optimize slow queries with better indexes
  - _Requirements: 11.5, 11.6_

- [x] 44. Checkpoint - Verify testing and documentation
  - Ensure all tests pass
  - Review documentation for completeness
  - Verify performance optimizations
  - Ask user if any questions arise

### Phase 12: Deployment & Monitoring

- [x] 45. Configure environment variables
  - Add `RESEND_API_KEY` to environment
  - Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
  - Add `AWS_REGION` configuration
  - Add `EMAIL_PROVIDER_DEFAULT` configuration (resend or ses)
  - Add `EMAIL_QUEUE_BATCH_SIZE` configuration (default: 10)
  - Add `EMAIL_RETRY_MAX_ATTEMPTS` configuration (default: 5)
  - Update `.env.example` file with all email variables
  - Document all environment variables in `docs/ENVIRONMENT-VARIABLES.md`
  - _Requirements: 12.1, 12.2_

- [x] 46. Deploy to production
  - Run database migrations on production database
  - Deploy edge functions to Supabase production
  - Configure webhooks in Resend dashboard (production URL)
  - Configure SNS topic for AWS SES events (production)
  - Test email sending in production with test emails
  - Monitor for errors in first 24 hours
  - Set up alerting for critical failures
  - _Requirements: 12.3, 12.4_

- [x] 47. Set up monitoring and alerting
  - Add email queue monitoring (alert if queue size > 1000)
  - Add failed email alerting (alert if failure rate > 5%)
  - Add bounce rate monitoring (alert if bounce rate > 10%)
  - Add provider health checks (ping every 5 minutes)
  - Add performance monitoring (track email sending latency)
  - Set up error tracking with Sentry
  - Create monitoring dashboard in admin UI
  - _Requirements: 12.5, 12.6_

- [x] 48. Final checkpoint - Production verification
  - Verify all emails are being sent successfully
  - Check queue processing is working correctly
  - Verify webhooks are being received
  - Check analytics are being tracked
  - Monitor system performance
  - Ensure no critical errors
  - Ask user for final approval

## Notes

- All tasks reference specific requirements for traceability
- Checkpoints allow for incremental validation and user feedback
- Each phase builds upon the previous phase
- Testing is integrated throughout the implementation
- Documentation is created alongside implementation
- Performance optimization is done before deployment
- Monitoring is set up immediately after deployment

## Summary

- **Total Tasks**: 48
- **Total Subtasks**: 250+
- **Estimated Duration**: 8-10 weeks
- **Phases**: 12 (Foundation, Provider Abstraction, Template Engine, Queue Processing, Webhooks & Analytics, Provider UI, Template UI, Logs & Analytics UI, Main Dashboard, API Integration, Testing & Documentation, Deployment)
