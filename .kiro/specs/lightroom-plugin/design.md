# Document de Conception - Plugin Adobe Lightroom

## Vue d'ensemble

Le plugin Adobe Lightroom pour PikSend est une extension native développée en Lua qui s'intègre dans Lightroom Classic. Il permet aux photographes Pro d'exporter leurs photos directement vers PikSend sans quitter leur environnement de travail. Le plugin utilise l'API REST de PikSend pour créer des galeries, uploader des photos et synchroniser les métadonnées.

### Objectifs de Conception

1. **Intégration Native**: S'intégrer parfaitement dans l'interface Lightroom
2. **Performance**: Upload rapide et efficace avec gestion parallèle
3. **Fiabilité**: Gestion robuste des erreurs et retry automatique
4. **Sécurité**: Communication chiffrée et stockage sécurisé des credentials
5. **Simplicité**: Interface intuitive nécessitant peu de configuration

## Architecture

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│              Adobe Lightroom Classic                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           PikSend Plugin (Lua)                       │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  UI Layer (Lightroom SDK)                      │ │   │
│  │  │  - Dialogs                                     │ │   │
│  │  │  - Progress Bars                               │ │   │
│  │  │  - Settings Panel                              │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  Business Logic Layer                          │ │   │
│  │  │  - Authentication Manager                      │ │   │
│  │  │  - Gallery Manager                             │ │   │
│  │  │  - Export Manager                              │ │   │
│  │  │  - Sync Manager                                │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  API Client Layer                              │ │   │
│  │  │  - HTTP Client (LuaSocket)                     │ │   │
│  │  │  - Request Builder                             │ │   │
│  │  │  - Response Parser                             │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    PikSend API (REST)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /api/auth/validate-token                       │   │
│  │  GET  /api/galleries                                 │   │
│  │  POST /api/galleries                                 │   │
│  │  POST /api/galleries/:id/images                      │   │
│  │  PUT  /api/galleries/:id                             │   │
│  │  DELETE /api/galleries/:id/images/:imageId           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Structure du Plugin

```
PikSend.lrplugin/
├── Info.lua                          # Métadonnées du plugin
├── PikSendExportServiceProvider.lua  # Export Service Provider
├── PikSendPublishServiceProvider.lua # Publish Service Provider
├── PikSendAPI.lua                    # Client API REST
├── PikSendAuth.lua                   # Gestion authentification
├── PikSendGallery.lua                # Gestion galeries
├── PikSendUpload.lua                 # Gestion uploads
├── PikSendMetadata.lua               # Gestion métadonnées
├── PikSendUI.lua                     # Composants UI
├── PikSendUtils.lua                  # Utilitaires
├── PikSendLogger.lua                 # Système de logs
├── PikSendCache.lua                  # Système de cache
├── resources/
│   ├── icon.png                      # Icône du plugin
│   ├── logo.png                      # Logo PikSend
│   └── watermark-default.png         # Watermark par défaut
└── localization/
    ├── en.lua                        # Traductions anglais
    └── fr.lua                        # Traductions français
```

## Composants Principaux

### 1. Info.lua - Métadonnées du Plugin

```lua
return {
  LrSdkVersion = 6.0,
  LrSdkMinimumVersion = 6.0,
  
  LrToolkitIdentifier = 'com.piksend.lightroom',
  LrPluginName = 'PikSend',
  
  LrExportServiceProvider = {
    title = 'PikSend',
    file = 'PikSendExportServiceProvider.lua',
  },
  
  LrPublishServiceProvider = {
    title = 'PikSend',
    file = 'PikSendPublishServiceProvider.lua',
  },
  
  VERSION = { major = 1, minor = 0, revision = 0 },
}
```

### 2. PikSendAPI.lua - Client API REST

