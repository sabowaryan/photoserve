# validate-package.ps1
# Script de validation du package .lrplugin pour PikSend
# Version: 1.0.0

param(
    [string]$PackagePath = ".",
    [switch]$Verbose = $false
)

# Couleurs pour l'affichage
$ErrorColor = "Red"
$WarningColor = "Yellow"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$DetailColor = "Gray"

# Compteurs
$script:ErrorCount = 0
$script:WarningCount = 0
$script:InfoCount = 0

# Fonctions d'affichage
function Write-Error-Message {
    param([string]$Message)
    Write-Host "  ✗ $Message" -ForegroundColor $ErrorColor
    $script:ErrorCount++
}

function Write-Warning-Message {
    param([string]$Message)
    Write-Host "  ⚠ $Message" -ForegroundColor $WarningColor
    $script:WarningCount++
}

function Write-Success-Message {
    param([string]$Message)
    Write-Host "  ✓ $Message" -ForegroundColor $SuccessColor
}

function Write-Info-Message {
    param([string]$Message)
    Write-Host "  ℹ $Message" -ForegroundColor $InfoColor
}

function Write-Detail-Message {
    param([string]$Message)
    if ($Verbose) {
        Write-Host "    $Message" -ForegroundColor $DetailColor
    }
}

# Début de la validation
Write-Host "`n" -NoNewline
Write-Host "Validation du Package PikSend.lrplugin" -ForegroundColor $InfoColor
Write-Host ""

# Vérifier que le dossier existe
if (-not (Test-Path $PackagePath)) {
    Write-Host "Erreur : Le dossier '$PackagePath' n'existe pas." -ForegroundColor $ErrorColor
    exit 1
}

$PackagePath = Resolve-Path $PackagePath

# ============================================================================
# 1. VALIDATION DES FICHIERS REQUIS
# ============================================================================

Write-Host "`n[1] Validation des fichiers requis..." -ForegroundColor $InfoColor

$requiredFiles = @(
    # Modules principaux
    "Info.lua",
    "PikSendExportServiceProvider.lua",
    "PikSendPublishServiceProvider.lua",
    "PikSendPluginInfoProvider.lua",
    "PikSendAPI.lua",
    "PikSendAuth.lua",
    "PikSendGallery.lua",
    "PikSendGallerySettings.lua",
    "PikSendUpload.lua",
    "PikSendMetadata.lua",
    "PikSendUI.lua",
    "PikSendUtils.lua",
    "PikSendLogger.lua",
    "PikSendCache.lua",
    "PikSendPresets.lua",
    "PikSendRetry.lua",
    "PikSendErrorHandler.lua",
    "PikSendUpdater.lua",
    "PikSendLocalization.lua",
    
    # Dépendances
    "json.lua",
    
    # Documentation
    "README.md",
    "GUIDE-INSTALLATION.md",
    "USER-GUIDE.md",
    
    # Ressources
    "resources/icon.png",
    "resources/logo.png",
    "resources/watermark-default.png",
    
    # Localisation
    "localization/en.lua",
    "localization/fr.lua"
)

$missingFiles = @()
$foundFiles = @()

