# Intégration Branding et Mode Sombre

## Vue d'ensemble

Cette documentation explique comment les **couleurs de branding personnalisées** s'adaptent automatiquement au **mode sombre** de la galerie pour garantir une expérience visuelle optimale.

## Problématique

Lorsqu'un photographe configure ses couleurs de marque (primary, secondary, accent), ces couleurs doivent rester **lisibles et esthétiques** dans les deux modes :

- **Mode clair** : Fond blanc/clair → Couleurs originales
- **Mode sombre** : Fond noir/sombre → Couleurs ajustées pour le contraste

### Exemple du problème

```
Couleur originale : #3B82F6 (Bleu foncé)

❌ Mode sombre sans ajustement :
   Fond noir + Bleu foncé = Faible contraste, difficile à lire

✅ Mode sombre avec ajustement :
   Fond noir + Bleu clair (#60A5FA) = Bon contraste, facile à lire
```

## Solution : Ajustement automatique

### Algorithme

Les couleurs de branding sont automatiquement ajustées en mode sombre via CSS :

```css
[data-gallery-theme="dark"] {
  /* Mélange la couleur originale avec du blanc (15%) */
  --brand-primary-dark: color-mix(in srgb, var(--brand-primary) 85%, white);
  --brand-secondary-dark: color-mix(in srgb, var(--brand-secondary) 85%, white);
  --brand-accent-dark: color-mix(in srgb, var(--brand-accent) 85%, white);
}

/* Augmentation supplémentaire de luminosité et saturation */
[data-gallery-theme="dark"] [style*="--brand-primary"] {
  filter: brightness(1.1) saturate(1.1);
}
```

### Étapes de transformation

1. **Éclaircissement** : Mélange avec 15% de blanc
2. **Luminosité** : Augmentation de 10% via `brightness(1.1)`
3. **Saturation** : Augmentation de 10% via `saturate(1.1)`

### Exemples de transformation

| Couleur originale | Nom | Mode clair | Mode sombre |
|-------------------|-----|------------|-------------|
| `#3B82F6` | Bleu | `rgb(59 130 246)` | `rgb(96 165 250)` |
| `#EF4444` | Rouge | `rgb(239 68 68)` | `rgb(248 113 113)` |
| `#10B981` | Vert | `rgb(16 185 129)` | `rgb(52 211 153)` |
| `#F59E0B` | Orange | `rgb(245 158 11)` | `rgb(251 191 36)` |
| `#8B5CF6` | Violet | `rgb(139 92 246)` | `rgb(167 139 250)` |

## Éléments utilisant le branding

### 1. Bouton "Télécharger tout"

```tsx
<LoadingButton 
  style={{
    background: `linear-gradient(to right, 
      var(--brand-primary, rgb(99 102 241)), 
      var(--brand-secondary, rgb(139 92 246)))`,
  }}
>
  Tout télécharger
</LoadingButton>
```

**Comportement** :
- Mode clair : Gradient avec couleurs originales
- Mode sombre : Gradient avec couleurs éclaircies automatiquement

### 2. Décorations de fond

```tsx
<div 
  className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-5"
  style={{ backgroundColor: 'var(--brand-primary, rgb(99 102 241))' }}
/>
```

**Comportement** :
- Mode clair : Cercle flou avec couleur primary
- Mode sombre : Cercle flou avec couleur primary éclaircie

### 3. Bouton "Créer ma galerie" (footer)

```tsx
<Link
  href={domainUrl || "/"}
  style={{
    backgroundColor: 'var(--brand-primary, rgb(99 102 241))',
  }}
>
  Créer ma galerie
</Link>
```

**Comportement** :
- Mode clair : Background primary
- Mode sombre : Background primary éclairci

### 4. Ombres et accents

```tsx
<button
  style={{
    boxShadow: '0 10px 15px -3px rgba(var(--brand-primary) / 0.25)',
  }}
>
  Action
</button>
```

**Comportement** :
- Mode clair : Ombre avec couleur primary
- Mode sombre : Ombre avec couleur primary éclaircie

## Configuration utilisateur

### Définir les couleurs de branding

**Interface** : `/dashboard/settings/branding`

```typescript
interface BrandingSettings {
  brandColors?: {
    primary?: string;    // Couleur principale (hex)
    secondary?: string;  // Couleur secondaire (hex)
    accent?: string;     // Couleur d'accent (hex)
  };
  customLogo?: string;   // URL du logo
  customDomain?: string; // Domaine personnalisé
}
```

**Exemple** :

```json
{
  "brandColors": {
    "primary": "#FF6B6B",    // Rouge corail
    "secondary": "#4ECDC4",  // Turquoise
    "accent": "#FFE66D"      // Jaune
  }
}
```

### Stockage

Les couleurs sont stockées dans la table `profiles` :

```sql
profiles
  ├── id
  ├── branding (jsonb)
  │   ├── brandColors
  │   │   ├── primary
  │   │   ├── secondary
  │   │   └── accent
  │   ├── customLogo
  │   └── customDomain
  └── ...
```

