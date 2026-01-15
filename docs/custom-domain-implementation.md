# Implémentation du Domaine Personnalisé et Branding

## Vue d'ensemble

Ce document explique comment le système de domaine personnalisé et de branding fonctionne dans PikSend, et comment un photographe peut personnaliser l'apparence de ses galeries.

## 🎨 Branding - Ce qui est déjà implémenté

### 1. Configuration du Branding (Dashboard)

Le photographe peut configurer son branding dans **Settings** (`/settings`) via le composant `BrandingSection`:

#### Fonctionnalités disponibles (Plan Pro uniquement):

1. **Logo personnalisé** (`customLogo`)
   - Upload d'image (PNG, JPG, max 2MB)
   - Remplace le logo PikSend dans les galeries
   - Stocké dans `profiles.branding.customLogo`

2. **Couleurs de marque** (`brandColors`)
   - Couleur primaire (boutons, liens)
   - Couleur secondaire (accents)
   - Couleur d'accentuation
   - Stockées dans `profiles.branding.brandColors`

3. **Domaine personnalisé** (`customDomain`)
   - Champ pour entrer le domaine (ex: `photos.votredomaine.com`)
   - Stocké dans `profiles.branding.customDomain`
   - ⚠️ **Nécessite configuration DNS et infrastructure**

### 2. Application du Branding dans les Galeries

Quand un visiteur accède à une galerie (`/g/[slug]`), le système:

1. **Récupère le branding du photographe**:
   ```typescript
   // src/app/g/[slug]/page.tsx
   const { data: profile } = await supabase
     .from('profiles')
     .select('branding, subscription_plan')
     .eq('id', gallery.user_id)
     .maybeSingle();
   ```

2. **Applique les couleurs via CSS variables**:
   ```typescript
   const cssVariables = {
     '--brand-primary': customColors.primary || '#6366f1',
     '--brand-secondary': customColors.secondary || '#8b5cf6',
     '--brand-accent': customColors.accent || '#ec4899',
   };
   ```

3. **Utilise les couleurs dans l'interface**:
   ```tsx
   <div style={{ backgroundColor: 'var(--brand-primary)' }}>
     Bouton personnalisé
   </div>
   ```

### 3. Où le branding est appliqué

- ✅ Couleurs des boutons et liens
- ✅ Dégradés de fond
- ✅ Bouton CTA
- ✅ Éléments interactifs
- ⚠️ Logo personnalisé (à implémenter dans le header)

## 🌐 Domaine Personnalisé - Ce qui reste à implémenter

### Architecture actuelle

Actuellement, toutes les galeries sont accessibles via:
```
https://piksend.com/g/[slug]
```

### Architecture cible avec domaine personnalisé

Avec un domaine personnalisé, les galeries seraient accessibles via:
```
https://photos.votredomaine.com/g/[slug]
ou
https://votredomaine.com/galerie/[slug]
```

### Étapes d'implémentation nécessaires

#### 1. Configuration DNS (Côté photographe)

Le photographe doit configurer son DNS pour pointer vers PikSend:

**Option A: Sous-domaine (Recommandé)**
```
Type: CNAME
Host: photos
Value: piksend.com
```

**Option B: Domaine racine**
```
Type: A
Host: @
Value: [IP de PikSend]
```

#### 2. Vérification du domaine (Backend)

Créer un service de vérification:

```typescript
// src/lib/services/domain-verification.service.ts
export class DomainVerificationService {
  /**
   * Vérifie que le domaine pointe vers PikSend
   */
  async verifyDomain(domain: string): Promise<boolean> {
    try {
      // Vérifier les enregistrements DNS
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
      const data = await response.json();
      
      // Vérifier que le CNAME pointe vers piksend.com
      return data.Answer?.some((record: any) => 
        record.data.includes('piksend.com')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Génère un token de vérification unique
   */
  generateVerificationToken(userId: string): string {
    return `piksend-verify-${userId}-${Date.now()}`;
  }

  /**
   * Vérifie le token via TXT record
   */
  async verifyToken(domain: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
      const data = await response.json();
      
      return data.Answer?.some((record: any) => 
        record.data.includes(token)
      );
    } catch (error) {
      return false;
    }
  }
}
```

