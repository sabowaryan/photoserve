# 🚨 URGENCE: Fix Fonts Geist - LCP 10.9s

## Problème Critique

Le LCP est passé de **2.3s à 10.9s** à cause des fonts **Geist** qui bloquent le rendu pendant **11.4 secondes**.

### Symptômes
- ❌ LCP: 10.9s (catastrophique)
- ❌ Element render delay: 11,280ms
- ❌ Fonts: `geist-latin.woff2` et `geist-mono-latin.woff2` prennent 11.4s
- ❌ CLS: 0.018 (layout shift causé par les fonts)

## Solution Immédiate

### 1. Nettoyer le Cache Next.js

**Windows:**
```cmd
clear-cache.bat
```

**Ou manuellement:**
```cmd
rmdir /s /q .next
rmdir /s /q node_modules\.cache
rmdir /s /q .turbo
```

**Linux/Mac:**
```bash
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
```

### 2. Vérifier les Fonts Configurées

✅ **Déjà corrigé dans:**
- `src/app/layout.tsx` - Réduit de 6 à 2 poids de police
- `src/app/(auth)/layout.tsx` - Utilise seulement 2 poids

### 3. Redémarrer le Serveur

```bash
npm run dev
```

### 4. Vérifier qu'il n'y a Plus de Geist

Ouvrir DevTools > Network > Filter: "geist"
- ✅ Aucune requête pour geist-latin.woff2
- ✅ Aucune requête pour geist-mono-latin.woff2

## Pourquoi Geist Apparaît?

Les fonts Geist sont les fonts par défaut de Next.js 15+ quand aucune font n'est explicitement configurée. Elles peuvent persister dans le cache même après avoir configuré Inter.

## Vérification Post-Fix

### Lighthouse Audit
1. Ouvrir Chrome DevTools
2. Lighthouse tab
3. Performance audit
4. Vérifier:
   - ✅ LCP < 2.5s
   - ✅ Pas de fonts Geist dans Network Dependency Tree
   - ✅ Seulement Inter fonts chargées

### Network Tab
Filtrer par "font" et vérifier:
- ✅ `inter-latin-*.woff2` (seulement 2 fichiers)
- ❌ Pas de `geist-*.woff2`

## Si le Problème Persiste

### Option 1: Forcer la Suppression du Cache
```bash
# Arrêter le serveur
# Supprimer TOUT
rm -rf .next node_modules/.cache .turbo

# Redémarrer
npm run dev
```

### Option 2: Vérifier next.config.ts
Assurez-vous qu'il n'y a pas de configuration de fonts Geist:

```typescript
// next.config.ts
// NE DEVRAIT PAS contenir de référence à Geist
```

### Option 3: Vérifier tailwind.config
```typescript
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      // PAS de Geist ici
    }
  }
}
```

## Métriques Attendues Après Fix

| Métrique | Avant (avec Geist) | Après (sans Geist) | Cible |
|----------|-------------------|-------------------|-------|
| LCP | 10.9s 🔴 | ~1.5s ✅ | < 2.5s |
| Element Render Delay | 11,280ms 🔴 | ~200ms ✅ | < 500ms |
| Font Load Time | 11.4s 🔴 | ~300ms ✅ | < 500ms |
| CLS | 0.018 🟡 | 0 ✅ | < 0.1 |
| Performance Score | 25 🔴 | 70-85 ✅ | > 70 |

## Commandes de Debug

### Trouver les Fonts dans le Build
```bash
# Après build
find .next -name "*.woff2" -o -name "*.woff"
```

### Vérifier la Taille des Fonts
```bash
# Windows
dir .next\static\media\*.woff2

# Linux/Mac
ls -lh .next/static/media/*.woff2
```

### Analyser le Bundle
```bash
ANALYZE=true npm run build
```

## Checklist de Validation

- [ ] Cache .next supprimé
- [ ] Cache node_modules/.cache supprimé
- [ ] Serveur redémarré
- [ ] Aucune font Geist dans Network tab
- [ ] Seulement 2 fichiers Inter chargés
- [ ] LCP < 2.5s
- [ ] Performance score > 70
- [ ] Pas d'erreur de compilation

## Notes Importantes

1. **Ne jamais utiliser Geist** - Trop lourdes et lentes
2. **Inter avec 2 poids maximum** - 400 et 600 suffisent
3. **Toujours preload les fonts** - `preload: true`
4. **Utiliser display: swap** - Évite FOIT
5. **Nettoyer le cache après changement de fonts**

## Contact

Si le problème persiste après ces étapes:
1. Vérifier les logs de compilation
2. Chercher "geist" dans tout le code: `grep -r "geist" src/`
3. Vérifier les imports de fonts dans tous les layouts

---

**Créé:** 2026-02-09  
**Priorité:** 🚨 CRITIQUE  
**Status:** En cours de résolution
