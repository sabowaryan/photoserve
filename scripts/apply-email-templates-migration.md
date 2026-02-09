# Apply Email Templates Migration

## Options pour Appliquer la Migration

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Ouvrir le Supabase Dashboard : https://app.supabase.com
2. Sélectionner votre projet
3. Aller dans "SQL Editor"
4. Cliquer sur "New Query"
5. Copier le contenu de `supabase/migrations/20240207000000_seed_email_templates.sql`
6. Coller dans l'éditeur
7. Cliquer sur "Run"

### Option 2 : Via psql (Ligne de commande)

```bash
# Remplacer les valeurs par vos credentials
psql -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20240207000000_seed_email_templates.sql
```

### Option 3 : Via Supabase CLI

```bash
# Si Supabase CLI est installé
supabase db push
```

## Vérification

Après avoir appliqué la migration, vérifier que les templates ont été créés :

```sql
-- Vérifier les templates
SELECT 
  slug,
  name,
  type,
  is_active,
  active_version
FROM email_templates
ORDER BY created_at;
```

Vous devriez voir 7 templates :
1. welcome-email
2. first-gallery-reminder-d1
3. help-email-d3
4. upgrade-email-d7
5. upgrade-email-d14
6. first-gallery-congrats
7. upgrade-confirmation

## Vérifier les Versions

```sql
-- Vérifier que les versions ont été créées
SELECT 
  et.slug,
  tv.version,
  tv.created_at
FROM template_versions tv
JOIN email_templates et ON tv.template_id = et.id
ORDER BY et.slug, tv.version;
```

Chaque template devrait avoir une version 1.

## Troubleshooting

### Erreur : "relation email_templates does not exist"

La table `email_templates` n'existe pas. Vous devez d'abord créer le schéma de base de données pour le système d'emails.

Vérifier si les migrations précédentes ont été appliquées :

```sql
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10;
```

### Erreur : "duplicate key value violates unique constraint"

Les templates existent déjà. La migration utilise `ON CONFLICT (slug) DO UPDATE` donc elle devrait mettre à jour les templates existants.

Si l'erreur persiste, vous pouvez supprimer les templates existants :

```sql
-- ATTENTION : Ceci supprimera les templates existants
DELETE FROM email_templates WHERE slug IN (
  'welcome-email',
  'first-gallery-reminder-d1',
  'help-email-d3',
  'upgrade-email-d7',
  'upgrade-email-d14',
  'first-gallery-congrats',
  'upgrade-confirmation'
);
```

Puis réappliquer la migration.

### Erreur : "permission denied"

Vous n'avez pas les permissions nécessaires. Assurez-vous d'utiliser le rôle `postgres` ou un rôle avec les permissions appropriées.

## Test des Templates

Après avoir appliqué la migration, vous pouvez tester un template :

```sql
-- Récupérer un template
SELECT 
  slug,
  subject,
  content->>'html' as html_content,
  variables
FROM email_templates
WHERE slug = 'welcome-email';
```

## Prochaines Étapes

Après avoir appliqué la migration :

1. ✅ Vérifier que les 7 templates existent
2. ✅ Vérifier que les versions ont été créées
3. ✅ Tester le système en créant un compte
4. ✅ Vérifier que l'email de bienvenue est envoyé
5. ✅ Vérifier que les emails planifiés sont dans la queue

## Support

Si vous rencontrez des problèmes :

1. Vérifier les logs Supabase
2. Vérifier que la table `email_templates` existe
3. Vérifier que la table `template_versions` existe
4. Consulter la documentation : `docs/email-triggers-system.md`
