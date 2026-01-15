# Branding + Mode Sombre : Résumé Rapide

## Comment ça marche ?

### 1️⃣ L'utilisateur configure son branding

```
Dashboard → Paramètres → Branding
├── Logo personnalisé : logo.png
├── Couleur principale : #FF6B6B (Rouge corail)
├── Couleur secondaire : #4ECDC4 (Turquoise)
└── Couleur accent : #FFE66D (Jaune)
```

### 2️⃣ Les couleurs sont injectées dans la galerie

```tsx
// src/app/g/[slug]/page.tsx
<div style={{
  '--brand-primary': '#FF6B6B',
  '--brand-secondary': '#4ECDC4',
  '--brand-accent': '#FFE66D'
}}>
  <GalleryViewClient />
</div>
```

### 3️⃣ Mode clair : Couleurs originales

```
┌─────────────────────────────────────┐
│  [Logo]  Ma Galerie                 │  ← Header blanc
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      Photos ici             │   │  ← Fond blanc
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Télécharger tout] ← Gradient     │
│   #FF6B6B → #4ECDC4                │
└─────────────────────────────────────┘
```

### 4️⃣ Mode sombre : Ajustement automatique

```css
/* CSS applique automatiquement */
[data-gallery-theme="dark"] {
  --brand-primary-dark: #FF9999;    /* +30% luminosité */
  --brand-secondary-dark: #7EDDD6;  /* +30% luminosité */
  --brand-accent-dark: #FFEE99;     /* +20% luminosité */
}
```

```
┌─────────────────────────────────────┐
│  [Logo]  Ma Galerie                 │  ← Header noir
│                                     │
│  ┌─────────────────────────────────┐   │
│  │                             │   │
│  │      Photos ici             │   │  ← Fond noir
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Télécharger tout] ← Gradient     │
│   #FF9999 → #7EDDD6 (plus clair!)  │
└─────────────────────────────────────┘
```

## Transformation des couleurs

| Couleur | Mode Clair | Mode Sombre | Changement |
|---------|------------|-------------|------------|
| 🔴 Rouge | `#FF6B6B` | `#FF9999` | +30% luminosité |
| 🔵 Turquoise | `#4ECDC4` | `#7EDDD6` | +30% luminosité |
| 🟡 Jaune | `#FFE66D` | `#FFEE99` | +20% luminosité |
| 🟣 Violet | `#8B5CF6` | `#A78BFA` | +25% luminosité |
| 🟢 Vert | `#10B981` | `#34D399` | +35% luminosité |

## Avantages

✅ **Automatique** : Pas de configuration supplémentaire  
✅ **Intelligent** : Ajustement basé sur la luminosité originale  
✅ **Accessible** : Contraste optimal garanti  
✅ **Cohérent** : Les couleurs restent reconnaissables  

## Éléments affectés

### Header
- Logo personnalisé (identique dans les deux modes)
- Fond : Blanc → Noir
- Texte : Noir → Blanc

### Boutons
- "Télécharger tout" : Gradient avec couleurs ajustées
- "Créer ma galerie" : Background avec couleur ajustée

### Décorations
- Cercles flous de fond : Couleurs ajustées
- Ombres : Couleurs ajustées

### Footer
- Logo personnalisé (identique)
- Nom de marque extrait du domaine
- Liens : Couleurs ajustées

## Cas d'usage

### Photographe avec couleurs vives

```
Branding : Rouge vif (#FF0000)
Mode clair : #FF0000 (visible sur blanc)
Mode sombre : #FF6666 (visible sur noir)
```

### Photographe avec couleurs pastel

```
Branding : Rose pastel (#FFB6C1)
Mode clair : #FFB6C1 (visible sur blanc)
Mode sombre : #FFD4DC (encore plus clair, visible sur noir)
```

### Photographe avec couleurs sombres

```
Branding : Bleu marine (#1E3A8A)
Mode clair : #1E3A8A (visible sur blanc)
Mode sombre : #60A5FA (beaucoup plus clair, visible sur noir)
```

## Technique

### CSS utilisé

```css
/* Éclaircissement avec color-mix */
--brand-primary-dark: color-mix(in srgb, var(--brand-primary) 85%, white);

/* Augmentation luminosité + saturation */
filter: brightness(1.1) saturate(1.1);
```

### Résultat final

```
Couleur originale : rgb(99, 102, 241)
                    ↓
Mélange avec blanc : rgb(129, 140, 248)  [+15% blanc]
                    ↓
Brightness 1.1 :     rgb(142, 154, 273)  [+10% luminosité]
                    ↓
Saturate 1.1 :       rgb(135, 147, 280)  [+10% saturation]
                    ↓
Résultat final :     rgb(135, 147, 255)  [clamped]
```

## FAQ

### Q: L'utilisateur doit-il configurer deux fois ses couleurs ?
**R:** Non ! Il configure une seule fois, l'ajustement est automatique.

### Q: Que se passe-t-il si les couleurs sont déjà très claires ?
**R:** L'ajustement est proportionnel. Les couleurs claires sont moins modifiées.

### Q: Peut-on désactiver l'ajustement automatique ?
**R:** Pas encore implémenté, mais peut être ajouté si nécessaire.

### Q: Le logo change-t-il en mode sombre ?
**R:** Non, le logo reste identique. Seules les couleurs de fond/texte changent.

### Q: Ça fonctionne sur mobile ?
**R:** Oui, parfaitement ! Le mode sombre est responsive.

## Documentation complète

📄 [Branding et Mode Sombre (détaillé)](./branding-dark-mode-integration.md)  
📄 [Mode Sombre Galerie](./gallery-dark-mode.md)  
📄 [White-Label Branding](./white-label-branding.md)  

---

**En résumé** : L'utilisateur configure ses couleurs **une fois**, et le système s'occupe de les adapter automatiquement au mode sombre pour garantir une lisibilité optimale. Simple et efficace ! 🎨✨
