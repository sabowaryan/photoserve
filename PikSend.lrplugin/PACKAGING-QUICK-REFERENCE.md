# Référence Rapide - Packaging du Plugin PikSend

## Commandes Essentielles

### Validation du Package
```powershell
# Exécuter le script de validation complet
.\validate-package.ps1

# Exécuter avec sortie détaillée
.\validate-package.ps1 -Verbose
```

### Tests
```powershell
# Exécuter tous les tests
.\run-busted.ps1

# Exécuter uniquement les tests d'intégration
.\run-busted.ps1 tests/test_integration_*.lua

# Exécuter uniquement les tests de propriétés
.\run-busted.ps1 tests/test_property_*.lua
```

### Création du Package
```powershell
# Créer l'archive ZIP pour distribution
Compress-Archive -Path PikSend.lrplugin -DestinationPath PikSend-v1.0.0.zip -Force

# Calculer le checksum MD5
Get-FileHash -Path PikSend-v1.0.0.zip -Algorithm MD5
```

### Vérifications Rapides
```powershell
# Vérifier la taille du package
Get-ChildItem -Path PikSend.lrplugin -Recurse | Measure-Object -Property Length -Sum

# Lister les fichiers de test restants
Get-ChildItem -Path PikSend.lrplugin -Recurse -Filter "test_*"

# Lister les fichiers de log
Get-ChildItem -Path PikSend.lrplugin -Recurse -Filter "*.log"

# Vérifier la syntaxe Lua (si luac est installé)
Get-ChildItem -Path PikSend.lrplugin -Filter "*.lua" -Recurse | ForEach-Object { luac -p $_.FullName }
```

---

## Checklist Rapide Pré-Release

### Avant de Créer le Package

- [ ] Tous les tests passent (`.\run-busted.ps1`)
- [ ] Version mise à jour dans `Info.lua`
- [ ] CHANGELOG.md mis à jour
- [ ] Documentation à jour (README, guides)

### Nettoyage

- [ ] Supprimer le dossier `tests/`
- [ ] Supprimer tous les fichiers `*.log`
- [ ] Supprimer tous les fichiers `test_*.txt` et `test_*.json`
- [ ] Supprimer tous les fichiers `TASK-*.md` et `CHECKPOINT-*.md`
- [ ] Supprimer tous les scripts de développement (`*.ps1`, `*.bat`)

### Validation

- [ ] Exécuter `.\validate-package.ps1` sans erreur
- [ ] Taille du package < 5 MB
- [ ] Tous les fichiers requis présents
- [ ] Aucun fichier interdit présent

### Test d'Installation

- [ ] Tester sur Windows 10/11
- [ ] Tester sur macOS 10.15+
- [ ] Tester avec Lightroom 11.0+
- [ ] Vérifier que le plugin apparaît dans le Gestionnaire de modules externes

---

## Fichiers Requis (Minimum)

### Modules Principaux (19 fichiers)
```
Info.lua
PikSendExportServiceProvider.lua
PikSendPublishServiceProvider.lua
PikSendPluginInfoProvider.lua
PikSendAPI.lua
PikSendAuth.lua
PikSendGallery.lua
PikSendGallerySettings.lua
PikSendUpload.lua
PikSendMetadata.lua
PikSendUI.lua
PikSendUtils.lua
PikSendLogger.lua
PikSendCache.lua
PikSendPresets.lua
PikSendRetry.lua
PikSendErrorHandler.lua
PikSendUpdater.lua
PikSendLocalization.lua
```

### Dépendances (1 fichier)
```
json.lua
```

### Documentation (3 fichiers)
```
README.md
GUIDE-INSTALLATION.md
USER-GUIDE.md
```

### Ressources (3 fichiers)
```
resources/icon.png
resources/logo.png
resources/watermark-default.png
```

### Localisation (2 fichiers)
```
localization/en.lua
localization/fr.lua
```

**Total : 28 fichiers minimum**

---

## Fichiers à EXCLURE

### Dossiers Complets
```
tests/
.git/
```

### Fichiers de Développement
```
.busted
run-tests.bat
run-busted.ps1
run_checkpoint_tests.ps1
setup-dev-environment.ps1
diagnose-busted.ps1
validate-package.ps1
DEVELOPMENT.md
DEPENDENCIES.md
STRUCTURE.md
PACKAGING-GUIDE.md
PACKAGING-CHECKLIST.md
PACKAGING-QUICK-REFERENCE.md
```

### Fichiers de Tâches et Vérification
```
TASK-*.md
CHECKPOINT-*.md
*-VERIFICATION.md
*-SUMMARY.md
```

