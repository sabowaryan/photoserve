# Configuration du Cron Job pour le Traitement des Emails

## ✅ Fonction Déployée

La fonction `process-email-queue` a été déployée avec succès sur Supabase!

**URL:** https://cccykchoteodrvabxaqq.supabase.co/functions/v1/process-email-queue

## 📋 Configuration du Cron Job

### Option 1: Via le Dashboard Supabase (Recommandé)

1. Allez sur: https://supabase.com/dashboard/project/cccykchoteodrvabxaqq/functions
2. Cliquez sur la fonction `process-email-queue`
3. Dans l'onglet "Settings" ou "Cron Jobs"
4. Ajoutez un nouveau cron job:
   - **Schedule:** `* * * * *` (toutes les minutes)
   - **Payload:** `{"batchSize": 10}`

### Option 2: Via GitHub Actions (Alternative)

Créez `.github/workflows/process-email-queue.yml`:

```yaml
name: Process Email Queue

on:
  schedule:
    - cron: '* * * * *'  # Toutes les minutes
  workflow_dispatch:  # Permet déclenchement manuel

jobs:
  process-queue:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            https://cccykchoteodrvabxaqq.supabase.co/functions/v1/process-email-queue \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"batchSize": 10}'
```

### Option 3: Via un Service Externe

Utilisez un service comme:
- **cron-job.org** (gratuit)
- **EasyCron** (gratuit jusqu'à 100 jobs)
- **Vercel Cron** (si vous déployez sur Vercel)

Configuration:
- **URL:** https://cccykchoteodrvabxaqq.supabase.co/functions/v1/process-email-queue
- **Méthode:** POST
- **Headers:**
  - `Authorization: Bearer [VOTRE_SUPABASE_ANON_KEY]`
  - `Content-Type: application/json`
- **Body:** `{"batchSize": 10}`
- **Fréquence:** Toutes les minutes

## 🧪 Test Manuel

Pour tester manuellement la fonction:

```powershell
.\test-edge-function.ps1
```

Ou via curl:

```bash
curl -X POST \
  https://cccykchoteodrvabxaqq.supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer [VOTRE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'
```

## 📊 Monitoring

Pour vérifier que les emails sont traités:

1. **Logs de la fonction:**
   - Dashboard Supabase > Functions > process-email-queue > Logs

2. **Queue status:**
   ```powershell
   .\check-email-system.ps1
   ```

3. **Email logs:**
   - Dashboard Admin > Emails > Logs

## ⚙️ Configuration

### Variables d'Environnement Requises

La fonction Edge utilise ces variables (configurées dans Supabase):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_PROVIDER_ENCRYPTION_KEY`

### Batch Size

Par défaut: 10 emails par exécution

Pour modifier, changez le payload du cron:
```json
{"batchSize": 20}
```

## 🔧 Dépannage

### La fonction ne traite pas les emails

1. Vérifiez que le provider Resend est actif:
   ```powershell
   npx tsx scripts/init-resend-provider.ts
   ```

2. Vérifiez les logs de la fonction dans le Dashboard

3. Testez manuellement:
   ```powershell
   .\test-edge-function.ps1
   ```

### Emails en queue mais pas envoyés

1. Vérifiez que le cron job est actif
2. Vérifiez les credentials Resend
3. Vérifiez les logs d'erreur dans `email_logs`

## 📝 Notes

- La fonction s'exécute de manière asynchrone
- Les emails sont traités par ordre de priorité (high > normal > low)
- Les emails échoués sont automatiquement réessayés avec exponential backoff
- Maximum 5 tentatives par email
