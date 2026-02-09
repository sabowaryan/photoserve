# Script PowerShell pour nettoyer le cache Next.js
Write-Host "🧹 Nettoyage du cache Next.js et des fonts..." -ForegroundColor Cyan
Write-Host ""

# Supprimer .next
if (Test-Path .next) {
    Write-Host "Suppression de .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
    Write-Host "✅ .next supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next n'existe pas" -ForegroundColor Gray
}

# Supprimer node_modules\.cache
if (Test-Path node_modules\.cache) {
    Write-Host "Suppression de node_modules\.cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✅ node_modules\.cache supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  node_modules\.cache n'existe pas" -ForegroundColor Gray
}

# Supprimer .turbo
if (Test-Path .turbo) {
    Write-Host "Suppression de .turbo..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .turbo
    Write-Host "✅ .turbo supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .turbo n'existe pas" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 Cache nettoyé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaine étape: npm run dev" -ForegroundColor Cyan
