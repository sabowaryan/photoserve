# 📋 SPÉCIFICATION PHASE 1 : Client Proofing & Gestion Contacts

## Vue d'ensemble

Cette spécification décrit l'implémentation de la **Phase 1** des nouvelles fonctionnalités PikSend :
1. **Client Proofing** : Amélioration du système de favoris avec workflow de validation
2. **Gestion Contacts Basique** : Fiche client détaillée pour organisation

**Durée estimée** : 8 jours (5 jours + 3 jours)  
**Objectif** : Combler les gaps critiques vs concurrence sans diluer le focus  
**Prix maintenu** : $19.99/mois

---

## 🎯 OBJECTIFS

### Objectifs Principaux
1. **Améliorer le système de favoris existant** avec workflow structuré
2. **Ajouter gestion basique des contacts** pour organisation photographe
3. **Maintenir la simplicité** et le focus sur la livraison de photos
4. **Justifier le prix actuel** face à la concurrence

### Objectifs Secondaires
1. Réduire les allers-retours photographe-client
2. Améliorer l'organisation du photographe
3. Préparer le terrain pour Phase 2 (Contrats)

---

## 📊 ÉTAT ACTUEL (Ce qui existe déjà)

### ✅ Système de Favoris (Implémenté)

**Base de données** :
```sql
-- Table: favorites
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id),
  image_id UUID REFERENCES images(id),
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Service** : `src/lib/services/favorites.service.ts`
- ✅ `toggleFavorite()` - Ajouter/retirer favori
- ✅ `getFavorites()` - Liste des favoris par session
- ✅ `exportFavorites()` - Export pour photographe

**Frontend** :
- ✅ Bouton cœur sur chaque image
- ✅ Compteur de favoris dans header
- ✅ Téléchargement ZIP des favoris
- ✅ Dashboard photographe voit les favoris

**Analytics** :
- ✅ Events `favorite_add` et `favorite_remove` trackés
- ✅ Stats dans `gallery_events`

### ✅ Profils Utilisateurs (Implémenté)

**Base de données** :
```sql
-- Table: profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  subscription_plan subscription_plan DEFAULT 'free',
  branding JSONB DEFAULT '{}'::jsonb,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Service** : `src/lib/repositories/profile.repository.ts`
- ✅ CRUD complet des profils
- ✅ Gestion branding
- ✅ Gestion abonnements



---

## 🆕 FEATURE 1 : CLIENT PROOFING

### Définition

Amélioration du système de favoris existant pour créer un **workflow de sélection structuré** :
- Limite de sélection configurable
- Statuts de sélection (brouillon, en cours, validé)
- Notifications de progression
- Verrouillage après validation

### Requirements

**Requirement 1.1** : Configuration de la sélection (Photographe)
- Le photographe DOIT pouvoir activer le mode "Client Proofing"
- Le photographe DOIT pouvoir définir une limite de sélection (ex: 20 photos)
- Le photographe DOIT pouvoir définir une date limite de sélection

**Requirement 1.2** : Interface de sélection (Client)
- Le client DOIT voir le compteur "X/20 sélectionnées"
- Le client DOIT être bloqué s'il atteint la limite
- Le client DOIT pouvoir valider sa sélection finale
- Le client DOIT voir un message de confirmation après validation

**Requirement 1.3** : Workflow de validation
- La sélection DOIT avoir 3 statuts : `draft`, `in_progress`, `validated`
- Une fois validée, la sélection DOIT être verrouillée
- Le photographe DOIT recevoir une notification de validation

**Requirement 1.4** : Dashboard photographe
- Le photographe DOIT voir le statut de sélection par galerie
- Le photographe DOIT voir la progression (X/20 sélectionnées)
- Le photographe DOIT pouvoir exporter les sélections validées

---

### Architecture Technique

#### 1.1 Base de données

**Nouvelle table : `gallery_proofing_config`**

```sql
CREATE TABLE public.gallery_proofing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL UNIQUE REFERENCES public.galleries(id) ON DELETE CASCADE,
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT false,
  selection_limit INTEGER, -- NULL = illimité
  deadline_date TIMESTAMP, -- NULL = pas de deadline
  
  -- Instructions pour le client
  instructions TEXT, -- Message personnalisé du photographe
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_selection_limit CHECK (selection_limit IS NULL OR selection_limit > 0)
);

-- Index
CREATE INDEX idx_gallery_proofing_config_gallery_id 
ON public.gallery_proofing_config(gallery_id);

-- RLS
ALTER TABLE public.gallery_proofing_config ENABLE ROW LEVEL SECURITY;

-- Policy: Gallery owners can manage their proofing config
CREATE POLICY "Gallery owners can manage proofing config"
ON public.gallery_proofing_config
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = gallery_proofing_config.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- Policy: Anyone can view proofing config (for public galleries)
CREATE POLICY "Anyone can view proofing config"
ON public.gallery_proofing_config
FOR SELECT
TO anon, authenticated
USING (true);
```

**Nouvelle table : `gallery_proofing_sessions`**

