# Configuration du mode sombre - Tailwind v4

## Problème résolu

Le navigateur en mode sombre système appliquait automatiquement des couleurs sombres (bordures noires, textes clairs) sur TOUTES les pages du site, alors que le mode sombre devrait être limité UNIQUEMENT aux pages `/g/` (galeries) et `/p/` (profils).

## Solution implémentée

### 1. Utilisation de `@custom-variant` (Tailwind v4)

La clé pour désactiver le mode sombre automatique basé sur `prefers-color-scheme` est d'utiliser `@custom-variant` au lieu de `@variant`:

```css
@import "tailwindcss";

/* Disable automatic dark mode based on system preference (prefers-color-scheme)
   Dark mode is ONLY enabled manually for galleries (/g/) and profiles (/p/) */
@custom-variant dark (&:where(.gallery-theme-wrapper[data-gallery-theme="dark"], .gallery-theme-wrapper[data-gallery-theme="dark"] *, .profile-theme-wrapper[data-profile-theme="dark"], .profile-theme-wrapper[data-profile-theme="dark"] *));
```

**Explication:**
- `@custom-variant dark` redéfinit complètement le variant `dark:` de Tailwind
- `&:where(...)` spécifie que les classes `dark:` ne s'appliquent QUE dans les wrappers spécifiés
- Cela désactive complètement la détection automatique de `prefers-color-scheme: dark`

### 2. Forcer `color-scheme: light` sur HTML et Body

```css
html {
  color-scheme: light !important;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color-scheme: light !important;
}
```

**Pourquoi `!important` ?**
- Force le navigateur à ignorer `prefers-color-scheme: dark`
- Empêche les styles natifs du navigateur d'appliquer le mode sombre
- Garantit que les formulaires, inputs, et autres éléments natifs restent en mode clair

### 3. Permettre le mode sombre pour les wrappers spécifiques

```css
.gallery-theme-wrapper[data-gallery-theme="dark"],
.profile-theme-wrapper[data-profile-theme="dark"] {
  color-scheme: dark;
}
```

Cela permet aux galeries et profils d'utiliser le mode sombre quand l'utilisateur l'active manuellement.

### 4. Metadata Next.js

Dans `src/app/layout.tsx`:

```typescript
export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
  // ...
};

export const metadata: Metadata = {
  // ...
  other: {
    'color-scheme': 'light',
    // ...
  },
};
```

Et dans le JSX:

```tsx
<html lang="en" suppressHydrationWarning style={{ colorScheme: 'light' }}>
  <body style={{ colorScheme: 'light' }}>
    {/* ... */}
  </body>
</html>
```

## Différence entre `@variant` et `@custom-variant`

### `@variant` (ne fonctionne PAS pour désactiver le mode sombre système)

```css
/* ❌ N'empêche PAS prefers-color-scheme: dark */
@variant dark (&:is(.gallery-theme-wrapper[data-gallery-theme="dark"] *));
```

Tailwind génère quand même des styles basés sur `@media (prefers-color-scheme: dark)`.

### `@custom-variant` (fonctionne ✅)

```css
/* ✅ Désactive complètement prefers-color-scheme: dark */
@custom-variant dark (&:where(.gallery-theme-wrapper[data-gallery-theme="dark"], .gallery-theme-wrapper[data-gallery-theme="dark"] *));
```

Tailwind utilise UNIQUEMENT le sélecteur spécifié, sans générer de media query.

## Résultat

- ✅ Tout le site reste en mode clair, même si le système est en mode sombre
- ✅ Les bordures, textes, et backgrounds restent clairs sur toutes les pages
- ✅ Les pages `/g/` et `/p/` peuvent toujours utiliser le mode sombre manuellement
- ✅ Les hooks `useGalleryTheme` et `useProfileTheme` fonctionnent correctement
- ✅ Le mode sombre par défaut est `'light'` au lieu de `'system'`

## Références

- [Tailwind CSS v4 - Disabling Dark Mode](https://iifx.dev/en/articles/457136754/goodbye-dark-mode-disabling-system-preference-theming-in-tailwind-css-4)
- [Tailwind CSS v4 - Custom Variants](https://tailwindcss.com/docs/v4-beta#custom-variants)
- [MDN - color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)

## Fichiers modifiés

1. `src/app/globals.css` - Configuration `@custom-variant` et `color-scheme`
2. `src/app/layout.tsx` - Metadata et styles inline
3. `src/hooks/use-gallery-theme.ts` - Défaut `'light'` au lieu de `'system'`
4. `src/hooks/use-profile-theme.ts` - Défaut `'light'` au lieu de `'system'`
