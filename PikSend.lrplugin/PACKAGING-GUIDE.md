# Guide de Packaging - Plugin PikSend pour Lightroom

## Vue d'ensemble

Ce document décrit le processus de création du package `.lrplugin` pour distribution. Le package doit contenir tous les fichiers nécessaires au fonctionnement du plugin, correctement organisés et validés.

## Structure du Package

Le package `.lrplugin` est un dossier spécial reconnu par Adobe Lightroom Classic. Il doit contenir la structure suivante :

```
PikSend.lrplugin/
├── Info.lua                          # Métadonnées du plugin (REQUIS)
├── PikSendExportServiceProvider.lua  # Export Service Provider (REQUIS)
├── PikSendPublishServiceProvider.lua # Publish Service Provider (REQUIS)
├── PikSendPluginInfoProvider.lua     # Plugin Info Provider (REQUIS)
├── PikSendAPI.lua                    # Client API REST
├── PikSendAuth.lua                   # Gestion authentification
├── PikSendGallery.lua                # Gestion galeries
├── PikSendGallerySettings.lua        # Paramètres avancés de galerie
├── PikSendUpload.lua                 # Gestion uploads
├── PikSendMetadata.lua               # Gestion métadonnées
├── PikSendUI.lua                     # Composants UI
├── PikSendUtils.lua                  # Utilitaires
├── PikSendLogger.lua                 # Système de logs
├── PikSendCache.lua                  # Système de cache
├── PikSendPresets.lua                # Gestion des presets
├── PikSendRetry.lua                  # Système de retry
├── PikSendErrorHandler.lua           # Gestion des erreurs
├── PikSendUpdater.lua                # Système de mises à jour
├── PikSendLocalization.lua           # Système de localisation
├── json.lua                          # Bibliothèque JSON
├── resources/                        # Ressources visuelles
│   ├── icon.png                      # Icône du plugin (256x256)
│   ├── logo.png                      # Logo PikSend
│   └── watermark-default.png         # Watermark par défaut
├── localization/                     # Fichiers de traduction
│   ├── en.lua                        # Traductions anglaises
│   └── fr.lua                        # Traductions françaises
├── README.md                         # Documentation utilisateur
├── GUIDE-INSTALLATION.md             # Guide d'installation
└── USER-GUIDE.md                     # Guide d'utilisation
```

## Fichiers à EXCLURE du Package

Les fichiers suivants ne doivent **PAS** être inclus dans le package de distribution :

### Fichiers de développement
- `tests/` - Tous les tests unitaires et d'intégration
- `*.md` (sauf README.md, GUIDE-INSTALLATION.md, USER-GUIDE.md)
- `.busted` - Configuration Busted
- `run-tests.bat`, `run-busted.ps1`, `run_checkpoint_tests.ps1`
- `setup-dev-environment.ps1`, `diagnose-busted.ps1`
- `DEVELOPMENT.md`, `DEPENDENCIES.md`, `STRUCTURE.md`
- Tous les fichiers `TASK-*.md`, `CHECKPOINT-*.md`

### Fichiers temporaires et logs
- `PikSend.log` - Fichiers de log
- `test_*.txt`, `test_*.json` - Résultats de tests
- Tout fichier `.tmp`, `.bak`, `.swp`

### Fichiers système
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)
- `.git/`, `.gitignore`

## Dépendances Requises

### Dépendances Lua Intégrées
Ces bibliothèques doivent être **incluses** dans le package :

1. **json.lua** - Parsing et génération JSON
   - Fichier : `json.lua`
   - Licence : MIT
   - Utilisé par : PikSendAPI.lua, PikSendCache.lua

### Dépendances Lightroom SDK
Ces bibliothèques sont fournies par Lightroom et ne doivent **PAS** être incluses :

- `LrHttp` - Requêtes HTTP
- `LrTasks` - Gestion des tâches asynchrones
- `LrDialogs` - Dialogs et messages
- `LrView` - Composants UI
- `LrBinding` - Data binding
- `LrPrefs` - Préférences
- `LrFileUtils` - Gestion des fichiers
- `LrPathUtils` - Gestion des chemins
- `LrLogger` - Logging
- `LrFunctionContext` - Contextes de fonction
- `LrProgressScope` - Barres de progression

### Dépendances Système
Ces bibliothèques sont fournies par le système d'exploitation :

- **LuaSocket** - Utilisé par LrHttp (fourni par Lightroom)
- **LuaFileSystem** - Utilisé par LrFileUtils (fourni par Lightroom)

## Processus de Packaging

