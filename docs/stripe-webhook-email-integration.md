# Stripe Webhook Email Integration

## Overview

Ce document explique comment intégrer l'email de confirmation d'upgrade dans le webhook Stripe.

## Modification Required

Dans le fichier `supabase/functions/stripe-webhook/index.ts`, ajouter l'envoi d'email dans la fonction `updateProfileFromSubscription`.

### Étape 1 : Ajouter l'import

Au début du fichier, après les autres imports :

```typescript
// Add this import at the top of the file
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
```

### Étape 2 : Modifier la fonction `updateProfileFromSubscription`

Ajouter le code suivant à la fin de la fonction `updateProfileFromSubscription`, juste après la mise à jour du profil :

```typescript
async function updateProfileFromSubscription(
  supabase: any,
  email: string,
  customerId: string,
  subscription: Stripe.Subscription
) {
  // ... existing code ...

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", profile.id);

  if (updateError) {
    logStep("Error updating profile", { error: updateError });
  } else {
    logStep("Profile updated successfully", { userId: profile.id, planName });
    
    // NEW CODE: Send upgrade confirmation email
    if (isActive && planName && planName !== "free") {
      try {
        // Get plan price
        const price = subscription.items.data[0]?.price?.unit_amount 
          ? subscription.items.data[0].price.unit_amount / 100 
          : 0;
        
        // Trigger upgrade email via API
        const appUrl = Deno.env.get('APP_URL') || 'https://piksend.com';
        const response = await fetch(`${appUrl}/api/email/triggers/upgrade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: profile.id,
            planName: planName.charAt(0).toUpperCase() + planName.slice(1),
            price,
          }),
        });
        
        if (response.ok) {
          logStep("Upgrade email triggered", { userId: profile.id, planName });
        } else {
          logStep("Failed to trigger upgrade email", { 
            userId: profile.id, 
            status: response.status 
          });
        }
      } catch (emailError) {
        // Log error but don't fail the webhook
        logStep("Error triggering upgrade email", { 
          error: emailError instanceof Error ? emailError.message : 'Unknown error' 
        });
      }
    }
  }
}
```

### Étape 3 : Ajouter la variable d'environnement

Dans le fichier `.env` de votre projet Supabase, ajouter :

```bash
APP_URL=https://piksend.com  # ou votre URL de production
```

Pour le développement local :

```bash
APP_URL=http://localhost:3000
```

## Alternative : Utiliser directement le service d'email

Si vous préférez appeler directement le service d'email depuis l'edge function (sans passer par l'API), vous pouvez :

### Option 2 : Import direct du service

```typescript
// At the top of the file
import { EmailTriggersService } from '../../src/lib/services/email-triggers.service.ts';

// In updateProfileFromSubscription function, after profile update:
if (isActive && planName && planName !== "free") {
  try {
    const price = subscription.items.data[0]?.price?.unit_amount 
      ? subscription.items.data[0].price.unit_amount / 100 
      : 0;
    
    const emailTriggersService = new EmailTriggersService(supabase);
    await emailTriggersService.handleUpgradeEvent(
      profile.id,
      planName.charAt(0).toUpperCase() + planName.slice(1),
      price
    );
    
    logStep("Upgrade email sent", { userId: profile.id, planName });
  } catch (emailError) {
    logStep("Error sending upgrade email", { 
      error: emailError instanceof Error ? emailError.message : 'Unknown error' 
    });
  }
}
```

## Testing

### Test en local

1. Démarrer le serveur local :
   ```bash
   npm run dev
   ```

2. Utiliser Stripe CLI pour tester le webhook :
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

3. Créer un test de checkout :
   ```bash
   stripe trigger checkout.session.completed
   ```

4. Vérifier les logs pour confirmer que l'email a été envoyé

### Test en production

1. Créer un abonnement test via l'interface
2. Vérifier dans les logs Supabase que l'email a été déclenché
3. Vérifier dans la table `email_queue` que l'email est en attente
4. Vérifier dans la table `email_logs` que l'email a été envoyé

## Troubleshooting

### L'email n'est pas envoyé

1. Vérifier que la variable `APP_URL` est correctement configurée
2. Vérifier les logs de l'edge function
3. Vérifier que l'API route `/api/email/triggers/upgrade` est accessible
4. Vérifier que le template `upgrade-confirmation` existe dans la base de données

### L'email est envoyé plusieurs fois

1. Vérifier que le webhook n'est pas appelé plusieurs fois (idempotence)
2. Vérifier les logs de Stripe pour voir si l'événement est dupliqué
3. Ajouter une vérification pour éviter les doublons :

```typescript
// Check if email was already sent for this subscription
const { data: existingLog } = await supabase
  .from('email_logs')
  .select('id')
  .eq('metadata->>subscriptionId', subscription.id)
  .eq('template_id', 'upgrade-confirmation')
  .single();

if (existingLog) {
  logStep("Upgrade email already sent", { subscriptionId: subscription.id });
  return;
}
```

## Monitoring

### Vérifier les emails envoyés

```sql
-- Emails d'upgrade envoyés aujourd'hui
SELECT 
  el.id,
  el.to_address,
  el.status,
  el.created_at,
  el.metadata->>'planName' as plan_name,
  el.metadata->>'price' as price
FROM email_logs el
WHERE el.template_id = (
  SELECT id FROM email_templates WHERE slug = 'upgrade-confirmation'
)
AND el.created_at > CURRENT_DATE
ORDER BY el.created_at DESC;
```

### Vérifier les erreurs

```sql
-- Emails d'upgrade en erreur
SELECT 
  el.id,
  el.to_address,
  el.error_message,
  el.created_at
FROM email_logs el
WHERE el.template_id = (
  SELECT id FROM email_templates WHERE slug = 'upgrade-confirmation'
)
AND el.status = 'failed'
ORDER BY el.created_at DESC
LIMIT 10;
```
