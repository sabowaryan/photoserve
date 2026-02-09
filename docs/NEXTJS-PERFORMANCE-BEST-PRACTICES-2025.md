# Next.js Performance Best Practices 2025

Guide complet d'optimisation basé sur les dernières recommandations Vercel et Next.js 16.

**Source:** [Vercel React Best Practices](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices), [Next.js Official Docs](https://nextjs.org/docs/app/guides/lazy-loading), [Vercel KB](https://vercel.com/kb/guide/how-to-optimize-your-document-size-in-next-js)

---

## 🎯 Priorités d'Optimisation

### 1. CRITIQUE - Éliminer les Waterfalls (async)
**Impact:** Réduction de 60-80% du temps de chargement

#### ✅ Paralléliser les Fetches Indépendants
```typescript
// ❌ MAUVAIS: Séquentiel (lent)
const user = await getUser(id);
const posts = await getPosts(id);
const comments = await getComments(id);

// ✅ BON: Parallèle (rapide)
const [user, posts, comments] = await Promise.all([
  getUser(id),
  getPosts(id),
  getComments(id)
]);
```

#### ✅ Déplacer await dans les Branches
```typescript
// ❌ MAUVAIS: Attend même si non utilisé
const data = await fetchData();
if (condition) {
  return data;
}

// ✅ BON: Attend seulement si nécessaire
if (condition) {
  const data = await fetchData();
  return data;
}
```

#### ✅ Utiliser Suspense pour Streamer le Contenu
```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<ProductsSkeleton />}>
        <Products />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews />
      </Suspense>
    </>
  );
}
```

### 2. CRITIQUE - Optimisation de la Taille du Bundle

#### ✅ Éviter les Barrel Imports
```typescript
// ❌ MAUVAIS: Importe tout le package
import { Button, Card, Modal } from '@/components';

// ✅ BON: Import direct
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
```

#### ✅ Dynamic Imports pour Composants Lourds
```typescript
import dynamic from 'next/dynamic';

// ✅ Charger seulement quand nécessaire
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Désactiver SSR si non nécessaire
});

const Modal = dynamic(() => import('./Modal'));
const Editor = dynamic(() => import('react-email-editor'), {
  ssr: false
});
```

#### ✅ Différer les Scripts Tiers
```typescript
// ✅ Charger analytics après hydration
useEffect(() => {
  import('analytics').then(({ default: analytics }) => {
    analytics.init();
  });
}, []);
```

#### ✅ Tree Shaking Optimal
```typescript
// ❌ MAUVAIS: Importe toute la librairie
import _ from 'lodash';
import * as Icons from 'react-icons/fa';

// ✅ BON: Importe seulement ce qui est nécessaire
import debounce from 'lodash/debounce';
import { FaUser, FaHome } from 'react-icons/fa';
```

### 3. HAUTE - Performance Côté Serveur

#### ✅ Utiliser React.cache() pour Déduplication
```typescript
import { cache } from 'react';

// ✅ Déduplique automatiquement les requêtes identiques
export const getUser = cache(async (id: string) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});

// Ces appels ne feront qu'UNE seule requête
const user1 = await getUser('123');
const user2 = await getUser('123');
```

#### ✅ Minimiser les Données Passées aux Client Components
```typescript
// ❌ MAUVAIS: Passe tout l'objet (bloat RSC payload)
<UserProfile user={fullUserObject} />

// ✅ BON: Passe seulement ce qui est nécessaire
<UserProfile 
  name={user.name} 
  avatar={user.avatar}
  email={user.email}
/>
```

#### ✅ Paralléliser les Fetches dans les Composants
```typescript
// ✅ Restructurer pour permettre le parallélisme
async function UserPage({ userId }) {
  // Ces fetches se font en parallèle
  return (
    <>
      <Suspense fallback={<UserSkeleton />}>
        <UserInfo userId={userId} />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts userId={userId} />
      </Suspense>
    </>
  );
}
```

### 4. MOYENNE-HAUTE - Optimisation des Images

#### ✅ Utiliser le Composant Image Partout
```typescript
import Image from 'next/image';

// ✅ Optimisation automatique WebP/AVIF
export default function ProductCard({ product }) {
  return (
    <Image
      src={product.image}
      alt={product.name}
      width={400}
      height={300}
      sizes="(max-width: 768px) 100vw, 400px"
      placeholder="blur"
      blurDataURL={product.blurHash}
    />
  );
}
```

#### ✅ Priority pour Images Above-the-Fold
```typescript
// ✅ Hero images doivent charger immédiatement
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority
  quality={90}
/>
```

#### ✅ Déplacer les SVG vers public/
```typescript
// ❌ MAUVAIS: SVG inline (ajoute au HTML)
<svg>...</svg>

// ✅ BON: SVG externe (cacheable)
<Image 
  src="/icons/logo.svg" 
  alt="Logo" 
  width={40} 
  height={40}
  unoptimized // SVG n'a pas besoin d'optimisation
/>
```

### 5. MOYENNE - Optimisation des Fonts

#### ✅ Utiliser next/font avec Preload
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Évite FOIT
  preload: true,
  weight: ['400', '600'], // Seulement les poids nécessaires
  variable: '--font-inter',
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
});