### Étape 1 : Validation Pré-Packaging

Avant de créer le package, vérifier :

1. **Tests** : Tous les tests passent
   ```powershell
   .\run-busted.ps1
   ```

2. **Version** : Mettre à jour le numéro de version dans `Info.lua`
   ```lua
   VERSION = { major = 1, minor = 0, revision = 0 }
   ```

3. **Changelog** : Documenter les changements dans `CHANGELOG.md`

4. **Documentation** : Vérifier que README.md, GUIDE-INSTALLATION.md et USER-GUIDE.md sont à jour

### Étape 2 : Nettoyage du Dossier

1. Supprimer tous les fichiers de test et de développement
2. Supprimer les logs et fichiers temporaires
3. Vérifier qu'aucun fichier système n'est présent

### Étape 3 : Validation de la Structure

Utiliser le script de validation (voir section suivante) pour vérifier :
- Tous les fichiers requis sont présents
- Aucun fichier interdit n'est présent
- Les dépendances sont correctement incluses
- La taille du package est raisonnable (< 5 MB)

### Étape 4 : Création du Package

Le package `.lrplugin` est simplement un dossier avec l'extension `.lrplugin`. Lightroom le reconnaît automatiquement.

**Sur Windows :**
```powershell
# Renommer le dossier si nécessaire
Rename-Item -Path "PikSend.lrplugin" -NewName "PikSend.lrplugin"

# Créer une archive ZIP pour distribution (optionnel)
Compress-Archive -Path "PikSend.lrplugin" -DestinationPath "PikSend-v1.0.0.zip"
```

**Sur macOS :**
```bash
# Le dossier .lrplugin est déjà prêt
# Créer une archive ZIP pour distribution (optionnel)
zip -r PikSend-v1.0.0.zip PikSend.lrplugin
```

### Étape 5 : Test d'Installation

1. Copier le package dans un dossier temporaire
2. Ouvrir Lightroom Classic
3. Aller dans `Fichier > Gestionnaire de modules externes`
4. Cliquer sur `Ajouter` et sélectionner le dossier `.lrplugin`
5. Vérifier que le plugin apparaît dans la liste
6. Vérifier que la version est correcte
7. Tester les fonctionnalités de base :
   - Authentification
   - Création de galerie
   - Export d'une photo

## Script de Validation

Créer un script PowerShell `validate-package.ps1` pour automatiser la validation :

