# Configuration du Cron Job Supabase

## ✅ Système Fonctionnel

Votre système d'emails fonctionne parfaitement! L'email a été:
- ✅ Traité par la queue
- ✅ Envoyé via Resend
- ✅ Reçu dans votre boîte mail

Il ne reste plus qu'à automatiser le traitement avec un cron job.

---

## Option 1: Cron Job Supabase (Recommandé)

### Étapes:

1. **Allez sur le Dashboard Supabase**
   ```
   https://supabase.com/dashboard/project/cccykchoteodrvabxaqq
   ```

2. **Naviguez vers Database > Cron Jobs**
   - Dans le menu de gauche: Database
   - Puis: Cron Jobs (ou Extensions > pg_cron)

3. **Créez un nouveau Cron Job**
   
   **Nom:** `process-email-queue`
   
   **Schedule:** `* * * * *` (toutes les minutes)
   
   **SQL Command:**
   ```sql
   SELECT
     net.http_post(
       url := 'https://cccykchoteodrvabxaqq.supabase.co/functions/v1/process-email-queue',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
       ),
       body := jsonb_build_object('batchSize', 10)
     ) AS request_id;
   ```

4. **Activez le Cron Job**
   - Cochez "Active"
   - Sauvegardez

### Alternative SQL (si la première ne fonctionne pas):

```sql
-- Créer le cron job
SELECT cron.schedule(
  'process-email-queue',           -- nom du job
  '* * * * *',                     -- toutes les minutes
  $$
  SELECT
    net.http_post(
      url := 'https://cccykchoteodrvabxaqq.supabase.co/functions/v1/process-email-queue',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"batchSize": 10}'::jsonb
    );
  $$
);
```

### Vérifier le Cron Job:

```sql
-- Voir tous les cron jobs
SELECT * FROM cron.job;

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Supprimer le Cron Job (si nécessaire):

```sql
SELECT cron.unschedule('process-email-queue');
```

---

## Option 2: GitHub Actions (Alternative)

Si vous préférez utiliser GitHub Actions, créez ce fichier:

**`.github/workflows/process-email-queue.yml`:**

```yaml
name: Process Email Queue

on:
  schedule:
    # Toutes les minutes
    - cron: '* * * * *'
  
  # Permet le déclenchement manuel
  workflow_dispatch:

jobs:
  process-queue:
    runs-on: ubuntu-latest
    
    steps:
      - name: Process Email Queue
        run: |
          curl -X POST \
            https://cccykchoteodrvabxaqq.supabase.co/functions/v1/process-email-queue \
            -H "Content-Type: application/json" \
            -d '{"batchSize": 10}'
        
      - name: Log Result
        if: always()
        run: echo "Queue processing completed"
```

**Note:** GitHub Actions a une limite de fréquence minimale de 5 minutes pour les cron jobs gratuits.

---

## Option 3: Service Externe (cron-job.org)

### Étapes:

1. **Allez sur:** https://cron-job.org/en/

2. **Créez un compte gratuit**

3. **Créez un nouveau Cron Job:**
   - **Title:** Process PikSend Email Queue
   - **URL:** `https://cccykchoteodrvabxaqq.supabase.co/functions/v1/process-email-queue`
   - **Schedule:** Every 1 minute
   - **Request Method:** POST
   - **Request Body:**
     ```json
     {"batchSize": 10}
     ```
   - **Headers:**
     ```
     Content-Type: application/json
     ```

4. **Activez le job**

---

## Option 4: Vercel Cron (si déployé sur Vercel)

Si vous déployez sur Vercel, ajoutez dans `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-email-queue",
      "schedule": "* * * * *"
    }
  ]
}
```

Puis créez la route API:

**`src/app/api/cron/process-email-queue/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Vérifier le secret Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Appeler la fonction Edge
    const response = await fetch(
      'https://cccykchoteodrvabxaqq.supabase.co/functions/v1/process-email-queue',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 10 }),
      }
    );

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing queue:', error);
    return NextResponse.json(
      { error: 'Failed to process queue' },
      { status: 500 }
    );
  }
}
```

---

## Monitoring

### Vérifier que le Cron fonctionne:

1. **Logs Supabase:**
   ```
   https://supabase.com/dashboard/project/cccykchoteodrvabxaqq/functions/process-email-queue/logs
   ```

2. **Vérifier la queue:**
   ```powershell
   .\check-email-system.ps1
   ```

3. **Logs de la base de données:**
   ```sql
   -- Voir les emails traités récemment
   SELECT 
     id,
     to_address,
     subject,
     status,
     created_at,
     updated_at
   FROM email_queue
   WHERE updated_at > NOW() - INTERVAL '1 hour'
   ORDER BY updated_at DESC;
   ```

---

## Dépannage

### Le cron ne s'exécute pas:

1. **Vérifiez les logs:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue')
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

2. **Vérifiez que pg_cron est activé:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

3. **Testez manuellement:**
   ```powershell
   .\test-edge-function.ps1
   ```

### Erreurs dans les logs:

- Vérifiez que la fonction Edge est déployée
- Vérifiez les variables d'environnement dans Supabase
- Vérifiez que le provider Resend est actif

---

## Configuration Recommandée

Pour un système de production, je recommande:

1. **Supabase Cron** (Option 1) - Le plus simple et intégré
2. **Backup avec GitHub Actions** (Option 2) - En cas de problème avec Supabase
3. **Monitoring** - Configurez des alertes pour les échecs

---

## Fréquence du Cron

### Toutes les minutes (recommandé):
```
* * * * *
```

### Toutes les 5 minutes (si moins de charge):
```
*/5 * * * *
```

### Toutes les 10 minutes:
```
*/10 * * * *
```

---

## Notes Importantes

- ✅ La fonction Edge est déjà déployée
- ✅ Le système fonctionne parfaitement
- ✅ Les emails sont envoyés et reçus
- ⏳ Il ne reste qu'à configurer l'automatisation

Une fois le cron configuré, les emails seront traités automatiquement toutes les minutes! 🎉
