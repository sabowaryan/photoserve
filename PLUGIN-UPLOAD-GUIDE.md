# Guide d'Upload du Plugin Lightroom

Ce guide explique comment préparer et uploader une nouvelle version du plugin PikSend Lightroom.

## Prérequis

- Le dossier `dist/PikSend.lrplugin` doit contenir la version à jour du plugin
- Le fichier `CHANGELOG.md` doit être à jour avec les changements de la nouvelle version
- Vous devez avoir accès à l'interface d'administration

## Étapes

### 1. Mettre à jour le CHANGELOG

Éditez `dist/PikSend.lrplugin/CHANGELOG.md` et ajoutez les informations de la nouvelle version :

```markdown
## [X.Y.Z] - YYYY-MM-DD

### 🚀 Nouvelles fonctionnalités
- Description des nouvelles fonctionnalités

### 🔧 Améliorations
- Description des améliorations

### 🐛 Corrections de bugs
- Description des corrections
```

**Limites** :
- Maximum 50,000 caractères
- Format Markdown supporté

### 2. Créer l'archive ZIP

Exécutez le script PowerShell pour créer l'archive :

```powershell
.\create-plugin-archive.ps1
```

Ce script va :
- Compresser le dossier `dist/PikSend.lrplugin`
- Créer le fichier `dist/PikSend-Plugin.zip`
- Afficher la taille du fichier

**Limites** :
- Taille maximale : 100 MB
- Formats acceptés : `.zip` ou `.lrplugin`

### 3. Uploader via l'interface admin

1. Connectez-vous à l'administration : `https://piksend.com/admin`
2. Allez dans **Plugin** dans le menu de navigation
3. Cliquez sur l'onglet **Upload New Version**
4. Remplissez le formulaire :
   - **Plugin File** : Sélectionnez `dist/PikSend-Plugin.zip`
   - **Version Number** : Format sémantique (ex: `1.2.0` ou `1.2.0-beta`)
   - **Changelog** : Copiez le contenu du CHANGELOG.md pour cette version
   - **Minimum Lightroom Version** : Version minimale requise (ex: `11.0`)
   - **Stability Status** : 
     - `Beta (Testing)` : Visible uniquement avec `includeUnstable=true`
     - `Stable (Production)` : Visible pour tous les utilisateurs

5. Cliquez sur **Upload Plugin Version**

### 4. Vérifier l'upload

Une barre de progression s'affichera avec :
- **0-50%** : Upload du fichier vers Cloudinary
- **50-100%** : Création de l'enregistrement de version
- **100%** : Upload terminé avec succès

Le formulaire se réinitialisera automatiquement après 2 secondes.

## Validation

Le système valide automatiquement :

### Fichier
- ✅ Extension `.zip` ou `.lrplugin`
- ✅ Taille ≤ 100 MB

### Version
- ✅ Format sémantique : `X.Y.Z` ou `X.Y.Z-suffix`
- ✅ Exemples valides : `1.0.0`, `1.2.3-beta`, `2.0.0-alpha.1`
- ✅ Exemples invalides : `1.0`, `v1.0.0`, `1.0.0.0`

### Changelog
- ✅ Non vide
- ✅ Maximum 50,000 caractères
- ✅ Markdown supporté

### Lightroom Version
- ✅ Format : `X.Y` (ex: `11.0`, `13.1`)

## Erreurs courantes

### "File must have .zip or .lrplugin extension"
- **Cause** : Vous essayez d'uploader un fichier avec une extension non supportée
- **Solution** : Utilisez le script `create-plugin-archive.ps1` pour créer un fichier `.zip`, ou uploadez directement le dossier `.lrplugin` si votre système le permet

### "File size must not exceed 100MB"
- **Cause** : L'archive est trop volumineuse
- **Solution** : Vérifiez qu'il n'y a pas de fichiers inutiles dans le dossier plugin

### "Version must follow semantic versioning"
- **Cause** : Format de version incorrect
- **Solution** : Utilisez le format `X.Y.Z` (ex: `1.2.0`)

### "Changelog must be 50,000 characters or less"
- **Cause** : Le changelog est trop long
- **Solution** : Réduisez le contenu ou déplacez les anciennes versions dans un fichier d'archive

## Routes de support

Les liens dans le CHANGELOG pointent vers :
- Documentation : `https://piksend.com/docs/lightroom`
- Centre d'aide : `https://piksend.com/help`
- Support email : `support@piksend.com`
- Téléchargement : `https://piksend.com/download/lightroom`

## Notes techniques

- Les fichiers sont uploadés vers Cloudinary dans le dossier `piksend/plugins`
- Les versions beta ne sont visibles qu'avec le paramètre `includeUnstable=true`
- Les versions stables sont automatiquement disponibles pour tous les utilisateurs
- L'upload utilise XMLHttpRequest pour le suivi de progression en temps réel