```lua
local LrHttp = import 'LrHttp'
local LrPathUtils = import 'LrPathUtils'
local json = require 'json'

PikSendAPI = {}

-- Configuration
PikSendAPI.baseURL = 'https://api.piksend.com'
PikSendAPI.timeout = 30

-- Authentification
function PikSendAPI.validateToken(apiToken)
  local url = PikSendAPI.baseURL .. '/api/auth/validate-token'
  local headers = {
    { field = 'Authorization', value = 'Bearer ' .. apiToken },
    { field = 'Content-Type', value = 'application/json' },
  }
  
  local response, hdrs = LrHttp.get(url, headers)
  
  if response then
    local data = json.decode(response)
    return data.valid, data.user
  end
  
  return false, nil
end

-- Récupérer les galeries
function PikSendAPI.getGalleries(apiToken)
  local url = PikSendAPI.baseURL .. '/api/galleries'
  local headers = {
    { field = 'Authorization', value = 'Bearer ' .. apiToken },
  }
  
  local response, hdrs = LrHttp.get(url, headers)
  
  if response then
    return json.decode(response)
  end
  
  return nil
end

-- Créer une galerie
function PikSendAPI.createGallery(apiToken, galleryData)
  local url = PikSendAPI.baseURL .. '/api/galleries'
  local headers = {
    { field = 'Authorization', value = 'Bearer ' .. apiToken },
    { field = 'Content-Type', value = 'application/json' },
  }
  
  local body = json.encode(galleryData)
  local response, hdrs = LrHttp.post(url, body, headers)
  
  if response then
    return json.decode(response)
  end
  
  return nil
end

-- Uploader une image
function PikSendAPI.uploadImage(apiToken, galleryId, imagePath, metadata)
  local url = PikSendAPI.baseURL .. '/api/galleries/' .. galleryId .. '/images'
  
  -- Multipart form data
  local boundary = 'LrBoundary' .. os.time()
  local headers = {
    { field = 'Authorization', value = 'Bearer ' .. apiToken },
    { field = 'Content-Type', value = 'multipart/form-data; boundary=' .. boundary },
  }
  
  -- Construction du body multipart
  local body = buildMultipartBody(boundary, imagePath, metadata)
  
  local response, hdrs = LrHttp.post(url, body, headers, 'POST', PikSendAPI.timeout)
  
  if response then
    return json.decode(response)
  end
  
  return nil
end

return PikSendAPI
```

### 3. PikSendAuth.lua - Gestion Authentification

```lua
local LrDialogs = import 'LrDialogs'
local LrPrefs = import 'LrPrefs'
local LrFunctionContext = import 'LrFunctionContext'

PikSendAuth = {}

-- Stocker le token de manière sécurisée
function PikSendAuth.saveToken(apiToken)
  local prefs = LrPrefs.prefsForPlugin()
  -- TODO: Chiffrer le token avant stockage
  prefs.apiToken = apiToken
end

-- Récupérer le token
function PikSendAuth.getToken()
  local prefs = LrPrefs.prefsForPlugin()
  return prefs.apiToken
end

-- Supprimer le token
function PikSendAuth.clearToken()
  local prefs = LrPrefs.prefsForPlugin()
  prefs.apiToken = nil
  prefs.userName = nil
end

-- Dialog d'authentification
function PikSendAuth.showLoginDialog()
  LrFunctionContext.callWithContext('showLoginDialog', function(context)
    local f = LrView.osFactory()
    
    local properties = LrBinding.makePropertyTable(context)
    properties.apiToken = ''
    
    local contents = f:column {
      bind_to_object = properties,
      spacing = f:control_spacing(),
      
      f:static_text {
        title = 'Connectez-vous à votre compte PikSend Pro',
        font = '<system/bold>',
      },
      
      f:static_text {
        title = 'Générez un token API depuis votre dashboard PikSend:',
        width_in_chars = 50,
      },
      
      f:row {
        f:push_button {
          title = 'Ouvrir le Dashboard',
          action = function()
            LrHttp.openUrlInBrowser('https://piksend.com/dashboard/settings/api')
          end,
        },
      },
      
      f:spacer { height = 10 },
      
      f:static_text {
        title = 'Token API:',
      },
      
      f:password_field {
        value = LrView.bind('apiToken'),
        width_in_chars = 50,
      },
    }
    
    local result = LrDialogs.presentModalDialog {
      title = 'Connexion PikSend',
      contents = contents,
    }
    
    if result == 'ok' then
      local token = properties.apiToken
      
      -- Valider le token
      local valid, user = PikSendAPI.validateToken(token)
      
      if valid then
        -- Vérifier le plan Pro
        if user.planType ~= 'pro' then
          LrDialogs.message('Plan Pro requis', 'Le plugin Lightroom est réservé aux utilisateurs Pro. Veuillez upgrader votre plan.', 'critical')
          return false
        end
        
        PikSendAuth.saveToken(token)
        
        local prefs = LrPrefs.prefsForPlugin()
        prefs.userName = user.name
        prefs.userEmail = user.email
        
        LrDialogs.message('Connexion réussie', 'Bienvenue ' .. user.name .. '!', 'info')
        return true
      else
        LrDialogs.message('Erreur d\'authentification', 'Token API invalide. Veuillez vérifier et réessayer.', 'critical')
        return false
      end
    end
    
    return false
  end)
end

return PikSendAuth
```

### 4. PikSendExportServiceProvider.lua - Export Service

