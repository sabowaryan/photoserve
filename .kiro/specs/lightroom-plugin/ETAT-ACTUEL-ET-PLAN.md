# État Actuel et Plan de Mise en Œuvre - Plugin Lightroom PikSend

## 📊 État Actuel du Projet

### ✅ Ce qui est FAIT (Plugin Lua)

Le plugin Lightroom lui-même est **COMPLÈTEMENT IMPLÉMENTÉ** avec:

1. **Structure complète du plugin** (PikSend.lrplugin/)
   - ✅ Info.lua avec métadonnées
   - ✅ Tous les modules Lua implémentés
   - ✅ Système de localisation (EN/FR)
   - ✅ Ressources visuelles (icônes, logos)

2. **Modules fonctionnels**
   - ✅ PikSendAPI.lua - Client API REST
   - ✅ PikSendAuth.lua - Authentification
   - ✅ PikSendGallery.lua - Gestion galeries
   - ✅ PikSendUpload.lua - Upload parallèle
   - ✅ PikSendMetadata.lua - Extraction métadonnées
   - ✅ PikSendLogger.lua - Système de logs
   - ✅ PikSendCache.lua - Cache et optimisation
   - ✅ PikSendPresets.lua - Presets d'export
   - ✅ PikSendUI.lua - Composants UI
   - ✅ PikSendUtils.lua - Utilitaires
   - ✅ PikSendUpdater.lua - Système de mises à jour
   - ✅ PikSendErrorHandler.lua - Gestion erreurs
   - ✅ PikSendRetry.lua - Retry avec backoff
   - ✅ PikSendGallerySettings.lua - Paramètres avancés
   - ✅ PikSendExportServiceProvider.lua - Export Service
   - ✅ PikSendPublishServiceProvider.lua - Publish Service

3. **Tests**
   - ✅ Framework Busted configuré
   - ✅ Tests unitaires écrits
   - ✅ Tests de propriétés (Property-Based Testing)
   - ✅ Tests d'intégration

4. **Documentation du plugin**
   - ✅ Guide d'installation (EN/FR)
   - ✅ Guide utilisateur
   - ✅ Guide de test
   - ✅ FAQ
   - ✅ Troubleshooting
   - ✅ Changelog
   - ✅ Guide de packaging

### ❌ Ce qui MANQUE (Infrastructure Web)

**RIEN n'est implémenté côté web** pour supporter le plugin:

1. **❌ Système d'API Keys**
   - Pas de table en base de données
   - Pas de génération de tokens
   - Pas d'interface de gestion
   - Pas d'endpoints de validation

2. **❌ Endpoints API pour le plugin**
   - Pas de `/api/auth/validate-token`
   - Pas de `/api/plugin/version`
   - Pas de `/api/plugin/download`
   - Les endpoints galeries/images existent mais pas adaptés pour le plugin

3. **❌ Pages publiques**
   - Pas de `/support`
   - Pas de `/docs/lightroom`
   - Pas de page de téléchargement du plugin

4. **❌ Espace admin**
   - Pas d'upload du fichier .lrplugin
   - Pas de gestion des versions
   - Pas de statistiques d'utilisation

5. **❌ Système de mise à jour**
   - Pas d'API de vérification de version
   - Pas de stockage des versions
   - Pas de changelog accessible via API

---

## 🎯 Plan Complet de Mise en Œuvre

### Phase 1: Infrastructure Base de Données et API Keys (Priorité CRITIQUE)