```sql
CREATE TABLE public.gallery_proofing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft' | 'in_progress' | 'validated'
  
  -- Metadata
  selection_count INTEGER DEFAULT 0,
  validated_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_gallery_session UNIQUE(gallery_id, session_id),
  CONSTRAINT check_status CHECK (status IN ('draft', 'in_progress', 'validated'))
);

-- Indexes
CREATE INDEX idx_gallery_proofing_sessions_gallery_id 
ON public.gallery_proofing_sessions(gallery_id);

CREATE INDEX idx_gallery_proofing_sessions_session_id 
ON public.gallery_proofing_sessions(session_id);

CREATE INDEX idx_gallery_proofing_sessions_status 
ON public.gallery_proofing_sessions(status);

-- RLS
ALTER TABLE public.gallery_proofing_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Gallery owners can view all sessions
CREATE POLICY "Gallery owners can view all sessions"
ON public.gallery_proofing_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = gallery_proofing_sessions.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- Policy: Users can manage their own session
CREATE POLICY "Users can manage their own session"
ON public.gallery_proofing_sessions
FOR ALL
TO anon, authenticated
USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');
```

**Modification de la table `favorites`** :

```sql
-- Ajouter colonne pour lier au proofing session
ALTER TABLE public.favorites 
ADD COLUMN proofing_session_id UUID REFERENCES public.gallery_proofing_sessions(id) ON DELETE SET NULL;

-- Index
CREATE INDEX idx_favorites_proofing_session 
ON public.favorites(proofing_session_id);
```



#### 1.2 Service Layer

**Nouveau service : `src/lib/services/proofing.service.ts`**

```typescript
/**
 * Proofing Service
 * Business logic for client proofing/selection workflow
 * 
 * @module lib/services/proofing.service
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { NotFoundError, ValidationError } from '@/lib/errors';

export interface ProofingConfig {
  id: string;
  galleryId: string;
  isEnabled: boolean;
  selectionLimit: number | null;
  deadlineDate: string | null;
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProofingSession {
  id: string;
  galleryId: string;
  sessionId: string;
  status: 'draft' | 'in_progress' | 'validated';
  selectionCount: number;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProofingStatus {
  config: ProofingConfig | null;
  session: ProofingSession | null;
  canAddMore: boolean;
  remainingSelections: number | null;
  isLocked: boolean;
  deadlinePassed: boolean;
}

export interface IProofingService {
  // Configuration (Photographe)
  enableProofing(galleryId: string, config: Partial<ProofingConfig>): Promise<ProofingConfig>;
  updateProofingConfig(galleryId: string, config: Partial<ProofingConfig>): Promise<ProofingConfig>;
  getProofingConfig(galleryId: string): Promise<ProofingConfig | null>;
  disableProofing(galleryId: string): Promise<void>;
  
  // Session (Client)
  getOrCreateSession(galleryId: string, sessionId: string): Promise<ProofingSession>;
  getProofingStatus(galleryId: string, sessionId: string): Promise<ProofingStatus>;
  validateSelection(galleryId: string, sessionId: string): Promise<ProofingSession>;
  
  // Validation
  canAddFavorite(galleryId: string, sessionId: string): Promise<boolean>;
  updateSelectionCount(galleryId: string, sessionId: string): Promise<void>;
}

export class ProofingService implements IProofingService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Enable proofing for a gallery
   * Requirement 1.1: Configuration de la sélection
   */
  async enableProofing(
    galleryId: string,
    config: Partial<ProofingConfig>
  ): Promise<ProofingConfig> {
    // Validate gallery exists and user owns it
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('id, user_id')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Check if config already exists
    const { data: existingConfig } = await this.supabase
      .from('gallery_proofing_config')
      .select('*')
      .eq('gallery_id', galleryId)
      .single();

    if (existingConfig) {
      throw new ValidationError('Proofing already enabled for this gallery');
    }

    // Create config
    const { data, error } = await this.supabase
      .from('gallery_proofing_config')
      .insert({
        gallery_id: galleryId,
        is_enabled: true,
        selection_limit: config.selectionLimit || null,
        deadline_date: config.deadlineDate || null,
        instructions: config.instructions || null,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create proofing config');

    return this.mapConfigFromDb(data);
  }

  /**
   * Get or create a proofing session for a client
   * Requirement 1.2: Interface de sélection
   */
  async getOrCreateSession(
    galleryId: string,
    sessionId: string
  ): Promise<ProofingSession> {
    // Check if session exists
    const { data: existingSession } = await this.supabase
      .from('gallery_proofing_sessions')
      .select('*')
      .eq('gallery_id', galleryId)
      .eq('session_id', sessionId)
      .single();

    if (existingSession) {
      return this.mapSessionFromDb(existingSession);
    }

    // Create new session
    const { data, error } = await this.supabase
      .from('gallery_proofing_sessions')
      .insert({
        gallery_id: galleryId,
        session_id: sessionId,
        status: 'draft',
        selection_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create proofing session');

    return this.mapSessionFromDb(data);
  }

  /**
   * Get complete proofing status for a client
   * Requirement 1.2: Interface de sélection
   */
  async getProofingStatus(
    galleryId: string,
    sessionId: string
  ): Promise<ProofingStatus> {
    // Get config
    const config = await this.getProofingConfig(galleryId);

    // Get or create session
    const session = await this.getOrCreateSession(galleryId, sessionId);

    // Calculate status
    const isLocked = session.status === 'validated';
    const deadlinePassed = config?.deadlineDate 
      ? new Date(config.deadlineDate) < new Date()
      : false;

    const canAddMore = !isLocked && 
      !deadlinePassed && 
      (config?.selectionLimit === null || session.selectionCount < config.selectionLimit);

    const remainingSelections = config?.selectionLimit 
      ? config.selectionLimit - session.selectionCount
      : null;

    return {
      config,
      session,
      canAddMore,
      remainingSelections,
      isLocked,
      deadlinePassed,
    };
  }

  /**
   * Validate selection (lock it)
   * Requirement 1.3: Workflow de validation
   */
  async validateSelection(
    galleryId: string,
    sessionId: string
  ): Promise<ProofingSession> {
    const session = await this.getOrCreateSession(galleryId, sessionId);

    if (session.status === 'validated') {
      throw new ValidationError('Selection already validated');
    }

    // Update session status
    const { data, error } = await this.supabase
      .from('gallery_proofing_sessions')
      .update({
        status: 'validated',
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to validate selection');

    // TODO: Send notification to photographer

    return this.mapSessionFromDb(data);
  }

  /**
   * Check if client can add more favorites
   * Requirement 1.2: Interface de sélection
   */
  async canAddFavorite(
    galleryId: string,
    sessionId: string
  ): Promise<boolean> {
    const status = await this.getProofingStatus(galleryId, sessionId);
    return status.canAddMore;
  }

  /**
   * Update selection count after favorite toggle
   * Called by FavoritesService
   */
  async updateSelectionCount(
    galleryId: string,
    sessionId: string
  ): Promise<void> {
    // Count current favorites
    const { count, error: countError } = await this.supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', galleryId)
      .eq('session_id', sessionId);

    if (countError) throw countError;

    // Update session
    const { error: updateError } = await this.supabase
      .from('gallery_proofing_sessions')
      .update({
        selection_count: count || 0,
        status: (count || 0) > 0 ? 'in_progress' : 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('gallery_id', galleryId)
      .eq('session_id', sessionId);

    if (updateError) throw updateError;
  }

  // Helper methods
  private mapConfigFromDb(data: any): ProofingConfig {
    return {
      id: data.id,
      galleryId: data.gallery_id,
      isEnabled: data.is_enabled,
      selectionLimit: data.selection_limit,
      deadlineDate: data.deadline_date,
      instructions: data.instructions,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapSessionFromDb(data: any): ProofingSession {
    return {
      id: data.id,
      galleryId: data.gallery_id,
      sessionId: data.session_id,
      status: data.status,
      selectionCount: data.selection_count,
      validatedAt: data.validated_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

/**
 * Factory function
 */
export function createProofingService(
  supabase: SupabaseClient<Database>
): IProofingService {
  return new ProofingService(supabase);
}
```

