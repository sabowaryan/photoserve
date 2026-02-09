# Email Management System Migration

## Overview

This migration creates a comprehensive email management infrastructure for the PikSend application, supporting multiple email providers (Resend and AWS SES), template management with versioning, email queue processing with retry logic, and detailed analytics tracking.

## Migration File

- **File**: `20260206120000_create_email_management_system.sql`
- **Date**: 2026-02-06
- **Requirements**: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7

## Tables Created

### 1. email_providers
Stores email service provider configurations (Resend, AWS SES).

**Columns**:
- `id` (UUID): Primary key
- `name` (VARCHAR): Provider name ('resend' or 'aws-ses')
- `is_active` (BOOLEAN): Whether this provider is currently active
- `config` (JSONB): Encrypted provider configuration (API keys, region, etc.)
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

**Features**:
- Only one provider can be active at a time (enforced by trigger)
- Configuration stored as encrypted JSONB
- Indexed on active status and name

### 2. sender_addresses
Manages verified sender email addresses.

**Columns**:
- `id` (UUID): Primary key
- `email` (VARCHAR): Sender email address (unique)
- `name` (VARCHAR): Display name for the sender
- `is_verified` (BOOLEAN): Whether the email/domain has been verified
- `is_default` (BOOLEAN): Default sender address for the system
- `domain_records` (JSONB): DKIM, SPF, and DMARC records
- `verified_at` (TIMESTAMPTZ): When the address was verified
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

**Features**:
- Email validation constraint
- Only one default sender allowed (enforced by trigger)
- Indexed on email, verified status, and default status

### 3. email_templates
Stores email templates (React Email and custom WYSIWYG).

**Columns**:
- `id` (UUID): Primary key
- `name` (VARCHAR): Human-readable template name
- `slug` (VARCHAR): URL-safe identifier (unique)
- `type` (VARCHAR): 'transactional' or 'marketing'
- `source` (VARCHAR): 'react-email' or 'custom'
- `subject` (VARCHAR): Email subject line (supports variables)
- `content` (JSONB): Template content
- `variables` (JSONB): Array of required variable names
- `active_version` (INTEGER): Currently active version number
- `is_active` (BOOLEAN): Whether template is active
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

**Features**:
- Supports both React Email and custom WYSIWYG templates
- Version tracking with active version pointer
- Indexed on slug, type, source, and active status

### 4. template_versions
Stores version history for email templates.

**Columns**:
- `id` (UUID): Primary key
- `template_id` (UUID): Foreign key to email_templates
- `version` (INTEGER): Version number (incremental)
- `subject` (VARCHAR): Email subject for this version
- `content` (JSONB): Template content for this version
- `variables` (JSONB): Required variables for this version
- `created_by` (UUID): Admin user who created this version
- `created_at` (TIMESTAMPTZ): When version was created

**Features**:
- Unique constraint on (template_id, version)
- Full version history preservation
- Indexed on template_id and version

### 5. email_queue
Queue for pending and scheduled emails.

**Columns**:
- `id` (UUID): Primary key
- `from_address` (VARCHAR): Sender email address
- `to_address` (VARCHAR): Recipient email address
- `cc_addresses`, `bcc_addresses` (TEXT[]): CC and BCC recipients
- `template_id` (UUID): Foreign key to email_templates
- `variables` (JSONB): Template variables for rendering
- `subject` (VARCHAR): Email subject
- `html_content` (TEXT): Rendered HTML content
- `text_content` (TEXT): Plain text version
- `priority` (VARCHAR): 'high', 'normal', or 'low'
- `type` (VARCHAR): 'transactional' or 'marketing'
- `status` (VARCHAR): 'pending', 'processing', 'sent', 'failed', 'cancelled'
- `scheduled_at` (TIMESTAMPTZ): When to send (null for immediate)
- `retry_count` (INTEGER): Number of retry attempts made
- `max_retries` (INTEGER): Maximum retry attempts allowed (default: 3)
- `last_error` (TEXT): Last error message
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

**Features**:
- Priority-based processing
- Scheduled email support
- Automatic retry logic with exponential backoff
- Indexed on status, priority, scheduled time, and template

### 6. email_logs
Comprehensive log of all email sending attempts.