#### 1.1 Schéma Base de Données
```sql
-- Table pour les API keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix VARCHAR(10) NOT NULL, -- Pour affichage partiel (ex: "pk_live_abc...")
  scopes TEXT[] DEFAULT ARRAY['plugin:read', 'plugin:write'],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Table pour les versions du plugin
CREATE TABLE plugin_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE, -- "1.0.0"
  file_url TEXT NOT NULL, -- URL Cloudinary du .lrplugin
  file_size BIGINT NOT NULL,
  changelog TEXT,
  is_stable BOOLEAN DEFAULT TRUE,
  min_lightroom_version VARCHAR(20) DEFAULT '11.0',
  release_date TIMESTAMPTZ DEFAULT NOW(),
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les téléchargements
CREATE TABLE plugin_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version_id UUID NOT NULL REFERENCES plugin_versions(id),
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les logs d'utilisation du plugin
CREATE TABLE plugin_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'auth', 'upload', 'create_gallery', etc.
  plugin_version VARCHAR(20),
  lightroom_version VARCHAR(20),
  os_version VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_plugin_versions_version ON plugin_versions(version);
CREATE INDEX idx_plugin_downloads_user_id ON plugin_downloads(user_id);
CREATE INDEX idx_plugin_downloads_version_id ON plugin_downloads(version_id);
CREATE INDEX idx_plugin_usage_logs_user_id ON plugin_usage_logs(user_id);
CREATE INDEX idx_plugin_usage_logs_created_at ON plugin_usage_logs(created_at);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Everyone can view stable plugin versions
CREATE POLICY "Anyone can view stable plugin versions"
  ON plugin_versions FOR SELECT
  USING (is_stable = TRUE);

-- Admin can manage plugin versions
CREATE POLICY "Admin can manage plugin versions"
  ON plugin_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );
```

#### 1.2 Service de Gestion des API Keys
**Fichier**: `src/lib/services/api-key.service.ts`