**Modification du service existant : `src/lib/services/favorites.service.ts`**

```typescript
// Ajouter dans la classe FavoritesService

/**
 * Toggle favorite with proofing validation
 * Enhanced version that checks proofing limits
 */
async toggleFavorite(
  galleryId: string,
  imageId: string,
  sessionId: string
): Promise<boolean> {
  // Check if proofing is enabled
  const { data: proofingConfig } = await this.supabase
    .from('gallery_proofing_config')
    .select('*')
    .eq('gallery_id', galleryId)
    .eq('is_enabled', true)
    .single();

  if (proofingConfig) {
    // Proofing is enabled, check limits
    const proofingService = createProofingService(this.supabase);
    const canAdd = await proofingService.canAddFavorite(galleryId, sessionId);

    // Check if trying to add (not remove)
    const { data: existingFavorite } = await this.supabase
      .from('favorites')
      .select('id')
      .eq('gallery_id', galleryId)
      .eq('image_id', imageId)
      .eq('session_id', sessionId)
      .single();

    if (!existingFavorite && !canAdd) {
      throw new ValidationError('Selection limit reached');
    }
  }

  // Original toggle logic...
  // [existing code]

  // Update proofing session count if proofing is enabled
  if (proofingConfig) {
    const proofingService = createProofingService(this.supabase);
    await proofingService.updateSelectionCount(galleryId, sessionId);
  }

  return result;
}
```



#### 1.3 API Routes

**POST `/api/galleries/[id]/proofing`**
- Activer/configurer le proofing pour une galerie
- Body : `{ isEnabled, selectionLimit, deadlineDate, instructions }`
- Auth : Photographe propriétaire uniquement

**GET `/api/galleries/[id]/proofing`**
- Récupérer la configuration du proofing
- Public (pour afficher au client)

**GET `/api/galleries/[id]/proofing/status`**
- Récupérer le statut complet pour un client
- Query : `?sessionId=xxx`
- Retourne : `{ config, session, canAddMore, remainingSelections, isLocked }`

**POST `/api/galleries/[id]/proofing/validate`**
- Valider la sélection (verrouiller)
- Body : `{ sessionId }`
- Envoie notification au photographe

**GET `/api/galleries/[id]/proofing/sessions`**
- Liste toutes les sessions de proofing (dashboard photographe)
- Auth : Photographe propriétaire uniquement
- Retourne : `{ sessions: [...], stats: {...} }`

#### 1.4 Composants React

**`ProofingConfigSection.tsx`** (Dashboard Photographe)

```typescript
/**
 * Section de configuration du proofing dans les paramètres de galerie
 * Requirement 1.1: Configuration de la sélection
 */
interface ProofingConfigSectionProps {
  galleryId: string;
  config: ProofingConfig | null;
  onUpdate: (config: ProofingConfig) => void;
}

export function ProofingConfigSection({ galleryId, config, onUpdate }: ProofingConfigSectionProps) {
  // Toggle activation
  // Input limite de sélection
  // Date picker deadline
  // Textarea instructions
  // Bouton "Enregistrer"
}
```

**`ProofingBanner.tsx`** (Vue Client)

```typescript
/**
 * Bannière sticky affichant la progression de sélection
 * Requirement 1.2: Interface de sélection
 */
interface ProofingBannerProps {
  status: ProofingStatus;
  onValidate: () => void;
}

export function ProofingBanner({ status, onValidate }: ProofingBannerProps) {
  // Affiche "X/20 sélectionnées"
  // Barre de progression
  // Bouton "Valider ma sélection"
  // Message de deadline si applicable
}
```

