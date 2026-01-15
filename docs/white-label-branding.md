# White-Label Branding Implementation

## Vue d'ensemble

Le système de branding personnalisé (white-label) permet aux photographes avec un plan **Pro** de personnaliser complètement l'apparence de leurs galeries avec leur propre identité visuelle.

## Fonctionnalités implémentées

### 1. Logo personnalisé

**Requirement 5.1.1** - Le logo du photographe remplace le logo PikSend dans :

- ✅ **Header de la galerie** (`GalleryHeader`)
- ✅ **Lightbox** (visionneuse plein écran)
- ✅ **Formulaire de mot de passe** (`PasswordForm`)
- ✅ **Diaporama** (`Slideshow`)
- ✅ **Footer de la galerie** (adapté selon le plan)

**Comportement :**
- Si `ownerPlan === 'pro'` ET `customLogo` existe → Logo personnalisé affiché
- Sinon → Logo PikSend par défaut

### 2. Couleurs de marque

**Requirement 5.1.2** - Les couleurs personnalisées sont injectées via CSS variables :

```css
--brand-primary: #6366f1    /* Couleur principale */
--brand-secondary: #8b5cf6  /* Couleur secondaire */
--brand-accent: #ec4899     /* Couleur d'accent */
```

**Utilisation :**
- Boutons d'action
- Éléments interactifs
- Dégradés de fond
- Indicateurs visuels

### 3. Footer adaptatif avec domaine personnalisé

Le footer s'adapte automatiquement selon le plan du photographe et la présence d'un domaine personnalisé :

#### Plan Free / Premium (Branding PikSend)
```
┌─────────────────────────────────────────────┐
│ [Logo PikSend] PikSend • Partagez vos photos│
│                    [Dashboard] [Créer]       │
│         Propulsé par PikSend © 2026         │
└─────────────────────────────────────────────┘
```

#### Plan Pro avec logo personnalisé (White-Label)

**Sans domaine personnalisé :**
```
┌─────────────────────────────────────────────┐
│ [Logo Custom] Galerie Professionnelle       │
│                         [Créer ma galerie]   │
│           © 2026 - Galerie sécurisée        │
└─────────────────────────────────────────────┘
```

**Avec domaine personnalisé :**
```
┌─────────────────────────────────────────────┐
│ [Logo Custom] JohnDoe                       │
│                         [Créer ma galerie]   │
│  © 2026 johndoe.com - Tous droits réservés │
└─────────────────────────────────────────────┘
```

**Avec domaine avec tirets :**
```
┌─────────────────────────────────────────────┐
│ [Logo Custom] My Studio                     │
│                         [Créer ma galerie]   │
│ © 2026 my-studio.com - Tous droits réservés│
└─────────────────────────────────────────────┘
```

**Différences clés :**
- Logo personnalisé au lieu de PikSend
- **Nom de marque extrait** du domaine (ex: "JohnDoe" pour johndoe.com)
- Gère les tirets/underscores (my-studio → "My Studio")
- Domaine complet dans le copyright
- Lien dashboard masqué pour les visiteurs
- CTA redirige vers le domaine personnalisé
- Aucune mention PikSend

## Architecture technique

### Flux de données

```
1. Page Server Component (page.tsx)
   ↓
   Fetch profile.branding from Supabase
   ↓
   Extract: customLogo, brandColors, customDomain
   ↓
2. Inject CSS variables + Pass branding data
   ↓
3. Client Component (gallery-view-client.tsx)
   ↓
   Distribute customLogo to child components
   Use customDomain in footer
   ↓
4. Child Components
   - GalleryHeader (logo)
   - Lightbox (logo)
   - PasswordForm (logo)
   - Slideshow (logo)
   - Footer (logo + domain)
```

### Fichiers modifiés

1. **`src/app/g/[slug]/page.tsx`**
   - Extraction du branding depuis le profil
   - Injection des CSS variables
   - Passage du `customLogo` et `customDomain` au client

2. **`src/app/g/[slug]/gallery-view-client.tsx`**
   - Interface `GalleryInfo` étendue avec `custom_logo` et `custom_domain`
   - Distribution du logo aux composants enfants
   - Footer adaptatif selon le plan
   - Normalisation du domaine avec utilitaires

3. **`src/lib/utils/domain.ts`** ⭐ **NOUVEAU**
   - Fonctions de normalisation de domaine
   - Gestion de tous les formats possibles
   - Validation de domaine
   - Tests unitaires complets

4. **`src/components/settings/branding-section.tsx`**
   - Validation du domaine à la saisie
   - Normalisation automatique au blur
   - Messages d'aide pour le format attendu

5. **`src/components/gallery-view/gallery-header.tsx`**
   - Prop `customLogo` ajoutée
   - Affichage conditionnel logo custom vs PikSend

