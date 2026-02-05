# Correction du Dark Mode - Limitation aux Galeries et Portfolios

## Problème
Le dark mode système s'appliquait à toute l'application alors qu'il devrait être réservé uniquement aux galeries publiques et aux portfolios de photographes.

## Solution Implémentée

### 1. Suppression du Script Global de Dark Mode
**Fichier**: `src/app/layout.tsx`

Le script qui appliquait le dark mode à `document.documentElement` a été supprimé. Ce script ajoutait la classe `dark` ou `light` à la racine HTML, affectant ainsi toute l'application.

**Avant**:
```tsx
<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      var theme = localStorage.getItem('theme') || 'system';
      // ... appliquait dark/light à document.documentElement
    })();
  `
}} />
```

**Après**: Script complètement supprimé.

### 2. Dépréciation du Hook `useTheme`
**Fichier**: `src/hooks/use-theme.ts`

Le hook `useTheme` a été marqué comme déprécié avec un avertissement console. Il ne modifie plus `document.documentElement`.

**Changements**:
- Ajout d'un avertissement de dépréciation
- Suppression de l'effet qui appliquait les classes au document root
- Documentation claire indiquant d'utiliser `useGalleryTheme` ou `useProfileTheme` à la place

### 3. Hooks Scopés Existants (Inchangés)

#### `useGalleryTheme`
**Fichier**: `src/hooks/use-gallery-theme.ts`
- Applique le dark mode uniquement au conteneur de galerie via `containerRef`
- Utilise l'attribut `data-theme` et les classes `gallery-light`/`gallery-dark`
- Stocke la préférence dans `localStorage` sous la clé `gallery-theme`

#### `useProfileTheme`
**Fichier**: `src/hooks/use-profile-theme.ts`
- Applique le dark mode uniquement au conteneur de profil via `containerRef`
- Utilise l'attribut `data-profile-theme`
- Stocke la préférence dans `localStorage` sous la clé `profile-theme`

### 4. CSS Scopé

#### Galerie
**Fichier**: `src/app/g/[slug]/gallery-theme.css`
- Tous les styles utilisent le sélecteur `[data-gallery-theme="dark"]`
- Les styles ne s'appliquent qu'aux éléments à l'intérieur du conteneur de galerie

#### Profil
**Fichier**: `src/app/p/[slug]/profile-theme.css`
- Tous les styles utilisent le sélecteur `[data-profile-theme="dark"]`
- Les styles ne s'appliquent qu'aux éléments à l'intérieur du conteneur de profil

### 5. CSS Global
**Fichier**: `src/app/globals.css`
- Les variables CSS pour `.dark` sont toujours définies mais ne seront appliquées que si un élément a la classe `dark`
- Aucun élément de l'application principale n'ajoute cette classe

## Architecture du Dark Mode

```
Application
├── Dashboard (toujours en light mode)
├── Settings (toujours en light mode)
├── Auth pages (toujours en light mode)
└── Pages publiques
    ├── Galerie (/g/[slug])
    │   └── useGalleryTheme → [data-gallery-theme="dark"]
    └── Profil (/p/[slug])
        └── useProfileTheme → [data-profile-theme="dark"]
```

## Utilisation

### Pour les Galeries
```tsx
import { useGalleryTheme } from '@/hooks/use-gallery-theme';

function GalleryComponent() {
  const { containerRef, toggleTheme, isDark } = useGalleryTheme();
  
  return (
    <div ref={containerRef}>
      {/* Contenu de la galerie */}
    </div>
  );
}
```

### Pour les Profils
```tsx
import { useProfileTheme } from '@/hooks/use-profile-theme';

function ProfileComponent() {
  const { containerRef, toggleTheme, isDark } = useProfileTheme();
  
  return (
    <div ref={containerRef}>
      {/* Contenu du profil */}
    </div>
  );
}
```

## Avantages

1. **Isolation**: Le dark mode n'affecte que les pages publiques
2. **Préférences Indépendantes**: Les galeries et profils ont leurs propres préférences de thème
3. **Performance**: Pas de re-render global de l'application
4. **Maintenance**: Code plus clair et plus facile à maintenir
5. **UX**: L'interface d'administration reste cohérente en light mode

## Tests Recommandés

1. Vérifier que le dashboard reste en light mode même si le système est en dark mode
2. Vérifier que les galeries peuvent basculer en dark mode indépendamment
3. Vérifier que les profils peuvent basculer en dark mode indépendamment
4. Vérifier que les préférences sont bien sauvegardées séparément
5. Vérifier que le mode système fonctionne correctement pour les galeries et profils

## Date
5 février 2026