#### 3. Provisionnement SSL (Automatique)

Utiliser un service comme **Let's Encrypt** ou **Cloudflare** pour générer automatiquement les certificats SSL:

**Option A: Cloudflare (Recommandé)**
- Utiliser l'API Cloudflare pour ajouter le domaine
- SSL automatique via Cloudflare
- CDN inclus

**Option B: Let's Encrypt + Certbot**
- Générer certificat via ACME protocol
- Renouvellement automatique

```typescript
// src/lib/services/ssl-provisioning.service.ts
export class SSLProvisioningService {
  /**
   * Provisionne SSL via Cloudflare
   */
  async provisionSSL(domain: string, userId: string): Promise<void> {
    // 1. Ajouter le domaine à Cloudflare
    const response = await fetch('https://api.cloudflare.com/client/v4/zones', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
        account: { id: process.env.CLOUDFLARE_ACCOUNT_ID },
      }),
    });

    const { result } = await response.json();
    
    // 2. Configurer les DNS records
    await this.configureDNS(result.id, domain);
    
    // 3. Activer SSL
    await this.enableSSL(result.id);
    
    // 4. Sauvegarder dans la base de données
    await this.saveDomainConfig(userId, domain, result.id);
  }
}
```

#### 4. Routing dynamique (Next.js Middleware)

