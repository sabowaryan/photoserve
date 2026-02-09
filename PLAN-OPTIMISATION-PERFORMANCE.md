# Plan d'Optimisation Performance PikSend

Plan d'action concret basé sur les meilleures pratiques Next.js 2025.

## 🎯 Objectif

Améliorer le score de performance de **25 à 85+** et réduire le TBT de **1,510ms à <200ms**.

---

## ✅ Phase 1: Quick Wins (FAIT)

### 1.1 Désactiver Sentry en Développement ✅
- **Impact:** -1,300ms TBT, -200KB bundle
- **Fichiers:** `next.config.ts`, `src/instrumentation-client.ts`
- **Status:** ✅ Implémenté

### 1.2 Optimiser les Fonts ✅
- **Impact:** -100ms LCP, -50KB
- **Changement:** 3 → 2 poids de police
- **Fichier:** `src/app/(auth)/layout.tsx`
- **Status:** ✅ Implémenté

### 1.3 Ajouter Preconnect pour OAuth ✅
- **Impact:** -150ms OAuth flow
- **Fichier:** `src/app/(auth)/layout.tsx`
- **Status:** ✅ Implémenté

### 1.4 Optimiser Package Imports ✅
- **Impact:** -50KB bundle
- **Fichier:** `next.config.ts`
- **Status:** ✅ Implémenté

**Résultat Phase 1:** -1,600ms TBT, -300KB bundle

---

## 🚀 Phase 2: Dynamic Imports (PRIORITAIRE)

### 2.1 Lazy Load Composants Lourds
**Impact estimé:** -200KB bundle, -300ms TBT

#### A. Email Editor
```typescript
// src/app/(dashboard)/settings/email-templates/page.tsx
const EmailEditor = dynamic(
  () => import('react-email-editor'),
  { 
    ssr: false,
    loading: () => <EditorSkeleton />
  }
);
```

#### B. PDF Generator
```typescript
// src/lib/pdf-generator.ts
export async function generatePDF(data) {
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;
  // ... reste du code
}
```

#### C. Excel Export
```typescript
// src/lib/excel-export.ts
export async function exportToExcel(data) {
  const XLSX = await import('xlsx');
  // ... reste du code
}
```

#### D. Canvas Confetti
```typescript
// src/components/celebration.tsx
export async function celebrate() {
  const confetti = (await import('canvas-confetti')).default;
  confetti();
}
```

#### E. 3D Components (Three.js)
```typescript
// src/components/3d-viewer.tsx
const ThreeViewer = dynamic(
  () => import('@/components/three-viewer'),
  { 
    ssr: false,
    loading: () => <ViewerSkeleton />
  }
);
```

### 2.2 Lazy Load Analytics
```typescript
// src/app/layout.tsx
useEffect(() => {
  // Charger après hydration
  if (typeof window !== 'undefined') {
    Promise.all([
      import('@vercel/analytics'),
      import('@vercel/speed-insights')
    ]).then(([analytics, speedInsights]) => {
      // Init
    });
  }
}, []);
```

**Fichiers à modifier:**
- `src/app/(dashboard)/settings/email-templates/page.tsx`
- `src/lib/pdf-generator.ts`
- `src/lib/excel-export.ts`
- `src/components/celebration.tsx`
- `src/components/3d-viewer.tsx`
- `src/app/layout.tsx`

---

## 📦 Phase 3: Optimisation des Imports

### 3.1 Éviter les Barrel Imports
**Impact estimé:** -100KB bundle

#### Avant:
```typescript
import { Button, Card, Modal, Dialog } from '@/components';
```

#### Après:
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Dialog } from '@/components/ui/dialog';
```

### 3.2 Optimiser Lucide Icons
```typescript
// ❌ Éviter
import * as Icons from 'lucide-react';

// ✅ Préférer
import { Mail, Lock, User } from 'lucide-react';
```

### 3.3 Optimiser Lodash
```typescript
// ❌ Éviter
import _ from 'lodash';

// ✅ Préférer
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

**Fichiers à auditer:**
- Tous les fichiers avec `import { ... } from '@/components'`
- Tous les fichiers avec `import * as`

---

## 🖼️ Phase 4: Optimisation des Images

### 4.1 Convertir SVG Inline vers Fichiers ✅ FAIT
**Impact estimé:** -50KB HTML, meilleur cache

#### Implémentation:
- ✅ Créé `/public/icons/logo-gradient.svg` avec gradients PikSend
- ✅ Créé `/public/icons/logo-white.svg` pour variante monochrome
- ✅ Adapté `src/components/shared/logo.tsx` pour utiliser Next.js Image
- ✅ Ajouté `priority` pour optimiser LCP
- ✅ Utilisé `unoptimized` (SVG n'a pas besoin d'optimisation)

**Bénéfices:**
- Logo maintenant cacheable par le navigateur
- Pas d'erreur d'hydratation (plus de `Math.random()`)
- Réduit la taille du HTML de ~3KB par page
- Meilleur pour le cache CDN