**Columns**:
- `id` (UUID): Primary key
- `queue_id` (UUID): Foreign key to email_queue
- `provider` (VARCHAR): 'resend' or 'aws-ses'
- `provider_message_id` (VARCHAR): Unique message ID from provider
- `from_address`, `to_address` (VARCHAR): Sender and recipient
- `subject` (VARCHAR): Email subject
- `template_id` (UUID): Foreign key to email_templates
- `status` (VARCHAR): Current email status
- `sent_at`, `delivered_at`, `opened_at`, `clicked_at`, `bounced_at`, `complained_at`, `failed_at` (TIMESTAMPTZ): Event timestamps
- `error_message` (TEXT): Error details if failed
- `metadata` (JSONB): Additional data (tags, custom headers, etc.)
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps

**Features**:
- Complete audit trail for all emails
- Tracks all delivery events
- Indexed on queue_id, provider_message_id, status, template, recipient, and timestamps
- GIN index on metadata for fast JSON queries

### 7. email_events
Detailed tracking of email events (opens, clicks, etc.).

**Columns**:
- `id` (UUID): Primary key
- `log_id` (UUID): Foreign key to email_logs
- `event_type` (VARCHAR): 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed'
- `event_data` (JSONB): Additional event data (clicked URL, bounce reason, etc.)
- `ip_address` (INET): IP address of the recipient
- `user_agent` (TEXT): User agent string
- `created_at` (TIMESTAMPTZ): When event occurred

**Features**:
- Granular event tracking for analytics
- Automatically updates email_logs via trigger
- Indexed on log_id, event_type, and timestamp
- GIN index on event_data for fast JSON queries

### 8. email_suppressions
Tracks bounced and complained email addresses.

**Columns**:
- `id` (UUID): Primary key
- `email` (VARCHAR): Suppressed email address (unique)
- `reason` (VARCHAR): 'bounce' or 'complaint'
- `bounce_type` (VARCHAR): 'hard' or 'soft' (null for complaints)
- `count` (INTEGER): Number of times this email has bounced/complained
- `first_occurred_at`, `last_occurred_at` (TIMESTAMPTZ): First and last occurrence
- `created_at` (TIMESTAMPTZ): When suppression was created

**Features**:
- Prevents sending to problematic addresses
- Tracks bounce/complaint frequency
- Indexed on email, reason, bounce_type, and last occurrence

### 9. email_unsubscribes
Manages unsubscribes from marketing emails.

**Columns**:
- `id` (UUID): Primary key
- `email` (VARCHAR): Unsubscribed email address (unique)
- `reason` (TEXT): Optional reason for unsubscribing
- `unsubscribed_at` (TIMESTAMPTZ): When unsubscribe occurred
- `created_at` (TIMESTAMPTZ): When record was created

**Features**:
- Public insert policy for unsubscribe links
- Admin-only view/management
- Indexed on email and unsubscribe timestamp

## Indexes

### Performance Indexes

All tables include strategic indexes for optimal query performance:

1. **email_queue**: Status, priority, scheduled time, template, recipient, creation time
2. **email_logs**: Queue ID, provider message ID, status, template, recipient, timestamps
3. **email_events**: Log ID, event type, timestamp
4. **email_suppressions**: Email, reason, bounce type, last occurrence
5. **email_unsubscribes**: Email, unsubscribe timestamp

### GIN Indexes

JSON columns use GIN indexes for fast queries:
- `email_logs.metadata`
- `email_events.event_data`

## Row Level Security (RLS)

All tables have RLS enabled with admin-only access policies:

- **Admin users** (identified by `profiles.is_admin = true`) have full access to all tables
- **Exception**: `email_unsubscribes` allows public INSERT for unsubscribe functionality

## Triggers and Functions

### 1. update_updated_at_column()
Automatically updates the `updated_at` timestamp on row updates.

**Applied to**:
- email_providers
- sender_addresses
- email_templates
- email_queue
- email_logs

### 2. ensure_single_active_provider()
Ensures only one email provider is active at a time.

**Applied to**: email_providers

### 3. ensure_single_default_sender()
Ensures only one sender address is marked as default.

**Applied to**: sender_addresses

### 4. update_email_log_from_event()
Automatically updates email_logs when new events are inserted into email_events.

**Applied to**: email_events

## Testing the Migration

### 1. Run the Migration

```bash
# Using Supabase CLI
supabase db reset

# Or apply specific migration
supabase migration up
```