```lua
local LrView = import 'LrView'
local LrBinding = import 'LrBinding'
local LrDialogs = import 'LrDialogs'
local LrTasks = import 'LrTasks'
local LrFileUtils = import 'LrFileUtils'
local LrPathUtils = import 'LrPathUtils'

require 'PikSendAPI'
require 'PikSendAuth'
require 'PikSendGallery'
require 'PikSendUpload'

PikSendExportServiceProvider = {}

-- Sections de configuration
function PikSendExportServiceProvider.sectionsForTopOfDialog(f, propertyTable)
  return {
    {
      title = 'Compte PikSend',
      
      f:row {
        f:static_text {
          title = LrView.bind {
            key = 'userName',
            transform = function(value, fromTable)
              if value then
                return 'Connecté en tant que: ' .. value
              else
                return 'Non connecté'
              end
            end,
          },
        },
        
        f:push_button {
          title = LrView.bind {
            key = 'userName',
            transform = function(value)
              return value and 'Déconnexion' or 'Connexion'
            end,
          },
          action = function()
            if propertyTable.userName then
              PikSendAuth.clearToken()
              propertyTable.userName = nil
            else
              if PikSendAuth.showLoginDialog() then
                local prefs = LrPrefs.prefsForPlugin()
                propertyTable.userName = prefs.userName
              end
            end
          end,
        },
      },
    },
    
    {
      title = 'Galerie de destination',
      
      f:row {
        f:popup_menu {
          value = LrView.bind('selectedGallery'),
          items = LrView.bind('galleries'),
          width_in_chars = 40,
        },
        
        f:push_button {
          title = 'Rafraîchir',
          action = function()
            PikSendGallery.refreshGalleries(propertyTable)
          end,
        },
        
        f:push_button {
          title = 'Nouvelle galerie',
          action = function()
            PikSendGallery.showCreateGalleryDialog(propertyTable)
          end,
        },
      },
    },
    
    {
      title = 'Paramètres d\'export',
      
      f:row {
        f:static_text { title = 'Format:' },
        f:popup_menu {
          value = LrView.bind('exportFormat'),
          items = {
            { title = 'JPEG', value = 'jpeg' },
            { title = 'PNG', value = 'png' },
            { title = 'TIFF', value = 'tiff' },
          },
        },
      }

      
      f:row {
        f:static_text { title = 'Qualité JPEG:' },
        f:slider {
          value = LrView.bind('jpegQuality'),
          min = 1,
          max = 100,
        },
      },
    },
  }
end

-- Processus d'export
function PikSendExportServiceProvider.processRenderedPhotos(functionContext, exportContext)
  local exportSession = exportContext.exportSession
  local exportSettings = exportContext.propertyTable
  
  local apiToken = PikSendAuth.getToken()
  if not apiToken then
    LrDialogs.message('Non authentifié', 'Veuillez vous connecter à votre compte PikSend.', 'critical')
    return
  end
  
  local galleryId = exportSettings.selectedGallery
  if not galleryId then
    LrDialogs.message('Aucune galerie sélectionnée', 'Veuillez sélectionner ou créer une galerie.', 'critical')
    return
  end
  
  local nPhotos = exportSession:countRenditions()
  local progressScope = exportContext:configureProgress {
    title = 'Upload vers PikSend',
  }
  
  for i, rendition in exportContext:renditions() do
    local success, pathOrMessage = rendition:waitForRender()
    
    if success then
      local photo = rendition.photo
      local metadata = PikSendMetadata.extractMetadata(photo, exportSettings)
      
      progressScope:setPortionComplete(i - 1, nPhotos)
      progressScope:setCaption('Upload ' .. i .. ' sur ' .. nPhotos)
      
      local result = PikSendAPI.uploadImage(apiToken, galleryId, pathOrMessage, metadata)
      
      if result then
        rendition:recordPublishedPhotoId(result.imageId)
      else
        rendition:recordPublishError('Échec de l\'upload')
      end
      
      -- Nettoyer le fichier temporaire
      LrFileUtils.delete(pathOrMessage)
    end
  end
  
  progressScope:done()
end

return PikSendExportServiceProvider
```

## Composants et Interfaces

### Interfaces API REST

#### POST /api/auth/validate-token
```typescript
Request:
  Headers: { Authorization: "Bearer <token>" }

Response:
  {
    valid: boolean
    user?: {
      id: string
      name: string
      email: string
      planType: "free" | "pro"
    }
  }
```

#### GET /api/galleries
```typescript
Request:
  Headers: { Authorization: "Bearer <token>" }

Response:
  {
    galleries: Array<{
      id: string
      title: string
      description?: string
      imageCount: number
      createdAt: string
      expiresAt?: string
      status: "active" | "expired"
    }>
  }
```

