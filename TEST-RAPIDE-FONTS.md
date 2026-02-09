# Test Rapide - Vérification Fonts

## 🚀 Étapes de Test (2 minutes)

### 1. Nettoyer le Cache
```cmd
clear-cache.bat
```

### 2. Démarrer le Serveur
```cmd
npm run dev
```

### 3. Ouvrir la Page Auth
```
http://localhost:3000/auth
```

### 4. Vérifier dans DevTools

#### A. Network Tab
1. Ouvrir DevTools (F12)
2. Onglet Network
3. Filter: "font"
4. Recharger la page (Ctrl+R)

**✅ Attendu:**
```
inter-latin-400-*.woff2  (~25KB)
inter-latin-600-*.woff2  (~28KB)
```

**❌ NE DEVRAIT PAS voir:**
```
geist-latin.woff2
geist-mono-latin.woff2
```

#### B. Performance Tab
1. Onglet Performance
2. Cliquer sur Record (rond rouge)
3. Recharger la page
4. Arrêter l'enregistrement

**Vérifier:**
- ✅ Fonts chargent en < 500ms
- ✅ Pas de long task > 500ms pour les fonts
- ✅ LCP element visible rapidement

#### C. Lighthouse
1. Onglet Lighthouse
2. Mode: Mobile
3. Catégorie: Performance
4. Cliquer "Analyze page load"

**Métriques attendues:**
- ✅ Performance: 70-85
- ✅ LCP: < 2.5s
- ✅ TBT: < 500ms
- ✅ CLS: < 0.1

### 5. Vérifier la Console

**✅ Pas d'erreurs:**
```
No errors
```

**❌ Si erreurs:**
- Vérifier que le cache est bien nettoyé
- Redémarrer le serveur
- Vérifier les imports de fonts

## 📊 Résultats Attendus

### Avant (avec Geist)
```
LCP: 10.9s 🔴
TBT: 1,360ms 🔴
Performance: 25 🔴
Fonts: geist-latin.woff2 (11.4s) 🔴
```

### Après (avec Inter optimisé)
```
LCP: ~1.5s ✅
TBT: ~300ms ✅
Performance: 70-85 ✅
Fonts: inter-latin (300ms) ✅
```

## 🐛 Troubleshooting

### Problème: Geist fonts encore présentes
**Solution:**
```cmd
# Arrêter le serveur (Ctrl+C)
rmdir /s /q .next
rmdir /s /q node_modules\.cache
npm run dev
```

### Problème: Erreur de compilation
**Solution:**
```cmd
# Vérifier les imports
grep -r "from 'next/font'" src/app/
```

### Problème: Performance toujours mauvaise
**Solution:**
1. Vérifier que Sentry est désactivé en dev
2. Vérifier Network tab pour requêtes lentes
3. Vérifier Console pour erreurs JavaScript

## ✅ Checklist Rapide

- [ ] Cache nettoyé
- [ ] Serveur redémarré
- [ ] Page /auth chargée
- [ ] Network tab vérifié (seulement Inter)
- [ ] Lighthouse score > 70
- [ ] LCP < 2.5s
- [ ] Pas d'erreurs console

## 📝 Notes

Si tout est ✅, le problème des fonts Geist est résolu!

Si ❌ persiste, voir `URGENCE-FIX-FONTS-GEIST.md` pour debug avancé.

---

**Temps estimé:** 2 minutes  
**Difficulté:** Facile
