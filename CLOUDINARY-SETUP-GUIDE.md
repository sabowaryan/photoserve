# Guide de configuration Cloudinary pour Video Cover et Background Audio

## Étape 1 : Créer un Upload Preset dans Cloudinary

1. **Connectez-vous à votre compte Cloudinary**
   - Allez sur https://cloudinary.com/console

2. **Accédez aux paramètres d'upload**
   - Cliquez sur l'icône ⚙️ (Settings) en haut à droite
   - Dans le menu de gauche, cliquez sur **Upload**

3. **Créez un nouveau preset**
   - Scrollez jusqu'à la section **Upload presets**
   - Cliquez sur **Add upload preset**

4. **Configurez le preset**
   - **Preset name** : `photoserve`
   - **Signing Mode** : Sélectionnez **Unsigned** ⚠️ (Important !)
   - **Folder** : Laissez vide (le code gère automatiquement les dossiers)
   - **Access Mode** : `Public`
   - Laissez les autres options par défaut

5. **Sauvegardez**
   - Cliquez sur **Save** en haut à droite

## Étape 2 : Récupérer votre Cloud Name

1. Dans le dashboard Cloudinary, en haut à gauche, vous verrez :
   ```
   Cloud name: your_cloud_name
   ```
2. Notez cette valeur, vous en aurez besoin pour la configuration

## Étape 3 : Configurer les variables d'environnement

1. **Ouvrez votre fichier `.env`** à la racine du projet

2. **Ajoutez ou mettez à jour ces lignes** :
   ```env
   # Cloudinary - Server-side (déjà configuré normalement)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Cloudinary - Client-side (NOUVEAU - pour upload vidéo/audio)
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=photoserve
   ```

3. **Remplacez les valeurs** :
   - `your_cloud_name` : Le Cloud Name de l'étape 2
   - `your_api_key` et `your_api_secret` : Disponibles dans Settings > Access Keys

⚠️ **Important** : `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` doit avoir la **même valeur** que `CLOUDINARY_CLOUD_NAME`

## Étape 4 : Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez
npm run dev
```

## Étape 5 : Tester l'upload

1. **Connectez-vous** en tant que photographe avec un plan Premium ou Pro

2. **Allez dans une galerie** :
   - Dashboard > Galeries > [Votre galerie] > Settings

3. **Scrollez jusqu'à la section "Media"**

4. **Testez Video Cover** :
   - Cliquez sur la zone "Video Cover"
   - Sélectionnez une vidéo MP4 (max 50MB, recommandé 1920x1080, max 30s)
   - ✅ Vous devriez voir :
     - Preview immédiate
     - Barre de progression circulaire
     - Toast "Vidéo uploadée avec succès !"
     - Lecteur vidéo avec contrôles

5. **Testez Background Audio** :
   - Cliquez sur la zone "Background Audio"
   - Sélectionnez un fichier MP3 (max 10MB, recommandé 320kbps, 2-5 min)
   - ✅ Vous devriez voir :
     - Barre de progression circulaire
     - Toast "Audio uploadé avec succès !"
     - Lecteur audio avec contrôles

6. **Sauvegardez** :
   - Cliquez sur le bouton "Save" en bas de la page
   - ✅ Toast "Modifications sauvegardées"

7. **Vérifiez dans la galerie publique** :
   - Ouvrez l'URL de la galerie : `/g/[slug]`
   - ✅ La vidéo devrait s'afficher en arrière-plan
   - ✅ Un dialogue de consentement audio devrait apparaître

## Dépannage

### Erreur : "Erreur lors de l'upload de la vidéo"

**Vérifiez** :
1. Le preset "photoserve" existe dans Cloudinary
2. Le preset est en mode "Unsigned"
3. Les variables d'environnement sont correctes
4. Le serveur a été redémarré après modification du .env

**Console réseau** :
- Ouvrez F12 > Network
- Tentez un upload
- Cherchez la requête vers `api.cloudinary.com`
- Vérifiez le statut (devrait être 200)

### Erreur : "Le fichier doit être une vidéo"

**Cause** : Type de fichier incorrect

**Solution** : Utilisez uniquement :
- Vidéo : MP4, WebM, QuickTime
- Audio : MP3, WAV, OGG

### Erreur : "La vidéo ne doit pas dépasser 50MB"

**Cause** : Fichier trop volumineux

**Solution** :
- Compressez la vidéo (recommandé : 1920x1080, H.264, max 30s)
- Utilisez un outil comme HandBrake ou FFmpeg
- Ou augmentez la limite dans le code (non recommandé)

### La vidéo/audio ne s'affiche pas dans la galerie

**Vérifiez** :
1. Le plan du photographe (Premium ou Pro requis)
2. Les settings ont été sauvegardés (bouton Save)
3. La console du navigateur pour les logs :
   ```
   [Gallery Debug] Media Settings: {
     ownerPlan: "premium",
     canUseVideoCover: true,
     videoCoverUrl: "https://..."
   }
   ```

**SQL Debug** :
```sql
SELECT 
  g.title,
  g.settings->>'videoCoverUrl' as video_url,
  g.settings->>'audioUrl' as audio_url,
  p.subscription_plan
FROM galleries g
LEFT JOIN profiles p ON g.user_id = p.id
WHERE g.unique_slug = 'your_slug';
```

## Limites et recommandations

### Video Cover
- **Format** : MP4 (H.264) recommandé
- **Résolution** : 1920x1080 (Full HD)
- **Durée** : Max 30 secondes (boucle automatique)
- **Taille** : Max 50MB
- **Bitrate** : 5-10 Mbps recommandé

### Background Audio
- **Format** : MP3 recommandé
- **Qualité** : 320kbps
- **Durée** : 2-5 minutes (boucle automatique)
- **Taille** : Max 10MB
- **Type** : Musique d'ambiance, instrumentale

## Sécurité

### Upload Preset "Unsigned"
- ✅ Sûr : Limité aux types de fichiers et dossiers définis
- ✅ Sûr : Taille max configurée dans Cloudinary
- ✅ Sûr : Pas d'accès aux autres fonctionnalités Cloudinary
- ⚠️ Note : Le Cloud Name est public (normal et sans risque)

### URLs Cloudinary
- Les URLs sont publiques mais difficiles à deviner
- Les fichiers peuvent être supprimés côté serveur si nécessaire
- Cloudinary gère automatiquement le CDN et l'optimisation

## Support

Si vous rencontrez des problèmes :

1. **Vérifiez la checklist** dans `FIX-VIDEO-AUDIO-NOT-SHOWING.md`
2. **Consultez les logs** de la console navigateur (F12)
3. **Vérifiez la base de données** avec les requêtes SQL fournies
4. **Testez l'URL Cloudinary** directement dans le navigateur

## Ressources

- [Cloudinary Upload Presets](https://cloudinary.com/documentation/upload_presets)
- [Cloudinary Video Upload](https://cloudinary.com/documentation/video_upload)
- [Cloudinary Audio Upload](https://cloudinary.com/documentation/audio_transformations)