#### POST /api/galleries
```typescript
Request:
  Headers: { Authorization: "Bearer <token>", Content-Type: "application/json" }
  Body: {
    title: string
    description?: string
    expiresAt?: string
    password?: string
    isPublic: boolean
  }

Response:
  {
    id: string
    title: string
    shareUrl: string
  }
```

#### POST /api/galleries/:id/images
```typescript
Request:
  Headers: { Authorization: "Bearer <token>", Content-Type: "multipart/form-data" }
  Body: FormData {
    image: File
    title?: string
    description?: string
    altText?: string
    keywords?: string[]
    exif?: object
  }

Response:
  {
    imageId: string
    url: string
    thumbnailUrl: string
  }
```

## Modèles de Données

### Configuration du Plugin
```lua
PluginPreferences = {
  apiToken: string,
  userName: string,
  userEmail: string,
  lastGalleryId: string,
  exportPresets: Array<ExportPreset>,
  debugMode: boolean,
  maxConcurrentUploads: number (1-5),
  autoCheckUpdates: boolean,
}
```

### Preset d'Export
```lua
ExportPreset = {
  name: string,
  format: "jpeg" | "png" | "tiff",
  jpegQuality: number (1-100),
  resize: {
    enabled: boolean,
    maxWidth: number,
    maxHeight: number,
  },
  watermark: {
    enabled: boolean,
    imagePath: string,
    position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "center",
    opacity: number (0-100),
  },
  metadata: {
    includeTitle: boolean,
    includeDescription: boolean,
    includeKeywords: boolean,
    includeCopyright: boolean,
    includeExif: boolean,
    includeGPS: boolean,
  },
}
```

### État d'Upload
```lua
UploadState = {
  photos: Array<PhotoUploadState>,
  totalCount: number,
  completedCount: number,
  failedCount: number,
  totalSize: number,
  uploadedSize: number,
  startTime: number,
  isPaused: boolean,
  isCancelled: boolean,
}

PhotoUploadState = {
  photoId: string,
  path: string,
  size: number,
  status: "pending" | "uploading" | "completed" | "failed",
  progress: number (0-100),
  error?: string,
}
```


## Propriétés de Correction

*Une propriété est une caractéristique ou un comportement qui doit être vrai pour toutes les exécutions valides d'un système - essentiellement, une déclaration formelle sur ce que le système devrait faire. Les propriétés servent de pont entre les spécifications lisibles par l'homme et les garanties de correction vérifiables par machine.*

### Propriété 1: Validation de compatibilité de version Lightroom
*Pour toute* version de Lightroom, la fonction de vérification de compatibilité doit retourner `true` si la version est >= 11.0 et `false` sinon
**Valide: Exigences 1.7**

### Propriété 2: Validation de token API
*Pour tout* token API, lorsqu'il est soumis pour validation, le plugin doit faire un appel à l'API PikSend et retourner le résultat de validation
**Valide: Exigences 2.3**

### Propriété 3: Récupération des informations utilisateur
*Pour tout* token API valide, après validation réussie, le plugin doit récupérer et stocker le nom et l'email de l'utilisateur
**Valide: Exigences 2.4**

### Propriété 4: Round-trip du stockage de token
*Pour tout* token API, après l'avoir stocké puis récupéré des préférences, le token récupéré doit être identique au token original
**Valide: Exigences 2.6**

### Propriété 5: Vérification du plan Pro
*Pour tout* utilisateur authentifié, le plugin doit vérifier que le champ `planType` est égal à "pro" avant d'autoriser l'utilisation
**Valide: Exigences 2.7**

### Propriété 6: Effacement du token lors de la déconnexion
*Pour tout* état authentifié, après déconnexion, le token et les informations utilisateur doivent être supprimés des préférences
**Valide: Exigences 2.9**

### Propriété 7: Rafraîchissement automatique du token
*Pour tout* token expiré avec un refresh token disponible, le plugin doit tenter de rafraîchir le token automatiquement
**Valide: Exigences 2.10**

### Propriété 8: Validation du titre de galerie
*Pour toute* chaîne de caractères, la validation du titre de galerie doit accepter les titres de 1-200 caractères et rejeter ceux en dehors de cette plage
**Valide: Exigences 3.4**

### Propriété 9: Création de galerie via API
*Pour toutes* données de galerie valides, l'appel de création doit retourner un ID de galerie non vide
**Valide: Exigences 3.5**

### Propriété 10: Recherche de galerie par nom
*Pour toute* requête de recherche et liste de galeries, les résultats doivent contenir uniquement les galeries dont le titre contient la requête (insensible à la casse)
**Valide: Exigences 3.6**

