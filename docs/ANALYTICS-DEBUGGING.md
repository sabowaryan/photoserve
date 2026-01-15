# Analytics - Guide de Débogage

## Problème : "Visitor 1 but no geographic data"

### Causes Possibles

#### 1. IP Locale (Développement) ⚠️

**Symptôme** : Vous testez en local (`localhost:3000`)

**Explication** : 
- Votre IP est `127.0.0.1` ou `::1` (localhost)
- Le service détecte automatiquement les IPs privées
- Retourne `null` sans appeler l'API de géolocalisation
- C'est **normal** et **attendu** en développement

**Solution** : Tester avec une IP publique (voir section Tests ci-dessous)

#### 2. Visite Avant l'Implémentation 📅

**Symptôme** : Le visiteur a été tracké avant la Phase 1

**Explication** :
- Les anciennes vues utilisaient `/api/view` (simple)
- Pas de `country_code` enregistré
- Dashboard affiche "1 visitor" mais pas de pays

**Solution** : 
- Supprimer les anciennes données de test
- Ou attendre de nouvelles visites

#### 3. Erreur API de Géolocalisation ❌

**Symptôme** : Erreur dans les logs serveur

**Causes possibles** :
- API ip-api.com indisponible
- Timeout (>3 secondes)
- Limite de requêtes dépassée (45/min)

**Solution** : Vérifier les logs serveur

---

## Vérifications

### 1. Vérifier les Données en Base

Exécutez ce SQL dans Supabase :

```sql
-- Voir les dernières vues
SELECT 
  ga.id,
  g.title,
  ga.visitor_ip,
  ga.country_code,
  ga.user_agent,
  ga.viewed_at
FROM gallery_analytics ga
JOIN galleries g ON g.id = ga.gallery_id
ORDER BY ga.viewed_at DESC
LIMIT 10;
```

**Résultats attendus** :

| visitor_ip | country_code | Signification |
|------------|--------------|---------------|
| `127.0.0.1` | `NULL` | ✅ Normal (IP locale) |
| `192.168.x.x` | `NULL` | ✅ Normal (IP privée) |
| `8.8.8.8` | `US` | ✅ Géolocalisation OK |
| `1.1.1.1` | `AU` | ✅ Géolocalisation OK |
| `203.0.113.42` | `NULL` | ⚠️ Erreur géolocalisation |

### 2. Vérifier les Logs Serveur

**Dans le terminal où Next.js tourne** :

```bash
# Chercher les erreurs de géolocalisation
grep -i "geolocation" .next/server.log

# Ou dans la console du terminal
# Vous devriez voir :
# "Private IP detected, skipping geolocation: 127.0.0.1"
```

### 3. Tester le Service de Géolocalisation

```bash
# Installer tsx si pas déjà fait
npm install -D tsx

# Exécuter le script de test
npx tsx scripts/test-geolocation.ts
```

**Résultat attendu** :
```
🧪 Test de Géolocalisation IP

Test 1: IP publique (Google DNS)
IP: 8.8.8.8
Pays: US
✅ Attendu: US

Test 2: IP publique (Cloudflare)
IP: 1.1.1.1
Pays: AU
✅ Attendu: AU (Australie)

Test 3: IP locale (localhost)
IP: 127.0.0.1
Pays: null
✅ Attendu: null (IP privée)

✅ Tests terminés !
```

---

## Solutions

### Solution 1 : Tester avec une IP Publique

#### Option A : Déployer en Production/Staging

1. Déployer sur Vercel/Netlify/autre
2. Accéder via l'URL publique
3. Votre vraie IP publique sera utilisée
4. Géolocalisation fonctionnera automatiquement

#### Option B : Simuler une IP Publique (Dev)

Modifier temporairement l'API analytics pour forcer une IP de test :

```typescript
// src/app/api/galleries/[id]/analytics/route.ts

// TEMPORAIRE - POUR TEST UNIQUEMENT
const ip = process.env.NODE_ENV === 'development' 
  ? '8.8.8.8' // IP de test (Google DNS - US)
  : metadata.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined;
```

**⚠️ IMPORTANT** : Retirer ce code après les tests !

#### Option C : Utiliser un Tunnel (ngrok)

```bash
# Installer ngrok
npm install -g ngrok

# Créer un tunnel vers localhost:3000
ngrok http 3000

# Accéder via l'URL ngrok (ex: https://abc123.ngrok.io)
# Votre IP publique sera utilisée
```

### Solution 2 : Nettoyer les Anciennes Données

```sql
-- Supprimer les vues sans country_code (anciennes)
DELETE FROM gallery_analytics 
WHERE country_code IS NULL;

-- Réinitialiser le compteur de vues
UPDATE galleries 
SET views_count = (
  SELECT COUNT(*) 
  FROM gallery_analytics 
  WHERE gallery_id = galleries.id
);
```

