# Mode Sombre Limité à la Galerie

## Vue d'ensemble

Le mode sombre de PikSend est **limité uniquement à la galerie publique** et n'affecte pas le reste de l'application (dashboard, pages marketing, etc.). Cela permet aux visiteurs de choisir leur thème préféré pour visualiser les photos sans impacter l'expérience globale du site.

## Pourquoi limiter le mode sombre à la galerie ?

### Avantages

1. **Expérience de visualisation optimale** : Le mode sombre est idéal pour voir des photos
2. **Indépendance** : Les visiteurs peuvent avoir un thème différent du photographe
3. **Pas de conflit** : Le dashboard du photographe garde son thème propre
4. **Stockage séparé** : Préférence galerie ≠ préférence dashboard
5. **Simplicité** : Pas besoin de synchroniser les thèmes entre sections

### Cas d'usage

- **Visiteur** : Regarde une galerie en mode sombre pour mieux voir les photos
- **Photographe** : Travaille dans son dashboard en mode clair
- **Résultat** : Aucun conflit, chacun son thème

## Architecture technique

### Hook personnalisé : `useGalleryTheme`

**Fichier** : `src/hooks/use-gallery-theme.ts`

```typescript
export function useGalleryTheme() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<GalleryTheme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  // Apply theme to gallery container only (not document root)
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    container.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);
  
  return {
    containerRef, // Must be attached to gallery container
    theme,
    resolvedTheme,
    toggleTheme,
    isDark,
    isLight,
  };
}
```

**Différences avec `useTheme` global** :

| Aspect | `useTheme` (Global) | `useGalleryTheme` (Galerie) |
|--------|---------------------|------------------------------|
| Cible | `document.documentElement` | Conteneur galerie uniquement |
| Stockage | `localStorage: 'theme'` | `localStorage: 'gallery-theme'` |
| Classes | `dark` sur `<html>` | `data-gallery-theme="dark"` sur conteneur |
| Portée | Toute l'application | Galerie uniquement |

### CSS personnalisé

**Fichier** : `src/app/g/[slug]/gallery-theme.css`

```css
/* Gallery-specific dark mode styles */
[data-gallery-theme="dark"] {
  color-scheme: dark;
}

/* Override Tailwind dark: classes to work with data-gallery-theme */
[data-gallery-theme="dark"] .dark\:bg-slate-800 {
  background-color: rgb(30 41 59);
}

[data-gallery-theme="dark"] .dark\:text-slate-300 {
  color: rgb(203 213 225);
}

/* ... etc */
```

**Principe** : Les classes Tailwind `dark:*` sont activées par l'attribut `data-gallery-theme="dark"` au lieu de la classe `dark` sur `<html>`.

### Intégration dans la galerie

**Fichier** : `src/app/g/[slug]/gallery-view-client.tsx`

```typescript
import { useGalleryTheme } from "@/hooks/use-gallery-theme";
import "./gallery-theme.css";

export function GalleryViewClient({ ... }) {
  // Gallery-specific theme (doesn't affect rest of the app)
  const { containerRef, toggleTheme, isDark, resolvedTheme } = useGalleryTheme();
  
  return (
    <div 
      ref={containerRef} 
      data-gallery-theme={resolvedTheme}
      className="gallery-theme-wrapper min-h-screen ..."
    >
      {/* Gallery content */}
      <GalleryHeader
        onToggleTheme={toggleTheme}
        isDark={isDark}
        {...otherProps}
      />
      {/* ... */}
    </div>
  );
}
```

**Points clés** :
1. `containerRef` attaché au conteneur principal
2. `data-gallery-theme` appliqué dynamiquement
3. `toggleTheme` et `isDark` passés au header
4. CSS importé localement

### Header de la galerie

**Fichier** : `src/components/gallery-view/gallery-header.tsx`

```typescript
interface GalleryHeaderProps {
  // ...
  onToggleTheme?: () => void;
  isDark?: boolean;
}

export function GalleryHeader({ onToggleTheme, isDark, ... }) {
  return (
    <header>
      {/* Theme toggle button */}
      <button onClick={onToggleTheme}>
        {isDark ? <Sun /> : <Moon />}
      </button>
    </header>
  );
}
```

**Changements** :
- Suppression de `useTheme()` hook
- Props `onToggleTheme` et `isDark` reçues du parent
- Pas de dépendance au thème global

## Fonctionnement

