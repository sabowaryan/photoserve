# Setup Supabase Secrets

Write-Host "Configuration des secrets Supabase..." -ForegroundColor Cyan
Write-Host ""

# Lire les valeurs depuis .env
$envContent = Get-Content .env -Raw
$resendKey = ($envContent | Select-String -Pattern 'RESEND_API_KEY=(.+)').Matches.Groups[1].Value.Trim()
$encryptionKey = ($envContent | Select-String -Pattern 'EMAIL_PROVIDER_ENCRYPTION_KEY=(.+)').Matches.Groups[1].Value.Trim()

if (-not $resendKey) {
    Write-Host "Error: RESEND_API_KEY non trouvee dans .env" -ForegroundColor Red
    exit 1
}

Write-Host "RESEND_API_KEY trouvee" -ForegroundColor Green

# Configurer RESEND_API_KEY
Write-Host ""
Write-Host "Configuration de RESEND_API_KEY..." -ForegroundColor Yellow
npx supabase secrets set RESEND_API_KEY=$resendKey

# Configurer EMAIL_PROVIDER_ENCRYPTION_KEY si disponible
if ($encryptionKey) {
    Write-Host ""
    Write-Host "Configuration de EMAIL_PROVIDER_ENCRYPTION_KEY..." -ForegroundColor Yellow
    npx supabase secrets set EMAIL_PROVIDER_ENCRYPTION_KEY=$encryptionKey
} else {
    Write-Host ""
    Write-Host "EMAIL_PROVIDER_ENCRYPTION_KEY non trouvee (optionnel)" -ForegroundColor Yellow
}

# Lister les secrets
Write-Host ""
Write-Host "Secrets configures:" -ForegroundColor Green
npx supabase secrets list

# Redéployer la fonction
Write-Host ""
Write-Host "Redeploiement de la fonction..." -ForegroundColor Yellow
npx supabase functions deploy process-email-queue

Write-Host ""
Write-Host "Configuration terminee!" -ForegroundColor Green
Write-Host ""
Write-Host "Testez avec:" -ForegroundColor Cyan
Write-Host "  .\test-edge-function.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Ou creez un email de test dans la queue et attendez 1 minute" -ForegroundColor Cyan
