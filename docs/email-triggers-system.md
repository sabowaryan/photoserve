# Email Triggers System

## Overview

Le système d'email triggers automatise l'envoi d'emails basés sur des événements utilisateur et des délais temporels. Il supporte les emails transactionnels et marketing avec gestion des désabonnements.

## Requirements

- Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8

## Architecture

### Components

1. **EmailTriggersService** (`src/lib/services/email-triggers.service.ts`)
   - Service principal pour gérer les triggers d'emails
   - Gère les événements signup, première galerie, upgrade
   - Planifie les emails temporels (D+1, D+3, D+7, D+14)

2. **Email Templates** (Base de données)
   - Templates stockés dans `email_templates` table
   - Support du versioning via `template_versions`
   - Variables dynamiques avec système de templating simple

3. **API Routes**
   - `/api/email/triggers/signup` - Déclenche les emails de signup
   - `/api/email/triggers/first-gallery` - Email de félicitations première galerie
   - `/api/email/triggers/upgrade` - Email de confirmation upgrade
   - `/api/email/unsubscribe` - Gestion des désabonnements

4. **Unsubscribe Page** (`src/app/(marketing)/unsubscribe/page.tsx`)
   - Page de désabonnement avec formulaire
   - Collecte optionnelle de feedback

## Email Templates

### 1. Welcome Email (Transactional)
- **Slug**: `welcome-email`
- **Trigger**: Immédiatement après signup
- **Type**: Transactional
- **Variables**: `firstName`, `email`

### 2. First Gallery Reminder (D+1) (Marketing)
- **Slug**: `first-gallery-reminder-d1`
- **Trigger**: 24h après signup si pas de galerie créée
- **Type**: Marketing
- **Variables**: `firstName`, `email`

### 3. Help Email (D+3) (Marketing)
- **Slug**: `help-email-d3`
- **Trigger**: 3 jours après signup si pas de galerie créée
- **Type**: Marketing
- **Variables**: `firstName`, `email`

### 4. Upgrade Email (D+7) (Marketing)
- **Slug**: `upgrade-email-d7`
- **Trigger**: 7 jours après signup
- **Type**: Marketing
- **Variables**: `firstName`, `email`

### 5. Upgrade Email (D+14) (Marketing)
- **Slug**: `upgrade-email-d14`
- **Trigger**: 14 jours après signup
- **Type**: Marketing
- **Variables**: `firstName`, `email`

### 6. First Gallery Congratulations (Transactional)
- **Slug**: `first-gallery-congrats`
- **Trigger**: Immédiatement après création première galerie
- **Type**: Transactional
- **Variables**: `firstName`, `email`

### 7. Upgrade Confirmation (Transactional)
- **Slug**: `upgrade-confirmation`
- **Trigger**: Immédiatement après upgrade
- **Type**: Transactional
- **Variables**: `firstName`, `email`, `planName`, `price`

## Setup

### 1. Configure Resend

Ensure `RESEND_API_KEY` is set in `.env`:

```bash
RESEND_API_KEY=re_your_resend_api_key
```

### 2. Run Database Migration

```bash
# Apply the email templates seed migration
supabase db push
```

Or manually run:
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20240207000000_seed_email_templates.sql
```

### 3. Verify Templates

Check that templates are created:
```sql
SELECT slug, name, type, is_active FROM email_templates;
```

## Usage

### Trigger Signup Emails

```typescript
import { useEmailTriggers } from '@/hooks/use-email-triggers';

const { triggerSignupEmails } = useEmailTriggers();

// After user signup
await triggerSignupEmails(userId);
```

This will:
- Send welcome email immediately
- Schedule first gallery reminder for D+1
- Schedule help email for D+3
- Schedule upgrade emails for D+7 and D+14

### Trigger First Gallery Email

```typescript
const { triggerFirstGalleryEmail } = useEmailTriggers();

// After user creates first gallery
await triggerFirstGalleryEmail(userId);
```

### Trigger Upgrade Email

```typescript
const { triggerUpgradeEmail } = useEmailTriggers();

// After user upgrades
await triggerUpgradeEmail(userId, 'Premium', 9.99);
```

## Unsubscribe Management

### Check Unsubscribe Status

```typescript
const response = await fetch(`/api/email/unsubscribe?email=${email}`);
const { isUnsubscribed } = await response.json();
```

### Unsubscribe User

```typescript
const response = await fetch('/api/email/unsubscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    reason: 'Too many emails'
  })
});
```

### Unsubscribe Link in Emails

All marketing emails include an unsubscribe link:
```
{{APP_URL}}/unsubscribe?email={{email}}
```

## Email Queue Processing

Emails are queued and processed by the `process-email-queue` edge function:
- Runs every 1 minute via cron
- Processes 10 emails per batch
- Automatic retry with exponential backoff
- Respects unsubscribe list for marketing emails

## Testing

### Test Welcome Email

```bash
curl -X POST http://localhost:3000/api/email/triggers/signup \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'
```

### Test Unsubscribe

```bash
curl -X POST http://localhost:3000/api/email/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "reason": "Testing"}'
```

## Monitoring

### Check Email Queue

```sql
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest
FROM email_queue
GROUP BY status;
```

### Check Unsubscribes

```sql
SELECT 
  COUNT(*) as total_unsubscribes,
  COUNT(CASE WHEN unsubscribed_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days
FROM email_unsubscribes;
```

### Check Email Logs

```sql
SELECT 
  status,
  COUNT(*) as count
FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

## Troubleshooting

### Emails Not Sending

1. Check Resend API key is configured
2. Verify email provider is active:
   ```sql
   SELECT * FROM email_providers WHERE is_active = true;
   ```
3. Check email queue for errors:
   ```sql
   SELECT * FROM email_queue WHERE status = 'failed' ORDER BY updated_at DESC LIMIT 10;
   ```

### Scheduled Emails Not Triggering

1. Verify cron job is running (check Supabase dashboard)
2. Check scheduled emails:
   ```sql
   SELECT * FROM email_queue 
   WHERE status = 'pending' 
   AND scheduled_at IS NOT NULL 
   ORDER BY scheduled_at;
   ```

### User Not Receiving Marketing Emails

1. Check if user is unsubscribed:
   ```sql
   SELECT * FROM email_unsubscribes WHERE email = 'user@example.com';
   ```
2. Check if email is suppressed:
   ```sql
   SELECT * FROM email_suppressions WHERE email = 'user@example.com';
   ```

## Best Practices

1. **Always use transactional type for critical emails** (welcome, confirmation, etc.)
2. **Respect unsubscribe preferences** - marketing emails check unsubscribe list
3. **Include unsubscribe link in all marketing emails**
4. **Monitor email metrics** - track open rates, click rates, unsubscribes
5. **Test templates before deploying** - use test email addresses
6. **Keep templates in database** - allows easy updates without code changes
7. **Use versioning** - track template changes over time

## Future Enhancements

- [ ] A/B testing for email templates
- [ ] Email analytics dashboard
- [ ] Personalized send times based on user behavior
- [ ] Dynamic content based on user persona
- [ ] Email preference center (frequency, types)
- [ ] Re-engagement campaigns for inactive users