```powershell
# validate-package.ps1
# Script de validation du package .lrplugin

$packagePath = "PikSend.lrplugin"
$errors = @()
$warnings = @()

# Fichiers requis
$requiredFiles = @(
    "Info.lua",
    "PikSendExportServiceProvider.lua",
    "PikSendPublishServiceProvider.lua",
    "PikSendPluginInfoProvider.lua",
    "PikSendAPI.lua",
    "PikSendAuth.lua",
    "PikSendGallery.lua",
    "PikSendUpload.lua",
    "PikSendMetadata.lua",
    "PikSendUI.lua",
    "PikSendUtils.lua",
    "PikSendLogger.lua",
    "PikSendCache.lua",
    "json.lua",
    "README.md",
    "GUIDE-INSTALLATION.md",
    "USER-GUIDE.md"
)

# Fichiers interdits
$forbiddenPatterns = @(
    "tests/*",
    "*.log",
    "test_*.txt",
    "test_*.json",
    ".busted",
    "run-tests.bat",
    "*.ps1",
    "DEVELOPMENT.md",
    "TASK-*.md",
    "CHECKPOINT-*.md"
)

Write-Host "Validation du package $packagePath..." -ForegroundColor Cyan

# Vérifier les fichiers requis
foreach ($file in $requiredFiles) {
    $filePath = Join-Path $packagePath $file
    if (-not (Test-Path $filePath)) {
        $errors += "Fichier requis manquant : $file"
    }
}

# Vérifier les fichiers interdits
foreach ($pattern in $forbiddenPatterns) {
    $files = Get-ChildItem -Path $packagePath -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    if ($files) {
        foreach ($file in $files) {
            $warnings += "Fichier interdit trouvé : $($file.FullName)"
        }
    }
}

# Vérifier la taille du package
$size = (Get-ChildItem -Path $packagePath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
if ($size -gt 5) {
    $warnings += "Taille du package trop grande : $([math]::Round($size, 2)) MB (max 5 MB)"
}

# Afficher les résultats
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✓ Validation réussie !" -ForegroundColor Green
    Write-Host "  Taille du package : $([math]::Round($size, 2)) MB" -ForegroundColor Gray
    exit 0
} else {
    if ($errors.Count -gt 0) {
        Write-Host "`n✗ Erreurs ($($errors.Count)) :" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  - $error" -ForegroundColor Red
        }
    }
    if ($warnings.Count -gt 0) {
        Write-Host "`n⚠ Avertissements ($($warnings.Count)) :" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
    }
    exit 1
}
```

## Checklist de Distribution

Avant de distribuer le package, vérifier :

- [ ] Tous les tests passent (unitaires, propriétés, intégration)
- [ ] Le numéro de version est correct dans `Info.lua`
- [ ] Le changelog est à jour
- [ ] La documentation est à jour (README, guides)
- [ ] Tous les fichiers requis sont présents
- [ ] Aucun fichier de développement n'est présent
- [ ] Aucun fichier temporaire ou log n'est présent
- [ ] Les ressources visuelles sont présentes et valides
- [ ] Les traductions sont complètes (en, fr)
- [ ] Le package a été testé sur Windows et macOS
- [ ] Le package a été testé avec Lightroom 11.0, 12.0, 13.0
- [ ] La taille du package est raisonnable (< 5 MB)
- [ ] Le script de validation passe sans erreur

## Distribution

### Upload sur le Dashboard PikSend

1. Se connecter au dashboard PikSend en tant qu'administrateur
2. Aller dans `Admin > Plugins > Lightroom`
3. Uploader le fichier ZIP du package
4. Remplir les métadonnées :
   - Version : 1.0.0
   - Date de release : [date]
   - Changelog : [copier depuis CHANGELOG.md]
   - Compatibilité : Lightroom Classic 11.0+, Windows 10/11, macOS 10.15+
5. Publier le plugin

### Page de Téléchargement

Le plugin sera disponible à l'adresse :
- https://piksend.com/downloads/lightroom-plugin

Les utilisateurs Pro pourront télécharger le plugin depuis :
- https://piksend.com/dashboard/downloads

## Versioning

Le plugin suit le versioning sémantique (SemVer) :

- **Major** : Changements incompatibles avec les versions précédentes
- **Minor** : Nouvelles fonctionnalités rétrocompatibles
- **Revision** : Corrections de bugs rétrocompatibles

Exemples :
- `1.0.0` - Release initiale
- `1.1.0` - Ajout de nouvelles fonctionnalités
- `1.1.1` - Correction de bugs
- `2.0.0` - Changements majeurs incompatibles

## Support et Maintenance

### Canaux de Support

- **Documentation** : https://piksend.com/docs/lightroom-plugin
- **FAQ** : https://piksend.com/faq/lightroom-plugin
- **Email** : support@piksend.com
- **Forum** : https://community.piksend.com/lightroom

### Mises à Jour

Le plugin vérifie automatiquement les mises à jour au démarrage de Lightroom. Les utilisateurs sont notifiés lorsqu'une nouvelle version est disponible.

Pour publier une mise à jour :
1. Incrémenter le numéro de version dans `Info.lua`
2. Mettre à jour le changelog
3. Suivre le processus de packaging
4. Uploader sur le dashboard PikSend
5. L'API retournera automatiquement la nouvelle version aux plugins

## Troubleshooting

### Le plugin n'apparaît pas dans Lightroom

- Vérifier que le dossier a bien l'extension `.lrplugin`
- Vérifier que `Info.lua` est présent et valide
- Vérifier les logs Lightroom : `~/Library/Logs/Adobe/Lightroom/` (macOS) ou `%APPDATA%\Adobe\Lightroom\Logs\` (Windows)

### Erreur "Plugin incompatible"

- Vérifier que `LrSdkVersion` et `LrSdkMinimumVersion` sont corrects dans `Info.lua`
- Vérifier la version de Lightroom (minimum 11.0)

### Erreur "Fichier manquant"

- Vérifier que tous les fichiers requis sont présents
- Exécuter le script de validation

### Le plugin ne se charge pas

- Vérifier les erreurs de syntaxe Lua dans les fichiers
- Vérifier les dépendances (json.lua)
- Consulter les logs du plugin : `PikSend.log`

## Références

- [Lightroom SDK Documentation](https://www.adobe.io/apis/creativecloud/lightroom.html)
- [Lua 5.1 Reference Manual](https://www.lua.org/manual/5.1/)
- [PikSend API Documentation](https://piksend.com/docs/api)

---

**Version du document** : 1.0.0  
**Dernière mise à jour** : 2024-01-15  
**Auteur** : Équipe PikSend
