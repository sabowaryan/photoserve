# Configuration des Variables d'Environnement Supabase

## ❌ Problème Identifié

L'erreur dans les logs:
```
[EMAIL-QUEUE] Email failed, scheduled retry - {"error":"Resend API key not configured"}
```

La fonction Edge n'a pas accès à `RESEND_API_KEY`.

---

## ✅ Solution: Configurer les Secrets Supabase

### Méthode 1: Via le Dashboard (Recommandé)

1. **Allez sur:**
   ```
   https://supabase.com/dashboard/project/cccykchoteodrvabxaqq/settings/functions
   ```

2. **Ajoutez les secrets suivants:**

   **RESEND_API_KEY**
   ```
   Votre clé API Resend (commence par re_)
   ```

   **EMAIL_PROVIDER_ENCRYPTION_KEY**
   ```
   Votre clé de chiffrement (64 caractères hex)
   ```

3. **Sauvegardez**

4. **Redéployez la fonction:**
   ```powershell
   npx supabase functions deploy process-email-queue
   ```

---

### Méthode 2: Via CLI

```powershell
# Définir RESEND_API_KEY
npx supabase secrets set RESEND_API_KEY=re_votre_cle_ici

# Définir EMAIL_PROVIDER_ENCRYPTION_KEY
npx supabase secrets set EMAIL_PROVIDER_ENCRYPTION_KEY=votre_cle_64_caracteres

# Vérifier les secrets
npx supabase secrets list

# Redéployer la fonction
npx supabase functions deploy process-email-queue
```

---

## 📋 Liste Complète des Secrets Requis

### Obligatoires:

1. **RESEND_API_KEY**
   - Votre clé API Resend
   - Format: `re_xxxxx...`
   - Trouvez-la sur: https://resend.com/api-keys

2. **SUPABASE_URL**
   - URL de votre projet Supabase
   - Format: `https://cccykchoteodrvabxaqq.supabase.co`
   - Déjà configuré automatiquement

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Clé service role de Supabase
   - Trouvez-la sur: https://supabase.com/dashboard/project/cccykchoteodrvabxaqq/settings/api
   - Déjà configuré automatiquement

### Optionnels (mais recommandés):

4. **EMAIL_PROVIDER_ENCRYPTION_KEY**
   - Clé pour déchiffrer la config du provider
   - Format: 64 caractères hexadécimaux
   - Générez avec: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 🔧 Script PowerShell pour Configuration Rapide

Créez un fichier `setup-supabase-secrets.ps1`:

```powershell
# Setup Supabase Secrets

Write-Host "Configuration des secrets Supabase..." -ForegroundColor Cyan
Write-Host ""

# Lire les valeurs depuis .env
$envContent = Get-Content .env -Raw
$resendKey = ($envContent | Select-String -Pattern 'RESEND_API_KEY=(.+)').Matches.Groups[1].Value.Trim()
$encryptionKey = ($envContent | Select-String -Pattern 'EMAIL_PROVIDER_ENCRYPTION_KEY=(.+)').Matches.Groups[1].Value.Trim()

if (-not $resendKey) {
    Write-Host "❌ RESEND_API_KEY non trouvée dans .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ RESEND_API_KEY trouvée" -ForegroundColor Green

# Configurer RESEND_API_KEY
Write-Host ""
Write-Host "Configuration de RESEND_API_KEY..." -ForegroundColor Yellow
npx supabase secrets set RESEND_API_KEY=$resendKey

# Configurer EMAIL_PROVIDER_ENCRYPTION_KEY si disponible
if ($encryptionKey) {
    Write-Host ""
    Write-Host "Configuration de EMAIL_PROVIDER_ENCRYPTION_KEY..." -ForegroundColor Yellow
    npx supabase secrets set EMAIL_PROVIDER_ENCRYPTION_KEY=$encryptionKey
}

# Lister les secrets
Write-Host ""
Write-Host "Secrets configurés:" -ForegroundColor Green
npx supabase secrets list

# Redéployer la fonction
Write-Host ""
Write-Host "Redéploiement de la fonction..." -ForegroundColor Yellow
npx supabase functions deploy process-email-queue

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "Testez avec:" -ForegroundColor Cyan
Write-Host "  .\test-edge-function.ps1" -ForegroundColor White
```

Puis exécutez:
```powershell
.\setup-supabase-secrets.ps1
```

---

## 🧪 Vérification

### 1. Vérifier que les secrets sont configurés:

```powershell
npx supabase secrets list
```

Vous devriez voir:
```
RESEND_API_KEY
EMAIL_PROVIDER_ENCRYPTION_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### 2. Tester la fonction Edge:

```powershell
.\test-edge-function.ps1
```

### 3. Vérifier les logs:

Allez sur: https://supabase.com/dashboard/project/cccykchoteodrvabxaqq/functions/process-email-queue/logs

Vous ne devriez plus voir l'erreur "Resend API key not configured".

### 4. Créer un email de test:

```sql
INSERT INTO public.email_queue (
  from_address,
  to_address,
  subject,
  html_content,
  priority,
  type,
  status
) VALUES (
  'noreply@piksend.com',
  'sabowaryan@gmail.com',
  '[TEST] After Secrets Config',
  '<h1>Test</h1><p>This should work now!</p>',
  'high',
  'transactional',
  'pending'
);
```

Attendez 1 minute et vérifiez que l'email est envoyé.

---

## 📝 Notes Importantes

1. **Les secrets sont chiffrés** par Supabase et ne sont accessibles qu'aux fonctions Edge

2. **Après modification des secrets**, vous DEVEZ redéployer la fonction:
   ```powershell
   npx supabase functions deploy process-email-queue
   ```

3. **Les secrets ne sont PAS visibles** dans le Dashboard après configuration (pour la sécurité)

4. **Pour mettre à jour un secret**, utilisez la même commande:
   ```powershell
   npx supabase secrets set SECRET_NAME=nouvelle_valeur
   ```

5. **Pour supprimer un secret**:
   ```powershell
   npx supabase secrets unset SECRET_NAME
   ```

---

## 🚨 Dépannage

### Erreur: "Resend API key not configured"

✅ **Solution:** Configurez `RESEND_API_KEY` dans les secrets Supabase

### Erreur: "Failed to decrypt provider config"

✅ **Solution:** Configurez `EMAIL_PROVIDER_ENCRYPTION_KEY` avec la même valeur que dans `.env`

### Les secrets ne sont pas pris en compte

✅ **Solution:** Redéployez la fonction après avoir configuré les secrets

### Comment vérifier si un secret est configuré?

```powershell
npx supabase secrets list
```

---

## ✅ Checklist Finale

- [ ] Configurer `RESEND_API_KEY` dans Supabase
- [ ] Configurer `EMAIL_PROVIDER_ENCRYPTION_KEY` (optionnel)
- [ ] Redéployer la fonction Edge
- [ ] Vérifier les logs (plus d'erreur "API key not configured")
- [ ] Tester avec un email
- [ ] Vérifier que l'email est reçu

Une fois ces étapes complétées, le système sera 100% fonctionnel! 🎉