**`ProofingValidationModal.tsx`** (Vue Client)

```typescript
/**
 * Modal de confirmation de validation
 * Requirement 1.3: Workflow de validation
 */
interface ProofingValidationModalProps {
  selectionCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ProofingValidationModal({ selectionCount, onConfirm, onCancel }: ProofingValidationModalProps) {
  // Message de confirmation
  // "Vous avez sélectionné X photos"
  // "Cette action est définitive"
  // Boutons "Confirmer" / "Annuler"
}
```

**`ProofingSessionsList.tsx`** (Dashboard Photographe)

```typescript
/**
 * Liste des sessions de proofing avec statuts
 * Requirement 1.4: Dashboard photographe
 */
interface ProofingSessionsListProps {
  galleryId: string;
  sessions: ProofingSession[];
}

export function ProofingSessionsList({ galleryId, sessions }: ProofingSessionsListProps) {
  // Table des sessions
  // Colonnes : Session ID, Statut, Progression, Date validation
  // Filtres par statut
  // Export des sélections validées
}
```

**Modification du composant existant : `FavoriteButton.tsx`**

```typescript
// Ajouter vérification de limite avant toggle
const handleToggle = async () => {
  try {
    // Check proofing status
    const status = await fetch(`/api/galleries/${galleryId}/proofing/status?sessionId=${sessionId}`);
    const { canAddMore, isLocked } = await status.json();
    
    if (isLocked) {
      toast.error('Sélection verrouillée');
      return;
    }
    
    if (!isFavorite && !canAddMore) {
      toast.error('Limite de sélection atteinte');
      return;
    }
    
    // Original toggle logic
    await toggleFavorite();
  } catch (error) {
    toast.error('Erreur lors de la sélection');
  }
};
```



#### 1.5 User Flows

**Flow 1 : Configuration par le photographe**

```
1. Dashboard → Galeries → [Sélectionner galerie]
2. Onglet "Paramètres" → Section "Client Proofing"
3. Toggle "Activer le mode sélection" → ON
4. Définir limite : 20 photos
5. Définir deadline : 15/02/2026
6. Instructions : "Merci de sélectionner vos 20 photos préférées pour la retouche"
7. Enregistrer
8. Copier le lien et l'envoyer au client
```

**Flow 2 : Sélection par le client**

```
1. Client accède à la galerie via le lien
2. Bannière sticky apparaît : "Sélectionnez 20 photos - 0/20 sélectionnées"
3. Client clique sur ❤️ sur une photo → "1/20 sélectionnées"
4. Client continue jusqu'à 20/20
5. Bouton "Valider ma sélection" devient actif
6. Client clique sur "Valider"
7. Modal de confirmation : "Vous avez sélectionné 20 photos. Cette action est définitive."
8. Client confirme
9. Message de succès : "Sélection validée ! Le photographe a été notifié."
10. Sélection verrouillée (plus de modification possible)
```

**Flow 3 : Consultation par le photographe**

```
1. Dashboard → Galeries → [Sélectionner galerie]
2. Onglet "Sélections"
3. Voir liste des sessions :
   - Session ABC123 : ✅ Validée (20/20) - 14/02/2026
   - Session DEF456 : 🔄 En cours (15/20)
   - Session GHI789 : 📝 Brouillon (3/20)
4. Cliquer sur session validée
5. Voir les 20 photos sélectionnées
6. Bouton "Exporter en ZIP"
7. Téléchargement des 20 photos
```

---

## 🆕 FEATURE 2 : GESTION CONTACTS BASIQUE

### Définition

Système simple de **gestion des contacts/clients** pour organisation du photographe :
- Fiche client détaillée (nom, email, téléphone, notes)
- Tags et catégories
- Historique des galeries par client
- Recherche et filtres

### Requirements

**Requirement 2.1** : Fiche client
- Le photographe DOIT pouvoir créer une fiche client
- La fiche DOIT contenir : nom, email, téléphone, adresse, notes
- Le photographe DOIT pouvoir éditer/supprimer une fiche

**Requirement 2.2** : Tags et catégories
- Le photographe DOIT pouvoir ajouter des tags (ex: "Mariage", "Portrait", "VIP")
- Le photographe DOIT pouvoir filtrer par tags

**Requirement 2.3** : Historique
- La fiche client DOIT afficher toutes les galeries créées pour ce client
- Le photographe DOIT voir les stats (vues, achats, revenus)

**Requirement 2.4** : Recherche
- Le photographe DOIT pouvoir rechercher par nom, email, téléphone
- Le photographe DOIT pouvoir trier par date, nom, revenus

---

### Architecture Technique

#### 2.1 Base de données

**Nouvelle table : `photographer_contacts`**

```sql
CREATE TABLE public.photographer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Contact Info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  
  -- Organization
  tags TEXT[], -- Array of tags: ['mariage', 'vip', 'portrait']
  notes TEXT,
  
  -- Metadata
  total_galleries INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  last_gallery_date TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_photographer_email UNIQUE(photographer_id, email)
);

-- Indexes
CREATE INDEX idx_photographer_contacts_photographer_id 
ON public.photographer_contacts(photographer_id);

CREATE INDEX idx_photographer_contacts_email 
ON public.photographer_contacts(email);

CREATE INDEX idx_photographer_contacts_name 
ON public.photographer_contacts(name);

CREATE INDEX idx_photographer_contacts_tags 
ON public.photographer_contacts USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_photographer_contacts_search 
ON public.photographer_contacts USING GIN(
  to_tsvector('simple', 
    COALESCE(name, '') || ' ' || 
    COALESCE(email, '') || ' ' || 
    COALESCE(phone, '')
  )
);

-- RLS
ALTER TABLE public.photographer_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Photographers can manage their own contacts
CREATE POLICY "Photographers can manage their own contacts"
ON public.photographer_contacts
FOR ALL
TO authenticated
USING (photographer_id = auth.uid());
```

