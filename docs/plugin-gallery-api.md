# Plugin Gallery API

Documentation des endpoints API pour créer et gérer des galeries depuis le plugin Lightroom.

## Vue d'ensemble

Le plugin Lightroom peut créer des galeries et uploader des images en utilisant l'authentification par API key. Ces endpoints sont séparés des endpoints web standards pour permettre une authentification différente (Bearer token vs session cookies).

## Authentification

Tous les endpoints du plugin nécessitent une API key valide dans le header `Authorization`:

```
Authorization: Bearer pk_live_<votre_api_key>
```

### Obtenir une API key

1. L'utilisateur doit avoir un plan **Pro**
2. Se connecter au dashboard PikSend
3. Aller dans **Settings → API Keys**
4. Cliquer sur **Create API Key**
5. Copier la clé (elle ne sera affichée qu'une seule fois)

## Endpoints

### 1. Créer une galerie

**Endpoint:** `POST /api/plugin/galleries`

**Headers:**
```
Authorization: Bearer pk_live_<api_key>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Mon shooting photo",
  "description": "Photos du mariage de Jean et Marie",
  "password": "secret123",
  "expires_at": "2024-12-31T23:59:59Z",
  "allow_downloads": true,
  "allow_comments": true,
  "watermark_enabled": false
}
```

**Champs:**
- `title` (requis): Titre de la galerie
- `description` (optionnel): Description de la galerie
- `password` (optionnel): Mot de passe pour protéger la galerie
- `expires_at` (optionnel): Date d'expiration au format ISO 8601
- `allow_downloads` (optionnel): Autoriser les téléchargements (défaut: true)
- `allow_comments` (optionnel): Autoriser les commentaires (défaut: true)
- `watermark_enabled` (optionnel): Activer le watermark (défaut: false)

**Réponse (201 Created):**
```json
{
  "success": true,
  "gallery": {
    "id": "uuid-de-la-galerie",
    "user_id": "uuid-utilisateur",
    "title": "Mon shooting photo",
    "description": "Photos du mariage de Jean et Marie",
    "slug": "mon-shooting-photo-abc123",
    "password_hash": "...",
    "expires_at": "2024-12-31T23:59:59Z",
    "allow_downloads": true,
    "allow_comments": true,
    "watermark_enabled": false,
    "is_active": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

**Erreurs:**
- `400`: Body invalide ou header Authorization manquant
- `401`: API key invalide ou expirée
- `403`: Utilisateur non-Pro
- `500`: Erreur serveur

### 2. Uploader des images dans une galerie

**Endpoint:** `POST /api/plugin/galleries/{gallery_id}/images`

**Headers:**
```
Authorization: Bearer pk_live_<api_key>
Content-Type: application/json
```

**Body:**
```json
{
  "images": [
    {
      "cloudinary_public_id": "piksend/galleries/abc123/image1",
      "cloudinary_url": "https://res.cloudinary.com/.../image1.jpg",
      "title": "Photo 1",
      "description": "Description de la photo",
      "width": 1920,
      "height": 1080,
      "format": "jpg",
      "size": 1048576
    },
    {
      "cloudinary_public_id": "piksend/galleries/abc123/image2",
      "cloudinary_url": "https://res.cloudinary.com/.../image2.jpg",
      "width": 1920,
      "height": 1080,
      "format": "jpg",
      "size": 987654
    }
  ]
}
```

**Champs pour chaque image:**
- `cloudinary_public_id` (requis): ID public Cloudinary de l'image
- `cloudinary_url` (requis): URL Cloudinary de l'image
- `title` (optionnel): Titre de l'image
- `description` (optionnel): Description de l'image
- `width` (optionnel): Largeur en pixels
- `height` (optionnel): Hauteur en pixels
- `format` (optionnel): Format de l'image (jpg, png, etc.)
- `size` (optionnel): Taille du fichier en octets

**Réponse (201 Created):**
```json
{
  "success": true,
  "images": [
    {
      "id": "uuid-image-1",
      "gallery_id": "uuid-galerie",
      "cloudinary_public_id": "piksend/galleries/abc123/image1",
      "cloudinary_url": "https://res.cloudinary.com/.../image1.jpg",
      "title": "Photo 1",
      "description": "Description de la photo",
      "width": 1920,
      "height": 1080,
      "format": "jpg",
      "size": 1048576,
      "order_index": 0,
      "created_at": "2024-01-15T10:05:00Z"
    },
    {
      "id": "uuid-image-2",
      "gallery_id": "uuid-galerie",
      "cloudinary_public_id": "piksend/galleries/abc123/image2",
      "cloudinary_url": "https://res.cloudinary.com/.../image2.jpg",
      "width": 1920,
      "height": 1080,
      "format": "jpg",
      "size": 987654,
      "order_index": 1,
      "created_at": "2024-01-15T10:05:00Z"
    }
  ],
  "count": 2
}
```

**Erreurs:**
- `400`: Body invalide ou header Authorization manquant
- `401`: API key invalide ou expirée
- `403`: Utilisateur non-Pro ou ne possède pas la galerie
- `404`: Galerie non trouvée
- `500`: Erreur serveur

## Flux de travail complet

### 1. Depuis Lightroom

```lua
-- 1. Valider l'API key
local validateResponse = LrHttp.post(
  "https://piksend.com/api/plugin/auth/validate",
  "",
  {
    { field = "Authorization", value = "Bearer " .. apiKey }
  }
)

-- 2. Créer une galerie
local galleryData = {
  title = "Mon shooting",
  description = "Photos du jour",
  allow_downloads = true
}

local createResponse = LrHttp.post(
  "https://piksend.com/api/plugin/galleries",
  JSON:encode(galleryData),
  {
    { field = "Authorization", value = "Bearer " .. apiKey },
    { field = "Content-Type", value = "application/json" }
  }
)

local gallery = JSON:decode(createResponse).gallery

-- 3. Uploader les images vers Cloudinary
-- (utiliser l'API Cloudinary directement)

-- 4. Enregistrer les images dans la galerie
local imagesData = {
  images = {
    {
      cloudinary_public_id = "piksend/galleries/abc/img1",
      cloudinary_url = "https://res.cloudinary.com/.../img1.jpg",
      width = 1920,
      height = 1080,
      format = "jpg",
      size = 1048576
    }
  }
}

local uploadResponse = LrHttp.post(
  "https://piksend.com/api/plugin/galleries/" .. gallery.id .. "/images",
  JSON:encode(imagesData),
  {
    { field = "Authorization", value = "Bearer " .. apiKey },
    { field = "Content-Type", value = "application/json" }
  }
)
```

## Rate Limiting

Les endpoints du plugin sont soumis aux mêmes limites de taux que les autres endpoints:
- **100 requêtes par minute** par API key
- **10 requêtes par seconde** (burst)

Si vous dépassez ces limites, vous recevrez une réponse `429 Too Many Requests` avec un header `Retry-After`.

## Sécurité

### Bonnes pratiques

1. **Ne jamais exposer l'API key**: L'API key doit être stockée de manière sécurisée dans le plugin
2. **Utiliser HTTPS**: Toutes les requêtes doivent utiliser HTTPS
3. **Gérer les erreurs**: Implémenter une gestion d'erreur robuste avec retry logic
4. **Valider les données**: Valider les données côté client avant de les envoyer
5. **Logs**: Logger les erreurs pour faciliter le débogage

### Gestion des erreurs

```lua
local function makeApiRequest(url, method, body, headers)
  local maxRetries = 3
  local retryDelay = 1000 -- ms
  
  for attempt = 1, maxRetries do
    local response, hdrs = LrHttp.post(url, body, headers)
    
    if response then
      local data = JSON:decode(response)
      
      if data.success then
        return data
      elseif hdrs.status == 429 then
        -- Rate limited - wait and retry
        local retryAfter = tonumber(hdrs["Retry-After"]) or retryDelay
        LrTasks.sleep(retryAfter / 1000)
      elseif hdrs.status >= 500 then
        -- Server error - retry
        LrTasks.sleep(retryDelay / 1000)
        retryDelay = retryDelay * 2 -- Exponential backoff
      else
        -- Client error - don't retry
        return nil, data.error
      end
    end
  end
  
  return nil, "Max retries exceeded"
end
```

## Monitoring

Les requêtes vers ces endpoints sont trackées dans le système de monitoring:
- Temps de réponse (p50, p95, p99)
- Taux de succès/échec
- Nombre de galeries créées
- Nombre d'images uploadées

Les administrateurs peuvent consulter ces métriques via `/api/admin/metrics`.

## Support

Pour toute question ou problème:
1. Consulter la documentation complète: `/docs/lightroom`
2. Vérifier les logs du plugin
3. Contacter le support: `/support`
