# Slideshow Feature - Documentation

## Vue d'ensemble

Le **Slideshow** (diaporama) est une fonctionnalité premium qui permet aux visiteurs de visionner les photos d'une galerie en mode plein écran avec défilement automatique, offrant une expérience cinématographique immersive.

## Statut d'implémentation

✅ **Complètement implémenté** et fonctionnel

## Restriction par plan

### Matrice d'accès

| Plan | Slideshow disponible | Requirement |
|------|---------------------|-------------|
| **Free** | ❌ Non | - |
| **Premium** | ✅ Oui | Requirement 1.4.6 |
| **Pro** | ✅ Oui | Requirement 1.4.6 |

### Code de vérification

```typescript
// src/app/g/[slug]/gallery-view-client.tsx
const canUseSlideshow = hasFeatureAccess(ownerPlan, 'slideshow');
// → true si ownerPlan === 'premium' ou 'pro'
// → false si ownerPlan === 'free'
```

### Configuration

```typescript
// src/config/plan-features.ts
export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    slideshow: false,  // ❌ Désactivé
    // ...
  },
  premium: {
    slideshow: true,   // ✅ Activé
    // ...
  },
  pro: {
    slideshow: true,   // ✅ Activé
    // ...
  },
};
```

## Fonctionnalités

### 1. Bouton de lancement (Requirement 1.4.1)

Le bouton "Lancer le diaporama" s'affiche **uniquement** si le photographe a un plan Premium ou Pro :

```tsx
{/* Slideshow Button - Only show if owner has Premium or Pro plan */}
{canUseSlideshow && (
  <div className="mb-6 flex justify-center">
    <button
      onClick={handleSlideshowClick}
      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/10 flex items-center gap-2"
    >
      <Play className="w-5 h-5" fill="currentColor" />
      <span>Lancer le diaporama</span>
    </button>
  </div>
)}
```

**Position** : Entre le deadline timer et la grille de photos

### 2. Mode plein écran (Requirement 1.4.2)

- Affichage fullscreen avec fond noir
- Navigation automatique entre les images
- Transitions fluides

### 3. Intervalle configurable (Requirement 1.4.3)

```typescript
<Slideshow
  images={images}
  interval={5000}  // 5 secondes (configurable: 3000, 5000, 10000)
  autoPlay={true}
  onClose={() => setShowSlideshow(false)}
/>
```

**Intervalles supportés** :
- 3000ms (3 secondes)
- 5000ms (5 secondes) ← Par défaut
- 10000ms (10 secondes)

### 4. Contrôles play/pause (Requirement 1.4.4)

Le composant Slideshow inclut :
- ▶️ Bouton Play
- ⏸️ Bouton Pause
- ⏮️ Image précédente
- ⏭️ Image suivante
- ❌ Fermer

### 5. Boucle automatique (Requirement 1.4.5)

Après la dernière image, le slideshow revient automatiquement à la première image et continue.

### 6. Watermark (Requirement 2.1)

Le watermark PikSend s'affiche sur les images si :
- La galerie n'est pas débloquée (`!is_unlocked`)
- ET le type de paiement est gratuit (`payment_type === 'free'`)

```typescript
<Slideshow
  images={images}
  showWatermark={!initialGallery.is_unlocked && initialGallery.payment_type === 'free'}
/>
```

### 7. Logo personnalisé (Requirement 5.1)

Le slideshow affiche le logo personnalisé du photographe (Plan Pro) dans le header :

```typescript
<Slideshow
  images={images}
  customLogo={initialGallery.custom_logo}
/>
```

## Expérience utilisateur

### Pour le visiteur (Plan Free)

```
┌─────────────────────────────────────┐
│  Galerie de photos                  │
│  [Photo 1] [Photo 2] [Photo 3]      │
│                                     │
│  ❌ Pas de bouton Slideshow         │
└─────────────────────────────────────┘
```

Le bouton n'est **pas visible** → Pas de frustration

### Pour le visiteur (Plan Premium/Pro)

```
┌─────────────────────────────────────┐
│  Galerie de photos                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ▶️ Lancer le diaporama      │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Photo 1] [Photo 2] [Photo 3]      │
└─────────────────────────────────────┘
```

Clic sur le bouton → Mode plein écran immersif

### Mode Slideshow actif

```
┌─────────────────────────────────────────────┐
│ [Logo] Diaporama          ⏮️ ⏸️ ⏭️ ❌      │
│                                             │
│                                             │
│              [Photo en plein écran]         │
│                                             │
│                                             │
│                    12 / 45                  │
└─────────────────────────────────────────────┘
```

