# Fix Cleanup Function - Déploiement Rapide

## Problème
La fonction `cleanup-expired-galleries` ne détecte pas les 11 galeries expirées à cause de problèmes RLS.

## Solution en 3 étapes

### Étape 1 : Corriger les politiques RLS

Dans **Supabase Dashboard → SQL Editor**, exécutez :

```sql
-- Créer des politiques pour le service_role
DROP POLICY IF EXISTS "Service role can access all galleries" ON galleries;
DROP POLICY IF EXISTS "Service role can delete all galleries" ON galleries;
DROP POLICY IF EXISTS "Service role can access all images" ON images;
DROP POLICY IF EXISTS "Service role can delete all images" ON images;

CREATE POLICY "Service role can access all galleries"
ON galleries FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can delete all galleries"
ON galleries FOR DELETE TO service_role USING (true);

CREATE POLICY "Service role can access all images"
ON images FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can delete all images"
ON images FOR DELETE TO service_role USING (true);

-- Fixer les galeries avec user_id NULL
UPDATE galleries
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE user_id IS NULL;
```

### Étape 2 : Déployer la fonction corrigée

**Option A - Via Supabase CLI (Recommandé):**
```bash
supabase functions deploy cleanup-expired-galleries
```

**Option B - Manuellement:**
1. Allez dans **Supabase Dashboard → Edge Functions**
2. Cliquez sur `cleanup-expired-galleries`
3. Cliquez sur **Edit Function**
4. Remplacez le code par le contenu de `supabase/functions/cleanup-expired-galleries/index.ts`
5. Cliquez sur **Deploy**

### Étape 3 : Tester

```bash
curl -X POST https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-expired-galleries
```

**Résultat attendu:**
```json
{
  "success": true,
  "deletedGalleries": 11,
  "deletedImages": X,
  "freedStorageMb": Y.Z,
  "affectedUsers": Z
}
```

## Vérification

Après le test, vérifiez que les galeries ont été supprimées :

```sql
SELECT COUNT(*) FROM galleries WHERE expires_at < NOW();
-- Devrait retourner 0
```

## Si ça ne fonctionne toujours pas

### Vérifier les logs de la fonction

1. Allez dans **Supabase Dashboard → Edge Functions**
2. Cliquez sur `cleanup-expired-galleries`
3. Onglet **Logs**
4. Cherchez les messages d'erreur

### Désactiver temporairement RLS (test uniquement)

```sql
-- ATTENTION : À faire uniquement pour tester !
ALTER TABLE galleries DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;

-- Tester la fonction
-- curl -X POST ...

-- IMPORTANT : Réactiver RLS après le test
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
```

### Vérifier les variables d'environnement

Dans **Supabase Dashboard → Edge Functions → cleanup-expired-galleries → Settings**, vérifiez que ces variables existent :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Changements effectués

1. **Ajout de politiques RLS pour service_role** : Permet à la fonction d'accéder à toutes les galeries
2. **Amélioration de la requête** : Utilise deux requêtes séparées au lieu de `.or()`
3. **Meilleur logging** : Affiche le nombre total de galeries et les détails de recherche
4. **Fix user_id NULL** : Remplace les NULL par un UUID spécial pour les galeries invités
5. **Configuration explicite du client** : Ajoute des options au createClient pour s'assurer du bon fonctionnement

## Après le fix

Une fois que tout fonctionne, configurez le cron job automatique avec le script `supabase/migrations/setup_cron_jobs.sql`
