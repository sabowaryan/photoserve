# Guide de Migration - Analytics Phase 2

## Étapes d'Installation

### 1. Exécuter la Migration SQL

**Dans Supabase Dashboard** :

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier-coller le contenu de `supabase/migrations/20260115_add_visitor_id_to_analytics.sql`
5. Cliquer sur **Run**

**Ou via CLI** :

```bash
# Si vous utilisez Supabase CLI
supabase db push
```

**SQL à exécuter** :

```sql
-- Add visitor_id column
ALTER TABLE gallery_analytics 
ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(255);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_gallery_analytics_visitor_id 
ON gallery_analytics(visitor_id);

-- Create composite index
CREATE INDEX IF NOT EXISTS idx_gallery_analytics_gallery_visitor 
ON gallery_analytics(gallery_id, visitor_id);

-- Add comment
COMMENT ON COLUMN gallery_analytics.visitor_id IS 'Unique visitor identifier from browser fingerprinting (FingerprintJS)';
```

### 2. Vérifier la Migration

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gallery_analytics' 
AND column_name = 'visitor_id';

-- Résultat attendu :
-- column_name | data_type
-- visitor_id  | character varying

-- Vérifier les index
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'gallery_analytics' 
AND indexname LIKE '%visitor%';

-- Résultat attendu :
-- idx_gallery_analytics_visitor_id
-- idx_gallery_analytics_gallery_visitor
```

### 3. Tester le Tracking

1. Accéder à une galerie
2. Ouvrir la console navigateur (F12)
3. Vérifier dans l'onglet Console :
   ```
   Visitor ID: Fp1a2b3c4d5e6f7g8h9i0j
   ```

4. Vérifier dans la base de données :
   ```sql
   SELECT visitor_id, visitor_ip, country_code, viewed_at
   FROM gallery_analytics
   ORDER BY viewed_at DESC
   LIMIT 5;
   ```

**Résultat attendu** :
```
visitor_id              | visitor_ip    | country_code | viewed_at
Fp1a2b3c4d5e6f7g8h9i0j | 203.0.113.42 | FR           | 2026-01-15 14:30:00
```

### 4. Vérifier le Dashboard

1. Aller sur `/dashboard/gallery/[id]/analytics`
2. Vérifier que **Unique Visitors** affiche un nombre cohérent
3. Les nouvelles vues devraient utiliser le fingerprint

---

## Rollback (Si Problème)

Si vous rencontrez des problèmes, vous pouvez revenir en arrière :

```sql
-- Supprimer les index
DROP INDEX IF EXISTS idx_gallery_analytics_visitor_id;
DROP INDEX IF EXISTS idx_gallery_analytics_gallery_visitor;

-- Supprimer la colonne
ALTER TABLE gallery_analytics DROP COLUMN IF EXISTS visitor_id;
```

**Note** : Les anciennes vues continueront de fonctionner avec l'IP uniquement.

---

## Compatibilité

### Anciennes Vues (Phase 1)

Les vues trackées avant Phase 2 n'ont pas de `visitor_id` :

```sql
SELECT 
  COUNT(*) as total_views,
  COUNT(visitor_id) as views_with_fingerprint,
  COUNT(*) - COUNT(visitor_id) as views_without_fingerprint
FROM gallery_analytics;
```

**C'est normal** : Le service utilise automatiquement l'IP comme fallback.

### Calcul des Visiteurs Uniques

```typescript
// Le service gère automatiquement le fallback
const uniqueIdentifiers = new Set(
  analytics.map(a => a.visitor_id || a.visitor_ip).filter(Boolean)
);
```

**Pas d'action requise** : Tout fonctionne automatiquement.

---

## Checklist

- [ ] Migration SQL exécutée
- [ ] Colonne `visitor_id` existe
- [ ] Index créés
- [ ] Test : Visiter une galerie
- [ ] Test : Vérifier le fingerprint en console
- [ ] Test : Vérifier `visitor_id` en base
- [ ] Test : Dashboard analytics affiche les stats
- [ ] Test : Visiteurs uniques cohérents

---

**Document créé le** : 15 Janvier 2026  
**Version** : 1.0.0  
**Auteur** : Équipe PikSend