### 1. Initialisation

```
User visite /g/[slug]
  ↓
useGalleryTheme() s'initialise
  ↓
Lit localStorage: 'gallery-theme'
  ↓
Détecte préférence système si 'system'
  ↓
Applique data-gallery-theme="light|dark"
```

### 2. Toggle du thème

```
User clique sur bouton thème
  ↓
toggleTheme() appelé
  ↓
Cycle: light → dark → system → light
  ↓
Sauvegarde dans localStorage: 'gallery-theme'
  ↓
Met à jour data-gallery-theme
  ↓
CSS applique les styles dark:*
```

### 3. Isolation

```
Galerie: data-gallery-theme="dark"
  ↓
CSS: [data-gallery-theme="dark"] .dark\:bg-slate-800
  ↓
Styles appliqués uniquement dans la galerie
  ↓
Dashboard: <html class="light">
  ↓
Pas affecté par le thème galerie
```

## Stockage

### LocalStorage

```javascript
// Thème global (dashboard, pages)
localStorage.getItem('theme') // 'light' | 'dark' | 'system'

// Thème galerie (vue publique)
localStorage.getItem('gallery-theme') // 'light' | 'dark' | 'system'
```

**Indépendants** : Un utilisateur peut avoir :
- Dashboard en mode clair
- Galerie en mode sombre

## Styles supportés

Le CSS personnalisé supporte toutes les classes Tailwind `dark:*` utilisées dans la galerie :

### Backgrounds
- `dark:bg-slate-800`
- `dark:bg-slate-900`
- `dark:from-slate-950`
- `dark:via-slate-900`
- `dark:to-slate-950`

### Text
- `dark:text-slate-100`
- `dark:text-slate-300`
- `dark:text-slate-400`
- `dark:text-slate-500`

### Borders
- `dark:border-slate-700`
- `dark:border-slate-600`

### Hover
- `dark:hover:bg-slate-700`
- `dark:hover:text-slate-200`

### Shadows
- `dark:shadow-indigo-500/10`
- `dark:shadow-slate-900/50`

## Branding personnalisé et mode sombre

### Ajustement automatique des couleurs

Lorsqu'un utilisateur configure son **branding personnalisé** (couleurs primary, secondary, accent), ces couleurs sont **automatiquement ajustées** en mode sombre pour garantir une lisibilité optimale.

#### Principe

```css
/* Mode clair - Couleurs originales */
--brand-primary: rgb(99 102 241);     /* Indigo-500 */
--brand-secondary: rgb(139 92 246);   /* Violet-500 */
--brand-accent: rgb(236 72 153);      /* Pink-500 */

/* Mode sombre - Ajustement automatique */
[data-gallery-theme="dark"] {
  /* Éclaircissement de 15% + saturation +10% */
  --brand-primary-dark: color-mix(in srgb, var(--brand-primary) 85%, white);
  --brand-secondary-dark: color-mix(in srgb, var(--brand-secondary) 85%, white);
  --brand-accent-dark: color-mix(in srgb, var(--brand-accent) 85%, white);
  
  /* Augmentation de luminosité et saturation */
  filter: brightness(1.1) saturate(1.1);
}
```

#### Résultat

| Couleur | Mode Clair | Mode Sombre (ajusté) |
|---------|------------|----------------------|
| Primary | `rgb(99 102 241)` | `rgb(129 140 248)` ≈ +30% luminosité |
| Secondary | `rgb(139 92 246)` | `rgb(167 139 250)` ≈ +30% luminosité |
| Accent | `rgb(236 72 153)` | `rgb(244 114 182)` ≈ +20% luminosité |

### Éléments affectés par le branding

Les couleurs personnalisées sont utilisées dans :

1. **Bouton "Télécharger tout"** : Gradient primary → secondary
2. **Bouton "Créer ma galerie"** (footer) : Background primary
3. **Décorations de fond** : Cercles flous avec couleurs de marque
4. **Accents et highlights** : Bordures, ombres, etc.

### Avantages de l'ajustement automatique

✅ **Pas de configuration supplémentaire** : L'utilisateur définit ses couleurs une seule fois  
✅ **Lisibilité garantie** : Les couleurs restent visibles sur fond sombre  
✅ **Cohérence visuelle** : Les couleurs restent reconnaissables  
✅ **Contraste optimal** : Augmentation automatique de la luminosité  

### Exemple concret

