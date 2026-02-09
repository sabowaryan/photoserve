# Email Triggers Integration Examples

## Overview

Ce document fournit des exemples d'intégration des email triggers dans différentes parties de l'application.

## 1. Signup Flow Integration

### Dans le composant d'authentification

```typescript
// src/app/(auth)/auth/page.tsx ou votre composant signup

import { useEmailTriggers } from '@/hooks/use-email-triggers';

export function SignupForm() {
  const { triggerSignupEmails } = useEmailTriggers();
  
  const handleSignup = async (email: string, password: string) => {
    try {
      // 1. Create user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // 2. Trigger signup emails (welcome + scheduled follow-ups)
      if (data.user) {
        await triggerSignupEmails(data.user.id);
      }
      
      // 3. Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
    }
  };
  
  return (
    // Your signup form JSX
  );
}
```

### Avec Server Action

```typescript
// src/app/actions/auth.ts

'use server';

import { createClient } from '@/lib/supabase/server';
import { EmailTriggersService } from '@/lib/services/email-triggers.service';

export async function signupAction(email: string, password: string) {
  const supabase = await createClient();
  
  // Create user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    return { error: error.message };
  }
  
  // Trigger emails server-side
  if (data.user) {
    const emailTriggersService = new EmailTriggersService(supabase);
    await emailTriggersService.handleSignupEvent(data.user.id);
  }
  
  return { success: true };
}
```

## 2. First Gallery Creation Integration

### Dans le composant de création de galerie

```typescript
// src/app/(dashboard)/galleries/create/page.tsx

import { useEmailTriggers } from '@/hooks/use-email-triggers';
import { useUser } from '@/hooks/use-user';

export function CreateGalleryPage() {
  const { user } = useUser();
  const { triggerFirstGalleryEmail } = useEmailTriggers();
  
  const handleCreateGallery = async (galleryData: GalleryData) => {
    try {
      // 1. Create gallery
      const { data: gallery, error } = await supabase
        .from('galleries')
        .insert(galleryData)
        .select()
        .single();
      
      if (error) throw error;
      
      // 2. Check if this is the first gallery
      const { count } = await supabase
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      // 3. If first gallery, trigger congratulations email
      if (count === 1 && user) {
        await triggerFirstGalleryEmail(user.id);
      }
      
      // 4. Redirect to gallery
      router.push(`/galleries/${gallery.id}`);
    } catch (error) {
      console.error('Create gallery error:', error);
    }
  };
  
  return (
    // Your create gallery form JSX
  );
}
```

### Avec Database Trigger (Alternative)

```sql
-- Create a database function to trigger email
CREATE OR REPLACE FUNCTION trigger_first_gallery_email()
RETURNS TRIGGER AS $$
DECLARE
  gallery_count INTEGER;
BEGIN
  -- Count user's galleries
  SELECT COUNT(*) INTO gallery_count
  FROM galleries
  WHERE user_id = NEW.user_id;
  
  -- If this is the first gallery, insert into a queue table
  IF gallery_count = 1 THEN
    INSERT INTO email_trigger_queue (user_id, trigger_type, created_at)
    VALUES (NEW.user_id, 'first_gallery', NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_first_gallery_created
AFTER INSERT ON galleries
FOR EACH ROW
EXECUTE FUNCTION trigger_first_gallery_email();
```

## 3. Upgrade Flow Integration

### Dans le composant de checkout Stripe

```typescript
// src/app/(dashboard)/upgrade/page.tsx

import { useEmailTriggers } from '@/hooks/use-email-triggers';
import { useUser } from '@/hooks/use-user';

export function UpgradePage() {
  const { user } = useUser();
  const { triggerUpgradeEmail } = useEmailTriggers();
  
  const handleUpgrade = async (planId: string) => {
    try {
      // 1. Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      
      const { sessionUrl } = await response.json();
      
      // 2. Redirect to Stripe checkout
      window.location.href = sessionUrl;
      
      // Note: Email will be triggered by webhook after successful payment
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  };
  
  return (
    // Your upgrade page JSX
  );
}
```

### Dans le Stripe Webhook Handler

