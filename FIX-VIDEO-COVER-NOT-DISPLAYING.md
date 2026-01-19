# Fix : Video Cover ne s'affiche pas malgré l'URL valide

## Problème rapporté

La galerie contient bien une vidéo (URL valide dans les logs), mais rien ne s'affiche à l'écran.

**Logs de la console** :
```javascript
[Gallery Debug] Media Settings: {
  ownerPlan: "pro",
  canUseVideoCover: true,
  canUseAudioGallery: true,
  videoCoverUrl: "https://res.cloudinary.com/dvjxn1apr/video/upload/v1768830562/photoserve/videos/sootn3m9owkea579uqmr.mp4",
  audioUrl: "https://res.cloudinary.com/dvjxn1apr/video/upload/v1768830584/photoserve/audio/lffdrqnlckpdm4wda1lg.mp3",
  settings: {...}
}
```

✅ L'URL est présente  
✅ Le plan est Pro  
✅ La feature est activée  
❌ La vidéo ne s'affiche pas

## Cause

Le composant `VideoCover` utilisait un positionnement `relative` au lieu de `fixed`, ce qui le plaçait dans le flux normal du document au lieu de l'afficher en arrière-plan plein écran.

### Code problématique

```tsx
// ❌ Avant
return (
  <div className={`relative w-full h-full overflow-hidden ${className}`}>
    <video className="absolute inset-0 w-full h-full object-cover" ... />
  </div>
);
```

**Problème** :
- `relative` : Le conteneur suit le flux du document
- `w-full h-full` : Dépend de la taille du parent (qui peut être 0)
- Résultat : La vidéo est rendue mais invisible ou hors écran

## Solution

Changement du positionnement en `fixed` avec `inset-0` pour couvrir tout l'écran :

```tsx
// ✅ Après
return (
  <div className={`fixed inset-0 w-full h-full overflow-hidden z-0 ${className}`}>
    <video className="absolute inset-0 w-full h-full object-cover" ... />
  </div>
);
```

**Avantages** :
- `fixed` : Positionné par rapport au viewport (écran)
- `inset-0` : Couvre tout l'écran (top: 0, right: 0, bottom: 0, left: 0)
- `z-0` : Derrière le contenu de la galerie
- `w-full h-full` : 100% de la taille du viewport

## Changements apportés

### Fichier modifié
- `src/components/gallery-view/video-cover.tsx`

### Modifications

**Avant** :
```tsx
<div className={`relative w-full h-full overflow-hidden ${className}`}>
```

**Après** :
```tsx
<div className={`fixed inset-0 w-full h-full overflow-hidden z-0 ${className}`}>
```

**Changements** :
1. `relative` → `fixed` : Positionnement par rapport au viewport
2. Ajout de `inset-0` : Couvre tout l'écran
3. Ajout de `z-0` : Derrière le contenu (z-index 0)

## Architecture de positionnement

Voici comment les éléments sont maintenant empilés (z-index) :

```
┌─────────────────────────────────────┐
│ z-300: Modals (consent, pricing)   │ ← Au-dessus de tout
├─────────────────────────────────────┤
│ z-50: Audio controls, Header        │ ← Contrôles fixes
├─────────────────────────────────────┤
│ z-10: Content (images, text)        │ ← Contenu principal
├─────────────────────────────────────┤
│ z-0: Video Cover                    │ ← Arrière-plan vidéo
└─────────────────────────────────────┘
```

## Tests

### Test 1 : Affichage de la vidéo
1. Ouvrir une galerie avec video cover uploadée
2. ✅ La vidéo s'affiche en plein écran en arrière-plan
3. ✅ La vidéo joue automatiquement (muet)
4. ✅ La vidéo boucle indéfiniment
5. ✅ Le contenu de la galerie est visible par-dessus

### Test 2 : Contrôles vidéo
1. Vérifier le bouton mute/unmute en bas à droite
2. ✅ Le bouton est visible et cliquable
3. Cliquer sur le bouton
4. ✅ Le son s'active/désactive
5. ✅ L'icône change (VolumeX ↔ Volume2)

### Test 3 : Overlay et lisibilité
1. Observer le contenu de la galerie
2. ✅ Un gradient sombre est appliqué sur la vidéo
3. ✅ Le texte est lisible (header, titres)
4. ✅ Les images sont visibles et cliquables
5. ✅ Pas de conflit visuel entre vidéo et contenu

### Test 4 : Responsive
1. Tester sur différentes tailles d'écran
2. ✅ Desktop : Vidéo plein écran
3. ✅ Tablet : Vidéo plein écran
4. ✅ Mobile : Vidéo plein écran
5. ✅ Pas de déformation (object-cover)

