# Architecture du Système de Plugin Lightroom

Ce document explique en détail le processus d'upload, de stockage et de téléchargement du plugin Lightroom PikSend.

---

## 📋 Vue d'Ensemble

Le système de plugin permet aux administrateurs d'uploader de nouvelles versions du plugin Lightroom, qui sont ensuite distribuées aux utilisateurs Pro via un système de téléchargement sécurisé.

### Composants Principaux

1. **Interface Admin** - Formulaire d'upload dans `/admin/plugin`
2. **API Upload** - `/api/admin/plugin/upload` (admin uniquement)
3. **Cloudinary** - Stockage CDN des fichiers
4. **Base de données** - Table `plugin_versions` (Supabase)
5. **API Version** - `/api/plugin/version` (public)
6. **API Download** - `/api/plugin/download` (authentifié Pro)

---

## 🔄 Processus d'Upload (Admin)

### Étape 1 : Préparation du Fichier

L'administrateur prépare le plugin dans `dist/PikSend.lrplugin/` :

```
dist/
└── PikSend.lrplugin/
    ├── Info.lua
    ├── PikSendAPI.lua
    ├── PikSendExportServiceProvider.lua
    ├── CHANGELOG.md
    └── ... (autres fichiers Lua)
```

**Options d'upload** :
- **Option A** : Créer une archive ZIP avec le script PowerShell
  ```powershell
  .\create-plugin-archive.ps1
  # Crée: dist/PikSend-Plugin.zip
  ```
- **Option B** : Uploader directement le dossier `.lrplugin` (si le navigateur le permet)

### Étape 2 : Upload via l'Interface Admin

**URL** : `https://piksend.com/admin/plugin` (onglet "Upload New Version")

**Formulaire** :
```typescript
{
  file: File,                    // .zip ou .lrplugin (max 100MB)
  version: string,               // Format: "1.2.0" ou "1.2.0-beta"
  changelog: string,             // Markdown (max 50,000 caractères)
  minLightroomVersion: string,   // Format: "11.0"
  isStable: boolean              // true = Production, false = Beta
}
```

**Validation côté client** :
- Extension : `.zip` ou `.lrplugin`
- Taille : ≤ 100 MB
- Version : Format sémantique (regex: `^\d+\.\d+\.\d+(-[a-z]+)?$`)
- Changelog : Non vide, ≤ 50,000 caractères

### Étape 3 : Upload vers Cloudinary

**Composant** : `src/components/admin/plugin-upload-form.tsx`

```typescript
// 1. Créer FormData
const formData = new FormData();
formData.append("file", file);

// 2. Upload avec suivi de progression (XMLHttpRequest)
POST /api/admin/plugin/upload
Content-Type: multipart/form-data

// Progression: 0-50%
```

**API Route** : `src/app/api/admin/plugin/upload/route.ts`

```typescript
// 1. Vérification admin
const authResult = await requireAdmin(request);

// 2. Validation du fichier
- Extension: .lrplugin ou .zip
- Taille: ≤ 100MB

// 3. Upload vers Cloudinary
cloudinary.uploader.upload_stream({
  folder: 'piksend/plugins',
  resource_type: 'raw',
  public_id: `lightroom-plugin-${Date.now()}`
})

// 4. Retour
{
  url: "https://res.cloudinary.com/piksend/raw/upload/v1234567890/piksend/plugins/lightroom-plugin-1234567890",
  fileSize: 163545
}
```

**Stockage Cloudinary** :
- **Dossier** : `piksend/plugins/`
- **Type** : `raw` (fichier brut, pas une image)
- **Nom** : `lightroom-plugin-{timestamp}`
- **Format** : Le fichier est stocké tel quel (ZIP ou LRPLUGIN)
- **URL** : Permanente et accessible via CDN global

### Étape 4 : Création de la Version

**Composant** : `src/components/admin/plugin-upload-form.tsx`

```typescript
// Progression: 50-100%
POST /api/admin/plugin/versions
Content-Type: application/json

{
  version: "1.2.0",
  fileUrl: "https://res.cloudinary.com/...",
  fileSize: 163545,
  changelog: "# Changelog...",
  isStable: true,
  minLightroomVersion: "11.0"
}
```

**API Route** : `src/app/api/admin/plugin/versions/route.ts`

```typescript
// 1. Validation avec Zod
const validatedParams = createPluginVersionSchema.parse(body);

// 2. Appel du service
const version = await pluginVersionService.createVersion(validatedParams);
```

**Service** : `src/lib/services/plugin-version.service.ts`

