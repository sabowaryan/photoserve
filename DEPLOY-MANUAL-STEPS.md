# Déploiement Manuel - Guide Étape par Étape

## Problème
Le déploiement via CLI échoue avec une erreur de permissions 403.

## Solution : Déploiement via Dashboard Supabase

### Étape 1 : Exécuter le SQL pour fixer RLS

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New query**
5. Copiez-collez ce code :

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

-- Note: Ne PAS modifier les galeries guest (user_id = NULL est valide)
-- Les galeries guest sont autorisées à avoir user_id = NULL
```

6. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)
7. Vérifiez qu'il n'y a pas d'erreurs

### Étape 2 : Mettre à jour la fonction Edge

**Option A : Via l'éditeur en ligne (Recommandé)**

1. Dans le dashboard Supabase, cliquez sur **Edge Functions** dans le menu
2. Trouvez `cleanup-expired-galleries` dans la liste
3. Cliquez dessus pour l'ouvrir
4. Cliquez sur le bouton **Edit** ou l'icône de crayon
5. Remplacez TOUT le code par le contenu du fichier `supabase/functions/cleanup-expired-galleries/index.ts`
6. Cliquez sur **Deploy** ou **Save**

**Option B : Supprimer et recréer**

Si l'option A ne fonctionne pas :

1. Dans **Edge Functions**, cliquez sur `cleanup-expired-galleries`
2. Cliquez sur **Delete Function**
3. Confirmez la suppression
4. Cliquez sur **New Function**
5. Nom : `cleanup-expired-galleries`
6. Collez le code de `supabase/functions/cleanup-expired-galleries/index.ts`
7. Cliquez sur **Deploy**

### Étape 3 : Vérifier les variables d'environnement

1. Dans **Edge Functions**, cliquez sur `cleanup-expired-galleries`
2. Allez dans l'onglet **Settings** ou **Secrets**
3. Vérifiez que ces variables existent (elles devraient déjà être là) :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

Si elles manquent, ajoutez-les depuis votre fichier `.env`

### Étape 4 : Tester la fonction

Dans votre terminal ou via un outil comme Postman :

```bash
curl -X POST https://gcosmlxwccfyjxwguzqi.supabase.co/functions/v1/cleanup-expired-galleries
```

**Résultat attendu :**
```json
{
  "success": true,
  "deletedGalleries": 11,
  "deletedImages": XX,
  "freedStorageMb": YY.ZZ,
  "affectedUsers": Z
}
```

### Étape 5 : Vérifier les logs

1. Dans **Edge Functions → cleanup-expired-galleries**
2. Cliquez sur l'onglet **Logs**
3. Vous devriez voir :
   - "Cleanup job started"
   - "Total galleries in database: XX"
   - "Found galleries: expiredByDate: 11, inactive: 0, totalUnique: 11"
   - "Processing gallery: ..."
   - "Cleanup job completed"

### Étape 6 : Vérifier dans la base de données

Dans **SQL Editor**, exécutez :

```sql
-- Devrait retourner 0
SELECT COUNT(*) as remaining_expired
FROM galleries
WHERE expires_at < NOW();

-- Vérifier les galeries restantes
SELECT id, title, expires_at, is_active
FROM galleries
ORDER BY expires_at ASC
LIMIT 10;
```

## Étape 7 : Configurer le cron automatique

Une fois que tout fonctionne, configurez le cron job :

1. Dans **SQL Editor**, exécutez le contenu de `supabase/migrations/setup_cron_jobs.sql`
2. Vérifiez que les jobs sont créés :

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobname;
```

Vous devriez voir 3 jobs :
- `cleanup-expired-galleries` - `0 2 * * *` (2h du matin)
- `cleanup-rate-limits` - `0 * * * *` (toutes les heures)
- `notify-expiring-galleries` - `0 9 * * *` (9h du matin)

## Dépannage

### La fonction ne trouve toujours pas les galeries

Vérifiez les logs pour voir les erreurs exactes. Si vous voyez "Total galleries in database: 0", c'est un problème RLS.

Solution temporaire pour tester :
```sql
ALTER TABLE galleries DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
-- Tester la fonction
-- Puis réactiver :
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
```

### Erreur 403 lors du déploiement CLI

C'est normal si vous n'êtes pas propriétaire du projet ou si le projet est dans une organisation. Utilisez le déploiement manuel via le dashboard.

### Les images ne sont pas supprimées de Cloudinary

Vérifiez que les variables d'environnement Cloudinary sont correctes dans les settings de la fonction.

## Résumé

✅ Étape 1 : SQL pour RLS  
✅ Étape 2 : Mettre à jour la fonction  
✅ Étape 3 : Vérifier les variables  
✅ Étape 4 : Tester  
✅ Étape 5 : Vérifier les logs  
✅ Étape 6 : Vérifier la DB  
✅ Étape 7 : Configurer le cron  

Une fois terminé, les 11 galeries expirées seront supprimées et le système nettoiera automatiquement les futures galeries expirées chaque jour à 2h du matin ! 🎉
