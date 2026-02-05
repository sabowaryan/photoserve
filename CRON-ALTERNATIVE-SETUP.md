# Configuration Alternative des Cron Jobs

## Problème
Le plan gratuit de Vercel limite le nombre de cron jobs, et vous avez déjà atteint cette limite avec d'autres projets.

## Solution Appliquée
La configuration cron a été désactivée dans `vercel.json` pour permettre le déploiement.

## Cron Job Désactivé
- **Endpoint**: `/api/cron/check-alerts`
- **Fréquence**: Toutes les 5 minutes
- **Fonction**: Vérifier les alertes et envoyer des notifications

## Options Alternatives

### Option 1 : Service Externe Gratuit (Recommandé)

#### A. cron-job.org (Gratuit)
**Avantages**:
- Jusqu'à 50 cron jobs gratuits
- Interface simple
- Monitoring et logs
- Notifications en cas d'échec

**Configuration**:
1. Créer un compte sur https://cron-job.org
2. Créer un nouveau cron job :
   - **URL**: `https://votre-domaine.vercel.app/api/cron/check-alerts`
   - **Schedule**: `*/5 * * * *` (toutes les 5 minutes)
   - **Method**: GET
   - **Headers**: Ajouter `Authorization: Bearer ${CRON_SECRET}`
3. Activer le job

**Variables d'environnement requises**:
```env
CRON_SECRET=A+X9UqffCtOO+u3dMAi9pQUdiC0mx+D7GJDJn59Iw4k=
```

#### B. UptimeRobot (Gratuit)
**Avantages**:
- Monitoring gratuit toutes les 5 minutes
- 50 monitors gratuits
- Alertes par email

**Configuration**:
1. Créer un compte sur https://uptimerobot.com
2. Créer un nouveau monitor :
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://votre-domaine.vercel.app/api/cron/check-alerts`
   - **Monitoring Interval**: 5 minutes
   - **Custom HTTP Headers**: `Authorization: Bearer ${CRON_SECRET}`
3. Activer le monitor

#### C. EasyCron (Gratuit)
**Avantages**:
- 1 cron job gratuit
- Interface simple

**Configuration**:
1. Créer un compte sur https://www.easycron.com
2. Créer un nouveau cron job :
   - **URL**: `https://votre-domaine.vercel.app/api/cron/check-alerts`
   - **Cron Expression**: `*/5 * * * *`
   - **HTTP Headers**: `Authorization: Bearer ${CRON_SECRET}`

### Option 2 : GitHub Actions (Gratuit)

Utiliser GitHub Actions pour déclencher le cron job.

**Créer `.github/workflows/cron-check-alerts.yml`**:
```yaml
name: Check Alerts Cron

on:
  schedule:
    # Toutes les 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Permet de déclencher manuellement

jobs:
  check-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Check Alerts
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://votre-domaine.vercel.app/api/cron/check-alerts
```

**Configuration**:
1. Ajouter le secret `CRON_SECRET` dans les secrets GitHub du repository
2. Commit et push le fichier workflow
3. Le cron s'exécutera automatiquement

**Limites**:
- GitHub Actions a une limite de 2000 minutes/mois sur le plan gratuit
- Un cron toutes les 5 minutes = ~8640 exécutions/mois
- Chaque exécution prend ~1 minute = ~8640 minutes/mois (dépasse la limite)
- **Recommandation**: Réduire la fréquence à toutes les 15 minutes (`*/15 * * * *`)

### Option 3 : Vercel Paid Plan

Passer au plan Hobby ($20/mois) ou Pro ($20/mois par utilisateur) pour avoir accès à plus de cron jobs.

**Avantages**:
- Cron jobs natifs Vercel
- Meilleure intégration
- Pas de configuration externe

## Sécurité

### Protection de l'Endpoint Cron

L'endpoint `/api/cron/check-alerts` est protégé par un secret. Assurez-vous que :

1. **Le secret est défini** dans les variables d'environnement Vercel :
   ```
   CRON_SECRET=A+X9UqffCtOO+u3dMAi9pQUdiC0mx+D7GJDJn59Iw4k=
   ```

2. **Le header Authorization est requis** :
   ```
   Authorization: Bearer A+X9UqffCtOO+u3dMAi9pQUdiC0mx+D7GJDJn59Iw4k=
   ```

3. **Ne partagez jamais le secret** publiquement

### Vérification de la Sécurité

Le code de l'endpoint vérifie le secret :

```typescript
// src/app/api/cron/check-alerts/route.ts
const authHeader = request.headers.get('authorization');
const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

if (authHeader !== expectedAuth) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

## Fonctionnalité du Cron Job

Le cron job `/api/cron/check-alerts` effectue les tâches suivantes :

1. **Vérification des galeries expirées** :
   - Trouve les galeries qui ont expiré
   - Envoie des notifications aux photographes

2. **Vérification des galeries bientôt expirées** :
   - Trouve les galeries qui expirent dans les 7 jours
   - Envoie des alertes préventives

3. **Nettoyage des données** :
   - Supprime les anciennes données de rate limiting
   - Nettoie les sessions expirées

## Impact de la Désactivation

Sans le cron job actif :

- ❌ Les notifications d'expiration de galerie ne seront pas envoyées automatiquement
- ❌ Les alertes préventives ne seront pas envoyées
- ❌ Le nettoyage automatique ne sera pas effectué

**Recommandation** : Configurer un service externe (Option 1A - cron-job.org) pour maintenir ces fonctionnalités.

## Configuration Recommandée

Pour le plan gratuit de Vercel, nous recommandons :

1. **Utiliser cron-job.org** (gratuit, fiable, simple)
2. **Configurer l'URL** : `https://votre-domaine.vercel.app/api/cron/check-alerts`
3. **Ajouter le header** : `Authorization: Bearer ${CRON_SECRET}`
4. **Fréquence** : Toutes les 5 minutes (`*/5 * * * *`)

## Test Manuel

Pour tester l'endpoint manuellement :

```bash
curl -X GET \
  -H "Authorization: Bearer A+X9UqffCtOO+u3dMAi9pQUdiC0mx+D7GJDJn59Iw4k=" \
  https://votre-domaine.vercel.app/api/cron/check-alerts
```

Réponse attendue :
```json
{
  "success": true,
  "message": "Alerts checked successfully",
  "timestamp": "2026-02-05T10:00:00.000Z"
}
```

## Réactivation Future

Si vous souhaitez réactiver les cron jobs Vercel plus tard :

1. Supprimer les cron jobs des autres projets Vercel
2. Modifier `vercel.json` :
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/check-alerts",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```
3. Redéployer le projet

## Date
5 février 2026
