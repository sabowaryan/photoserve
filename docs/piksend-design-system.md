# PikSend Design System

## Palette de Couleurs

La palette PikSend est définie dans `src/app/globals.css` et utilise un système de variables CSS pour une cohérence maximale.

### Couleurs Principales

```css
--piksend-deep-blue: 225 54% 38%;  /* #2B4B93 */
--piksend-violet: 282 55% 47%;     /* #6B3186 */
--piksend-rose: 330 44% 48%;       /* #AF4C83 */
--piksend-orange: 14 85% 64%;      /* #E9725D */
--piksend-slate-dark: 222 47% 11%; /* #0F172A */
--piksend-slate-grey: 215 16% 47%; /* #64748B */
```

### Variables Sémantiques

Les couleurs PikSend sont automatiquement mappées aux variables sémantiques Tailwind :

```css
--primary: var(--piksend-deep-blue);
--accent: var(--piksend-violet);
--warning: var(--piksend-orange);
--foreground: var(--piksend-slate-dark);
--muted-foreground: var(--piksend-slate-grey);
```

## Utilisation avec Tailwind

### Classes Tailwind Standard

Utilisez les classes Tailwind standard qui utilisent automatiquement la palette PikSend :

```tsx
// Couleur primaire (Deep Blue)
<button className="bg-primary text-primary-foreground">
  Bouton Principal
</button>

// Couleur accent (Violet)
<div className="bg-accent text-accent-foreground">
  Élément accentué
</div>

// Bordures et anneaux
<input className="border-primary focus:ring-primary" />
```

### Classes Utilitaires PikSend

Des classes utilitaires spécifiques sont disponibles pour un accès direct :

```tsx
// Backgrounds
<div className="bg-piksend-deep-blue">Deep Blue</div>
<div className="bg-piksend-violet">Violet</div>
<div className="bg-piksend-rose">Rose</div>
<div className="bg-piksend-orange">Orange</div>

// Texte
<span className="text-piksend-deep-blue">Texte bleu</span>
<span className="text-piksend-violet">Texte violet</span>
<span className="text-piksend-rose">Texte rose</span>
<span className="text-piksend-orange">Texte orange</span>

// Bordures
<div className="border border-piksend-deep-blue">Bordure bleue</div>
<div className="border border-piksend-violet">Bordure violette</div>
```

### Gradient PikSend

Le gradient signature PikSend est disponible via plusieurs méthodes :

```tsx
// Classe utilitaire pour background
<div className="bg-piksend-gradient">
  Fond avec gradient
</div>

// Classe pour texte avec gradient
<h1 className="gradient-text">
  Titre avec gradient
</h1>

// Classe brand-text (optimisée pour le logo)
<span className="brand-text">PikSend</span>

// Style inline pour plus de contrôle
<div style={{ 
  background: 'linear-gradient(135deg, #2B4B93 0%, #6B3186 40%, #AF4C83 70%, #E9725D 100%)' 
}}>
  Gradient personnalisé
</div>
```

## Exemples d'Utilisation

### Boutons

```tsx
// Bouton principal avec gradient
<button className="bg-piksend-gradient text-white px-6 py-3 rounded-lg">
  Action Principale
</button>

// Bouton avec couleur primaire
<button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg">
  Bouton Standard
</button>

// Bouton outline
<button className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 py-3 rounded-lg">
  Bouton Outline
</button>
```

### Cards

```tsx
<div className="bg-card border border-border rounded-xl p-6">
  <h3 className="text-foreground font-bold mb-2">Titre</h3>
  <p className="text-muted-foreground">Description</p>
  <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
    Action
  </button>
</div>
```

### Badges

```tsx
// Badge avec couleur PikSend
<span className="bg-piksend-violet/10 text-piksend-violet px-3 py-1 rounded-full text-sm font-medium">
  Nouveau
</span>

<span className="bg-piksend-orange/10 text-piksend-orange px-3 py-1 rounded-full text-sm font-medium">
  Important
</span>
```

### Progress Bars

```tsx
<div className="w-full bg-secondary rounded-full h-2">
  <div className="bg-piksend-gradient h-2 rounded-full" style={{ width: '60%' }} />
</div>
```

## Mode Sombre

Le mode sombre utilise automatiquement les mêmes variables PikSend avec des ajustements de contraste :

```tsx
// Fonctionne automatiquement en mode sombre
<div className="bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground">
  Contenu adaptatif
</div>
```

## Bonnes Pratiques

1. **Utilisez les variables sémantiques** (`primary`, `accent`, etc.) plutôt que les couleurs directes pour une meilleure maintenabilité
2. **Le gradient PikSend** doit être réservé aux éléments importants (CTA, headers, logos)
3. **Respectez les contrastes** : utilisez toujours `text-primary-foreground` avec `bg-primary`
4. **Cohérence** : utilisez `primary` pour les actions principales, `accent` pour les éléments secondaires

## Migration depuis l'ancien système

Si vous avez du code avec des couleurs hardcodées, voici comment migrer :

```tsx
// ❌ Ancien (hardcodé)
<button style={{ background: '#2B4B93' }}>Bouton</button>

// ✅ Nouveau (avec variables)
<button className="bg-primary text-primary-foreground">Bouton</button>

// ❌ Ancien (Tailwind générique)
<div className="bg-blue-600">Contenu</div>

// ✅ Nouveau (PikSend)
<div className="bg-primary">Contenu</div>
```

## Ressources

- Palette complète : `src/app/globals.css` (lignes 308-383)
- Composant Logo : `src/components/shared/logo.tsx`
- Exemples : `src/app/(auth)/layout.tsx` et `src/app/(auth)/auth/page.tsx`


## Logo Component

Le composant Logo de PikSend est disponible en plusieurs variantes pour s'adapter à différents contextes visuels.

### Variantes disponibles

1. **gradient** (par défaut) - Logo avec les couleurs PikSend en gradient
   - Utilisation: Fonds clairs, fonds blancs, contextes neutres
   - Exemple: `<LogoIcon size={24} />`

2. **white** / **monochrome** - Logo monochrome blanc
   - Utilisation: Fonds gradient, fonds colorés, fonds sombres
   - Exemple: `<LogoIcon size={24} variant="white" />`
   - Cas d'usage:
     - Layout d'authentification (fond gradient PikSend)
     - Header admin (fond gradient indigo-purple)
     - Tout contexte avec fond coloré où le gradient ne serait pas visible

### Exemples d'utilisation

```tsx
// Logo gradient sur fond clair
<LogoIcon size={32} />

// Logo blanc sur fond gradient
<div className="bg-piksend-gradient">
  <LogoIcon size={32} variant="white" />
</div>

// Logo blanc sur fond coloré
<div className="bg-indigo-600">
  <LogoIcon size={32} variant="monochrome" />
</div>
```

### Props

- `size`: number - Taille du logo en pixels (défaut: 24)
- `className`: string - Classes CSS additionnelles
- `variant`: 'gradient' | 'white' | 'monochrome' - Variante de couleur (défaut: 'gradient')