**Modification de la table `galleries`** :

```sql
-- Ajouter colonne pour lier au contact
ALTER TABLE public.galleries 
ADD COLUMN contact_id UUID REFERENCES public.photographer_contacts(id) ON DELETE SET NULL;

-- Index
CREATE INDEX idx_galleries_contact_id 
ON public.galleries(contact_id);
```

**Fonction pour mettre à jour les stats du contact** :

```sql
CREATE OR REPLACE FUNCTION update_contact_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_galleries and last_gallery_date
  UPDATE public.photographer_contacts
  SET 
    total_galleries = (
      SELECT COUNT(*) 
      FROM public.galleries 
      WHERE contact_id = NEW.contact_id
    ),
    last_gallery_date = (
      SELECT MAX(created_at) 
      FROM public.galleries 
      WHERE contact_id = NEW.contact_id
    ),
    updated_at = NOW()
  WHERE id = NEW.contact_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on galleries insert/update
CREATE TRIGGER trigger_update_contact_stats
AFTER INSERT OR UPDATE OF contact_id ON public.galleries
FOR EACH ROW
WHEN (NEW.contact_id IS NOT NULL)
EXECUTE FUNCTION update_contact_stats();
```



#### 2.2 Service Layer

**Nouveau service : `src/lib/services/contacts.service.ts`**