### Propriété 11: Affichage complet des informations de galerie
*Pour toute* galerie, la représentation affichée doit contenir: titre, nombre d'images, date de création, et statut
**Valide: Exigences 3.7**

### Propriété 12: Tri des galeries par date
*Pour toute* liste de galeries, après tri par défaut, les galeries doivent être ordonnées par date de création décroissante
**Valide: Exigences 3.8**

### Propriété 13: Cache des galeries
*Pour toute* liste de galeries récupérée, les requêtes subséquentes dans un délai de 5 minutes doivent utiliser le cache au lieu de faire un nouvel appel API
**Valide: Exigences 3.10**

### Propriété 14: Round-trip des presets d'export
*Pour tout* preset de configuration d'export, après sauvegarde puis chargement, le preset chargé doit être identique au preset original
**Valide: Exigences 4.8**

### Propriété 15: Validation de la taille maximale
*Pour tout* fichier, la validation doit rejeter les fichiers > 500 MB et accepter ceux <= 500 MB
**Valide: Exigences 4.10**

### Propriété 16: Calcul du nombre et de la taille totale
*Pour toute* sélection de photos, le nombre affiché doit égaler le nombre de photos sélectionnées et la taille totale doit égaler la somme des tailles individuelles
**Valide: Exigences 5.3**

### Propriété 17: Application des paramètres d'export
*Pour toute* configuration d'export et photo, la photo exportée doit respecter le format, la qualité et les dimensions spécifiés dans la configuration
**Valide: Exigences 5.4**

### Propriété 18: Format multipart/form-data
*Pour toute* photo uploadée, la requête HTTP doit utiliser le Content-Type "multipart/form-data" et inclure le fichier image
**Valide: Exigences 5.6**

### Propriété 19: Limite d'uploads parallèles
*À tout* moment pendant l'upload, le nombre d'uploads actifs simultanés ne doit jamais dépasser la limite configurée (par défaut 3)
**Valide: Exigences 5.7**

### Propriété 20: Gestion des erreurs d'upload
*Pour toute* erreur d'upload (timeout, connexion perdue, erreur serveur), le plugin doit capturer l'erreur et permettre un retry
**Valide: Exigences 5.8**

### Propriété 21: Mécanisme de retry
*Pour toute* photo dont l'upload a échoué, le plugin doit permettre de réessayer l'upload sans re-exporter la photo
**Valide: Exigences 5.9**

### Propriété 22: Nettoyage des fichiers temporaires
*Pour toute* photo uploadée avec succès, le fichier temporaire correspondant doit être supprimé du système de fichiers
**Valide: Exigences 5.10**

### Propriété 23: Calcul de la progression globale
*Pour tout* état d'upload, le pourcentage de progression doit être égal à (uploadedSize / totalSize) * 100
**Valide: Exigences 6.1, 6.2, 6.3**

### Propriété 24: Calcul de la vitesse d'upload
*Pour tout* état d'upload, la vitesse doit être calculée comme (uploadedSize / tempsÉcoulé) en MB/s
**Valide: Exigences 6.4**

### Propriété 25: Estimation du temps restant
*Pour tout* état d'upload avec vitesse > 0, le temps restant doit être calculé comme (tailleRestante / vitesse)
**Valide: Exigences 6.5**

### Propriété 26: Suivi du statut des photos
*Pour toute* photo dans un upload, son statut doit être l'un de: "pending", "uploading", "completed", ou "failed"
**Valide: Exigences 6.6**

### Propriété 27: Pause de l'upload
*Pour tout* upload en cours, après mise en pause, aucun nouvel upload ne doit démarrer jusqu'à la reprise
**Valide: Exigences 6.7**

### Propriété 28: Reprise de l'upload
*Pour tout* upload en pause, après reprise, les uploads doivent continuer à partir de l'état sauvegardé
**Valide: Exigences 6.8**

### Propriété 29: Annulation de l'upload
*Pour tout* upload en cours, après annulation, tous les uploads actifs doivent s'arrêter et les fichiers temporaires doivent être nettoyés
**Valide: Exigences 6.9**

### Propriété 30: Marquage des photos à publier
*Pour toute* photo ajoutée à une Published Collection, son statut doit être marqué comme "à publier"
**Valide: Exigences 7.3**

### Propriété 31: Upload sélectif des photos modifiées
*Pour toute* Published Collection, lors de la publication, seules les photos avec le statut "à publier" ou "modifié" doivent être uploadées
**Valide: Exigences 7.4**