Créer un middleware pour router les requêtes selon le domaine:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Si c'est le domaine principal, continuer normalement
  if (hostname.includes('piksend.com') || hostname.includes('localhost')) {
    return NextResponse.next();
  }
  
  // Sinon, c'est un domaine personnalisé
  const supabase = createAdminClient();
  
  // Trouver le photographe avec ce domaine
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, branding')
    .eq('branding->customDomain', hostname)
    .maybeSingle();
  
  if (!profile) {
    // Domaine non configuré
    return new NextResponse('Domain not configured', { status: 404 });
  }
  
  // Extraire le slug de la galerie depuis l'URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  
  // Si c'est /g/[slug] ou /galerie/[slug]
  if ((pathParts[1] === 'g' || pathParts[1] === 'galerie') && pathParts[2]) {
    const slug = pathParts[2];
    
    // Vérifier que la galerie appartient à ce photographe
    const { data: gallery } = await supabase
      .from('galleries')
      .select('id')
      .eq('unique_slug', slug)
      .eq('user_id', profile.id)
      .maybeSingle();
    
    if (!gallery) {
      return new NextResponse('Gallery not found', { status: 404 });
    }
    
    // Rewriter vers la route interne
    return NextResponse.rewrite(
      new URL(`/g/${slug}?customDomain=${hostname}`, request.url)
    );
  }
  
  // Page d'accueil du photographe
  return NextResponse.rewrite(
    new URL(`/p/${profile.id}`, request.url)
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### 5. Interface de configuration (Dashboard)

Améliorer le composant `BrandingSection` pour inclure:

```typescript
// Ajout dans src/components/settings/branding-section.tsx

const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
const [verificationToken, setVerificationToken] = useState<string>('');

const handleVerifyDomain = async () => {
  try {
    setIsLoading(true);
    
    // 1. Générer un token de vérification
    const response = await fetch('/api/domain/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: branding.customDomain }),
    });
    
    const { token, status } = await response.json();
    
    if (status === 'verified') {
      setVerificationStatus('verified');
      toast.success('Domain verified successfully!');
      
      // Provisionner SSL
      await fetch('/api/domain/provision-ssl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: branding.customDomain }),
      });
    } else {
      setVerificationToken(token);
      setVerificationStatus('pending');
    }
  } catch (error) {
    setVerificationStatus('failed');
    toast.error('Domain verification failed');
  } finally {
    setIsLoading(false);
  }
};
```

#### 6. API Routes nécessaires

```typescript
// src/app/api/domain/verify/route.ts
export async function POST(request: Request) {
  const { domain } = await request.json();
  const session = await getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const verificationService = new DomainVerificationService();
  
  // Générer token
  const token = verificationService.generateVerificationToken(session.user.id);
  
  // Vérifier le domaine
  const isVerified = await verificationService.verifyDomain(domain);
  
  if (isVerified) {
    // Sauvegarder dans la base de données
    await supabase
      .from('profiles')
      .update({
        branding: {
          ...profile.branding,
          customDomain: domain,
          domainVerified: true,
        },
      })
      .eq('id', session.user.id);
    
    return NextResponse.json({ status: 'verified' });
  }
  
  return NextResponse.json({ 
    status: 'pending',
    token,
    instructions: `Add this TXT record to your DNS: ${token}`,
  });
}

// src/app/api/domain/provision-ssl/route.ts
export async function POST(request: Request) {
  const { domain } = await request.json();
  const session = await getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const sslService = new SSLProvisioningService();
  
  try {
    await sslService.provisionSSL(domain, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'SSL provisioning failed' }, { status: 500 });
  }
}
```

## 📋 Checklist d'implémentation

### Phase 1: Vérification de domaine
- [ ] Créer `DomainVerificationService`
- [ ] API `/api/domain/verify`
- [ ] Interface de vérification dans `BrandingSection`
- [ ] Instructions DNS pour l'utilisateur

### Phase 2: Provisionnement SSL
- [ ] Intégration Cloudflare API
- [ ] Créer `SSLProvisioningService`
- [ ] API `/api/domain/provision-ssl`
- [ ] Gestion des certificats

### Phase 3: Routing
- [ ] Middleware Next.js pour domaines personnalisés
- [ ] Rewriting des URLs
- [ ] Gestion des erreurs 404

### Phase 4: Logo personnalisé
- [ ] Upload vers Cloudinary
- [ ] Affichage dans `GalleryHeader`
- [ ] Remplacement du logo PikSend

### Phase 5: Tests
- [ ] Tests de vérification DNS
- [ ] Tests de routing
- [ ] Tests SSL
- [ ] Tests end-to-end

## 🔧 Configuration requise

### Variables d'environnement

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete configuration guide.**

Required environment variables for custom domain feature:

```env
# Cloudflare (pour SSL et DNS)
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ZONE_ID=your_zone_id

# Domaine principal
NEXT_PUBLIC_APP_DOMAIN=piksend.com

# Cloudinary (pour logos)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

All variables are documented in `.env.example` at the project root.

### Infrastructure

- **Cloudflare** (recommandé) ou **AWS Route53** pour DNS
- **Let's Encrypt** ou **Cloudflare SSL** pour certificats
- **Next.js Middleware** pour routing dynamique
- **Cloudinary** pour hébergement des logos

## 📖 Guide utilisateur

### Pour le photographe (Plan Pro)

1. **Aller dans Settings > Branding**
2. **Entrer le domaine personnalisé** (ex: `photos.votredomaine.com`)
3. **Suivre les instructions DNS**:
   ```
   Type: CNAME
   Host: photos
   Value: piksend.com
   ```
4. **Cliquer sur "Verify Domain"**
5. **Attendre la vérification** (peut prendre jusqu'à 48h)
6. **SSL provisionné automatiquement**
7. **Galeries accessibles via le domaine personnalisé**

### Accès aux galeries

- **Domaine principal**: `https://piksend.com/g/abc123`
- **Domaine personnalisé**: `https://photos.votredomaine.com/g/abc123`

Les deux URLs fonctionnent simultanément !

## 🎯 Prochaines étapes

1. Implémenter la vérification de domaine (Phase 1)
2. Intégrer Cloudflare pour SSL (Phase 2)
3. Créer le middleware de routing (Phase 3)
4. Implémenter l'upload et affichage du logo (Phase 4)
5. Tests complets (Phase 5)

## 💡 Notes importantes

- Le domaine personnalisé est une fonctionnalité **Pro uniquement**
- La vérification DNS peut prendre jusqu'à 48h
- SSL est provisionné automatiquement après vérification
- Les galeries restent accessibles via piksend.com même avec un domaine personnalisé
- Le branding (couleurs) fonctionne déjà sans domaine personnalisé