```typescript
/**
 * Contacts Service
 * Business logic for photographer contact management
 * 
 * @module lib/services/contacts.service
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { NotFoundError, ValidationError } from '@/lib/errors';

export interface Contact {
  id: string;
  photographerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tags: string[];
  notes: string | null;
  totalGalleries: number;
  totalRevenueCents: number;
  lastGalleryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactWithGalleries extends Contact {
  galleries: Array<{
    id: string;
    title: string;
    createdAt: string;
    viewsCount: number;
    revenue: number;
  }>;
}

export interface ContactFilters {
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'date' | 'revenue' | 'galleries';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface IContactsService {
  createContact(photographerId: string, data: Partial<Contact>): Promise<Contact>;
  updateContact(contactId: string, data: Partial<Contact>): Promise<Contact>;
  deleteContact(contactId: string): Promise<void>;
  getContact(contactId: string): Promise<ContactWithGalleries>;
  listContacts(photographerId: string, filters?: ContactFilters): Promise<{ contacts: Contact[]; total: number }>;
  searchContacts(photographerId: string, query: string): Promise<Contact[]>;
  getTags(photographerId: string): Promise<string[]>;
  linkGalleryToContact(galleryId: string, contactId: string): Promise<void>;
}

export class ContactsService implements IContactsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new contact
   * Requirement 2.1: Fiche client
   */
  async createContact(
    photographerId: string,
    data: Partial<Contact>
  ): Promise<Contact> {
    // Validate required fields
    if (!data.name?.trim()) {
      throw new ValidationError('Contact name is required');
    }

    // Check for duplicate email
    if (data.email) {
      const { data: existing } = await this.supabase
        .from('photographer_contacts')
        .select('id')
        .eq('photographer_id', photographerId)
        .eq('email', data.email)
        .single();

      if (existing) {
        throw new ValidationError('Contact with this email already exists');
      }
    }

    // Insert contact
    const { data: contact, error } = await this.supabase
      .from('photographer_contacts')
      .insert({
        photographer_id: photographerId,
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        tags: data.tags || [],
        notes: data.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;
    if (!contact) throw new Error('Failed to create contact');

    return this.mapContactFromDb(contact);
  }

  /**
   * List contacts with filters
   * Requirement 2.2, 2.4: Tags, catégories, recherche
   */
  async listContacts(
    photographerId: string,
    filters: ContactFilters = {}
  ): Promise<{ contacts: Contact[]; total: number }> {
    let query = this.supabase
      .from('photographer_contacts')
      .select('*', { count: 'exact' })
      .eq('photographer_id', photographerId);

    // Search filter
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,` +
        `email.ilike.%${filters.search}%,` +
        `phone.ilike.%${filters.search}%`
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Sorting
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    
    switch (sortBy) {
      case 'name':
        query = query.order('name', { ascending: sortOrder === 'asc' });
        break;
      case 'date':
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
        break;
      case 'revenue':
        query = query.order('total_revenue_cents', { ascending: sortOrder === 'asc' });
        break;
      case 'galleries':
        query = query.order('total_galleries', { ascending: sortOrder === 'asc' });
        break;
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      contacts: (data || []).map(this.mapContactFromDb),
      total: count || 0,
    };
  }

  /**
   * Get contact with galleries
   * Requirement 2.3: Historique
   */
  async getContact(contactId: string): Promise<ContactWithGalleries> {
    // Get contact
    const { data: contact, error: contactError } = await this.supabase
      .from('photographer_contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new NotFoundError('Contact');
    }

    // Get galleries for this contact
    const { data: galleries, error: galleriesError } = await this.supabase
      .from('galleries')
      .select('id, title, created_at, views_count')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (galleriesError) throw galleriesError;

    // Get revenue for each gallery
    const galleryIds = (galleries || []).map(g => g.id);
    const { data: purchases } = await this.supabase
      .from('gallery_purchases')
      .select('gallery_id, photographer_earnings_cents')
      .in('gallery_id', galleryIds.length > 0 ? galleryIds : [''])
      .eq('status', 'succeeded');

    const revenueByGallery = new Map<string, number>();
    (purchases || []).forEach(p => {
      const current = revenueByGallery.get(p.gallery_id) || 0;
      revenueByGallery.set(p.gallery_id, current + p.photographer_earnings_cents);
    });

    return {
      ...this.mapContactFromDb(contact),
      galleries: (galleries || []).map(g => ({
        id: g.id,
        title: g.title,
        createdAt: g.created_at || '',
        viewsCount: g.views_count || 0,
        revenue: revenueByGallery.get(g.id) || 0,
      })),
    };
  }

  /**
   * Get all unique tags used by photographer
   * Requirement 2.2: Tags et catégories
   */
  async getTags(photographerId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('photographer_contacts')
      .select('tags')
      .eq('photographer_id', photographerId);

    if (error) throw error;

    // Flatten and deduplicate tags
    const allTags = (data || [])
      .flatMap(c => c.tags || [])
      .filter((tag, index, self) => self.indexOf(tag) === index)
      .sort();

    return allTags;
  }

  /**
   * Link a gallery to a contact
   * Requirement 2.3: Historique
   */
  async linkGalleryToContact(galleryId: string, contactId: string): Promise<void> {
    // Verify gallery exists and user owns it
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('id, user_id')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Verify contact exists and belongs to same photographer
    const { data: contact, error: contactError } = await this.supabase
      .from('photographer_contacts')
      .select('id, photographer_id')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new NotFoundError('Contact');
    }

    if (contact.photographer_id !== gallery.user_id) {
      throw new ValidationError('Contact does not belong to gallery owner');
    }

    // Link gallery to contact
    const { error: updateError } = await this.supabase
      .from('galleries')
      .update({ contact_id: contactId })
      .eq('id', galleryId);

    if (updateError) throw updateError;
  }

  // Helper methods
  private mapContactFromDb(data: any): Contact {
    return {
      id: data.id,
      photographerId: data.photographer_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      tags: data.tags || [],
      notes: data.notes,
      totalGalleries: data.total_galleries || 0,
      totalRevenueCents: data.total_revenue_cents || 0,
      lastGalleryDate: data.last_gallery_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

/**
 * Factory function
 */
export function createContactsService(
  supabase: SupabaseClient<Database>
): IContactsService {
  return new ContactsService(supabase);
}
```



#### 2.3 API Routes

**POST `/api/contacts`**
- Créer un nouveau contact
- Body : `{ name, email, phone, address, tags, notes }`
- Auth : Photographe authentifié

**GET `/api/contacts`**
- Liste des contacts avec filtres
- Query : `?search=xxx&tags=mariage,vip&sortBy=name&sortOrder=asc&limit=20&offset=0`
- Auth : Photographe authentifié

**GET `/api/contacts/[id]`**
- Détails d'un contact avec historique des galeries
- Auth : Photographe propriétaire uniquement

**PUT `/api/contacts/[id]`**
- Mettre à jour un contact
- Body : `{ name, email, phone, address, tags, notes }`
- Auth : Photographe propriétaire uniquement

**DELETE `/api/contacts/[id]`**
- Supprimer un contact
- Auth : Photographe propriétaire uniquement

**GET `/api/contacts/tags`**
- Liste de tous les tags utilisés
- Auth : Photographe authentifié

**POST `/api/galleries/[id]/link-contact`**
- Lier une galerie à un contact
- Body : `{ contactId }`
- Auth : Photographe propriétaire uniquement

#### 2.4 Composants React

**`ContactsList.tsx`** (Dashboard Photographe)

```typescript
/**
 * Liste des contacts avec recherche et filtres
 * Requirement 2.1, 2.2, 2.4
 */
interface ContactsListProps {
  photographerId: string;
}

export function ContactsList({ photographerId }: ContactsListProps) {
  // Search input
  // Tags filter (multi-select)
  // Sort dropdown (nom, date, revenus, galeries)
  // Table des contacts
  // Colonnes : Nom, Email, Tags, Galeries, Revenus, Actions
  // Pagination
  // Bouton "Nouveau contact"
}
```

**`ContactForm.tsx`** (Modal/Page)

```typescript
/**
 * Formulaire de création/édition de contact
 * Requirement 2.1
 */
interface ContactFormProps {
  contact?: Contact;
  onSave: (contact: Contact) => void;
  onCancel: () => void;
}

export function ContactForm({ contact, onSave, onCancel }: ContactFormProps) {
  // Input nom (requis)
  // Input email
  // Input téléphone
  // Textarea adresse
  // Tags input (créer/sélectionner)
  // Textarea notes
  // Boutons "Enregistrer" / "Annuler"
}
```

**`ContactDetail.tsx`** (Page)

```typescript
/**
 * Détails d'un contact avec historique
 * Requirement 2.3
 */
interface ContactDetailProps {
  contactId: string;
}

export function ContactDetail({ contactId }: ContactDetailProps) {
  // Header avec nom, email, téléphone
  // Tags badges
  // Stats cards (Galeries, Revenus, Dernière galerie)
  // Section Notes
  // Section Historique des galeries
  // Table : Titre, Date, Vues, Revenus, Actions
  // Bouton "Éditer" / "Supprimer"
}
```

**`ContactSelector.tsx`** (Composant réutilisable)

```typescript
/**
 * Sélecteur de contact pour lier à une galerie
 * Requirement 2.3
 */
interface ContactSelectorProps {
  photographerId: string;
  selectedContactId?: string;
  onChange: (contactId: string | null) => void;
}

export function ContactSelector({ photographerId, selectedContactId, onChange }: ContactSelectorProps) {
  // Combobox avec recherche
  // Affiche nom + email
  // Option "Créer nouveau contact"
  // Option "Aucun contact"
}
```

**Modification du composant : `GalleryForm.tsx`**

```typescript
// Ajouter sélecteur de contact lors de la création de galerie
<ContactSelector
  photographerId={userId}
  selectedContactId={gallery?.contactId}
  onChange={(contactId) => setGallery({ ...gallery, contactId })}
/>
```

#### 2.5 User Flows

**Flow 1 : Créer un contact**

```
1. Dashboard → Contacts
2. Cliquer "Nouveau contact"
3. Modal s'ouvre
4. Remplir :
   - Nom : "Sophie Martin"
   - Email : "sophie@example.com"
   - Téléphone : "+33 6 12 34 56 78"
   - Tags : "Mariage", "VIP"
   - Notes : "Mariage prévu le 15 juin 2026"
5. Enregistrer
6. Contact apparaît dans la liste
```

**Flow 2 : Lier une galerie à un contact**

```
1. Dashboard → Galeries → Nouvelle galerie
2. Remplir titre, mot de passe, etc.
3. Section "Client" :
   - Sélectionner "Sophie Martin" dans le dropdown
   - OU cliquer "Créer nouveau contact"
4. Enregistrer la galerie
5. Galerie liée au contact
```

**Flow 3 : Consulter l'historique d'un contact**

```
1. Dashboard → Contacts
2. Cliquer sur "Sophie Martin"
3. Page de détails s'ouvre :
   - Header : Nom, email, téléphone, tags
   - Stats : 3 galeries, 450€ de revenus, dernière galerie il y a 2 jours
   - Notes : "Mariage prévu le 15 juin 2026"
   - Historique :
     * Mariage Sophie & Marc - 14/02/2026 - 150 vues - 300€
     * Essai robe - 10/02/2026 - 45 vues - 0€
     * Photos engagement - 05/02/2026 - 89 vues - 150€
4. Cliquer sur une galerie pour y accéder
```

**Flow 4 : Rechercher et filtrer**

```
1. Dashboard → Contacts
2. Barre de recherche : "sophie"
3. Résultats filtrés : 2 contacts trouvés
4. Filtrer par tag : "Mariage"
5. Résultats : 1 contact
6. Trier par : "Revenus (décroissant)"
7. Contact avec le plus de revenus en premier
```

---

## 📊 PLAN D'IMPLÉMENTATION

### Phase 1.1 : Client Proofing (5 jours)

**Jour 1 : Base de données et migrations**
- Créer tables `gallery_proofing_config` et `gallery_proofing_sessions`
- Modifier table `favorites`
- Créer indexes et RLS policies
- Tester migrations

**Jour 2 : Service Layer**
- Créer `ProofingService`
- Modifier `FavoritesService`
- Tests unitaires
- Intégration avec services existants

**Jour 3 : API Routes**
- Créer routes `/api/galleries/[id]/proofing/*`
- Validation et error handling
- Tests d'intégration

**Jour 4 : Composants React**
- `ProofingConfigSection` (dashboard photographe)
- `ProofingBanner` (vue client)
- `ProofingValidationModal`
- Modifier `FavoriteButton`

**Jour 5 : Dashboard et finitions**
- `ProofingSessionsList`
- Notifications
- Tests end-to-end
- Documentation

### Phase 1.2 : Gestion Contacts (3 jours)

**Jour 1 : Base de données et service**
- Créer table `photographer_contacts`
- Modifier table `galleries`
- Créer `ContactsService`
- Tests unitaires

**Jour 2 : API et composants**
- Créer routes `/api/contacts/*`
- `ContactsList`
- `ContactForm`
- `ContactSelector`

**Jour 3 : Intégration et finitions**
- `ContactDetail`
- Intégration avec `GalleryForm`
- Tests end-to-end
- Documentation

---

## 🧪 TESTS

### Tests Unitaires

**ProofingService**
- ✅ Enable proofing with valid config
- ✅ Reject invalid selection limit
- ✅ Create session on first access
- ✅ Block favorite when limit reached
- ✅ Validate selection successfully
- ✅ Prevent validation twice
- ✅ Update selection count correctly

**ContactsService**
- ✅ Create contact with valid data
- ✅ Reject duplicate email
- ✅ List contacts with filters
- ✅ Search contacts by name/email/phone
- ✅ Get contact with galleries
- ✅ Link gallery to contact
- ✅ Update contact stats on gallery creation

### Tests d'Intégration

**Client Proofing Flow**
- ✅ Photographe active proofing
- ✅ Client voit la bannière
- ✅ Client sélectionne jusqu'à la limite
- ✅ Client ne peut pas dépasser la limite
- ✅ Client valide sa sélection
- ✅ Sélection verrouillée après validation
- ✅ Photographe reçoit notification

**Contacts Flow**
- ✅ Photographe crée un contact
- ✅ Photographe lie une galerie au contact
- ✅ Stats du contact se mettent à jour
- ✅ Photographe consulte l'historique
- ✅ Photographe recherche et filtre

---

## 📈 MÉTRIQUES DE SUCCÈS

### KPIs à suivre

**Client Proofing**
1. **Taux d'activation** : % de galeries avec proofing activé
2. **Taux de validation** : % de sessions validées vs abandonnées
3. **Temps moyen de sélection** : Durée entre création et validation
4. **Satisfaction photographe** : Feedback sur la feature

**Gestion Contacts**
1. **Taux d'adoption** : % de photographes qui créent des contacts
2. **Contacts par photographe** : Moyenne de contacts créés
3. **Taux de liaison** : % de galeries liées à un contact
4. **Utilisation recherche** : Fréquence d'utilisation des filtres

### Objectifs

**Phase 1 (3 mois après lancement) :**
- 40% des photographes Pro activent le proofing
- 60% des sessions de proofing sont validées
- 30% des photographes créent au moins 5 contacts
- 50% des nouvelles galeries sont liées à un contact

---

## 🔄 MIGRATION

### Migration des données existantes

**Favoris existants**
- Les favoris existants continuent de fonctionner
- Pas de migration nécessaire
- Proofing est opt-in (désactivé par défaut)

**Galeries existantes**
- Aucune modification requise
- `contact_id` est NULL par défaut
- Photographes peuvent lier rétroactivement

### Compatibilité

- ✅ Backward compatible avec favoris existants
- ✅ Pas de breaking changes
- ✅ Proofing désactivé par défaut
- ✅ Contacts optionnels

---

## 📝 DOCUMENTATION

### Documentation utilisateur

**Pour les photographes :**
1. Guide "Activer le Client Proofing"
2. Guide "Gérer vos contacts"
3. FAQ Client Proofing
4. FAQ Gestion Contacts
5. Vidéo tutoriel (3-5 min)

**Pour les clients :**
1. Guide "Sélectionner vos photos"
2. FAQ Sélection

### Documentation technique

1. API Reference (routes, params, responses)
2. Database Schema (tables, relations, indexes)
3. Service Layer (interfaces, methods)
4. Component Library (props, usage)

---

## 🚀 DÉPLOIEMENT

### Checklist pré-déploiement

**Base de données**
- [ ] Migrations testées en staging
- [ ] Indexes créés
- [ ] RLS policies validées
- [ ] Backup de la DB

**Backend**
- [ ] Services testés
- [ ] API routes testées
- [ ] Error handling validé
- [ ] Logs configurés

**Frontend**
- [ ] Composants testés
- [ ] Responsive validé
- [ ] Accessibilité vérifiée
- [ ] Performance optimisée

**Documentation**
- [ ] Guides utilisateur rédigés
- [ ] API docs à jour
- [ ] Changelog mis à jour
- [ ] Annonce préparée

### Rollout progressif

**Semaine 1 : Beta (10% des utilisateurs Pro)**
- Activer pour early adopters
- Collecter feedback
- Monitorer métriques
- Corriger bugs critiques

**Semaine 2 : Expansion (50% des utilisateurs Pro)**
- Déployer plus largement
- Analyser adoption
- Optimiser UX
- Support utilisateurs

**Semaine 3 : Général (100% des utilisateurs Pro)**
- Déploiement complet
- Annonce officielle
- Marketing push
- Monitoring continu

---

## 💰 IMPACT BUSINESS

### Coûts

**Développement** : 8 jours × $625/jour = $5,000
**Tests** : Inclus dans le développement
**Documentation** : 1 jour × $625 = $625
**Total** : $5,625

### Revenus attendus

**Hypothèses :**
- 500 utilisateurs Pro actuels
- Taux de conversion amélioré : +15%
- Rétention améliorée : +10%
- Prix maintenu : $19.99/mois

**Année 1 :**
```
Utilisateurs Pro : 500 → 575 (+75)
Revenus mensuels : $9,995 → $11,494
Revenus annuels : $119,940 → $137,928
Gain : +$17,988/an
```

**ROI** : $17,988 / $5,625 = **320% la première année**

### Bénéfices non-financiers

1. **Réduction du churn** : Features au niveau de la concurrence
2. **Amélioration NPS** : Photographes plus satisfaits
3. **Différenciation** : Proofing + Contacts + Lightroom + 10%
4. **Préparation Phase 2** : Base solide pour Contrats

---

## 📎 RÉFÉRENCES

### Documents connexes

- **[NEW-FEATURES-COMPETITIVE-ANALYSIS.md](./NEW-FEATURES-COMPETITIVE-ANALYSIS.md)** - Analyse complète des 4 features
- **[EXECUTIVE-SUMMARY-NEW-FEATURES.md](./EXECUTIVE-SUMMARY-NEW-FEATURES.md)** - Résumé exécutif
- **[PRICING-FINAL-ANALYSIS.md](./PRICING-FINAL-ANALYSIS.md)** - Analyse des prix
- **[FEATURES-BY-PLAN.md](./FEATURES-BY-PLAN.md)** - Features par plan
- **[photographer-gallery-monetization.md](./photographer-gallery-monetization.md)** - Spec monétisation

### Services existants à consulter

- `src/lib/services/favorites.service.ts` - Service favoris existant
- `src/lib/services/comments.service.ts` - Service commentaires (pattern similaire)
- `src/lib/services/gallery.service.ts` - Service galeries
- `src/lib/repositories/profile.repository.ts` - Repository profils

### Migrations existantes

- `supabase/migrations/20260114120000_piksend_features.sql` - Features PikSend
- `supabase/migrations/20260115_create_gallery_events.sql` - Events analytics

---

**Document créé** : Janvier 2026  
**Version** : 1.0.0  
**Statut** : Spécification complète - Prêt pour implémentation  
**Durée estimée** : 8 jours  
**ROI estimé** : 320% Année 1