**Fichiers modifiés:**
- `src/components/shared/logo.tsx` - Utilise maintenant Image
- `public/icons/logo-gradient.svg` - Nouveau fichier
- `public/icons/logo-white.svg` - Nouveau fichier

### 4.2 Ajouter Priority aux Images Hero
```typescript
// Pages avec hero images
<Image
  src="/hero.jpg"
  alt="Hero"
  priority
  quality={90}
/>
```

**Fichiers à vérifier:**
- `src/app/page.tsx` (homepage)
- `src/app/(marketing)/**/page.tsx`
- Tous les composants avec images above-the-fold

---

## ⚡ Phase 5: Optimisation Server Components

### 5.1 Minimiser RSC Payload
**Impact estimé:** -200KB payload

#### Audit actuel:
```bash
find .next -type f -name "*.rsc" -exec du -h {} + | sort -nr | head -n 5
```

#### Optimiser les props:
```typescript
// ❌ Éviter
<UserProfile user={fullUserObject} />

// ✅ Préférer
<UserProfile 
  name={user.name}
  avatar={user.avatar}
  email={user.email}
/>
```

### 5.2 Utiliser React.cache()
```typescript
import { cache } from 'react';

export const getGallery = cache(async (id: string) => {
  const res = await fetch(`/api/galleries/${id}`);
  return res.json();
});
```

**Fichiers à modifier:**
- `src/lib/services/*.service.ts`
- Tous les fetches dans Server Components

---

## 🎨 Phase 6: Optimisation CSS

### 6.1 Audit CSS-in-JS
**Impact estimé:** Variable selon usage

#### Vérifier l'usage de styled-components/emotion:
```bash
grep -r "styled\." src/ --include="*.tsx" --include="*.jsx"
```

#### Si trouvé, migrer vers:
- Tailwind (préféré)
- CSS Modules
- Vanilla Extract (zero-runtime)

---

## 📊 Phase 7: Monitoring et Validation

### 7.1 Configurer Bundle Analyzer
```bash
npm install @next/bundle-analyzer --save-dev
```

```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

### 7.2 Ajouter Web Vitals Reporting
```typescript
// src/app/layout.tsx
export function reportWebVitals(metric: any) {
  if (metric.label === 'web-vital') {
    console.log(metric);
    // TODO: Envoyer à analytics
  }
}
```

### 7.3 Tests de Performance
```bash
# Lighthouse CI
npm run build
npm start
# Ouvrir Chrome DevTools > Lighthouse

# Bundle analysis
ANALYZE=true npm run build
```

---

## 📅 Timeline

### Semaine 1: Quick Wins + Dynamic Imports
- ✅ Phase 1: Quick Wins (FAIT)
- 🔄 Phase 2: Dynamic Imports (EN COURS)

### Semaine 2: Imports + Images
- Phase 3: Optimisation des Imports
- Phase 4: Optimisation des Images

### Semaine 3: Server + CSS
- Phase 5: Optimisation Server Components
- Phase 6: Optimisation CSS

### Semaine 4: Monitoring + Validation
- Phase 7: Monitoring et Validation
- Tests finaux
- Documentation

---

## 🎯 Métriques de Succès

| Métrique | Avant | Cible | Après Phase 1 | Après Phase 7 |
|----------|-------|-------|---------------|---------------|
| Performance Score | 25 | 85+ | ~70 | 85+ |
| LCP | 2.3s | <1.5s | ~1.8s | <1.5s |
| TBT | 1,510ms | <200ms | ~500ms | <200ms |
| Bundle Size | 1.2MB | <500KB | ~900KB | <500KB |
| First Load JS | 600KB+ | <250KB | ~400KB | <250KB |

---

## 🔍 Commandes Utiles

### Analyser le Bundle
```bash
ANALYZE=true npm run build
```

### Vérifier RSC Payload
```bash
find .next -type f -name "*.rsc" -exec du -h {} + | sort -nr | head -n 5
```

### Trouver les Gros Fichiers
```bash
find src -type f -exec du -h {} + | sort -rh | head -n 20
```

### Audit des Imports
```bash
# Barrel imports
grep -r "from '@/components'" src/ --include="*.tsx" | wc -l

# Wildcard imports
grep -r "import \* as" src/ --include="*.tsx" | wc -l
```

---

## 📝 Notes

- **Priorité 1:** Phases 1-2 (Impact immédiat)
- **Priorité 2:** Phases 3-4 (Impact moyen)
- **Priorité 3:** Phases 5-7 (Optimisation fine)

- **Tester après chaque phase** pour valider les gains
- **Monitorer les erreurs** en production
- **Documenter les changements** pour l'équipe

---

**Créé:** 2026-02-09  
**Dernière mise à jour:** 2026-02-09  
**Status:** Phase 1 complétée ✅