### Fichiers Temporaires
```
*.log
test_*.txt
test_*.json
*.tmp
*.bak
*.swp
```

### Fichiers Système
```
.DS_Store
Thumbs.db
.gitignore
```

---

## Tailles Recommandées

| Élément | Taille Max |
|---------|-----------|
| Package complet | 5 MB |
| resources/icon.png | 100 KB |
| resources/logo.png | 200 KB |
| resources/watermark-default.png | 50 KB |
| Fichier Lua individuel | 500 KB |

---

## Versions et Compatibilité

### Format de Version (SemVer)
```
MAJOR.MINOR.REVISION
```

- **MAJOR** : Changements incompatibles
- **MINOR** : Nouvelles fonctionnalités rétrocompatibles
- **REVISION** : Corrections de bugs

### Compatibilité Requise
- Lightroom Classic 11.0+
- Windows 10/11 (64-bit)
- macOS 10.15+
- Lightroom SDK 6.0+
- Lua 5.1+

---

## Processus de Distribution

### 1. Préparation
```powershell
# Mettre à jour la version
# Éditer Info.lua : VERSION = { major = 1, minor = 0, revision = 0 }

# Mettre à jour le changelog
# Éditer CHANGELOG.md

# Exécuter les tests
.\run-busted.ps1
```

### 2. Nettoyage
```powershell
# Supprimer les fichiers de développement
Remove-Item -Path "PikSend.lrplugin/tests" -Recurse -Force
Remove-Item -Path "PikSend.lrplugin/*.log" -Force
Remove-Item -Path "PikSend.lrplugin/test_*" -Force
Remove-Item -Path "PikSend.lrplugin/TASK-*.md" -Force
Remove-Item -Path "PikSend.lrplugin/CHECKPOINT-*.md" -Force
Remove-Item -Path "PikSend.lrplugin/*.ps1" -Force
Remove-Item -Path "PikSend.lrplugin/*.bat" -Force
```

### 3. Validation
```powershell
# Valider le package
.\validate-package.ps1 -Verbose
```

### 4. Création de l'Archive
```powershell
# Créer le ZIP
$version = "1.0.0"
Compress-Archive -Path "PikSend.lrplugin" -DestinationPath "PikSend-v$version.zip" -Force

# Calculer le checksum
Get-FileHash -Path "PikSend-v$version.zip" -Algorithm MD5
```

### 5. Test d'Installation
```
1. Copier le dossier PikSend.lrplugin dans un dossier temporaire
2. Ouvrir Lightroom Classic
3. Fichier > Gestionnaire de modules externes
4. Cliquer sur "Ajouter"
5. Sélectionner le dossier PikSend.lrplugin
6. Vérifier que le plugin apparaît dans la liste
7. Tester l'authentification et l'export d'une photo
```

### 6. Upload sur le Dashboard
```
1. Se connecter au dashboard PikSend (admin)
2. Aller dans Admin > Plugins > Lightroom
3. Uploader le fichier ZIP
4. Remplir les métadonnées (version, changelog, compatibilité)
5. Publier le plugin
6. Tester le téléchargement depuis la page publique
```

---

## Dépannage Rapide

### Le script de validation échoue
```powershell
# Vérifier les fichiers manquants
.\validate-package.ps1 -Verbose

# Vérifier la syntaxe Lua
Get-ChildItem -Path PikSend.lrplugin -Filter "*.lua" -Recurse | ForEach-Object { 
    Write-Host "Vérification de $($_.Name)..."
    luac -p $_.FullName 
}
```

### Le package est trop volumineux
```powershell
# Identifier les fichiers les plus volumineux
Get-ChildItem -Path PikSend.lrplugin -Recurse -File | 
    Sort-Object Length -Descending | 
    Select-Object -First 10 | 
    Format-Table Name, @{Label="Size (MB)"; Expression={[math]::Round($_.Length / 1MB, 2)}}
```

### Le plugin ne se charge pas dans Lightroom
```
1. Vérifier que Info.lua est présent et valide
2. Vérifier que LrSdkVersion = 6.0 dans Info.lua
3. Consulter les logs Lightroom :
   - Windows : %APPDATA%\Adobe\Lightroom\Logs\
   - macOS : ~/Library/Logs/Adobe/Lightroom/
4. Vérifier qu'aucune erreur de syntaxe Lua n'est présente
```

---

## Contacts et Support

- **Documentation** : https://piksend.com/docs/lightroom-plugin
- **Support** : support@piksend.com
- **Dashboard** : https://piksend.com/dashboard

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024-01-15
