# Résumé des Corrections - Limites de Plan

## Problème
Les utilisateurs avec des plans supérieurs (Premium/Pro) voyaient des modals d'upgrade même s'ils avaient les droits nécessaires. Cela était dû à l'utilisation des anciennes valeurs de la base de données au lieu des limites définies dans la configuration.

## Solution
Utiliser **toujours** les limites depuis `PLAN_LIMITS` (configuration) basées sur `subscription_plan`, et **jamais** les colonnes `storage_limit_mb`, `max_galleries`, etc. de la base de données.

## Fichiers Corrigés

### 1. Frontend - Composants React

#### ✅ `src/app/(dashboard)/dashboard/gallery/[id]/gallery-detail-client.tsx`
**Avant:**
```typescript
const limits = {
  max_images_per_gallery: profile?.max_images_per_gallery || 30,
  max_image_size_mb: profile?.max_image_size_mb || 5,
};
```

**Après:**
```typescript
const userPlan = profile?.subscription_plan || 'free';
const planLimits = PLAN_LIMITS[userPlan];

const limits = {
  max_images_per_gallery: planLimits.max_images_per_gallery,
  max_image_size_mb: planLimits.max_image_size_mb,
};
```

#### ✅ `src/app/(dashboard)/dashboard/gallery/new/page.tsx`
**Avant:**
```typescript
<GalleryCreateForm
  maxImagesPerGallery={profile?.max_images_per_gallery || 30}
  maxImageSizeMb={profile?.max_image_size_mb || 1}
  ...
/>
```

**Après:**
```typescript
<GalleryCreateForm
  maxImagesPerGallery={planLimits.max_images_per_gallery}
  maxImageSizeMb={planLimits.max_image_size_mb}
  ...
/>
```

#### ✅ `src/app/(dashboard)/dashboard/dashboard-client.tsx`
**Avant:**
```typescript
const stats = useMemo(() => ({
  storageLimit: profile?.storage_limit_mb || 20,
  maxGalleries: profile?.max_galleries || 3,
}), [galleries, profile]);
```

**Après:**
```typescript
const userPlan = profile?.subscription_plan || "free";
const planLimits = PLAN_LIMITS[userPlan];

const stats = useMemo(() => ({
  storageLimit: planLimits.storage_limit_mb,
  maxGalleries: planLimits.max_galleries,
}), [galleries, profile, planLimits]);
```

### 2. Backend - Services

#### ✅ `src/lib/services/image.service.ts`
**Avant:**
```typescript
const storageLimitMb = profile.storage_limit_mb || planLimits.storage_limit_mb;
const maxImagesPerGallery = profile.max_images_per_gallery || planLimits.max_images_per_gallery;
```

**Après:**
```typescript
// Always use plan limits from config, not DB values
const storageLimitMb = planLimits.storage_limit_mb;
const maxImagesPerGallery = planLimits.max_images_per_gallery;
```

#### ✅ `src/lib/services/gallery.service.ts`
Déjà correct - utilise `planLimits` directement.

### 3. Edge Functions

#### ✅ `supabase/functions/stripe-webhook/index.ts`
Mis à jour pour synchroniser les limites avec la configuration:
- Free: 500 MB, 2 galleries
- Premium: 100 GB, 100 galleries
- Pro: 1 TB, 9999 galleries

## Architecture Finale

```
┌─────────────────────────────────────────┐
│  Source de Vérité: src/config/plans.ts  │
│  PLAN_LIMITS = {                        │
│    free: { ... },                       │
│    premium: { ... },                    │
│    pro: { ... }                         │
│  }                                      │
└─────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
┌───────────────┐      ┌────────────────┐
│   Frontend    │      │    Backend     │
│               │      │                │
│ - Dashboard   │      │ - Services     │
│ - Gallery     │      │ - Validators   │
│ - Forms       │      │ - API Routes   │
└───────────────┘      └────────────────┘
        ↓                       ↓
    Lit subscription_plan depuis profile
        ↓                       ↓
    Utilise PLAN_LIMITS[subscription_plan]
```

## Colonnes DB (Legacy)

Les colonnes suivantes dans la table `profiles` sont maintenant **legacy** (conservées pour compatibilité mais non utilisées):
- `storage_limit_mb`
- `max_galleries`
- `max_images_per_gallery`
- `max_image_size_mb`

**Seule colonne importante:** `subscription_plan` ('free' | 'premium' | 'pro')

## Avantages

1. ✅ **Source unique de vérité** - Toutes les limites dans un seul fichier
2. ✅ **Pas de désynchronisation** - Impossible d'avoir des valeurs obsolètes
3. ✅ **Mises à jour faciles** - Changer les limites dans `plans.ts` suffit
4. ✅ **Cohérence garantie** - Frontend et backend utilisent les mêmes valeurs
5. ✅ **Pas de migration DB** - Changer les limites ne nécessite pas de migration

## Tests

### Test 1: Utilisateur Pro - Upload d'image volumineuse
```
Plan: Pro
Limite: 500 MB par image
Fichier: 250 MB
Résultat attendu: ✅ Upload réussi (pas de modal d'upgrade)
```

### Test 2: Utilisateur Free - Upload d'image volumineuse
```
Plan: Free
Limite: 25 MB par image
Fichier: 30 MB
Résultat attendu: ❌ Modal d'upgrade affiché
```

### Test 3: Affichage des limites
```
Plan: Pro
Dashboard devrait afficher:
- Stockage: X Mo / 1 To
- Galeries: Y / ∞
- Images par galerie: 2000 max
- Taille par image: 500 Mo max
```

## Migration des Utilisateurs Existants

Les utilisateurs existants avec des anciennes valeurs dans la DB continueront de fonctionner car:
1. Le code lit `subscription_plan`
2. Applique les limites depuis `PLAN_LIMITS[subscription_plan]`
3. Ignore les anciennes colonnes de limites

**Aucune migration de données nécessaire !**

## Documentation

Voir aussi:
- `docs/plan-limits-architecture.md` - Architecture détaillée
- `src/config/plans.ts` - Configuration des limites
- `DEPLOY-CLEANUP-FIX.md` - Corrections du système de nettoyage