### Propriété 32: Détection des modifications
*Pour toute* photo dans une Published Collection, si ses métadonnées ou son contenu changent, son statut doit passer à "modifié"
**Valide: Exigences 7.5**

### Propriété 33: Suppression synchronisée
*Pour toute* photo supprimée d'une Published Collection, un appel API DELETE doit être fait pour supprimer la photo de la galerie PikSend
**Valide: Exigences 7.6**

### Propriété 34: Transfert complet des métadonnées
*Pour toute* photo avec métadonnées (titre, description, mots-clés, copyright, EXIF), toutes les métadonnées activées dans la configuration doivent être incluses dans la requête d'upload
**Valide: Exigences 8.1, 8.2, 8.3, 8.4, 8.5**

### Propriété 35: Respect de la confidentialité de la géolocalisation
*Pour toute* photo, si le transfert de géolocalisation est désactivé dans les paramètres, les données GPS ne doivent pas être incluses dans les métadonnées uploadées
**Valide: Exigences 8.7**

### Propriété 36: Génération d'alt-text
*Pour toute* photo avec un titre ou une description, un alt-text doit être généré automatiquement en combinant ces informations
**Valide: Exigences 8.8**

### Propriété 37: Application des métadonnées par défaut
*Pour toute* photo dans un export, si des métadonnées par défaut sont définies, elles doivent être appliquées aux photos qui n'ont pas ces métadonnées
**Valide: Exigences 8.9**

### Propriété 38: Préservation de l'ordre des photos
*Pour toute* collection de photos, l'ordre d'upload doit correspondre à l'ordre dans la collection Lightroom
**Valide: Exigences 8.10**

### Propriété 39: Logging complet des erreurs et debug
*Pour toute* erreur ou événement de debug (si activé), une entrée doit être ajoutée au fichier de log avec timestamp, niveau, et message
**Valide: Exigences 9.2, 9.3**

### Propriété 40: Rotation automatique des logs
*Pour tout* fichier de log, lorsque sa taille dépasse 10 MB, une rotation doit être effectuée automatiquement
**Valide: Exigences 9.6**

### Propriété 41: Affichage des messages d'erreur API
*Pour toute* réponse d'erreur de l'API PikSend, le message d'erreur de l'API doit être extrait et affiché à l'utilisateur
**Valide: Exigences 9.7**

### Propriété 42: Configuration de la limite d'uploads simultanés
*Pour toute* valeur de configuration d'uploads simultanés, elle doit être dans la plage 1-5, sinon elle doit être rejetée
**Valide: Exigences 10.2**

### Propriété 43: Compression conditionnelle
*Pour toute* photo avec qualité JPEG < 100, une compression doit être appliquée avant l'upload
**Valide: Exigences 10.3**

### Propriété 44: Détection de doublons par hash
*Pour toute* photo, un hash MD5 doit être calculé et utilisé pour détecter si la photo a déjà été uploadée
**Valide: Exigences 10.4, 10.5**

### Propriété 45: Backoff exponentiel pour les retries
*Pour tout* retry après échec, le délai d'attente doit suivre une progression exponentielle (ex: 1s, 2s, 4s, 8s)
**Valide: Exigences 10.7**

### Propriété 46: Utilisation exclusive de HTTPS
*Pour toute* URL d'API construite, elle doit commencer par "https://" et non "http://"
**Valide: Exigences 11.1**

### Propriété 47: Sanitisation des logs
*Pour toute* entrée de log, le token API ne doit jamais apparaître en clair (doit être masqué ou omis)
**Valide: Exigences 11.3**

### Propriété 48: Restriction des requêtes réseau
*Pour toute* requête HTTP sortante, l'URL de destination doit être dans le domaine PikSend (api.piksend.com)
**Valide: Exigences 11.6**

### Propriété 49: Vérification des mises à jour
*Au* démarrage de Lightroom, le plugin doit faire un appel API pour vérifier la disponibilité d'une nouvelle version
**Valide: Exigences 12.1**

### Propriété 50: Notification de mise à jour disponible
*Pour toute* vérification de mise à jour, si une version plus récente est disponible, une notification doit être affichée
**Valide: Exigences 12.2**

### Propriété 51: Configuration complète de galerie
*Pour toute* galerie, les paramètres de protection par mot de passe, expiration, watermark, et visibilité doivent être envoyés à l'API lors de la création ou modification
**Valide: Exigences 14.1, 14.2, 14.3, 14.4**

### Propriété 52: Génération de lien de partage
*Pour toute* galerie créée ou sélectionnée, un lien de partage doit être généré au format https://piksend.com/g/{galleryId}
**Valide: Exigences 14.5**