## Architecture technique

### Composant principal

**Fichier** : `src/components/gallery-view/slideshow.tsx`

**Props** :
```typescript
interface SlideshowProps {
  images: ImageWithMeta[];
  interval?: 3000 | 5000 | 10000;
  onClose: () => void;
  autoPlay?: boolean;
  showWatermark?: boolean;
  customLogo?: string | null;
}
```

### Intégration dans la galerie

**Fichier** : `src/app/g/[slug]/gallery-view-client.tsx`

```typescript
// 1. État
const [showSlideshow, setShowSlideshow] = useState(false);

// 2. Vérification du plan
const canUseSlideshow = hasFeatureAccess(ownerPlan, 'slideshow');

// 3. Handler
const handleSlideshowClick = () => {
  setShowSlideshow(true);
};

// 4. Rendu conditionnel du bouton
{canUseSlideshow && (
  <button onClick={handleSlideshowClick}>
    Lancer le diaporama
  </button>
)}

// 5. Rendu du composant
{showSlideshow && (
  <Slideshow
    images={images}
    interval={5000}
    onClose={() => setShowSlideshow(false)}
    autoPlay={true}
    showWatermark={!isUnlocked && paymentType === 'free'}
    customLogo={customLogo}
  />
)}
```

## Tests

### Tests unitaires

**Fichier** : `src/config/__tests__/plan-features.property.test.ts`

```typescript
it('should have slideshow available only for Premium and Pro', () => {
  expect(hasFeatureAccess('free', 'slideshow')).toBe(false);
  expect(hasFeatureAccess('premium', 'slideshow')).toBe(true);
  expect(hasFeatureAccess('pro', 'slideshow')).toBe(true);
});
```

### Tests manuels

1. ✅ **Plan Free** : Bouton slideshow non visible
2. ✅ **Plan Premium** : Bouton visible et fonctionnel
3. ✅ **Plan Pro** : Bouton visible et fonctionnel
4. ✅ **Auto-advance** : Images défilent automatiquement
5. ✅ **Contrôles** : Play/Pause/Prev/Next fonctionnent
6. ✅ **Boucle** : Retour à la première image après la dernière
7. ✅ **Watermark** : Affiché si galerie gratuite non débloquée
8. ✅ **Logo custom** : Affiché si Plan Pro avec logo

## Avantages business

### Pour le photographe

1. **Argument de vente Premium** : Fonctionnalité exclusive qui justifie l'upgrade
2. **Expérience client améliorée** : Présentation professionnelle et immersive
3. **Différenciation** : Se démarque des galeries basiques
4. **Valorisation du travail** : Mode cinématographique met en valeur les photos

### Pour PikSend

1. **Upsell clair** : Fonctionnalité visible qui incite à upgrader
2. **Valeur perçue** : Justifie le prix du plan Premium
3. **Rétention** : Photographes satisfaits restent abonnés
4. **Différenciation marché** : Fonctionnalité premium vs concurrents

## Améliorations futures possibles

### 1. Intervalles personnalisables
Permettre au photographe de définir l'intervalle exact (1-30 secondes)

### 2. Transitions personnalisables
- Fade
- Slide
- Zoom
- Dissolve

### 3. Musique de fond
Intégration avec la fonctionnalité Audio Gallery (Requirement 8.2)

### 4. Mode Ken Burns
Effet de zoom/pan automatique sur les images

### 5. Partage du slideshow
Générer un lien direct vers le mode slideshow

### 6. Slideshow automatique au chargement
Option pour démarrer automatiquement le slideshow

## Conformité avec les requirements

- ✅ **Requirement 1.4.1** : Bouton "Slideshow" dans la galerie
- ✅ **Requirement 1.4.2** : Affichage fullscreen avec auto-advance
- ✅ **Requirement 1.4.3** : Intervalle configurable (3s, 5s, 10s)
- ✅ **Requirement 1.4.4** : Contrôles play/pause
- ✅ **Requirement 1.4.5** : Boucle automatique
- ✅ **Requirement 1.4.6** : Disponible pour Premium et Pro uniquement

## Conclusion

Le Slideshow est une fonctionnalité **premium complète et fonctionnelle** qui :
- ✅ Est correctement restreinte aux plans Premium et Pro
- ✅ Offre une expérience immersive et professionnelle
- ✅ Respecte tous les requirements
- ✅ S'intègre parfaitement avec le branding personnalisé
- ✅ Constitue un argument de vente fort pour l'upgrade

C'est un excellent exemple de fonctionnalité premium bien implémentée qui apporte une réelle valeur ajoutée aux photographes payants.