### Injection dans la galerie

**Fichier** : `src/app/g/[slug]/page.tsx`

```typescript
// Fetch owner's branding
const { data: profile } = await supabase
  .from('profiles')
  .select('branding')
  .eq('id', gallery.user_id)
  .maybeSingle();

const brandColors = profile?.branding?.brandColors || null;

// Generate CSS variables
const cssVariables = brandColors ? {
  '--brand-primary': brandColors.primary || '#6366f1',
  '--brand-secondary': brandColors.secondary || '#8b5cf6',
  '--brand-accent': brandColors.accent || '#ec4899',
} : undefined;

return (
  <div style={cssVariables as React.CSSProperties}>
    <GalleryViewClient {...props} />
  </div>
);
```

## Tests et validation

### Test visuel

1. **Configurer des couleurs de branding** dans `/dashboard/settings/branding`
2. **Ouvrir une galerie** en mode clair
3. **Vérifier** : Les couleurs personnalisées sont appliquées
4. **Basculer en mode sombre**
5. **Vérifier** : Les couleurs sont automatiquement éclaircies

### Test de contraste

Utiliser un outil comme [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) pour vérifier :

- **Mode clair** : Couleur sur fond blanc (ratio ≥ 4.5:1)
- **Mode sombre** : Couleur ajustée sur fond noir (ratio ≥ 4.5:1)

### Test de cohérence

1. **Choisir une couleur très claire** (ex: `#F0F0F0`)
2. **Vérifier** : Reste visible en mode clair
3. **Basculer en mode sombre**
4. **Vérifier** : Devient plus lumineuse et visible

## Cas particuliers

### Couleurs très claires

**Exemple** : `#F0F0F0` (Gris très clair)

**Problème** : En mode clair, déjà très clair → Risque d'être invisible en mode sombre si éclairci davantage

**Solution** : Le filtre `brightness(1.1)` est suffisant, pas besoin d'éclaircir davantage

### Couleurs très sombres

**Exemple** : `#1A1A1A` (Gris très foncé)

**Problème** : En mode sombre, invisible sur fond noir

**Solution** : L'ajustement `color-mix` éclaircit significativement → `#4A4A4A` (visible)

### Couleurs saturées

**Exemple** : `#FF0000` (Rouge pur)

**Problème** : Peut être trop agressif en mode sombre

**Solution** : `saturate(1.1)` augmente légèrement la saturation sans exagérer

## Améliorations futures

### 1. Prévisualisation en temps réel

Ajouter un toggle mode sombre dans l'interface de configuration du branding :

```tsx
<BrandingSection>
  <ColorPicker value={primary} onChange={setPrimary} />
  <ThemeToggle /> {/* Prévisualisation mode sombre */}
  <Preview colors={{ primary, secondary, accent }} isDark={isDark} />
</BrandingSection>
```

### 2. Ajustement manuel

Permettre à l'utilisateur de définir des couleurs séparées pour le mode sombre :

```typescript
interface BrandingSettings {
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  brandColorsDark?: {  // Nouveau
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}
```

### 3. Validation automatique du contraste

Avertir l'utilisateur si les couleurs choisies ont un contraste insuffisant :

```tsx
<ColorPicker 
  value={primary}
  onChange={setPrimary}
  onValidate={(color) => {
    const contrastLight = getContrast(color, '#FFFFFF');
    const contrastDark = getContrast(adjustForDark(color), '#000000');
    
    if (contrastLight < 4.5 || contrastDark < 4.5) {
      return 'Contraste insuffisant pour l\'accessibilité';
    }
  }}
/>
```

### 4. Thèmes prédéfinis

Proposer des palettes de couleurs pré-testées :

```typescript
const PRESET_THEMES = {
  ocean: { primary: '#0EA5E9', secondary: '#06B6D4', accent: '#14B8A6' },
  sunset: { primary: '#F97316', secondary: '#FB923C', accent: '#FBBF24' },
  forest: { primary: '#10B981', secondary: '#34D399', accent: '#6EE7B7' },
  lavender: { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD' },
};
```

## Conclusion

L'ajustement automatique des couleurs de branding en mode sombre garantit :

✅ **Lisibilité optimale** dans les deux modes  
✅ **Cohérence visuelle** avec l'identité de marque  
✅ **Simplicité** pour l'utilisateur (pas de configuration double)  
✅ **Accessibilité** avec des contrastes suffisants  

L'utilisateur définit ses couleurs **une seule fois**, et le système s'occupe du reste.

---

**Fichiers clés** :
- `src/app/g/[slug]/gallery-theme.css` - Ajustement CSS
- `src/app/g/[slug]/page.tsx` - Injection des variables CSS
- `src/components/settings/branding-section.tsx` - Configuration
- `docs/gallery-dark-mode.md` - Documentation mode sombre
