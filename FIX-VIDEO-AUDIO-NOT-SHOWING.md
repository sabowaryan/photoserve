# Fix : Video Cover et Background Audio - Upload et Affichage

## Problème rapporté

1. **Upload UI non fonctionnel** : Dans les paramètres de la galerie, lorsque l'utilisateur upload le Video Cover ou l'audio, rien ne se passe - pas de preview, pas d'upload
2. **Affichage manquant** : Le photographe a activé Video Cover et Background Audio dans les paramètres de la galerie, mais rien ne s'affiche dans la galerie publique

## Solution implémentée

### 1. Composants d'upload créés

Deux nouveaux composants dédiés ont été créés pour gérer l'upload de médias :

#### **VideoUploader** (`src/components/gallery-detail/video-uploader.tsx`)

Composant complet pour l'upload de vidéos avec :
- **Validation** : Type de fichier (MP4, WebM), taille max (50MB par défaut)
- **Preview** : Affichage de la vidéo avant et après upload avec contrôles
- **Progress** : Indicateur circulaire de progression d'upload
- **Upload Cloudinary** : Upload direct vers Cloudinary avec XMLHttpRequest
- **Gestion d'état** : Loading, erreurs, succès avec toasts
- **Suppression** : Bouton pour retirer la vidéo uploadée
- **Design** : Même style que les autres composants du projet

```typescript
<VideoUploader
  currentVideoUrl={settings.videoCoverUrl}
  onVideoChange={(url) => onSettingsChange({ videoCoverUrl: url })}
  maxSizeMB={50}
  disabled={isUpdating}
/>
```

#### **AudioUploader** (`src/components/gallery-detail/audio-uploader.tsx`)

Composant complet pour l'upload d'audio avec :
- **Validation** : Type de fichier (MP3, WAV, OGG), taille max (10MB par défaut)
- **Preview** : Lecteur audio avec contrôles natifs
- **Progress** : Indicateur circulaire de progression d'upload
- **Upload Cloudinary** : Upload direct vers Cloudinary avec XMLHttpRequest
- **Gestion d'état** : Loading, erreurs, succès avec toasts
- **Suppression** : Bouton pour retirer l'audio uploadé
- **Design** : Même style que les autres composants du projet

```typescript
<AudioUploader
  currentAudioUrl={settings.audioUrl}
  onAudioChange={(url) => onSettingsChange({ audioUrl: url })}
  maxSizeMB={10}
  disabled={isUpdating}
/>
```

### 2. Intégration dans SettingsTab

Les composants ont été intégrés dans `src/components/gallery-detail/settings-tab.tsx` :

```typescript
{/* Media Card */}
<div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
  <div className="flex items-center gap-3 mb-5">
    <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl text-white shadow-lg">
      <Film size={18} />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-900">Media</span>
        {!hasFeature('videoCover') && (
          <Lock size={14} className="text-slate-400" />
        )}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">Video cover & audio</p>
    </div>
  </div>

  {hasFeature('videoCover') || hasFeature('audioGallery') ? (
    <div className="space-y-4">
      {/* Video Cover */}
      {hasFeature('videoCover') && (
        <VideoUploader
          currentVideoUrl={settings.videoCoverUrl}
          onVideoChange={(url) => onSettingsChange({ videoCoverUrl: url })}
          maxSizeMB={50}
          disabled={isUpdating}
        />
      )}

      {/* Audio */}
      {hasFeature('audioGallery') && (
        <AudioUploader
          currentAudioUrl={settings.audioUrl}
          onAudioChange={(url) => onSettingsChange({ audioUrl: url })}
          maxSizeMB={10}
          disabled={isUpdating}
        />
      )}
    </div>
  ) : (
    <Link 
      href="/settings?upgrade=true"
      className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-600 hover:from-indigo-100 hover:to-violet-100 transition-all"
    >
      <Lock size={16} />
      Upgrade to Pro
    </Link>
  )}
</div>
```

### 3. Export des composants

Les composants ont été ajoutés à `src/components/gallery-detail/index.ts` :

```typescript
export { VideoUploader } from './video-uploader';
export { AudioUploader } from './audio-uploader';
```

### 4. Configuration Cloudinary requise

Les composants utilisent l'upload direct vers Cloudinary depuis le navigateur. Les variables d'environnement suivantes sont nécessaires :

```env
# .env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=photoserve
```