```typescript
import { createHash, randomBytes } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface APIKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface CreateAPIKeyParams {
  name: string;
  scopes?: string[];
  expiresAt?: string;
}

export class APIKeyService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Génère une nouvelle API key
   * Format: pk_live_<32 caractères aléatoires>
   */
  async createAPIKey(
    userId: string,
    params: CreateAPIKeyParams
  ): Promise<{ key: string; apiKey: APIKey }> {
    // Générer la clé
    const randomPart = randomBytes(24).toString('base64url');
    const key = `pk_live_${randomPart}`;
    
    // Hash de la clé pour stockage sécurisé
    const keyHash = createHash('sha256').update(key).digest('hex');
    
    // Préfixe pour affichage (premiers 12 caractères)
    const keyPrefix = key.substring(0, 12);

    // Insérer en base
    const { data, error } = await this.supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: params.name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: params.scopes || ['plugin:read', 'plugin:write'],
        expires_at: params.expiresAt || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      key, // Retourné UNE SEULE FOIS
      apiKey: this.mapToAPIKey(data),
    };
  }

  /**
   * Valide une API key et retourne les infos utilisateur
   */
  async validateAPIKey(key: string): Promise<{
    valid: boolean;
    user?: {
      id: string;
      name: string;
      email: string;
      planType: string;
    };
    apiKeyId?: string;
  }> {
    const keyHash = createHash('sha256').update(key).digest('hex');

    const { data: apiKey, error } = await this.supabase
      .from('api_keys')
      .select(`
        id,
        user_id,
        is_active,
        expires_at,
        users:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('key_hash', keyHash)
      .single();

    if (error || !apiKey) {
      return { valid: false };
    }

    // Vérifier si la clé est active
    if (!apiKey.is_active) {
      return { valid: false };
    }

    // Vérifier l'expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return { valid: false };
    }

    // Mettre à jour last_used_at
    await this.supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id);

    const user = apiKey.users as any;
    const metadata = user.raw_user_meta_data || {};

    return {
      valid: true,
      apiKeyId: apiKey.id,
      user: {
        id: user.id,
        name: metadata.name || user.email,
        email: user.email,
        planType: metadata.planType || 'free',
      },
    };
  }

  /**
   * Liste les API keys d'un utilisateur
   */
  async listAPIKeys(userId: string): Promise<APIKey[]> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapToAPIKey);
  }

  /**
   * Révoque une API key
   */
  async revokeAPIKey(userId: string, keyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Supprime une API key
   */
  async deleteAPIKey(userId: string, keyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  private mapToAPIKey(data: any): APIKey {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      keyPrefix: data.key_prefix,
      scopes: data.scopes,
      lastUsedAt: data.last_used_at,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      isActive: data.is_active,
    };
  }
}
```

#### 1.3 Endpoints API pour le Plugin

**Fichier**: `src/app/api/plugin/auth/validate/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { APIKeyService } from '@/lib/services/api-key.service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer "
    
    const supabase = await createServerClient();
    const apiKeyService = new APIKeyService(supabase);
    
    const result = await apiKeyService.validateAPIKey(apiKey);
    
    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    // Vérifier le plan Pro
    if (result.user?.planType !== 'pro') {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Pro plan required',
          user: result.user 
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: result.user,
    });
  } catch (error) {
    console.error('API key validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Fichier**: `src/app/api/plugin/version/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Récupérer la dernière version stable
    const { data: latestVersion, error } = await supabase
      .from('plugin_versions')
      .select('*')
      .eq('is_stable', true)
      .order('release_date', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    return NextResponse.json({
      version: latestVersion.version,
      downloadUrl: latestVersion.file_url,
      fileSize: latestVersion.file_size,
      changelog: latestVersion.changelog,
      releaseDate: latestVersion.release_date,
      minLightroomVersion: latestVersion.min_lightroom_version,
    });
  } catch (error) {
    console.error('Version check error:', error);
    return NextResponse.json(
      { error: 'Failed to check version' },
      { status: 500 }
    );
  }
}
```

### Phase 2: Interface de Gestion des API Keys (Dashboard)

#### 2.1 Page de Gestion des API Keys
**Fichier**: `src/app/(dashboard)/settings/api-keys/page.tsx`

Interface permettant de:
- ✅ Créer une nouvelle API key
- ✅ Voir la liste des API keys (avec préfixe masqué)
- ✅ Copier la clé (uniquement à la création)
- ✅ Révoquer/Supprimer une clé
- ✅ Voir la date de dernière utilisation
- ✅ Définir une date d'expiration

#### 2.2 Composants UI
- `APIKeyList` - Liste des clés
- `CreateAPIKeyDialog` - Dialog de création
- `APIKeyCard` - Carte d'affichage d'une clé
- `CopyButton` - Bouton de copie sécurisé

### Phase 3: Pages Publiques

#### 3.1 Page /support
**Fichier**: `src/app/(public)/support/page.tsx`

Contenu:
- FAQ générale
- Formulaire de contact
- Liens vers documentation
- Statut des services
- Horaires de support

#### 3.2 Page /docs/lightroom
**Fichier**: `src/app/(public)/docs/lightroom/page.tsx`

Contenu:
- Guide d'installation
- Guide d'utilisation
- Troubleshooting
- Vidéos tutoriels
- Changelog
- Lien de téléchargement

#### 3.3 Page de Téléchargement
**Fichier**: `src/app/(public)/download/lightroom/page.tsx`

Fonctionnalités:
- Téléchargement du plugin (authentification requise + plan Pro)
- Affichage de la version actuelle
- Changelog
- Prérequis système
- Instructions d'installation rapide

### Phase 4: Espace Admin

#### 4.1 Upload et Gestion des Versions
**Fichier**: `src/app/(admin)/admin/plugin/page.tsx`

Fonctionnalités:
- Upload du fichier .lrplugin vers Cloudinary
- Création d'une nouvelle version
- Édition du changelog
- Marquage stable/beta
- Statistiques de téléchargement
- Logs d'utilisation

#### 4.2 Statistiques d'Utilisation
- Nombre d'utilisateurs actifs du plugin
- Versions utilisées
- Actions les plus fréquentes
- Erreurs remontées
- Graphiques d'adoption

### Phase 5: Système de Mise à Jour

#### 5.1 API de Vérification
Déjà couvert dans Phase 1.3 (`/api/plugin/version`)

#### 5.2 Notifications
- Email aux utilisateurs lors d'une nouvelle version
- Notification in-app dans le dashboard
- Badge "Nouvelle version disponible"

---

## 📋 Checklist de Mise en Œuvre

### Étape 1: Base de Données ⏱️ 2-3 heures
- [ ] Créer la migration pour les tables API keys
- [ ] Créer la migration pour les tables plugin_versions
- [ ] Créer la migration pour les tables plugin_downloads
- [ ] Créer la migration pour les tables plugin_usage_logs
- [ ] Tester les RLS policies
- [ ] Créer les indexes

### Étape 2: Services Backend ⏱️ 4-5 heures
- [ ] Implémenter APIKeyService
- [ ] Implémenter PluginVersionService
- [ ] Écrire les tests unitaires
- [ ] Écrire les tests d'intégration

### Étape 3: Endpoints API ⏱️ 3-4 heures
- [ ] `/api/plugin/auth/validate` - Validation token
- [ ] `/api/plugin/version` - Vérification version
- [ ] `/api/plugin/download` - Téléchargement
- [ ] `/api/plugin/usage` - Log d'utilisation
- [ ] Tests des endpoints

### Étape 4: Interface Dashboard ⏱️ 6-8 heures
- [ ] Page de gestion des API keys
- [ ] Composants UI (liste, création, révocation)
- [ ] Intégration avec le backend
- [ ] Tests E2E

### Étape 5: Pages Publiques ⏱️ 8-10 heures
- [ ] Page /support
- [ ] Page /docs/lightroom
- [ ] Page de téléchargement
- [ ] Contenu et documentation
- [ ] SEO et métadonnées

### Étape 6: Espace Admin ⏱️ 6-8 heures
- [ ] Page de gestion des versions
- [ ] Upload vers Cloudinary
- [ ] Statistiques d'utilisation
- [ ] Logs et monitoring

### Étape 7: Tests et Validation ⏱️ 4-6 heures
- [ ] Tests d'intégration complets
- [ ] Tests avec le plugin Lua réel
- [ ] Tests de sécurité
- [ ] Tests de performance
- [ ] Documentation finale

---

## ⏱️ Estimation Totale

**Temps de développement**: 33-44 heures (4-6 jours de travail)

**Priorités**:
1. **CRITIQUE**: Phase 1 (Base de données + API Keys + Endpoints) - Le plugin ne peut pas fonctionner sans ça
2. **HAUTE**: Phase 2 (Interface Dashboard) - Les utilisateurs doivent pouvoir générer des clés
3. **MOYENNE**: Phase 3 (Pages publiques) - Important pour l'adoption
4. **BASSE**: Phase 4 (Admin) - Peut être fait progressivement
5. **BASSE**: Phase 5 (Notifications) - Nice to have

---

## 🚀 Ordre de Mise en Œuvre Recommandé

1. **Jour 1-2**: Phase 1 (Infrastructure critique)
2. **Jour 2-3**: Phase 2 (Dashboard API keys)
3. **Jour 3-4**: Phase 3 (Pages publiques)
4. **Jour 4-5**: Phase 4 (Admin)
5. **Jour 5-6**: Phase 7 (Tests et validation)

---

## 📝 Notes Importantes

### Sécurité
- Les API keys doivent être stockées hashées (SHA-256)
- Afficher uniquement le préfixe (12 premiers caractères)
- La clé complète n'est montrée qu'UNE SEULE FOIS à la création
- Rate limiting sur les endpoints de validation
- Logs d'utilisation pour détecter les abus

### Performance
- Cache des validations de token (Redis ou mémoire)
- CDN pour le téléchargement du plugin
- Compression du fichier .lrplugin

### Monitoring
- Logs d'utilisation du plugin
- Alertes sur les erreurs fréquentes
- Métriques d'adoption
- Feedback utilisateurs

### Documentation
- Guide d'installation détaillé
- Vidéos tutoriels
- FAQ complète
- Troubleshooting
- Changelog accessible

---

## 🎯 Prochaines Étapes Immédiates

1. **Valider ce plan** avec l'équipe
2. **Créer les migrations** de base de données
3. **Implémenter APIKeyService**
4. **Créer les endpoints API**
5. **Tester avec le plugin Lua**

Une fois ces étapes validées, nous pourrons commencer l'implémentation phase par phase.