export default function RootLayout({ children }) {
  return (
    <html className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### 6. MOYENNE - Stratégies de Cache

#### ✅ Static Generation avec Revalidation
```typescript
// ✅ Régénère la page toutes les 60 secondes
export const revalidate = 60;

async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 60 }
  });
  return res.json();
}
```

#### ✅ Cache des Routes API
```typescript
// app/api/data/route.js
export async function GET() {
  const data = await fetchData();
  
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
```

### 7. MOYENNE - Optimisation des Re-renders

#### ✅ Utiliser useMemo pour Calculs Coûteux
```typescript
// ✅ Mémorise les calculs coûteux
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

#### ✅ useCallback pour Callbacks Stables
```typescript
// ✅ Évite de recréer la fonction à chaque render
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

#### ✅ Dériver l'État au Lieu d'Utiliser useEffect
```typescript
// ❌ MAUVAIS: useEffect pour état dérivé
const [filteredItems, setFilteredItems] = useState([]);
useEffect(() => {
  setFilteredItems(items.filter(item => item.active));
}, [items]);

// ✅ BON: Dériver pendant le render
const filteredItems = items.filter(item => item.active);
```

## 🎨 Optimisation CSS

### ✅ Préférer Tailwind ou CSS Modules
```typescript
// ✅ CSS statique (pas de runtime overhead)
import styles from './Button.module.css';

export function Button() {
  return <button className={styles.button}>Click</button>;
}

// ✅ Tailwind (bundle minimal)
export function Button() {
  return <button className="px-4 py-2 bg-blue-500">Click</button>;
}
```

### ❌ Éviter CSS-in-JS Runtime
```typescript
// ❌ MAUVAIS: Ajoute du poids au HTML
import styled from 'styled-components';
const Button = styled.button`...`;

// ✅ BON: Utiliser des alternatives zero-runtime
// ou extraire le CSS au build time
```

## 📊 Monitoring et Mesure

### ✅ Analyser le Bundle
```bash
# Installer l'analyseur
npm install @next/bundle-analyzer --save-dev

# Analyser
ANALYZE=true npm run build
```

### ✅ Vérifier le RSC Payload
```bash
# Trouver les plus gros fichiers RSC
find .next -type f -name "*.rsc" -exec du -h {} + | sort -nr | head -n 5
```

### ✅ Monitorer les Core Web Vitals
```typescript
// app/layout.js
export function reportWebVitals(metric) {
  if (metric.label === 'web-vital') {
    console.log(metric);
    // Envoyer à analytics
    analytics.track(metric.name, metric.value);
  }
}
```

## 🚀 Quick Wins pour PikSend

### 1. Désactiver Sentry en Dev ✅ FAIT
```typescript
// next.config.ts
webpack: (config, { dev }) => {
  if (dev) {
    config.resolve.alias = {
      '@sentry/nextjs': false,
      '@sentry/browser': false,
      '@sentry/core': false,
    };
  }
}
```

### 2. Dynamic Import pour Composants Lourds
```typescript
// ✅ À implémenter
const EmailEditor = dynamic(() => import('react-email-editor'), {
  ssr: false,
  loading: () => <EditorSkeleton />
});

const PDFGenerator = dynamic(() => import('jspdf'), {
  ssr: false
});

const ExcelExport = dynamic(() => import('xlsx'), {
  ssr: false
});
```

### 3. Optimiser les Imports Radix UI
```typescript
// ❌ ACTUEL
import { Dialog } from '@radix-ui/react-dialog';

// ✅ MEILLEUR (si utilisé plusieurs fois)
import * as Dialog from '@radix-ui/react-dialog';
```

### 4. Ajouter Preconnect pour Services Externes
```typescript
// src/app/layout.tsx
<head>
  <link rel="preconnect" href="https://accounts.google.com" />
  <link rel="preconnect" href="https://res.cloudinary.com" />
  <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
</head>
```

### 5. Lazy Load Analytics
```typescript
// ✅ Charger après hydration
useEffect(() => {
  if (typeof window !== 'undefined') {
    import('@vercel/analytics').then(({ Analytics }) => {
      // Init analytics
    });
  }
}, []);
```

## 📈 Objectifs de Performance

| Métrique | Cible | Actuel (Auth) | Après Optimisation |
|----------|-------|---------------|-------------------|
| Performance Score | 90+ | 25 | 85+ |
| LCP | < 2.5s | 2.3s | < 1.5s |
| TBT | < 300ms | 1,510ms | < 200ms |
| CLS | < 0.1 | 0 | 0 |
| Bundle Size | < 400KB | 1.2MB | < 500KB |
| First Load JS | < 200KB | 600KB+ | < 250KB |

## 🔧 Outils Recommandés

1. **Lighthouse** - Audit de performance
2. **WebPageTest** - Test de performance réel
3. **Vercel Analytics** - Monitoring en production
4. **Bundle Analyzer** - Analyse de la taille du bundle
5. **RSC Parser** - Visualiser le payload RSC

## 📚 Ressources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Vercel React Best Practices](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices)
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading)

---

**Dernière mise à jour:** 2026-02-09  
**Basé sur:** Next.js 16, React 19, Vercel Best Practices 2025