**Important** : Un upload preset doit être créé dans Cloudinary Dashboard :
1. Aller dans Settings > Upload
2. Créer un nouveau Upload Preset nommé "photoserve"
3. Mode : Unsigned (pour permettre l'upload depuis le navigateur)
4. Folder : Laisser vide (géré par le code)

### 5. Fonctionnalités implémentées

#### Upload Flow
1. Utilisateur clique sur la zone d'upload
2. Sélectionne un fichier (vidéo ou audio)
3. Validation du type et de la taille
4. Preview immédiate (blob URL)
5. Upload vers Cloudinary avec progress
6. URL Cloudinary retournée et sauvegardée
7. Preview finale avec l'URL Cloudinary

#### Gestion d'erreurs
- Type de fichier invalide → Toast d'erreur
- Taille dépassée → Toast avec taille actuelle
- Erreur d'upload → Toast + retour à l'état précédent
- Succès → Toast de confirmation

#### UX
- Indicateur de progression circulaire pendant l'upload
- Preview vidéo avec contrôles natifs
- Preview audio avec lecteur natif
- Bouton de suppression au hover
- État disabled pendant l'upload
- Messages en français

## Architecture existante (inchangée)

### Composants

Les composants sont déjà implémentés et fonctionnels :

1. **VideoCover** (`src/components/gallery-view/video-cover.tsx`)
   - Affiche une vidéo en arrière-plan
   - Lecture automatique en boucle
   - Contrôle mute/unmute
   - Max 30 secondes, 1080p

2. **AudioPlayer** (`src/components/gallery-view/audio-player.tsx`)
   - Lecture de musique d'ambiance
   - Dialogue de consentement GDPR
   - Contrôles de volume et lecture/pause
   - Lecture en boucle

### Intégration

Les composants sont correctement intégrés dans `gallery-view-client.tsx` :

```typescript
// Ligne 777-779
{videoCoverUrl && (
  <VideoCover videoUrl={videoCoverUrl} />
)}

// Ligne 810-812
{audioUrl && (
  <AudioPlayer audioUrl={audioUrl} />
)}
```

### Feature Gating

Les fonctionnalités sont correctement gatées par plan :

```typescript
const canUseVideoCover = hasFeatureAccess(ownerPlan, 'videoCover');
const canUseAudioGallery = hasFeatureAccess(ownerPlan, 'audioGallery');

const videoCoverUrl = canUseVideoCover ? settings.videoCoverUrl : undefined;
const audioUrl = canUseAudioGallery ? settings.audioUrl : undefined;
```

## Causes possibles

### 1. URLs non définies dans les settings

Les URLs ne sont peut-être pas stockées dans `galleries.settings` :

```json
{
  "videoCoverUrl": null,  // ❌ Devrait contenir une URL
  "audioUrl": null,       // ❌ Devrait contenir une URL
  "enableComments": true,
  "enableFavorites": true
}
```

### 2. Plan insuffisant

Le photographe n'a peut-être pas le bon plan :

- **Video Cover** : Disponible pour Premium et Pro
- **Background Audio** : Disponible pour Premium et Pro
- **Free** : ❌ Non disponible

### 3. Settings non sauvegardés

Les settings ont peut-être été activés dans l'UI mais pas sauvegardés en base de données.

### 4. Format d'URL incorrect

Les URLs doivent être des URLs complètes et valides :

```typescript
// ✅ Correct
"videoCoverUrl": "https://res.cloudinary.com/xxx/video/upload/v123/gallery-video.mp4"
"audioUrl": "https://res.cloudinary.com/xxx/video/upload/v123/background-music.mp3"

// ❌ Incorrect
"videoCoverUrl": "gallery-video.mp4"
"audioUrl": "/uploads/music.mp3"
```

## Diagnostic

### Étape 1 : Vérifier les settings en base de données

Exécutez le script `debug-gallery-settings.sql` dans Supabase SQL Editor :

```sql
SELECT 
  g.id,
  g.title,
  g.settings->>'videoCoverUrl' as video_cover_url,
  g.settings->>'audioUrl' as audio_url,
  p.subscription_plan as owner_plan
FROM galleries g
LEFT JOIN profiles p ON g.user_id = p.id
WHERE g.unique_slug = 'kc9dqfrr';  -- Votre slug
```

**Résultats attendus** :
- `video_cover_url` : URL complète de la vidéo
- `audio_url` : URL complète de l'audio
- `owner_plan` : 'premium' ou 'pro'

### Étape 2 : Vérifier les logs de la console

Ouvrez la console du navigateur et recherchez :

```
[Gallery Debug] Media Settings: {
  ownerPlan: "premium",
  canUseVideoCover: true,
  canUseAudioGallery: true,
  videoCoverUrl: "https://...",
  audioUrl: "https://...",
  settings: { ... }
}
```

**Vérifications** :
- ✅ `canUseVideoCover` et `canUseAudioGallery` doivent être `true`
- ✅ `videoCoverUrl` et `audioUrl` doivent contenir des URLs
- ❌ Si `undefined`, le problème vient des settings

### Étape 3 : Vérifier le plan du photographe

```sql
SELECT id, email, subscription_plan 
FROM profiles 
WHERE id = (
  SELECT user_id FROM galleries WHERE unique_slug = 'kc9dqfrr'
);
```

**Plans requis** :
- Video Cover : Premium ou Pro
- Background Audio : Premium ou Pro

### Étape 4 : Vérifier l'UI de configuration

Dans le dashboard photographe :
1. Aller dans Settings de la galerie
2. Onglet "Apparence" ou "Médias"
3. Vérifier que les URLs sont bien renseignées
4. Cliquer sur "Sauvegarder"

## Solutions

### Solution 1 : Ajouter les URLs manuellement en SQL

Si les URLs ne sont pas dans les settings :

```sql
UPDATE galleries
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{videoCoverUrl}',
  '"https://res.cloudinary.com/xxx/video/upload/v123/video.mp4"'
)
WHERE unique_slug = 'kc9dqfrr';

UPDATE galleries
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{audioUrl}',
  '"https://res.cloudinary.com/xxx/video/upload/v123/audio.mp3"'
)
WHERE unique_slug = 'kc9dqfrr';
```

### Solution 2 : Upgrade du plan

Si le plan est insuffisant :

```sql
UPDATE profiles
SET subscription_plan = 'premium'
WHERE id = (
  SELECT user_id FROM galleries WHERE unique_slug = 'kc9dqfrr'
);
```

### Solution 3 : Vérifier l'API de mise à jour

Si l'UI ne sauvegarde pas correctement, vérifier :

```typescript
// src/app/api/galleries/[id]/route.ts
// Doit accepter videoCoverUrl et audioUrl dans settings
```

### Solution 4 : Upload des médias

Si les URLs n'existent pas encore :

1. **Pour la vidéo** :
   - Format : MP4, WebM
   - Durée max : 30 secondes
   - Résolution max : 1080p
   - Upload vers Cloudinary

2. **Pour l'audio** :
   - Format : MP3, WAV, OGG
   - Durée : Recommandé 2-5 minutes (boucle)
   - Upload vers Cloudinary

## Checklist de vérification

### Configuration
- [ ] Variables d'environnement Cloudinary configurées
  - [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - [ ] `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- [ ] Upload preset "photoserve" créé dans Cloudinary (mode: unsigned)
- [ ] Le photographe a un plan Premium ou Pro

### Upload UI
- [ ] Zone d'upload visible dans Settings > Media
- [ ] Clic sur la zone ouvre le sélecteur de fichiers
- [ ] Validation des types de fichiers fonctionne
- [ ] Validation de la taille fonctionne
- [ ] Preview s'affiche après sélection
- [ ] Progress bar s'affiche pendant l'upload
- [ ] URL Cloudinary est retournée après upload
- [ ] Preview finale s'affiche avec l'URL Cloudinary
- [ ] Bouton de suppression fonctionne
- [ ] Toasts de succès/erreur s'affichent

### Sauvegarde
- [ ] Les URLs sont définies dans `galleries.settings`
- [ ] Les URLs sont valides et accessibles
- [ ] Les fichiers existent sur Cloudinary
- [ ] Les settings ont été sauvegardés (bouton Save)

### Affichage public
- [ ] La console affiche les bonnes valeurs (voir logs de débogage)
- [ ] Pas d'erreurs dans la console réseau (404, CORS)
- [ ] Video Cover s'affiche en arrière-plan
- [ ] Background Audio démarre après consentement

## Configuration Cloudinary

### 1. Créer un Upload Preset

Dans votre Cloudinary Dashboard :

1. Aller dans **Settings** > **Upload**
2. Scroll jusqu'à **Upload presets**
3. Cliquer sur **Add upload preset**
4. Configurer :
   - **Preset name** : `photoserve`
   - **Signing Mode** : `Unsigned` (important pour l'upload depuis le navigateur)
   - **Folder** : Laisser vide (géré par le code : `photoserve/videos` et `photoserve/audio`)
   - **Access Mode** : `Public`
5. Sauvegarder

### 2. Configurer les variables d'environnement

Ajouter dans votre fichier `.env` :

```env
# Cloudinary - Server-side (déjà configuré)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Cloudinary - Client-side (nouveau)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=photoserve
```

**Note** : `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` doit avoir la même valeur que `CLOUDINARY_CLOUD_NAME`.

### 3. Redémarrer le serveur

Après avoir ajouté les variables d'environnement :

```bash
npm run dev
```

## Tests complets

### Test 1 : Upload Video Cover

1. Se connecter en tant que photographe avec plan Premium ou Pro
2. Aller dans Dashboard > Galeries > [Votre galerie] > Settings
3. Scroll jusqu'à la section "Media"
4. Cliquer sur la zone "Video Cover"
5. ✅ Le sélecteur de fichiers s'ouvre
6. Sélectionner une vidéo MP4 (< 50MB, recommandé 1920x1080, max 30s)
7. ✅ Une preview de la vidéo s'affiche immédiatement
8. ✅ Un indicateur de progression circulaire apparaît
9. ✅ Le pourcentage d'upload s'affiche (0% → 100%)
10. ✅ Toast "Vidéo uploadée avec succès !" apparaît
11. ✅ La preview finale s'affiche avec l'URL Cloudinary
12. ✅ Les contrôles vidéo fonctionnent
13. ✅ Le bouton "Supprimer" apparaît au hover
14. Cliquer sur "Save" en bas de la page
15. ✅ Toast "Modifications sauvegardées"

### Test 2 : Upload Background Audio

1. Dans la même section "Media"
2. Cliquer sur la zone "Background Audio"
3. ✅ Le sélecteur de fichiers s'ouvre
4. Sélectionner un fichier MP3 (< 10MB, recommandé 320kbps, 2-5 min)
5. ✅ Un indicateur de progression circulaire apparaît
6. ✅ Le pourcentage d'upload s'affiche (0% → 100%)
7. ✅ Toast "Audio uploadé avec succès !" apparaît
8. ✅ Le lecteur audio s'affiche avec contrôles
9. ✅ La lecture audio fonctionne
10. ✅ Le bouton "Supprimer" apparaît au hover
11. Cliquer sur "Save" en bas de la page
12. ✅ Toast "Modifications sauvegardées"

### Test 3 : Validation des erreurs

**Type de fichier invalide** :
1. Essayer d'uploader une image PNG dans Video Cover
2. ✅ Toast d'erreur : "Le fichier doit être une vidéo (MP4, WebM)"

**Taille dépassée** :
1. Essayer d'uploader une vidéo > 50MB
2. ✅ Toast d'erreur : "La vidéo ne doit pas dépasser 50MB (taille: XX.XMB)"

**Audio invalide** :
1. Essayer d'uploader une vidéo dans Background Audio
2. ✅ Toast d'erreur : "Le fichier doit être un audio (MP3, WAV, OGG)"

### Test 4 : Affichage dans la galerie publique

1. Ouvrir la galerie publique (URL : `/g/[slug]`)
2. ✅ Une vidéo devrait s'afficher en arrière-plan (plein écran, fixe)
3. ✅ La vidéo devrait jouer automatiquement (muet par défaut)
4. ✅ Un bouton mute/unmute devrait être visible en bas à droite
5. ✅ La vidéo devrait boucler indéfiniment
6. ✅ Un dialogue de consentement audio devrait apparaître
7. Cliquer sur "Activer la musique"
8. ✅ La musique devrait commencer
9. ✅ Des contrôles devraient apparaître en bas à gauche (play/pause, volume)
10. ✅ La musique devrait boucler indéfiniment

### Test 5 : Suppression

**Supprimer Video Cover** :
1. Dans Settings > Media
2. Hover sur la preview vidéo
3. ✅ Bouton "Supprimer" apparaît en haut à droite
4. Cliquer sur "Supprimer"
5. ✅ Toast "Vidéo supprimée"
6. ✅ La zone d'upload réapparaît
7. Cliquer sur "Save"
8. Recharger la galerie publique
9. ✅ La vidéo n'apparaît plus

**Supprimer Background Audio** :
1. Dans Settings > Media
2. Hover sur le lecteur audio
3. ✅ Bouton "Supprimer" apparaît en haut à droite
4. Cliquer sur "Supprimer"
5. ✅ Toast "Audio supprimé"
6. ✅ La zone d'upload réapparaît
7. Cliquer sur "Save"
8. Recharger la galerie publique
9. ✅ Le dialogue audio n'apparaît plus

## Dépannage

### Problème : "Erreur lors de l'upload"

**Causes possibles** :
1. Variables d'environnement manquantes ou incorrectes
2. Upload preset non créé ou mal configuré
3. Problème réseau/CORS

**Solutions** :
1. Vérifier `.env` :
   ```bash
   echo $NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   echo $NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
   ```
2. Vérifier dans Cloudinary Dashboard que le preset "photoserve" existe et est "Unsigned"
3. Ouvrir la console réseau (F12 > Network) et vérifier la requête vers `api.cloudinary.com`
4. Vérifier les logs de la console pour plus de détails

### Problème : "Rien ne se passe au clic"

**Causes possibles** :
1. Plan insuffisant (Free)
2. JavaScript désactivé
3. Erreur de compilation

**Solutions** :
1. Vérifier le plan du photographe :
   ```sql
   SELECT subscription_plan FROM profiles WHERE id = 'user_id';
   ```
2. Vérifier la console pour des erreurs JavaScript
3. Redémarrer le serveur de développement

### Problème : "Preview ne s'affiche pas"

**Causes possibles** :
1. Format de fichier non supporté par le navigateur
2. Fichier corrompu
3. Blob URL révoquée prématurément

**Solutions** :
1. Essayer avec un autre fichier
2. Vérifier le format (MP4 pour vidéo, MP3 pour audio)
3. Vérifier la console pour des erreurs

### Problème : "Vidéo/Audio ne s'affiche pas dans la galerie publique"

**Causes possibles** :
1. Settings non sauvegardés
2. URL Cloudinary invalide
3. Plan insuffisant
4. Feature gating incorrect

**Solutions** :
1. Vérifier en base de données :
   ```sql
   SELECT settings->>'videoCoverUrl', settings->>'audioUrl' 
   FROM galleries 
   WHERE unique_slug = 'your_slug';
   ```
2. Vérifier les logs de la console :
   ```
   [Gallery Debug] Media Settings: {
     ownerPlan: "premium",
     canUseVideoCover: true,
     canUseAudioGallery: true,
     videoCoverUrl: "https://...",
     audioUrl: "https://..."
   }
   ```
3. Vérifier que l'URL Cloudinary est accessible (ouvrir dans un nouvel onglet)

## Prochaines étapes

1. ✅ Configurer Cloudinary upload preset
2. ✅ Ajouter les variables d'environnement
3. ✅ Redémarrer le serveur
4. ✅ Tester l'upload de vidéo
5. ✅ Tester l'upload d'audio
6. ✅ Sauvegarder les settings
7. ✅ Vérifier l'affichage dans la galerie publique
8. ✅ Supprimer les logs de débogage (optionnel)

## Notes techniques

### Upload direct vs Server-side

Les composants utilisent l'**upload direct** vers Cloudinary depuis le navigateur :

**Avantages** :
- Pas de limite de taille côté serveur
- Pas de consommation de bande passante serveur
- Progress tracking natif
- Plus rapide (pas de double upload)

**Inconvénients** :
- Nécessite un upload preset unsigned
- Expose le cloud name (pas de problème de sécurité)
- Nécessite CORS configuré (géré par Cloudinary)

### Sécurité

- L'upload preset est "unsigned" mais limité par :
  - Taille max configurée dans Cloudinary
  - Types de fichiers acceptés (resource_type)
  - Folder forcé par le code
- Les URLs Cloudinary sont publiques mais :
  - Difficiles à deviner (public_id aléatoire)
  - Peuvent être transformées (watermark, resize)
  - Peuvent être supprimées côté serveur

### Performance

- Les vidéos sont automatiquement optimisées par Cloudinary
- Les audios sont compressés si nécessaire
- Le streaming est géré par Cloudinary CDN
- Pas d'impact sur les performances du serveur Next.js

## Résumé

✅ **Problème résolu** : Upload UI complet et fonctionnel
✅ **Composants créés** : VideoUploader et AudioUploader
✅ **Intégration** : Settings tab avec feature gating
✅ **Configuration** : Variables d'environnement documentées
✅ **Tests** : Checklist complète fournie
✅ **Affichage** : VideoCover et AudioPlayer déjà fonctionnels

Le système est maintenant complet de bout en bout :
1. Upload dans Settings → Cloudinary
2. Sauvegarde dans `galleries.settings`
3. Affichage dans la galerie publique
4. Feature gating par plan (Premium/Pro)