### Propriété 53: Récupération des statistiques de galerie
*Pour toute* galerie, les statistiques (vues, téléchargements) doivent être récupérées via l'API et affichées
**Valide: Exigences 14.7**

### Propriété 54: Synchronisation bidirectionnelle
*Pour toute* galerie, les modifications faites sur PikSend (ajout/suppression de photos, changement de paramètres) doivent être synchronisées vers Lightroom lors du rafraîchissement
**Valide: Exigences 14.10**


## Gestion des Erreurs

### Catégories d'Erreurs

#### 1. Erreurs d'Authentification
- **Token invalide**: Afficher un message clair et rediriger vers la page de connexion
- **Token expiré**: Tenter le rafraîchissement automatique, sinon demander une nouvelle authentification
- **Plan non-Pro**: Afficher un message invitant à upgrader avec un lien vers la page de tarification

#### 2. Erreurs Réseau
- **Timeout**: Implémenter un retry automatique avec backoff exponentiel (max 3 tentatives)
- **Connexion perdue**: Mettre l'upload en pause et afficher un message, permettre la reprise manuelle
- **Erreur serveur (5xx)**: Logger l'erreur, afficher un message générique, permettre le retry

#### 3. Erreurs de Validation
- **Titre de galerie invalide**: Afficher un message d'erreur inline avec les contraintes (1-200 caractères)
- **Fichier trop volumineux**: Afficher la taille du fichier et la limite (500 MB), suggérer de réduire la qualité
- **Format non supporté**: Lister les formats acceptés (JPEG, PNG, TIFF)

#### 4. Erreurs d'Upload
- **Échec d'upload individuel**: Marquer la photo comme "failed", permettre le retry sans re-exporter
- **Quota de stockage atteint**: Afficher un message avec l'utilisation actuelle et inviter à upgrader ou libérer de l'espace
- **Galerie expirée**: Afficher un message et suggérer de créer une nouvelle galerie

#### 5. Erreurs Système
- **Erreur d'écriture de fichier**: Vérifier les permissions, afficher un message avec le chemin du fichier
- **Mémoire insuffisante**: Réduire le nombre d'uploads simultanés, afficher un message d'avertissement
- **Erreur Lightroom SDK**: Logger l'erreur complète, afficher un message générique, suggérer de redémarrer Lightroom

### Stratégie de Logging

```lua
-- Niveaux de log
LogLevel = {
  ERROR = 1,   -- Erreurs critiques
  WARN = 2,    -- Avertissements
  INFO = 3,    -- Informations générales
  DEBUG = 4,   -- Détails de débogage
}

-- Format des logs
-- [2024-01-15 14:30:45] [ERROR] PikSendAPI: Upload failed for photo IMG_1234.jpg - Network timeout
-- [2024-01-15 14:30:46] [INFO] PikSendUpload: Retrying upload (attempt 2/3)
-- [2024-01-15 14:30:50] [DEBUG] PikSendAPI: POST /api/galleries/abc123/images - 200 OK (1.2s)
```

### Gestion des Erreurs Asynchrones

Le plugin utilise `LrTasks` pour gérer les opérations asynchrones. Toutes les erreurs dans les tâches asynchrones doivent être capturées avec `pcall` et loggées:

```lua
LrTasks.startAsyncTask(function()
  local success, result = pcall(function()
    return PikSendAPI.uploadImage(token, galleryId, imagePath, metadata)
  end)
  
  if not success then
    PikSendLogger.error('Upload failed: ' .. tostring(result))
    -- Afficher un message d'erreur à l'utilisateur
    LrDialogs.message('Erreur d\'upload', result, 'critical')
  end
end)
```

## Stratégie de Test

### Approche Duale de Test

Le plugin sera testé avec une combinaison de tests unitaires et de tests basés sur les propriétés:

- **Tests unitaires**: Vérifient des exemples spécifiques, des cas limites et des conditions d'erreur
- **Tests basés sur les propriétés**: Vérifient les propriétés universelles à travers de nombreuses entrées générées

Les deux approches sont complémentaires et nécessaires pour une couverture complète.

### Tests Unitaires

Les tests unitaires se concentrent sur:
- **Exemples spécifiques**: Cas d'utilisation typiques et scénarios réels
- **Cas limites**: Valeurs aux frontières (chaînes vides, tailles maximales, etc.)
- **Conditions d'erreur**: Gestion des erreurs réseau, tokens invalides, etc.
- **Points d'intégration**: Interactions entre composants

**Framework**: Busted (framework de test Lua)