### 2. Verify Tables

```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'email_%'
ORDER BY table_name;

-- Verify indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%'
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%'
ORDER BY tablename, policyname;
```

### 3. Test Constraints

```sql
-- Test provider constraint (should fail with invalid provider)
INSERT INTO email_providers (name, config) 
VALUES ('invalid-provider', '{}');

-- Test email validation (should fail with invalid email)
INSERT INTO sender_addresses (email) 
VALUES ('invalid-email');

-- Test single active provider (should deactivate others)
INSERT INTO email_providers (name, is_active, config) 
VALUES ('resend', true, '{"apiKey": "test"}');
INSERT INTO email_providers (name, is_active, config) 
VALUES ('aws-ses', true, '{"region": "us-east-1"}');

-- Verify only one is active
SELECT name, is_active FROM email_providers;
```

### 4. Test RLS Policies

```sql
-- As non-admin user (should return no rows)
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'non-admin-user-id';
SELECT * FROM email_providers;

-- As admin user (should return all rows)
SET request.jwt.claims.sub TO 'admin-user-id';
SELECT * FROM email_providers;
```

## Integration with Application

### Environment Variables Required

```env
# Email Provider Configuration
RESEND_API_KEY=your_resend_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Email System Configuration
EMAIL_PROVIDER_DEFAULT=resend
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_RETRY_MAX_ATTEMPTS=3
```

### Next Steps

After running this migration:

1. **Install Dependencies** (Task 2):
   - `resend` SDK
   - `@aws-sdk/client-sesv2`
   - `react-email` and `@react-email/components`
   - Email editor library
   - `juice` for CSS inlining
   - `html-to-text` for plain text conversion

2. **Create Provider Adapters** (Tasks 4-6):
   - Implement Resend provider
   - Implement AWS SES provider
   - Create provider factory

3. **Create Services** (Tasks 7-9):
   - Email provider service
   - Sender address repository
   - Template engine

4. **Create Queue Processing** (Tasks 14-16):
   - Queue manager
   - Email sending service
   - Edge function for queue processing

5. **Create Admin UI** (Tasks 22-37):
   - Provider configuration page
   - Sender management page
   - Template editor
   - Email logs and analytics

## Rollback

If you need to rollback this migration:

```sql
-- Drop all tables (in reverse order of dependencies)
DROP TABLE IF EXISTS public.email_unsubscribes CASCADE;
DROP TABLE IF EXISTS public.email_suppressions CASCADE;
DROP TABLE IF EXISTS public.email_events CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.email_queue CASCADE;
DROP TABLE IF EXISTS public.template_versions CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.sender_addresses CASCADE;
DROP TABLE IF EXISTS public.email_providers CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_email_log_from_event() CASCADE;
DROP FUNCTION IF EXISTS ensure_single_default_sender() CASCADE;
DROP FUNCTION IF EXISTS ensure_single_active_provider() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## Performance Considerations

1. **Indexes**: All frequently queried columns are indexed
2. **Partitioning**: Consider partitioning `email_logs` and `email_events` by date for large volumes
3. **Archival**: Implement archival strategy for logs older than 90 days
4. **Connection Pooling**: Use connection pooling for queue processing
5. **Batch Processing**: Process emails in batches (default: 10 per run)

## Security Considerations

1. **Encrypted Configuration**: Provider API keys stored in encrypted JSONB
2. **RLS Policies**: Admin-only access to all management tables
3. **Email Validation**: Regex validation on all email addresses
4. **Rate Limiting**: Implement rate limiting on API routes
5. **Webhook Verification**: Always verify webhook signatures

## Monitoring

Key metrics to monitor:

1. **Queue Depth**: Number of pending emails
2. **Processing Rate**: Emails processed per minute
3. **Failure Rate**: Percentage of failed emails
4. **Bounce Rate**: Percentage of bounced emails
5. **Delivery Rate**: Percentage of successfully delivered emails
6. **Open Rate**: Percentage of opened emails
7. **Click Rate**: Percentage of clicked emails

## Support

For issues or questions:
- Check the main design document: `.kiro/specs/email-management-system/design.md`
- Review requirements: `.kiro/specs/email-management-system/requirements.md`
- See implementation tasks: `.kiro/specs/email-management-system/tasks.md`