### Test 5 : Performance
1. Ouvrir la galerie
2. ✅ La vidéo charge progressivement (preload="auto")
3. ✅ Un placeholder animé s'affiche pendant le chargement
4. ✅ Transition douce (opacity) quand la vidéo est prête
5. ✅ Pas de flash ou de saut visuel

### Test 6 : Erreurs
1. Tester avec une URL invalide
2. ✅ Aucune erreur visible à l'utilisateur
3. ✅ Le composant se cache automatiquement
4. ✅ La galerie reste fonctionnelle
5. ✅ Erreur loggée dans la console pour debug

## Comportement attendu

### Chargement
1. **Placeholder** : Fond gris animé (pulse)
2. **Chargement** : Vidéo se charge en arrière-plan
3. **Transition** : Fade-in progressif (1 seconde)
4. **Lecture** : Autoplay muet en boucle

### Interaction
- **Scroll** : La vidéo reste fixe (parallax effect)
- **Hover** : Pas d'interaction (sauf bouton mute)
- **Click** : Pas d'interaction (sauf bouton mute)
- **Mute button** : Toggle son on/off

### Visuel
- **Gradient** : Overlay sombre pour lisibilité
- **Object-fit** : Cover (remplit l'écran sans déformation)
- **Aspect ratio** : Maintenu automatiquement
- **Quality** : Optimisé par Cloudinary

## Recommandations vidéo

Pour une expérience optimale :

### Format
- **Codec** : H.264 (MP4)
- **Résolution** : 1920x1080 (Full HD)
- **Durée** : Max 30 secondes
- **Taille** : Max 50MB
- **Bitrate** : 5-10 Mbps

### Contenu
- **Style** : Cinématique, lent, fluide
- **Mouvement** : Subtil (pas trop rapide)
- **Couleurs** : Pas trop saturées
- **Contraste** : Modéré (pour lisibilité du texte)

### Optimisation
```bash
# Avec FFmpeg
ffmpeg -i input.mp4 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 \
  -preset slow \
  -crf 23 \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  output.mp4
```

## Dépannage

### Problème : Vidéo ne s'affiche toujours pas

**Vérifications** :
1. Ouvrir la console (F12)
2. Chercher `[Gallery Debug] Media Settings`
3. Vérifier que `videoCoverUrl` contient une URL
4. Vérifier que `canUseVideoCover` est `true`
5. Vérifier que `ownerPlan` est `premium` ou `pro`

**Test de l'URL** :
1. Copier l'URL de la vidéo depuis les logs
2. Ouvrir dans un nouvel onglet
3. ✅ La vidéo devrait se télécharger ou jouer
4. ❌ Si erreur 404 : Le fichier n'existe pas sur Cloudinary
5. ❌ Si erreur CORS : Problème de configuration Cloudinary

### Problème : Vidéo s'affiche mais ne joue pas

**Causes possibles** :
1. Autoplay bloqué par le navigateur
2. Fichier vidéo corrompu
3. Format non supporté

**Solutions** :
1. Vérifier la console pour les erreurs autoplay
2. Tester avec un autre fichier vidéo
3. Vérifier le format (MP4 H.264 recommandé)

### Problème : Vidéo saccade ou lag

**Causes possibles** :
1. Fichier trop lourd (> 50MB)
2. Bitrate trop élevé
3. Connexion internet lente

**Solutions** :
1. Compresser la vidéo (voir recommandations)
2. Réduire la résolution (1280x720)
3. Réduire le bitrate (5 Mbps)

### Problème : Vidéo cache le contenu

**Vérifications** :
1. Le z-index du VideoCover doit être `z-0`
2. Le contenu principal doit avoir `z-10` ou plus
3. Le gradient overlay doit être présent

**Solution** :
```tsx
// VideoCover
<div className="fixed inset-0 ... z-0">

// Contenu principal
<main className="relative z-10 ...">
```

## Résumé

✅ **Problème résolu** : Video Cover s'affiche maintenant correctement
✅ **Cause identifiée** : Positionnement `relative` au lieu de `fixed`
✅ **Solution appliquée** : Changement en `fixed inset-0 z-0`
✅ **Tests validés** : Affichage, contrôles, responsive, performance
✅ **Architecture** : Z-index correctement organisé

La vidéo de couverture s'affiche maintenant en plein écran en arrière-plan de la galerie, avec lecture automatique en boucle et contrôles de son accessibles.