foreach ($file in $requiredFiles) {
    $filePath = Join-Path $PackagePath $file
    if (Test-Path $filePath) {
        $foundFiles += $file
        Write-Detail-Message "Trouvé : $file"
    } else {
        $missingFiles += $file
        Write-Error-Message "Fichier requis manquant : $file"
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Success-Message "Tous les fichiers requis sont présents ($($foundFiles.Count)/$($requiredFiles.Count))"
} else {
    Write-Error-Message "$($missingFiles.Count) fichier(s) requis manquant(s)"
}

# ============================================================================
# 2. VALIDATION DES EXCLUSIONS
# ============================================================================

Write-Host "`n[2] Validation des exclusions..." -ForegroundColor $InfoColor

$forbiddenPatterns = @(
    @{ Pattern = "tests"; Type = "Directory"; Description = "Dossier de tests" },
    @{ Pattern = "*.log"; Type = "File"; Description = "Fichiers de log" },
    @{ Pattern = "test_*.txt"; Type = "File"; Description = "Résultats de tests" },
    @{ Pattern = "test_*.json"; Type = "File"; Description = "Résultats de tests JSON" },
    @{ Pattern = ".busted"; Type = "File"; Description = "Configuration Busted" },
    @{ Pattern = "run-tests.bat"; Type = "File"; Description = "Script de test" },
    @{ Pattern = "run-busted.ps1"; Type = "File"; Description = "Script de test" },
    @{ Pattern = "run_checkpoint_tests.ps1"; Type = "File"; Description = "Script de test" },
    @{ Pattern = "setup-dev-environment.ps1"; Type = "File"; Description = "Script de développement" },
    @{ Pattern = "diagnose-busted.ps1"; Type = "File"; Description = "Script de développement" },
    @{ Pattern = "DEVELOPMENT.md"; Type = "File"; Description = "Documentation de développement" },
    @{ Pattern = "DEPENDENCIES.md"; Type = "File"; Description = "Documentation de développement" },
    @{ Pattern = "STRUCTURE.md"; Type = "File"; Description = "Documentation de développement" },
    @{ Pattern = "TASK-*.md"; Type = "File"; Description = "Fichiers de tâches" },
    @{ Pattern = "CHECKPOINT-*.md"; Type = "File"; Description = "Fichiers de checkpoint" },
    @{ Pattern = "*-VERIFICATION.md"; Type = "File"; Description = "Fichiers de vérification" },
    @{ Pattern = "*-SUMMARY.md"; Type = "File"; Description = "Fichiers de résumé" },
    @{ Pattern = ".DS_Store"; Type = "File"; Description = "Fichier système macOS" },
    @{ Pattern = "Thumbs.db"; Type = "File"; Description = "Fichier système Windows" },
    @{ Pattern = ".git"; Type = "Directory"; Description = "Dossier Git" },
    @{ Pattern = ".gitignore"; Type = "File"; Description = "Configuration Git" }
)

$forbiddenFound = @()

foreach ($forbidden in $forbiddenPatterns) {
    $pattern = $forbidden.Pattern
    $type = $forbidden.Type
    $description = $forbidden.Description
    
    if ($type -eq "Directory") {
        $items = Get-ChildItem -Path $PackagePath -Directory -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    } else {
        $items = Get-ChildItem -Path $PackagePath -File -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    }
    
    if ($items) {
        foreach ($item in $items) {
            $relativePath = $item.FullName.Replace($PackagePath, "").TrimStart("\", "/")
            $forbiddenFound += @{ Path = $relativePath; Description = $description }
            Write-Warning-Message "Fichier/dossier interdit trouvé : $relativePath ($description)"
        }
    }
}

if ($forbiddenFound.Count -eq 0) {
    Write-Success-Message "Aucun fichier/dossier interdit trouvé"
} else {
    Write-Warning-Message "$($forbiddenFound.Count) fichier(s)/dossier(s) interdit(s) trouvé(s)"
}

# ============================================================================
# 3. VALIDATION DE LA TAILLE DU PACKAGE
# ============================================================================

Write-Host "`n[3] Validation de la taille du package..." -ForegroundColor $InfoColor

$totalSize = (Get-ChildItem -Path $PackagePath -Recurse -File | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Info-Message "Taille totale du package : $totalSizeMB MB"

if ($totalSizeMB -gt 5) {
    Write-Warning-Message "Taille du package trop grande : $totalSizeMB MB (max recommandé : 5 MB)"
    
    # Identifier les fichiers les plus volumineux
    $largeFiles = Get-ChildItem -Path $PackagePath -Recurse -File | 
                  Sort-Object Length -Descending | 
                  Select-Object -First 5
    
    Write-Info-Message "Fichiers les plus volumineux :"
    foreach ($file in $largeFiles) {
        $fileSizeMB = [math]::Round($file.Length / 1MB, 2)
        $relativePath = $file.FullName.Replace($PackagePath, "").TrimStart("\", "/")
        Write-Detail-Message "$relativePath : $fileSizeMB MB"
    }
} else {
    Write-Success-Message "Taille du package acceptable : $totalSizeMB MB"
}

# Vérifier la taille des ressources visuelles
$resourceSizes = @{
    "resources/icon.png" = 0.1  # 100 KB
    "resources/logo.png" = 0.2  # 200 KB
    "resources/watermark-default.png" = 0.05  # 50 KB
}

foreach ($resource in $resourceSizes.Keys) {
    $resourcePath = Join-Path $PackagePath $resource
    if (Test-Path $resourcePath) {
        $resourceSize = (Get-Item $resourcePath).Length / 1MB
        $maxSize = $resourceSizes[$resource]
        
        if ($resourceSize -gt $maxSize) {
            Write-Warning-Message "$resource trop volumineux : $([math]::Round($resourceSize, 2)) MB (max : $maxSize MB)"
        } else {
            Write-Detail-Message "$resource : $([math]::Round($resourceSize, 2)) MB"
        }
    }
}

# ============================================================================
# 4. VALIDATION DE LA SYNTAXE LUA
# ============================================================================

Write-Host "`n[4] Validation de la syntaxe Lua..." -ForegroundColor $InfoColor

# Vérifier si luac est disponible
$luacAvailable = $null -ne (Get-Command luac -ErrorAction SilentlyContinue)

if ($luacAvailable) {
    $luaFiles = Get-ChildItem -Path $PackagePath -Filter "*.lua" -Recurse
    $syntaxErrors = @()
    
    foreach ($luaFile in $luaFiles) {
        $result = & luac -p $luaFile.FullName 2>&1
        if ($LASTEXITCODE -ne 0) {
            $relativePath = $luaFile.FullName.Replace($PackagePath, "").TrimStart("\", "/")
            $syntaxErrors += @{ File = $relativePath; Error = $result }
            Write-Error-Message "Erreur de syntaxe dans $relativePath : $result"
        } else {
            Write-Detail-Message "Syntaxe valide : $($luaFile.Name)"
        }
    }
    
    if ($syntaxErrors.Count -eq 0) {
        Write-Success-Message "Aucune erreur de syntaxe Lua détectée ($($luaFiles.Count) fichiers vérifiés)"
    } else {
        Write-Error-Message "$($syntaxErrors.Count) erreur(s) de syntaxe Lua détectée(s)"
    }
} else {
    Write-Warning-Message "luac non disponible - validation de syntaxe Lua ignorée"
    Write-Info-Message "Installez Lua pour activer la validation de syntaxe"
}

# ============================================================================
# 5. VALIDATION DE LA SÉCURITÉ
# ============================================================================

Write-Host "`n[5] Validation de la sécurité..." -ForegroundColor $InfoColor

$securityIssues = @()

# Rechercher des tokens API en dur
$luaFiles = Get-ChildItem -Path $PackagePath -Filter "*.lua" -Recurse
foreach ($luaFile in $luaFiles) {
    $content = Get-Content $luaFile.FullName -Raw
    
    # Rechercher des patterns suspects
    if ($content -match 'Bearer\s+[a-zA-Z0-9_-]+') {
        $relativePath = $luaFile.FullName.Replace($PackagePath, "").TrimStart("\", "/")
        $securityIssues += "Token API potentiel trouvé dans $relativePath"
        Write-Warning-Message "Token API potentiel trouvé dans $relativePath"
    }
    
    # Rechercher des URLs HTTP (non HTTPS)
    if ($content -match 'http://[^l]') {
        $relativePath = $luaFile.FullName.Replace($PackagePath, "").TrimStart("\", "/")
        $securityIssues += "URL HTTP (non securisee) trouvee dans $relativePath"
        Write-Warning-Message "URL HTTP (non securisee) trouvee dans $relativePath"
    }
    
    # Rechercher des mots de passe en dur
    if ($content -match 'password\s*=\s*["''][^"'']+["'']') {
        $relativePath = $luaFile.FullName.Replace($PackagePath, "").TrimStart("\", "/")
        $securityIssues += "Mot de passe potentiel en dur dans $relativePath"
        Write-Warning-Message "Mot de passe potentiel en dur dans $relativePath"
    }
}

if ($securityIssues.Count -eq 0) {
    Write-Success-Message "Aucun problème de sécurité évident détecté"
} else {
    Write-Warning-Message "$($securityIssues.Count) problème(s) de sécurité potentiel(s) détecté(s)"
}

# ============================================================================
# 6. VALIDATION DE LA VERSION
# ============================================================================

Write-Host "`n[6] Validation de la version..." -ForegroundColor $InfoColor

$infoLuaPath = Join-Path $PackagePath "Info.lua"
if (Test-Path $infoLuaPath) {
    $infoContent = Get-Content $infoLuaPath -Raw
    
    # Extraire la version
    if ($infoContent -match 'VERSION\s*=\s*\{\s*major\s*=\s*(\d+)\s*,\s*minor\s*=\s*(\d+)\s*,\s*revision\s*=\s*(\d+)') {
        $major = $matches[1]
        $minor = $matches[2]
        $revision = $matches[3]
        $version = "$major.$minor.$revision"
        
        Write-Success-Message "Version detectee : $version"
        
        # Vérifier que la version est valide
        if ($major -eq 0 -and $minor -eq 0 -and $revision -eq 0) {
            Write-Warning-Message "Version 0.0.0 detectee - pensez a mettre a jour la version"
        }
    } else {
        Write-Error-Message "Impossible d'extraire la version depuis Info.lua"
    }
    
    # Vérifier LrSdkVersion
    if ($infoContent -match 'LrSdkVersion\s*=\s*([0-9.]+)') {
        $sdkVersion = $matches[1]
        Write-Info-Message "LrSdkVersion : $sdkVersion"
        
        if ([double]$sdkVersion -lt 6.0) {
            Write-Warning-Message "LrSdkVersion inferieur a 6.0 - compatibilite avec Lightroom 11.0+ non garantie"
        }
    }
} else {
    Write-Error-Message "Info.lua non trouvé"
}

# ============================================================================
# 7. RÉSUMÉ
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "Resume de la Validation" -ForegroundColor $InfoColor
Write-Host ""

Write-Host "  Fichiers requis       : $($foundFiles.Count)/$($requiredFiles.Count)" -ForegroundColor $(if ($missingFiles.Count -eq 0) { $SuccessColor } else { $ErrorColor })
Write-Host "  Fichiers interdits    : $($forbiddenFound.Count)" -ForegroundColor $(if ($forbiddenFound.Count -eq 0) { $SuccessColor } else { $WarningColor })
Write-Host "  Taille du package     : $totalSizeMB MB" -ForegroundColor $(if ($totalSizeMB -le 5) { $SuccessColor } else { $WarningColor })
Write-Host "  Erreurs               : $script:ErrorCount" -ForegroundColor $(if ($script:ErrorCount -eq 0) { $SuccessColor } else { $ErrorColor })
Write-Host "  Avertissements        : $script:WarningCount" -ForegroundColor $(if ($script:WarningCount -eq 0) { $SuccessColor } else { $WarningColor })

Write-Host ""

if ($script:ErrorCount -eq 0 -and $script:WarningCount -eq 0) {
    Write-Host "Validation reussie ! Le package est pret pour la distribution." -ForegroundColor $SuccessColor
    exit 0
} elseif ($script:ErrorCount -eq 0) {
    Write-Host "Validation reussie avec avertissements. Veuillez les examiner avant la distribution." -ForegroundColor $WarningColor
    exit 0
} else {
    Write-Host "Validation echouee. Veuillez corriger les erreurs avant la distribution." -ForegroundColor $ErrorColor
    exit 1
}
