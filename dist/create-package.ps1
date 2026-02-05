# Script de packaging pour PikSend Lightroom Plugin v1.1.0
$ErrorActionPreference = "Stop"

$pluginName = "PikSend.lrplugin"
$version = "1.1.0"
$outputName = "PikSend-Lightroom-Plugin-v$version.zip"
$distPath = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PikSend Plugin Packaging Script" -ForegroundColor Cyan
Write-Host "Version: $version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le dossier plugin existe
if (-not (Test-Path "$distPath\$pluginName")) {
    Write-Host "ERREUR: Le dossier $pluginName n'existe pas" -ForegroundColor Red
    exit 1
}

Write-Host "[1/3] Vérification des fichiers..." -ForegroundColor Yellow
Write-Host "  OK - Dossier plugin trouvé" -ForegroundColor Green

Write-Host "[2/3] Création de l'archive ZIP..." -ForegroundColor Yellow

# Supprimer l'archive existante
if (Test-Path "$distPath\$outputName") {
    Remove-Item "$distPath\$outputName" -Force
}

# Créer l'archive
Compress-Archive -Path "$distPath\$pluginName" -DestinationPath "$distPath\$outputName" -CompressionLevel Optimal
Write-Host "  OK - Archive créée" -ForegroundColor Green

Write-Host "[3/3] Vérification..." -ForegroundColor Yellow
$archiveSize = (Get-Item "$distPath\$outputName").Length
$archiveSizeMB = [math]::Round($archiveSize / 1MB, 2)
Write-Host "  OK - Taille: $archiveSizeMB MB" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUCCÈS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fichier: $outputName" -ForegroundColor White
Write-Host "Taille: $archiveSizeMB MB" -ForegroundColor White
Write-Host ""
