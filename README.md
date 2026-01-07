# PikSend - Next.js 15+

Application de partage de galeries photo sécurisées pour photographes professionnels.

## 🚀 Fonctionnalités

- **Galeries sécurisées** : Créez des galeries protégées par mot de passe avec date d'expiration
- **Authentification** : Email/mot de passe et Google OAuth via NextAuth.js v5
- **Plans d'abonnement** : Free, Premium et Pro avec Stripe
- **Stockage cloud** : Upload et optimisation d'images via Cloudinary
- **SEO optimisé** : Métadonnées dynamiques, sitemap, données structurées JSON-LD
- **Interface française** : UI entièrement en français

## 📋 Prérequis

- Node.js 18.17 ou supérieur
- npm, yarn, pnpm ou bun
- Compte Supabase (base de données PostgreSQL)
- Compte Cloudinary (stockage d'images)
- Compte Stripe (paiements)
- Compte Google Cloud (OAuth - optionnel)

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd photoserve-nextjs
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

### 3. Configurer les variables d'environnement

Copiez le fichier `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

Remplissez les variables d'environnement (voir section [Variables d'environnement](#-variables-denvironnement)).

### 4. Configurer Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Exécutez les migrations SQL depuis le dossier `supabase/migrations/`
3. Configurez les Row Level Security (RLS) policies
4. Déployez les Edge Functions depuis `supabase/functions/`

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du projet

```
photoserve-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Pages d'authentification
│   │   ├── (dashboard)/        # Pages protégées (dashboard, settings)
│   │   ├── (errors)/           # Pages d'erreur (401, 403, 500, 503)
│   │   ├── (public)/           # Pages publiques (pricing, legal)
│   │   ├── api/                # API Routes
│   │   └── g/[slug]/           # Vue publique des galeries
│   ├── components/
│   │   ├── forms/              # Composants de formulaires
│   │   ├── providers/          # Context providers
│   │   ├── shared/             # Composants partagés
│   │   └── ui/                 # Composants shadcn/ui
│   ├── config/                 # Configuration (auth, plans)
│   ├── lib/
│   │   ├── api/                # Utilitaires API (CORS, error handler)
│   │   ├── auth/               # Authentification NextAuth
│   │   ├── cloudinary/         # Client Cloudinary
│   │   ├── errors/             # Classes d'erreurs personnalisées
│   │   ├── middleware/         # Middleware de protection des routes
│   │   ├── repositories/       # Couche d'accès aux données
│   │   ├── security/           # Sanitization, sécurité
│   │   ├── services/           # Couche service (business logic)
│   │   ├── stripe/             # Client Stripe
│   │   ├── supabase/           # Clients Supabase (browser/server)
│   │   └── validators/         # Schémas de validation Zod
│   └── types/                  # Types TypeScript
├── supabase/
│   ├── functions/              # Edge Functions Supabase
│   └── migrations/             # Migrations SQL
└── public/                     # Assets statiques
```

## 🔧 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Lance le serveur de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run test` | Lance les tests (Vitest) |
| `npm run test:watch` | Lance les tests en mode watch |
| `npm run test:coverage` | Lance les tests avec couverture |


## 🔐 Variables d'environnement

### Variables requises

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | URL de base de l'application |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'application |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase (serveur uniquement) |
| `NEXTAUTH_URL` | URL pour NextAuth.js |
| `NEXTAUTH_SECRET` | Secret pour NextAuth.js (générer avec `openssl rand -base64 32`) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe |
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary |

### Variables optionnelles

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Client ID Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client Secret Google OAuth |
| `STRIPE_PREMIUM_MONTHLY_PRICE_ID` | ID du prix Premium mensuel |
| `STRIPE_PREMIUM_YEARLY_PRICE_ID` | ID du prix Premium annuel |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | ID du prix Pro mensuel |
| `STRIPE_PRO_YEARLY_PRICE_ID` | ID du prix Pro annuel |

## 🏗️ Architecture

### Couche Service (Business Logic)

- `AuthService` : Authentification et gestion des sessions
- `GalleryService` : CRUD galeries, vérification mot de passe
- `ImageService` : Upload, suppression, optimisation d'images
- `PaymentService` : Intégration Stripe (checkout, portal)
- `SeoService` : Génération métadonnées et données structurées
- `RateLimiterService` : Limitation des tentatives de connexion

### Couche Repository (Data Access)

- `ProfileRepository` : Gestion des profils utilisateurs
- `GalleryRepository` : Accès aux données des galeries
- `ImageRepository` : Accès aux données des images

### Edge Functions Supabase

- `stripe-webhook` : Gestion des webhooks Stripe
- `cleanup-expired-galleries` : Nettoyage des galeries expirées (cron)
- `cleanup-rate-limits` : Nettoyage des rate limits (cron)
- `notify-expiring-galleries` : Notifications d'expiration (cron)

## 📊 Plans d'abonnement

| Fonctionnalité | Free | Premium | Pro |
|----------------|------|---------|-----|
| Stockage | 20 MB | 5 GB | 50 GB |
| Galeries max | 3 | 50 | 500 |
| Images/galerie | 30 | 500 | 5000 |
| Taille image max | 1 MB | 50 MB | 100 MB |
| Expiration max | 30 jours | 90 jours | 180 jours |

## 🧪 Tests

Le projet utilise Vitest avec fast-check pour les tests property-based :

```bash
# Lancer tous les tests
npm run test

# Lancer les tests en mode watch
npm run test:watch

# Générer le rapport de couverture
npm run test:coverage
```

## 🚀 Déploiement

### Vercel (recommandé)

1. Connectez votre repository à [Vercel](https://vercel.com)
2. Configurez les variables d'environnement
3. Déployez

### Autres plateformes

Le projet peut être déployé sur toute plateforme supportant Next.js :
- Netlify
- AWS Amplify
- Railway
- Render

## 📝 Licence

Projet privé - Tous droits réservés.