### Solution 3 : Vérifier l'API ip-api.com

Tester manuellement l'API :

```bash
# Test direct de l'API
curl "http://ip-api.com/json/8.8.8.8?fields=status,countryCode"

# Résultat attendu :
# {"status":"success","countryCode":"US"}
```

Si l'API ne répond pas :
- Vérifier votre connexion internet
- Vérifier que vous n'avez pas dépassé la limite (45 req/min)
- Attendre quelques minutes et réessayer

---

## Tests Complets

### Test 1 : Visite Locale (Dev)

1. Accéder à une galerie : `http://localhost:3000/g/[slug]`
2. Ouvrir la console réseau (F12)
3. Vérifier les requêtes :
   - `POST /api/galleries/[id]/analytics` → 204
   - `POST /api/galleries/[id]/view` → 200

4. Vérifier les logs serveur :
   ```
   Private IP detected, skipping geolocation: 127.0.0.1
   ```

5. Vérifier en base :
   ```sql
   SELECT visitor_ip, country_code FROM gallery_analytics ORDER BY viewed_at DESC LIMIT 1;
   -- Résultat : visitor_ip = '127.0.0.1', country_code = NULL
   ```

**✅ Résultat attendu** : Pas de country_code (normal)

### Test 2 : Visite Publique (Production)

1. Déployer sur Vercel/Netlify
2. Accéder via l'URL publique
3. Vérifier en base :
   ```sql
   SELECT visitor_ip, country_code FROM gallery_analytics ORDER BY viewed_at DESC LIMIT 1;
   -- Résultat : visitor_ip = '203.0.113.42', country_code = 'FR' (ou votre pays)
   ```

**✅ Résultat attendu** : country_code présent

### Test 3 : Dashboard Analytics

1. Aller sur `/dashboard/gallery/[id]/analytics`
2. Vérifier les métriques :
   - **Total Views** : > 0
   - **Unique Visitors** : > 0
   - **Geographic Distribution** : Carte avec pays (si IP publique)
   - **Views Over Time** : Graphique avec données

---

## Checklist de Débogage

- [ ] Vérifier que vous êtes en local (IP privée = normal)
- [ ] Exécuter le script de test : `npx tsx scripts/test-geolocation.ts`
- [ ] Vérifier les données en base (SQL ci-dessus)
- [ ] Vérifier les logs serveur (erreurs géolocalisation)
- [ ] Tester l'API ip-api.com manuellement
- [ ] Déployer en production pour test avec IP publique
- [ ] Vérifier le dashboard analytics

---

## FAQ

### Q: Pourquoi "Unique Visitors: 1" mais pas de pays ?

**R:** Vous testez probablement en local avec une IP privée (`127.0.0.1`). C'est normal. Le service détecte les IPs privées et ne les géolocalise pas.

### Q: Comment tester la géolocalisation en local ?

**R:** 
1. Utiliser ngrok pour exposer localhost
2. Ou modifier temporairement le code pour forcer une IP de test
3. Ou déployer en staging/production

### Q: L'API ip-api.com est-elle fiable ?

**R:** Oui, mais :
- Gratuit : 45 requêtes/minute
- HTTP uniquement (HTTPS payant)
- Précision : ~95% pour le pays, ~80% pour la ville
- Alternative : MaxMind GeoLite2 (base locale)

### Q: Que faire si la limite de 45 req/min est dépassée ?

**R:** 
1. Implémenter un cache (Redis/Memcached)
2. Ou passer à MaxMind GeoLite2 (base locale, illimité)
3. Ou payer pour ip-api.com Pro (HTTPS + plus de requêtes)

### Q: Les anciennes vues seront-elles géolocalisées ?

**R:** Non. Seules les nouvelles vues (après Phase 1) auront un `country_code`. Les anciennes vues resteront avec `country_code = NULL`.

---

## Logs Utiles

### Logs Normaux (Développement)

```
Private IP detected, skipping geolocation: 127.0.0.1
```

### Logs Normaux (Production)

```
Geolocation successful: FR (from IP: 203.0.113.42)
```

### Logs d'Erreur

```
Geolocation error: Request timeout
Geolocation error: API error: 429 (Too Many Requests)
Geolocation error: Invalid IP format
```

---

## Ressources

- [ip-api.com Documentation](http://ip-api.com/docs/)
- [MaxMind GeoLite2](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data)
- [ngrok Documentation](https://ngrok.com/docs)

---

**Document créé le** : 15 Janvier 2026  
**Version** : 1.0.0  
**Auteur** : Équipe PikSend