**Exemples de tests unitaires**:
```lua
describe("PikSendAuth", function()
  it("should reject empty token", function()
    local valid, user = PikSendAPI.validateToken("")
    assert.is_false(valid)
    assert.is_nil(user)
  end)
  
  it("should handle network timeout gracefully", function()
    -- Mock network timeout
    local valid, user = PikSendAPI.validateToken("test-token")
    assert.is_false(valid)
    -- Vérifier que l'erreur est loggée
  end)
  
  it("should display error message for non-Pro user", function()
    -- Test que le message d'erreur approprié est affiché
  end)
end)
```

### Tests Basés sur les Propriétés

Les tests basés sur les propriétés vérifient que les propriétés de correction définies dans la section précédente sont respectées pour toutes les entrées valides.

**Framework**: QuickCheck pour Lua (ou implémentation custom)

**Configuration**:
- Minimum 100 itérations par test de propriété
- Chaque test doit référencer sa propriété du document de design
- Format de tag: **Feature: lightroom-plugin, Property {number}: {property_text}**

**Exemples de tests de propriétés**:
```lua
describe("Property Tests", function()
  -- Feature: lightroom-plugin, Property 8: Validation du titre de galerie
  it("Property 8: validates gallery title length constraints", function()
    for i = 1, 100 do
      local title = generateRandomString(math.random(0, 250))
      local isValid = PikSendGallery.validateTitle(title)
      
      if #title >= 1 and #title <= 200 then
        assert.is_true(isValid)
      else
        assert.is_false(isValid)
      end
    end
  end)
  
  -- Feature: lightroom-plugin, Property 14: Round-trip des presets d'export
  it("Property 14: export preset round-trip preserves data", function()
    for i = 1, 100 do
      local preset = generateRandomPreset()
      PikSendExport.savePreset(preset)
      local loaded = PikSendExport.loadPreset(preset.name)
      
      assert.are.same(preset, loaded)
    end
  end)
  
  -- Feature: lightroom-plugin, Property 19: Limite d'uploads parallèles
  it("Property 19: never exceeds concurrent upload limit", function()
    for i = 1, 100 do
      local photos = generateRandomPhotos(math.random(10, 50))
      local maxConcurrent = 3
      
      local activeUploads = simulateUpload(photos, maxConcurrent)
      
      -- À tout moment, vérifier que activeUploads <= maxConcurrent
      assert.is_true(activeUploads <= maxConcurrent)
    end
  end)
end)
```

### Tests d'Intégration

Les tests d'intégration vérifient l'interaction entre le plugin et l'API PikSend réelle (ou un mock):

1. **Flux d'authentification complet**: De la saisie du token à la récupération des galeries
2. **Flux d'export complet**: De la sélection des photos à l'upload réussi
3. **Flux de synchronisation**: Publish Service avec détection des modifications
4. **Gestion des erreurs réseau**: Simulation de timeouts et reconnexions

### Tests Manuels

Certains aspects nécessitent des tests manuels:
- **Compatibilité multi-plateforme**: Windows 10/11, macOS 10.15+
- **Compatibilité Lightroom**: Versions 11.0, 12.0, 13.0
- **Interface utilisateur**: Ergonomie, clarté des messages, responsive design
- **Performance**: Temps de réponse, utilisation mémoire, fluidité de l'interface

### Couverture de Test

Objectifs de couverture:
- **Couverture de code**: Minimum 80% pour les modules critiques (API, Auth, Upload)
- **Couverture des propriétés**: 100% des propriétés de correction doivent avoir un test
- **Couverture des exigences**: 100% des critères d'acceptation testables doivent être couverts

### Environnement de Test

```
tests/
├── unit/
│   ├── test_api.lua
│   ├── test_auth.lua
│   ├── test_gallery.lua
│   ├── test_upload.lua
│   ├── test_metadata.lua
│   └── test_logger.lua
├── property/
│   ├── test_properties_auth.lua
│   ├── test_properties_gallery.lua
│   ├── test_properties_upload.lua
│   └── test_properties_metadata.lua
├── integration/
│   ├── test_full_export_flow.lua
│   ├── test_publish_service.lua
│   └── test_error_handling.lua
├── mocks/
│   ├── mock_api.lua
│   ├── mock_lightroom_sdk.lua
│   └── mock_http.lua
└── helpers/
    ├── generators.lua  -- Générateurs de données aléatoires
    └── assertions.lua  -- Assertions personnalisées
```

### Automatisation des Tests

- **CI/CD**: Intégrer les tests dans un pipeline CI/CD (GitHub Actions)
- **Tests pré-commit**: Exécuter les tests unitaires avant chaque commit
- **Tests de régression**: Exécuter tous les tests avant chaque release
- **Tests de performance**: Benchmarks réguliers pour détecter les régressions de performance

