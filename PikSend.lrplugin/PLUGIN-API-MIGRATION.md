# Migration vers les nouveaux endpoints API

## Vue d'ensemble

Le plugin Lightroom a été mis à jour pour utiliser les nouveaux endpoints API dédiés au plugin. Cette migration améliore la sécurité, les performances et la fiabilité.

## Changements principaux

### 1. Nouveaux endpoints API

| Ancien endpoint | Nouvel endpoint | Méthode |
|----------------|-----------------|---------|
| `/api/auth/validate-token` | `/api/plugin/auth/validate` | POST |
| `/api/galleries` | `/api/plugin/galleries` | POST |
| `/api/galleries/{id}/images` | `/api/plugin/galleries/{id}/images` | POST |
| `/api/plugin/lightroom/version` | `/api/plugin/version` | GET |

### 2. Changement de l'URL de base

```lua
-- Ancien
PikSendAPI.baseURL = 'https://api.piksend.com'

-- Nouveau
PikSendAPI.baseURL = 'https://piksend.com'
```

### 3. Nouveau flux d'upload

#### Ancien flux (upload direct)
1. Upload de l'image via multipart/form-data vers `/api/galleries/{id}/images`
2. Le serveur traite et stocke l'image

#### Nouveau flux (Cloudinary + enregistrement)
1. Upload de l'image vers Cloudinary (direct)
2. Enregistrement des métadonnées Cloudinary dans la galerie via `/api/plugin/galleries/{id}/images`

**Avantages:**
- Upload plus rapide (CDN Cloudinary)
- Meilleure gestion des erreurs
- Support du batch upload (plusieurs images à la fois)
- Moins de charge sur le serveur PikSend

### 4. Nouveau module: PikSendCloudinaryUpload

Un nouveau module a été créé pour gérer le flux d'upload complet:

```lua
local PikSendCloudinaryUpload = require 'PikSendCloudinaryUpload'

-- Upload multiple images
local success, results = PikSendCloudinaryUpload.uploadImagesToGallery(
  galleryId,
  imagePaths,
  { title = 'Photo', description = 'Description' }
)

-- Upload single image
local success, error = PikSendCloudinaryUpload.uploadSingleImage(
  galleryId,
  imagePath,
  { title = 'Photo' }
)
```

## Modifications des fichiers

### PikSendAPI.lua

**Fonctions modifiées:**
- `validateToken()` - Utilise POST au lieu de GET
- `createGallery()` - Utilise `/api/plugin/galleries` et adapte la réponse
- `checkForUpdates()` - Utilise `/api/plugin/version`

**Nouvelles fonctions:**
- `uploadImagesToGallery()` - Enregistre des images Cloudinary dans une galerie (batch)
- `uploadToCloudinary()` - Upload direct vers Cloudinary

**Fonctions supprimées:**
- `uploadImage()` - Remplacée par le nouveau flux Cloudinary

### PikSendGallery.lua

**Modifications:**
- Adaptation des paramètres de création de galerie (`allow_downloads`, `allow_comments`, `watermark_enabled`)
- Changement de `isPublic` vers les nouveaux paramètres
- Changement de `expiresAt` vers `expires_at`

### PikSendCloudinaryUpload.lua (nouveau)

**Fonctions:**
- `uploadImagesToGallery()` - Upload batch avec progress tracking
- `uploadSingleImage()` - Upload d'une seule image

## Configuration requise

### Variables d'environnement

Le plugin nécessite maintenant la configuration Cloudinary:

```lua
-- Dans Info.lua ou configuration
_PLUGIN.cloudinaryCloudName = 'dvjxn1apr'
_PLUGIN.cloudinaryUploadPreset = 'piksend'
```

Ces valeurs sont déjà configurées par défaut dans le code.

## Migration du code existant

### Exemple 1: Création de galerie

```lua
-- Ancien code
local galleryData = {
  title = 'Ma galerie',
  description = 'Description',
  isPublic = true,
  expiresAt = '2024-12-31T23:59:59Z'
}

-- Nouveau code
local galleryData = {
  title = 'Ma galerie',
  description = 'Description',
  allow_downloads = true,
  allow_comments = true,
  watermark_enabled = false,
  expires_at = '2024-12-31T23:59:59Z'
}
```

### Exemple 2: Upload d'images

```lua
-- Ancien code
for _, imagePath in ipairs(imagePaths) do
  local result, error = PikSendAPI.uploadImage(
    apiToken,
    galleryId,
    imagePath,
    { title = 'Photo' }
  )
end

-- Nouveau code
local PikSendCloudinaryUpload = require 'PikSendCloudinaryUpload'

local success, results = PikSendCloudinaryUpload.uploadImagesToGallery(
  galleryId,
  imagePaths,
  { title = 'Photo' }
)

-- Résultats disponibles:
-- results.uploaded - Nombre d'images uploadées
-- results.failed - Nombre d'échecs
-- results.errors - Liste des erreurs
```

## Compatibilité

### Version minimale requise
- Lightroom Classic: 11.0+
- Plugin PikSend: 1.0.0+

### Rétrocompatibilité
Les anciens endpoints ne sont plus supportés. Tous les utilisateurs doivent mettre à jour vers la nouvelle version du plugin.

## Tests

### Test de validation du token

```lua
local PikSendAPI = require 'PikSendAPI'

local valid, user, error = PikSendAPI.validateToken('pk_live_...')
if valid then
  print('Token valide pour: ' .. user.name)
  print('Plan: ' .. user.planType)
else
  print('Erreur: ' .. (error and error.message or 'Unknown'))
end
```

### Test de création de galerie

```lua
local PikSendAPI = require 'PikSendAPI'

local gallery, error = PikSendAPI.createGallery(
  'pk_live_...',
  {
    title = 'Test Gallery',
    description = 'Test',
    allow_downloads = true
  }
)

if gallery then
  print('Galerie créée: ' .. gallery.id)
else
  print('Erreur: ' .. (error and error.message or 'Unknown'))
end
```

### Test d'upload

```lua
local PikSendCloudinaryUpload = require 'PikSendCloudinaryUpload'

local success, results = PikSendCloudinaryUpload.uploadImagesToGallery(
  'gallery-id',
  {'/path/to/image1.jpg', '/path/to/image2.jpg'},
  { title = 'Test' }
)

print('Uploaded: ' .. results.uploaded)
print('Failed: ' .. results.failed)
```

## Dépannage

### Erreur: "Authentication required"
- Vérifier que l'API key est valide
- Vérifier que l'utilisateur a un plan Pro
- Vérifier que le token n'est pas expiré

### Erreur: "Upload to Cloudinary failed"
- Vérifier la connexion internet
- Vérifier que le fichier existe et est accessible
- Vérifier la taille du fichier (max 500 MB)
- Vérifier la configuration Cloudinary

### Erreur: "Failed to register images in gallery"
- Vérifier que la galerie existe
- Vérifier que l'utilisateur possède la galerie
- Vérifier que l'API key est valide

## Support

Pour toute question ou problème:
1. Consulter la documentation: `/docs/lightroom`
2. Vérifier les logs du plugin: `PikSend.log`
3. Contacter le support: `/support`

## Changelog

### Version 1.1.0 (2024-02-05)
- ✅ Migration vers les nouveaux endpoints API
- ✅ Ajout du support Cloudinary
- ✅ Amélioration du batch upload
- ✅ Meilleure gestion des erreurs
- ✅ Progress tracking amélioré
- ✅ Support du retry automatique