```typescript
async createVersion(params: CreateVersionParams): Promise<PluginVersion> {
  // 1. Insertion dans la base de données
  const { data: versionRecord } = await supabase
    .from('plugin_versions')
    .insert({
      version: params.version,
      file_url: params.fileUrl,
      file_size: params.fileSize,
      changelog: params.changelog,
      is_stable: params.isStable ?? false,
      min_lightroom_version: params.minLightroomVersion ?? '11.0',
      release_date: new Date().toISOString(),
      download_count: 0,
    })
    .select()
    .single();

  // 2. Invalidation du cache si version stable
  if (params.isStable) {
    await this.cacheService.delete(CACHE_KEY_LATEST_STABLE);
  }

  // 3. Retour de l'objet PluginVersion
  return pluginVersion;
}
```

### Étape 5 : Stockage en Base de Données

**Table** : `plugin_versions`

```sql
CREATE TABLE plugin_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,
  file_url TEXT NOT NULL,              -- URL Cloudinary
  file_size BIGINT NOT NULL,           -- Taille en bytes
  changelog TEXT,                      -- Markdown
  is_stable BOOLEAN DEFAULT TRUE,      -- Production vs Beta
  min_lightroom_version VARCHAR(20) DEFAULT '11.0',
  release_date TIMESTAMPTZ DEFAULT NOW(),
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemple d'enregistrement** :
```json
{
  "id": "4b8b8ee7-e861-4097-b14e-23c998782048",
  "version": "1.2.0",
  "file_url": "https://res.cloudinary.com/piksend/raw/upload/v1234567890/piksend/plugins/lightroom-plugin-1234567890",
  "file_size": 163545,
  "changelog": "# Changelog\n\n## [1.2.0]...",
  "is_stable": true,
  "min_lightroom_version": "11.0",
  "release_date": "2026-02-10T00:00:00Z",
  "download_count": 0,
  "created_at": "2026-02-10T00:00:00Z",
  "updated_at": "2026-02-10T00:00:00Z"
}
```

---

## 📥 Processus de Téléchargement (Utilisateur)

### Étape 1 : Vérification de Version (Public)

**API** : `/api/plugin/version` (pas d'authentification requise)

**Utilisé par** :
- Page de téléchargement : `https://piksend.com/download/lightroom`
- Plugin Lightroom : Vérification des mises à jour

```typescript
GET /api/plugin/version
GET /api/plugin/version?currentVersion=1.0.0

// Réponse
{
  "version": "1.2.0",
  "downloadUrl": "https://res.cloudinary.com/piksend/raw/upload/v1234567890/piksend/plugins/lightroom-plugin-1234567890",
  "fileSize": 163545,
  "changelog": "# Changelog...",
  "releaseDate": "2026-02-10T00:00:00Z",
  "minLightroomVersion": "11.0",
  "updateAvailable": true  // Si currentVersion fourni
}
```

**Service** : `pluginVersionService.getLatestStableVersion()`
- Cache : 5 minutes (pour performance)
- Filtre : `is_stable = true`
- Tri : Par version (descendant)

### Étape 2 : Page de Téléchargement

**URL** : `https://piksend.com/download/lightroom`

**Composant** : `src/app/(public)/download/lightroom/download-page-client.tsx`

```typescript
// 1. Récupération des infos de version
const response = await fetch('/api/plugin/version');
const data = await response.json();

// 2. Affichage
- Version number
- File size
- Release date
- Changelog (formaté en Markdown)
- Download button
- Installation instructions
```

**Bouton de téléchargement** :
```typescript
<DownloadButton version="1.2.0" />
// Redirige vers: /api/plugin/download
```

### Étape 3 : Téléchargement Sécurisé

**API** : `/api/plugin/download` (authentification requise + plan Pro)

**Flux** :
```typescript
GET /api/plugin/download
GET /api/plugin/download?version=1.1.0  // Version spécifique

// 1. Rate limiting (10 téléchargements/heure par IP)
const rateLimitResponse = rateLimitMiddleware(request, 'download');

// 2. Authentification
const { supabase, userId } = await requireSupabaseClient();

// 3. Vérification du plan Pro
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_plan')
  .eq('id', userId)
  .single();

if (profile.subscription_plan !== 'pro') {
  return 403 Forbidden
}

// 4. Récupération de la version
const pluginVersion = await pluginVersionService.getLatestStableVersion();

// 5. Enregistrement du téléchargement
await pluginVersionService.recordDownload(
  pluginVersion.id,
  userId,
  { ipAddress, userAgent }
);

// 6. Redirection vers Cloudinary (302)
return NextResponse.redirect(versionedUrl, 302);
```

**Headers de la réponse** :
```http
HTTP/1.1 302 Found
Location: https://res.cloudinary.com/piksend/raw/upload/v1234567890/piksend/plugins/lightroom-plugin-1234567890
Content-Disposition: attachment; filename="PikSend-1.2.0.zip"
Content-Type: application/zip
X-Content-Type-Options: nosniff
Content-Transfer-Encoding: binary
Cache-Control: public, max-age=31536000, immutable
```

### Étape 4 : Téléchargement depuis Cloudinary

**CDN** : Cloudinary distribue le fichier via son réseau global

