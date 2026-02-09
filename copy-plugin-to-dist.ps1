# Script pour copier le plugin vers le dossier dist
# Utilisation: .\copy-plugin-to-dist.ps1

Write-Host "Copie du plugin PikSend vers dist..." -ForegroundColor Cyan

# Créer le dossier dist si nécessaire
if (-not (Test-Path "dist\PikSend.lrplugin")) {
    New-Item -ItemType Directory -Path "dist\PikSend.lrplugin" -Force | Out-Null
}

# Copier tous les fichiers .lua
Write-Host "Copie des fichiers .lua..." -ForegroundColor Yellow
Copy-Item -Path "PikSend.lrplugin\*.lua" -Destination "dist\PikSend.lrplugin\" -Force

# Copier le dossier localization
Write-Host "Copie du dossier localization..." -ForegroundColor Yellow
if (Test-Path "PikSend.lrplugin\localization") {
    if (-not (Test-Path "dist\PikSend.lrplugin\localization")) {
        New-Item -ItemType Directory -Path "dist\PikSend.lrplugin\localization" -Force | Out-Null
    }
    Copy-Item -Path "PikSend.lrplugin\localization\*.lua" -Destination "dist\PikSend.lrplugin\localization\" -Force
}

# Copier le dossier resources
Write-Host "Copie du dossier resources..." -ForegroundColor Yellow
if (Test-Path "PikSend.lrplugin\resources") {
    if (-not (Test-Path "dist\PikSend.lrplugin\resources")) {
        New-Item -ItemType Directory -Path "dist\PikSend.lrplugin\resources" -Force | Out-Null
    }
    Copy-Item -Path "PikSend.lrplugin\resources\*" -Destination "dist\PikSend.lrplugin\resources\" -Recurse -Force
}

# Copier Info.lua
Write-Host "Copie de Info.lua..." -ForegroundColor Yellow
Copy-Item -Path "PikSend.lrplugin\Info.lua" -Destination "dist\PikSend.lrplugin\Info.lua" -Force

Write-Host "`nCopie terminée avec succès!" -ForegroundColor Green
Write-Host "`nProchaines étapes:" -ForegroundColor Cyan
Write-Host "1. Ouvrir Lightroom Classic" -ForegroundColor White
Write-Host "2. Aller dans File > Plug-in Manager" -ForegroundColor White
Write-Host "3. Sélectionner PikSend" -ForegroundColor White
Write-Host "4. Cliquer sur 'Reload' ou 'Remove' puis 'Add' pour pointer vers dist\PikSend.lrplugin" -ForegroundColor White
Write-Host "5. Réessayer l'authentification" -ForegroundColor White
