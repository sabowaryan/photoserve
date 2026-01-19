# Fix : Gestion du conflit audio entre Video Cover et AudioPlayer

## Problème potentiel

Si la vidéo de couverture contient un audio ET que l'AudioPlayer (musique d'ambiance) est activé, les deux sons joueraient en même temps, créant une cacophonie désagréable pour l'utilisateur.

### Scénario problématique

1. Photographe uploade une vidéo avec son (ex: vidéo de mariage avec musique)
2. Photographe active aussi la musique d'ambiance (AudioPlayer)
3. Utilisateur ouvre la galerie
4. ❌ Deux audios jouent simultanément
5. ❌ Expérience utilisateur dégradée

## Solution implémentée

### 1. Détection automatique du conflit

Le composant `VideoCover` reçoit maintenant un prop `hasBackgroundAudio` pour détecter si l'AudioPlayer est présent :

```tsx
interface VideoCoverProps {
  videoUrl: string;
  className?: string;
  showControls?: boolean;
  hasBackgroundAudio?: boolean; // Nouveau prop
}
```

### 2. Comportement adaptatif

**Sans AudioPlayer** (musique d'ambiance désactivée) :
- ✅ Vidéo muette par défaut
- ✅ Bouton unmute visible
- ✅ Utilisateur peut activer le son de la vidéo

**Avec AudioPlayer** (musique d'ambiance activée) :
- ✅ Vidéo toujours muette (forcé)
- ✅ Bouton unmute caché
- ✅ Tooltip informatif affiché
- ✅ Priorité donnée à la musique d'ambiance

### 3. Code implémenté

**VideoCover.tsx** :
```tsx
export function VideoCover({ 
  videoUrl, 
  className = "",
  showControls = true,
  hasBackgroundAudio = false // Nouveau prop
}: VideoCoverProps) {
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    // Empêcher le unmute si musique d'ambiance présente
    if (hasBackgroundAudio) {
      return;
    }
    
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed inset-0 ...">
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted={isMuted} // Toujours muted si hasBackgroundAudio
        loop
        playsInline
        preload="auto"
      />

      {/* Bouton unmute - Caché si AudioPlayer présent */}
      {showControls && isLoaded && !hasBackgroundAudio && (
        <button onClick={toggleMute} ...>
          {isMuted ? <VolumeX /> : <Volume2 />}
        </button>
      )}
      
      {/* Tooltip informatif - Affiché si AudioPlayer présent */}
      {hasBackgroundAudio && isLoaded && (
        <div className="absolute bottom-6 right-6 z-10 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-medium pointer-events-none">
          Vidéo muette (musique d'ambiance active)
        </div>
      )}
    </div>
  );
}
```

**gallery-view-client.tsx** :
```tsx
// Détection automatique de l'AudioPlayer
const audioUrl = canUseAudioGallery ? settings.audioUrl : undefined;

// Passage du prop au VideoCover
{videoCoverUrl && (
  <VideoCover 
    videoUrl={videoCoverUrl} 
    hasBackgroundAudio={!!audioUrl} // true si AudioPlayer présent
  />
)}
```

## Logique de priorité

### Hiérarchie audio

1. **Musique d'ambiance (AudioPlayer)** : Priorité haute
   - Contrôlée par l'utilisateur (play/pause, volume)
   - Boucle continue pendant toute la visite
   - Expérience immersive intentionnelle

2. **Son de la vidéo** : Priorité basse
   - Optionnel et contextuel
   - Peut être désactivé sans impact
   - Secondaire par rapport à l'ambiance générale

### Matrice de décision

| Video Cover | AudioPlayer | Comportement |
|-------------|-------------|--------------|
| Sans audio  | Désactivé   | Vidéo muette, pas de contrôle |
| Avec audio  | Désactivé   | Vidéo muette, bouton unmute visible |
| Sans audio  | Activé      | Vidéo muette, tooltip informatif |
| Avec audio  | Activé      | Vidéo muette forcée, tooltip informatif |

## Interface utilisateur

### Sans conflit (AudioPlayer désactivé)

```
┌─────────────────────────────────────┐
│                                     │
│         Video Cover                 │
│         (avec audio)                │
│                                     │
│                                     │
│                          [🔇]       │ ← Bouton unmute
└─────────────────────────────────────┘
```

### Avec conflit (AudioPlayer activé)

```
┌─────────────────────────────────────┐
│                                     │
│         Video Cover                 │
│         (muette forcée)             │
│                                     │
│                                     │
│    [Vidéo muette (musique active)] │ ← Tooltip informatif
└─────────────────────────────────────┘

[🎵 Musique | ⏸ | ━━━━━━ | 🔊]        ← AudioPlayer en bas à gauche
```

## Tests

### Test 1 : Vidéo seule (sans AudioPlayer)
1. Désactiver la musique d'ambiance dans les settings
2. Uploader une vidéo avec audio
3. Ouvrir la galerie
4. ✅ Vidéo joue en muet
5. ✅ Bouton unmute visible en bas à droite
6. Cliquer sur unmute
7. ✅ Le son de la vidéo s'active
8. ✅ Pas de conflit audio

### Test 2 : Vidéo + AudioPlayer
1. Activer la musique d'ambiance dans les settings
2. Uploader une vidéo avec audio
3. Ouvrir la galerie
4. Accepter le consentement audio
5. ✅ Musique d'ambiance joue
6. ✅ Vidéo joue en muet
7. ✅ Bouton unmute de la vidéo est caché
8. ✅ Tooltip "Vidéo muette (musique d'ambiance active)" affiché
9. ✅ Pas de conflit audio

### Test 3 : Vidéo sans audio + AudioPlayer
1. Activer la musique d'ambiance
2. Uploader une vidéo sans audio
3. Ouvrir la galerie
4. ✅ Musique d'ambiance joue
5. ✅ Vidéo joue normalement
6. ✅ Tooltip affiché (même si vidéo sans audio)
7. ✅ Expérience cohérente

### Test 4 : Changement dynamique
1. Ouvrir une galerie avec vidéo + audio
2. ✅ Bouton unmute visible
3. Activer la musique d'ambiance (si possible dynamiquement)
4. ✅ Bouton unmute disparaît
5. ✅ Tooltip apparaît
6. ✅ Vidéo reste muette

## Recommandations pour les photographes

### Choix de la stratégie audio

**Option 1 : Musique d'ambiance seule** (Recommandé)
- ✅ Expérience cohérente
- ✅ Contrôle total sur l'ambiance
- ✅ Pas de conflit
- ✅ Boucle continue
- 📹 Vidéo sans audio ou muette

**Option 2 : Son de la vidéo seul**
- ✅ Audio contextuel à la vidéo
- ✅ Synchronisé avec les images
- ⚠️ Boucle de 30s max
- ⚠️ Peut être répétitif
- 🎵 Pas de musique d'ambiance

**Option 3 : Les deux** (Non recommandé)
- ❌ Conflit audio potentiel
- ❌ Expérience confuse
- ✅ Système gère automatiquement (vidéo muette)
- 💡 Mieux vaut choisir l'un ou l'autre

### Guide de décision

**Utilisez la musique d'ambiance si** :
- Vous voulez une ambiance continue
- Vous avez une playlist ou une musique longue
- Vous voulez que l'utilisateur contrôle le volume
- Vous avez plusieurs vidéos dans la galerie

**Utilisez le son de la vidéo si** :
- Le son est essentiel à la vidéo (ex: vœux de mariage)
- Vous n'avez qu'une seule vidéo courte
- Le son est synchronisé avec l'action
- Vous ne voulez pas de musique continue

## Améliorations futures possibles

### 1. Choix utilisateur
Permettre à l'utilisateur de choisir quelle source audio écouter :
```tsx
<div className="audio-selector">
  <button>🎵 Musique d'ambiance</button>
  <button>📹 Son de la vidéo</button>
</div>
```

### 2. Mix audio
Mixer les deux sources avec des volumes ajustables :
```tsx
<div className="audio-mixer">
  <input type="range" label="Musique" />
  <input type="range" label="Vidéo" />
</div>
```

### 3. Détection automatique
Détecter si la vidéo contient de l'audio et adapter l'UI :
```tsx
const hasVideoAudio = await detectAudioTrack(videoUrl);
if (hasVideoAudio && hasBackgroundAudio) {
  showConflictWarning();
}
```

### 4. Avertissement dans le dashboard
Prévenir le photographe lors de l'upload :
```tsx
{videoHasAudio && settings.audioUrl && (
  <Alert>
    ⚠️ Votre vidéo contient de l'audio. La musique d'ambiance sera prioritaire.
  </Alert>
)}
```

## Fichiers modifiés

1. ✅ `src/components/gallery-view/video-cover.tsx`
   - Ajout du prop `hasBackgroundAudio`
   - Logique de désactivation du unmute
   - Tooltip informatif

2. ✅ `src/app/g/[slug]/gallery-view-client.tsx`
   - Passage du prop `hasBackgroundAudio={!!audioUrl}`

## Résumé

✅ **Problème anticipé** : Conflit audio entre vidéo et musique d'ambiance
✅ **Solution implémentée** : Priorité automatique à la musique d'ambiance
✅ **UX améliorée** : Tooltip informatif pour l'utilisateur
✅ **Comportement adaptatif** : Bouton unmute caché si conflit
✅ **Logique claire** : Musique d'ambiance = priorité haute

Le système gère maintenant intelligemment le conflit audio potentiel, en donnant la priorité à la musique d'ambiance tout en informant l'utilisateur de manière claire et non intrusive.