**Ce qui est téléchargé** :
- **Nom du fichier** : `PikSend-1.2.0.zip`
- **Contenu** : Le fichier exact uploadé par l'admin (ZIP ou LRPLUGIN)
- **Taille** : Celle enregistrée en base de données
- **Format** : Toujours téléchargé comme `.zip` (même si uploadé comme `.lrplugin`)

**Avantages du CDN** :
- Distribution mondiale rapide
- Cache automatique
- Bande passante illimitée
- Haute disponibilité

### Étape 5 : Installation par l'Utilisateur

**Instructions** : Affichées sur `/download/lightroom`

1. **Télécharger** : `PikSend-1.2.0.zip`
2. **Extraire** : Décompresser pour obtenir `PikSend.lrplugin/`
3. **Copier** vers :
   - Windows : `C:\Users\[Username]\AppData\Roaming\Adobe\Lightroom\Modules`
   - macOS : `~/Library/Application Support/Adobe/Lightroom/Modules`
4. **Redémarrer** Lightroom
5. **Configurer** la clé API

---

## 📊 Suivi des Téléchargements

### Enregistrement

**Table** : `plugin_download_logs`

```sql
CREATE TABLE plugin_download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES plugin_versions(id),
  user_id UUID REFERENCES profiles(id),
  ip_address TEXT,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Service** : `pluginVersionService.recordDownload()`

```typescript
async recordDownload(
  versionId: string,
  userId: string | null,
  metadata: DownloadMetadata
): Promise<void> {
  // 1. Incrémenter le compteur de la version
  await supabase
    .from('plugin_versions')
    .update({ download_count: download_count + 1 })
    .eq('id', versionId);

  // 2. Enregistrer le log détaillé
  await supabase
    .from('plugin_download_logs')
    .insert({
      version_id: versionId,
      user_id: userId,
      ip_address: metadata.ipAddress,
      user_agent: metadata.userAgent,
    });
}
```

### Statistiques

**API** : `/api/admin/plugin/versions` (admin uniquement)

**Affichage** :
- Nombre total de téléchargements par version
- Graphiques de téléchargements dans le temps
- Répartition par version
- Taux d'adoption des nouvelles versions

---

## 🔒 Sécurité

### Contrôles d'Accès

1. **Upload** : Admin uniquement (`requireAdmin` middleware)
2. **Download** : Utilisateurs Pro authentifiés
3. **Version Info** : Public (pas d'authentification)

### Rate Limiting

```typescript
RATE_LIMITS = {
  download: { requests: 10, window: 60 * 60 * 1000 }, // 10/heure
}
```

### Validation

- **Taille** : Max 100MB
- **Extension** : `.zip` ou `.lrplugin` uniquement
- **Version** : Format sémantique strict
- **Changelog** : Max 50,000 caractères

---

## 🚀 Performance

### Caching

**Service Layer** :
```typescript
CACHE_KEY_LATEST_STABLE = 'plugin:version:latest-stable'
TTL = 5 minutes
```

**CDN** :
```http
Cache-Control: public, max-age=31536000, immutable
```

### Optimisations

1. **Redirection 302** : Pas de proxy, téléchargement direct depuis Cloudinary
2. **URL versionnée** : Cache busting automatique
3. **CDN global** : Distribution géographique optimale
4. **Compression** : Fichiers ZIP déjà compressés

---

## 📝 Résumé du Flux

```
UPLOAD (Admin)
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin prépare le plugin dans dist/PikSend.lrplugin/     │
│ 2. Crée une archive ZIP (optionnel)                         │
│ 3. Upload via /admin/plugin                                 │
│    ├─ Validation (extension, taille)                        │
│    ├─ Upload vers Cloudinary (CDN)                          │
│    └─ Création version en base de données                   │
│ 4. Fichier stocké sur Cloudinary                            │
│ 5. Métadonnées stockées dans plugin_versions                │
└─────────────────────────────────────────────────────────────┘

DOWNLOAD (Utilisateur)
┌─────────────────────────────────────────────────────────────┐
│ 1. Utilisateur visite /download/lightroom                   │
│ 2. Page récupère infos via /api/plugin/version (public)     │
│ 3. Affiche version, changelog, bouton download              │
│ 4. Clic sur download → /api/plugin/download                 │
│    ├─ Rate limiting (10/heure)                              │
│    ├─ Authentification requise                              │
│    ├─ Vérification plan Pro                                 │
│    ├─ Enregistrement du téléchargement                      │
│    └─ Redirection 302 vers Cloudinary                       │
│ 5. Téléchargement direct depuis CDN Cloudinary              │
│ 6. Fichier: PikSend-{version}.zip                           │
│ 7. Utilisateur extrait et installe                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Points Clés

1. **Stockage** : Cloudinary (CDN global)
2. **Format** : Toujours téléchargé comme `.zip`
3. **Sécurité** : Admin pour upload, Pro pour download
4. **Performance** : Cache 5min + CDN
5. **Suivi** : Logs détaillés de chaque téléchargement