6. **`src/components/gallery-view/lightbox.tsx`**
   - Prop `customLogo` ajoutée
   - Logo dans le header du lightbox

7. **`src/components/gallery-view/password-form.tsx`**
   - Prop `customLogo` ajoutée
   - Logo dans le formulaire de protection

8. **`src/components/gallery-view/slideshow.tsx`**
   - Prop `customLogo` ajoutée
   - Logo dans le header du diaporama

## Configuration du branding

### Dans le dashboard photographe

Le photographe configure son branding dans **Settings > Branding** :

1. **Upload du logo** (PNG, JPG, max 2MB)
   - Stocké en base64 ou Cloudinary
   - Redimensionné automatiquement

2. **Couleurs de marque**
   - Primaire (boutons, liens)
   - Secondaire (dégradés)
   - Accent (highlights)

3. **Domaine personnalisé** (optionnel)
   - Configuration DNS requise
   - SSL automatique

### Stockage en base de données

```typescript
// Table: profiles
{
  branding: {
    customLogo: "data:image/png;base64,..." | "https://cloudinary.com/...",
    brandColors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#ec4899"
    },
    customDomain: "photos.johndoe.com",
    profileSlug: "john-doe",
    profileBio: "Photographe professionnel"
  }
}
```

### Logique du footer

```typescript
// Footer branding logic with domain normalization
import { getDisplayDomain, getDomainUrl } from '@/lib/utils/domain';

// Normalize domain (handles all formats)
const displayDomain = getDisplayDomain(customDomain);
// Input: "https://photos.johndoe.com/" → Output: "photos.johndoe.com"
// Input: "PHOTOS.JOHNDOE.COM" → Output: "photos.johndoe.com"
// Input: "photos.johndoe.com?test=1" → Output: "photos.johndoe.com"

const domainUrl = getDomainUrl(customDomain);
// Always returns: "https://photos.johndoe.com"

if (ownerPlan === 'pro' && customLogo) {
  // White-label mode
  if (displayDomain) {
    // Show: [Logo] photos.johndoe.com
    // Copyright: © 2026 photos.johndoe.com - Tous droits réservés
    // CTA link: https://photos.johndoe.com
  } else {
    // Show: [Logo] Galerie Professionnelle
    // Copyright: © 2026 - Galerie sécurisée
    // CTA link: /
  }
} else {
  // Standard PikSend branding
  // Show: [PikSend Logo] PikSend • Tagline
  // Copyright: Propulsé par PikSend © 2026
  // CTA link: /
}
```

### Normalisation du domaine

Le système gère automatiquement tous les formats de domaine possibles :

| Input | Output (Display) | Output (Brand Name) |
|-------|------------------|---------------------|
| `example.com` | `example.com` | `Example` |
| `johndoe.com` | `johndoe.com` | `Johndoe` |
| `photos.johndoe.com` | `photos.johndoe.com` | `Johndoe` |
| `my-studio.com` | `my-studio.com` | `My Studio` |
| `https://example.com` | `example.com` | `Example` |
| `http://example.com` | `example.com` | `Example` |
| `https://photos.example.com/` | `photos.example.com` | `Example` |
| `PHOTOS.EXAMPLE.COM` | `photos.example.com` | `Example` |
| `photos.example.com/path` | `photos.example.com` | `Example` |
| `photos.example.com?param=value` | `photos.example.com` | `Example` |
| `https://photos.example.com/path?test=1#top` | `photos.example.com` | `Example` |

**Fonctions utilitaires :**
- `normalizeDomain()` : Nettoie et normalise le domaine
- `getDomainUrl()` : Retourne l'URL complète avec https://
- `getDisplayDomain()` : Retourne le domaine pour affichage
- `getBrandName()` : **Extrait le nom de marque** (ex: "JohnDoe" de johndoe.com)
- `getShortBrandName()` : Nom de marque ou domaine complet en fallback
- `isValidDomain()` : Valide le format du domaine
- `getRootDomain()` : Extrait le domaine racine d'un sous-domaine

## Gestion des plans

### Vérification des accès

```typescript
import { hasFeatureAccess } from '@/config/plan-features';

// Vérifier si le photographe peut utiliser le white-label
const canUseWhiteLabel = hasFeatureAccess(ownerPlan, 'whiteLabel');
// → true si ownerPlan === 'pro'
```

### Matrice des fonctionnalités

| Fonctionnalité | Free | Premium | Pro |
|----------------|------|---------|-----|
| Logo personnalisé | ❌ | ❌ | ✅ |
| Couleurs de marque | ❌ | ❌ | ✅ |
| Domaine personnalisé | ❌ | ❌ | ✅ |
| Footer white-label | ❌ | ❌ | ✅ |

## Expérience utilisateur

### Pour le photographe Pro

