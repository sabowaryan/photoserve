# Synchronisation des Features entre FEATURES-BY-PLAN.md et plans.ts

## ✅ Features synchronisées

Les features suivantes du fichier `FEATURES-BY-PLAN.md` ont été ajoutées dans `plans.ts` et s'affichent maintenant automatiquement dans tous les composants de pricing.

### Features ajoutées dans le pricing

| Feature | Free | Premium | Pro | Affichage |
|---------|------|---------|-----|-----------|
| **Galeries actives** | 2 | 100 | Illimitées | ✅ Toujours |
| **Photos par galerie** | 50 | 500 | 2000 | ✅ Toujours |
| **Accès** | 7 jours | 90 jours | 1 an | ✅ Toujours |
| **Fichiers HD** | Jusqu'à 25 Mo | Sans limite | Sans limite | ✅ Toujours |
| **Qualité originale** | ✅ | ✅ | ✅ | ✅ Toujours |
| **Mode diaporama** | ❌ | ✅ | ✅ | ✅ Si activé |
| **Système de favoris** | ❌ | ✅ | ✅ | ✅ Si activé |
| **Téléchargement ZIP** | ❌ | ✅ | ✅ | ✅ Si activé |
| **Watermark personnalisé** | ❌ | ✅ | ✅ | ✅ Si activé |
| **Branding personnalisé** | ❌ | ❌ | ✅ | ✅ Si activé |
| **Domaine personnalisé** | ❌ | ❌ | ✅ | ✅ Si activé |
| **Support prioritaire** | ❌ | ❌ | ✅ | ✅ Si activé |

### Résultat dans le pricing

**Plan FREE affiche maintenant :**
- 2 galeries actives
- 50 photos par galerie
- Accès jusqu'à 7 jours
- Fichiers jusqu'à 25 Mo
- Qualité originale préservée

**Plan PREMIUM affiche maintenant :**
- 100 galeries actives
- 500 photos par galerie
- Accès jusqu'à 90 jours
- Fichiers HD sans limite
- Qualité originale préservée
- Mode diaporama
- Système de favoris
- Téléchargement ZIP
- Watermark personnalisé

**Plan PRO affiche maintenant :**
- Galeries illimitées
- 2000 photos par galerie
- Accès jusqu'à 1 an
- Fichiers HD sans limite
- Qualité originale préservée
- Mode diaporama
- Système de favoris
- Téléchargement ZIP
- Watermark personnalisé
- Branding personnalisé
- Domaine personnalisé
- Support prioritaire sous 2h

## 📋 Features dans FEATURES-BY-PLAN.md mais pas dans le pricing

Ces features sont documentées mais ne sont pas affichées dans le pricing (volontairement, pour garder le pricing simple) :

### Features techniques (non marketing)
- Grille Masonry responsive
- Lightbox plein écran
- Mode sombre/clair
- Upload drag & drop
- Upload de dossiers
- Gestion des galeries
- Tri intelligent
- Protection mot de passe
- Zero compression
- Edge Delivery (CDN)
- SEO Opt-Out
- Multi-langues
- QR Code Generator
- Mobile App (PWA)

### Features avancées (futures)
- Commentaires sur images
- Statistiques détaillées
- Bouton CTA personnalisé
- Paywall (Vente galerie)
- Deadline Timer
- Lead Magnet
- Video Cover
- Audio Gallery
- Testimonial Collector
- Adobe Lightroom Plugin
- Face Recognition
- Auto-Captioning
- Smart Culling

## 🔄 Comment ajouter une nouvelle feature au pricing

1. **Ajouter dans `PlanLimits`** (src/types/index.ts)
```typescript
export interface PlanLimits {
  // ... autres propriétés
  has_new_feature: boolean;
}
```

2. **Ajouter dans `PLAN_LIMITS`** (src/config/plans.ts)
```typescript
export const PLAN_LIMITS = {
  free: { has_new_feature: false },
  premium: { has_new_feature: true },
  pro: { has_new_feature: true },
};
```

3. **Ajouter dans `PLAN_FEATURES_CONFIG`** (src/config/plans.ts)
```typescript
{
  key: 'new_feature',
  getLabel: () => 'Ma nouvelle feature',
  condition: (limits) => limits.has_new_feature,
  priority: 13,
}
```

4. **C'est tout !** La feature apparaît automatiquement dans :
   - Landing page (section pricing)
   - Page `/pricing` dédiée
   - Settings > Abonnement

## 📝 Bonnes pratiques

1. **Pricing simple** : Limitez à 5-8 features par plan pour ne pas surcharger
2. **Features marketing** : Privilégiez les features qui ont un impact sur la décision d'achat
3. **Documentation complète** : Gardez FEATURES-BY-PLAN.md à jour avec TOUTES les features
4. **Cohérence** : Assurez-vous que les features affichées correspondent aux features réellement implémentées

## 🎯 Stratégie actuelle

- **Pricing** : Affiche les features clés pour la conversion (5-12 features)
- **FEATURES-BY-PLAN.md** : Documentation exhaustive de toutes les features (60+ features)
- **plans.ts** : Configuration technique avec les features importantes pour le pricing

Cette séparation permet de garder le pricing simple et impactant tout en maintenant une documentation technique complète.
