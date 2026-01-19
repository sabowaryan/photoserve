# Comment ajouter une nouvelle feature aux plans

Ce guide explique comment ajouter une nouvelle fonctionnalité qui sera automatiquement affichée dans tous les composants de pricing.

## 📋 Étapes

### 1. Ajouter la propriété dans le type `PlanLimits`

Fichier : `src/types/index.ts`

```typescript
export interface PlanLimits {
  storage_limit_mb: number;
  max_galleries: number;
  max_images_per_gallery: number;
  max_image_size_mb: number;
  max_expiration_days: number;
  can_download_zip: boolean;
  has_custom_branding: boolean;
  has_priority_support: boolean; // ✅ Nouvelle feature
}
```

### 2. Ajouter les valeurs dans `PLAN_LIMITS`

Fichier : `src/config/plans.ts`

```typescript
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    // ... autres propriétés
    has_priority_support: false, // ✅ Free n'a pas le support prioritaire
  },
  premium: {
    // ... autres propriétés
    has_priority_support: false, // ✅ Premium n'a pas le support prioritaire
  },
  pro: {
    // ... autres propriétés
    has_priority_support: true, // ✅ Pro a le support prioritaire
  },
};
```

### 3. Ajouter la configuration d'affichage dans `PLAN_FEATURES_CONFIG`

Fichier : `src/config/plans.ts`

```typescript
export const PLAN_FEATURES_CONFIG = [
  // ... features existantes
  {
    key: 'priority_support',
    getLabel: () => 'Support prioritaire sous 2h',
    condition: (limits: PlanLimits) => limits.has_priority_support,
    priority: 8, // Ordre d'affichage
  },
];
```

### 4. C'est tout ! 🎉

La nouvelle feature apparaîtra automatiquement dans :
- ✅ Landing page (section pricing)
- ✅ Page `/pricing` dédiée
- ✅ Settings > Abonnement
- ✅ Tous les futurs composants utilisant `getPlanFeatures()`

## 🔧 Configuration avancée

### Feature toujours affichée

Pour une feature qui doit toujours être affichée (comme "Qualité originale préservée") :

```typescript
{
  key: 'original_quality',
  getLabel: () => 'Qualité originale préservée',
  priority: 5,
  alwaysShow: true, // ✅ Toujours affichée, même si condition est false
}
```

### Feature avec condition complexe

Pour une feature avec une condition plus complexe :

```typescript
{
  key: 'advanced_analytics',
  getLabel: (limits: PlanLimits) => 
    limits.max_galleries > 50 
      ? 'Analytics avancées illimitées' 
      : 'Analytics basiques',
  condition: (limits: PlanLimits) => limits.max_galleries > 10,
  priority: 9,
}
```

### Feature avec label dynamique

Pour une feature dont le label dépend des limites :

```typescript
{
  key: 'api_calls',
  getLabel: (limits: PlanLimits) => {
    if (limits.api_calls_per_month >= 1000000) {
      return 'API illimitée';
    }
    return `${limits.api_calls_per_month.toLocaleString()} appels API/mois`;
  },
  priority: 10,
}
```

## 📝 Bonnes pratiques

1. **Nommage** : Utilisez des noms de clés descriptifs en snake_case
2. **Priorité** : Ordonnez les features par importance (1 = plus important)
3. **Labels** : Soyez concis et orienté bénéfice client
4. **Conditions** : Utilisez des conditions simples et lisibles
5. **Focus livraison** : Évitez de parler de "stockage", préférez "capacité de livraison"

## ✅ Exemple complet

Ajout d'une feature "Watermark personnalisé" :

```typescript
// 1. Type
export interface PlanLimits {
  // ... autres propriétés
  has_custom_watermark: boolean;
}

// 2. Limites
export const PLAN_LIMITS = {
  free: { has_custom_watermark: false },
  premium: { has_custom_watermark: true },
  pro: { has_custom_watermark: true },
};

// 3. Configuration d'affichage
export const PLAN_FEATURES_CONFIG = [
  // ... autres features
  {
    key: 'custom_watermark',
    getLabel: () => 'Watermark personnalisé',
    condition: (limits) => limits.has_custom_watermark,
    priority: 7,
  },
];
```

Résultat : La feature apparaît automatiquement dans tous les composants de pricing ! 🚀