```typescript
// src/app/api/stripe/webhook/route.ts

import { EmailTriggersService } from '@/lib/services/email-triggers.service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  
  // Handle successful subscription
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Get user and plan details
    const userId = session.metadata?.userId;
    const planName = session.metadata?.planName;
    const price = session.amount_total ? session.amount_total / 100 : 0;
    
    if (userId && planName) {
      const supabase = await createClient();
      const emailTriggersService = new EmailTriggersService(supabase);
      
      // Trigger upgrade confirmation email
      await emailTriggersService.handleUpgradeEvent(userId, planName, price);
    }
  }
  
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

## 4. Unsubscribe Link in Email Footer

### Template avec lien de désabonnement

Tous les emails marketing doivent inclure un lien de désabonnement :

```html
<!-- Dans vos templates email -->
<p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
  <a href="{{APP_URL}}/unsubscribe?email={{email}}" 
     style="color: #6b7280; text-decoration: underline;">
    Se désabonner
  </a>
</p>
```

### Vérification avant envoi

```typescript
// Le service EmailTriggersService vérifie automatiquement
// le statut d'unsubscribe avant d'envoyer des emails marketing

const isUnsubscribed = await emailTriggersService.isUnsubscribed(email);
if (isUnsubscribed) {
  console.log('User is unsubscribed, skipping marketing email');
  return;
}
```

## 5. Testing Email Triggers

### Test en développement

```typescript
// Create a test script: scripts/test-email-triggers.ts

import { createClient } from '@supabase/supabase-js';
import { EmailTriggersService } from '../src/lib/services/email-triggers.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testWelcomeEmail() {
  const emailTriggersService = new EmailTriggersService(supabase);
  
  // Test with a real user ID from your database
  const testUserId = 'your-test-user-id';
  
  await emailTriggersService.handleSignupEvent(testUserId);
  
  console.log('Welcome email triggered! Check your email queue.');
}

testWelcomeEmail().catch(console.error);
```

### Test avec curl

```bash
# Test signup emails
curl -X POST http://localhost:3000/api/email/triggers/signup \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'

# Test first gallery email
curl -X POST http://localhost:3000/api/email/triggers/first-gallery \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'

# Test upgrade email
curl -X POST http://localhost:3000/api/email/triggers/upgrade \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id", "planName": "Premium", "price": 9.99}'
```

## 6. Monitoring and Analytics

### Track email events

```typescript
// src/lib/services/email-analytics.ts

export async function trackEmailEvent(
  emailId: string,
  event: 'sent' | 'opened' | 'clicked' | 'bounced' | 'complained'
) {
  await supabase
    .from('email_events')
    .insert({
      email_log_id: emailId,
      event_type: event,
      occurred_at: new Date().toISOString(),
    });
}
```

### Dashboard metrics

```typescript
// Get email metrics for dashboard
const { data: metrics } = await supabase
  .rpc('get_email_metrics', {
    start_date: '2024-01-01',
    end_date: '2024-12-31',
  });

console.log('Emails sent:', metrics.total_sent);
console.log('Open rate:', metrics.open_rate);
console.log('Click rate:', metrics.click_rate);
console.log('Unsubscribe rate:', metrics.unsubscribe_rate);
```

## Best Practices

1. **Always handle errors gracefully** - Email failures shouldn't break user flows
2. **Use async/await with try-catch** - Catch and log email errors
3. **Don't block user actions** - Trigger emails asynchronously
4. **Test with real email addresses** - Verify templates render correctly
5. **Monitor email queue** - Set up alerts for failed emails
6. **Respect user preferences** - Check unsubscribe status before sending
7. **Include unsubscribe links** - Required for marketing emails
8. **Track metrics** - Monitor open rates, click rates, unsubscribes

## Troubleshooting

### Email not received

1. Check email queue status
2. Verify Resend API key is configured
3. Check spam folder
4. Verify email address is correct
5. Check if user is unsubscribed or suppressed

### Scheduled emails not sending

1. Verify cron job is running
2. Check scheduled_at timestamp
3. Verify email queue processor is working
4. Check for errors in email_logs table

### Template variables not rendering

1. Verify variable names match template
2. Check that variables are passed correctly
3. Test template rendering with sample data
4. Check for typos in variable names