**Photographe configure** :
```json
{
  "brandColors": {
    "primary": "#FF6B6B",    // Rouge corail
    "secondary": "#4ECDC4",  // Turquoise
    "accent": "#FFE66D"      // Jaune
  }
}
```

**Résultat en mode sombre** :
- Primary : `#FF6B6B` → `#FF9999` (plus clair, plus visible)
- Secondary : `#4ECDC4` → `#7EDDD6` (plus lumineux)
- Accent : `#FFE66D` → `#FFEE99` (plus éclatant)

### Cas particuliers

#### Couleurs très claires

Si l'utilisateur choisit des couleurs déjà très claires (ex: `#F0F0F0`), l'ajustement peut les rendre trop lumineuses. Dans ce cas, le filtre `brightness(1.1)` est suffisant pour maintenir la visibilité.

#### Couleurs très sombres

Si l'utilisateur choisit des couleurs très sombres (ex: `#1A1A1A`), l'ajustement les éclaircit significativement pour assurer le contraste sur fond sombre.

### Désactivation de l'ajustement (optionnel)

Si un utilisateur souhaite garder exactement les mêmes couleurs en mode sombre, il peut ajouter dans ses paramètres :

```json
{
  "branding": {
    "disableDarkModeAdjustment": true
  }
}
```

**Note** : Cette option n'est pas encore implémentée mais peut être ajoutée si nécessaire.

## Tests

### Test manuel

1. **Ouvrir une galerie** : `/g/[slug]`
2. **Cliquer sur le bouton thème** : Icône lune/soleil
3. **Vérifier** : La galerie passe en mode sombre
4. **Ouvrir le dashboard** : `/dashboard`
5. **Vérifier** : Le dashboard reste en mode clair
6. **Retourner à la galerie** : Le thème galerie est préservé

### Test de persistance

1. **Galerie en mode sombre**
2. **Fermer l'onglet**
3. **Rouvrir la galerie**
4. **Vérifier** : Toujours en mode sombre

### Test système

1. **Thème galerie sur "system"**
2. **Changer le thème OS** : Clair → Sombre
3. **Vérifier** : La galerie suit le thème OS
4. **Dashboard** : Non affecté

## Avantages de cette approche

### ✅ Isolation complète
- Galerie et dashboard indépendants
- Pas de conflit de thèmes
- Stockage séparé

### ✅ Performance
- CSS minimal et ciblé
- Pas de re-render global
- Changement instantané

### ✅ Maintenabilité
- Code clair et séparé
- Hook réutilisable
- CSS facile à étendre

### ✅ UX optimale
- Visiteurs choisissent leur thème
- Photographes gardent leur préférence
- Pas de surprise

## Limitations

### ⚠️ Composants externes

Les composants qui utilisent des portails (modals, tooltips) peuvent ne pas hériter du thème galerie s'ils sont rendus en dehors du conteneur.

**Solution** : Passer `isDark` en prop et appliquer les styles conditionnellement.

### ⚠️ Maintenance CSS

Chaque nouvelle classe Tailwind `dark:*` doit être ajoutée manuellement au CSS.

**Solution** : Documenter les classes supportées et les ajouter au besoin.

## Améliorations futures

### 1. Plugin Tailwind

Créer un plugin Tailwind pour générer automatiquement les variantes `data-gallery-theme` :

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    plugin(function({ addVariant }) {
      addVariant('gallery-dark', '[data-gallery-theme="dark"] &')
    })
  ]
}
```

Usage : `gallery-dark:bg-slate-800`

### 2. Thème par galerie

Permettre au photographe de définir un thème par défaut pour chaque galerie :

```typescript
interface GallerySettings {
  defaultTheme?: 'light' | 'dark' | 'system';
}
```

### 3. Transitions fluides

Ajouter des transitions CSS pour un changement de thème plus doux :

```css
.gallery-theme-wrapper {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

## Conclusion

Le mode sombre limité à la galerie offre une **expérience optimale** pour visualiser les photos tout en maintenant l'**indépendance** avec le reste de l'application. L'implémentation est **propre, performante et maintenable**.

---

**Fichiers clés** :
- `src/hooks/use-gallery-theme.ts` - Hook personnalisé
- `src/app/g/[slug]/gallery-theme.css` - Styles dark mode
- `src/app/g/[slug]/gallery-view-client.tsx` - Intégration
- `src/components/gallery-view/gallery-header.tsx` - Bouton toggle