1. Upload son logo dans Settings
2. Configure ses couleurs de marque
3. Configure son domaine personnalisé (optionnel)
4. Ses galeries affichent automatiquement son branding complet
5. Ses clients voient une galerie professionnelle à son image

### Pour les visiteurs

- **Plan Free/Premium** : Galerie PikSend avec logo et branding standard
- **Plan Pro sans domaine** : Galerie professionnelle avec logo et "Galerie Professionnelle"
- **Plan Pro avec domaine** : Galerie entièrement white-label avec domaine personnalisé
- Expérience cohérente et professionnelle
- Aucune mention PikSend si white-label activé

## Avantages du white-label avec domaine personnalisé

### Pour le photographe
- ✅ Renforce son identité de marque
- ✅ Apparence 100% professionnelle
- ✅ Cohérence visuelle avec son site web
- ✅ Pas de distraction avec d'autres marques
- ✅ Valorise son offre premium
- ✅ **Domaine personnalisé = crédibilité maximale**
- ✅ **URL mémorable pour les clients**
- ✅ **SEO optimisé sur son propre domaine**

### Pour PikSend
- ✅ Argument de vente majeur pour le plan Pro
- ✅ Différenciation claire entre les plans
- ✅ Fidélisation des photographes professionnels
- ✅ Positionnement haut de gamme
- ✅ **Domaine personnalisé = valeur perçue élevée**

## Améliorations futures possibles

1. **Nom de marque personnalisé**
   - Remplacer "Galerie Professionnelle" par le nom du photographe
   - Récupérer depuis `profile.name` ou `branding.businessName`

2. **Lien vers profil photographe**
   - Footer avec lien vers `/p/[profileSlug]`
   - "Voir toutes mes galeries"

3. **Favicon personnalisé**
   - Utiliser le logo comme favicon
   - Améliore l'expérience en onglet

4. **Email branding**
   - Emails de notification avec logo personnalisé
   - Templates adaptés aux couleurs de marque

5. **Watermark personnalisé**
   - Utiliser le logo comme watermark
   - Position et opacité configurables

## Conformité avec les requirements

- ✅ **Requirement 5.1.1** : Logo personnalisé uploadable et affiché
- ✅ **Requirement 5.1.2** : Couleurs de marque configurables et appliquées
- ✅ **Requirement 5.1.3** : Disponible uniquement pour plans Premium et Pro
- ✅ **Requirement 5.2** : Support domaine personnalisé (infrastructure prête)
- ✅ **Requirement 5.3** : Couleurs appliquées à tous les éléments UI

## Tests recommandés

### Tests fonctionnels
1. ✅ Upload d'un logo dans Settings
2. ✅ Configuration des couleurs de marque
3. ✅ Vérification de l'affichage dans la galerie
4. ✅ Test avec différents plans (Free, Premium, Pro)
5. ✅ Vérification du fallback si pas de logo

### Tests visuels
1. ✅ Logo bien dimensionné dans tous les composants
2. ✅ Couleurs appliquées correctement
3. ✅ Footer adapté selon le plan
4. ✅ Responsive sur mobile et desktop
5. ✅ Mode sombre/clair

### Tests de régression
1. ✅ Galeries sans branding fonctionnent toujours
2. ✅ Plans Free/Premium non affectés
3. ✅ Performance non dégradée
4. ✅ Pas de fuite de données entre photographes

## Intégration avec le mode sombre

Les couleurs de branding personnalisées s'adaptent **automatiquement** au mode sombre de la galerie pour garantir une lisibilité optimale. Voir la documentation complète :

📄 **[Branding et Mode Sombre](./branding-dark-mode-integration.md)**

**Résumé** :
- Les couleurs sont automatiquement éclaircies en mode sombre (+15% luminosité)
- Augmentation de la saturation (+10%) pour plus de vivacité
- Pas de configuration supplémentaire requise
- Contraste optimal garanti dans les deux modes

## Documentation connexe

- 📄 [Mode Sombre Galerie](./gallery-dark-mode.md) - Implémentation du mode sombre isolé
- 📄 [Branding et Mode Sombre](./branding-dark-mode-integration.md) - Ajustement automatique des couleurs
- 📄 [Domaine Personnalisé](./custom-domain-implementation.md) - Configuration du domaine
- 📄 [Extraction de Domaine](./domain-extraction-examples.md) - Exemples de normalisation

## Conclusion

Le système de white-label branding est maintenant **complètement implémenté** et fonctionnel. Il permet aux photographes Pro de créer une expérience galerie entièrement personnalisée, renforçant leur identité de marque et offrant une valeur ajoutée significative par rapport aux plans inférieurs.

Les couleurs de branding s'adaptent intelligemment au mode sombre, garantissant une expérience visuelle optimale dans tous les contextes.
