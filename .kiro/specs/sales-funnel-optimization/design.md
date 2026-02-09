# Design Document - Tunnel de Vente et Conversion Optimisé PikSend

## Overview

Ce document décrit l'architecture et le design technique pour l'implémentation d'un tunnel de vente et de conversion optimisé pour PikSend. Le système vise à augmenter le taux de conversion de 2,4% à 8-10% en 90 jours en implémentant une segmentation intelligente par persona, des landing pages personnalisées, un processus de signup progressif, un onboarding guidé et des triggers d'upgrade automatiques.

### Infrastructure Existante

**IMPORTANT**: Ce design tire parti d'une infrastructure existante substantielle. Environ 40% des composants nécessaires existent déjà et seront réutilisés ou améliorés :

**✅ Composants Existants à Réutiliser:**
- Landing page complète avec hero, stats, benefits, pricing
- Système d'authentification complet (signup, login, OAuth Google)
- Composant d'onboarding avec 4 étapes
- Modal d'upgrade pour limites de plan
- Service d'analytics complet avec tracking d'événements
- Hook de gestion d'abonnement et configuration des plans
- Composant de guest upload
- Tous les composants UI de base (shadcn/ui)

**❌ Nouveaux Composants à Construire:**
- Quiz de segmentation persona (modal)
- 4 landing pages spécifiques par persona
- Calculateur ROI
- Tableau de comparaison
- Composant vidéo témoignage
- Infrastructure A/B testing
- Triggers d'upgrade intelligents
- Logique de détection/routing persona

Cette approche permet de réduire le temps de développement de 12 semaines à 8-10 semaines.

### Objectifs Principaux

1. **Segmentation Intelligente** : Identifier le persona du visiteur via un quiz de 3 questions et personnaliser l'expérience
2. **Personnalisation du Parcours** : Adapter le messaging, les CTAs et les composants selon le persona
3. **Réduction de Friction** : Implémenter un signup progressif (email → password → profil) pour maximiser les conversions
4. **Activation Rapide** : Guider l'utilisateur vers sa première galerie partagée en moins de 10 minutes
5. **Conversion Optimisée** : Déclencher des invitations d'upgrade au bon moment avec le bon messaging
6. **Mesure Continue** : Tracker toutes les métriques du funnel pour optimisation continue

### Stack Technique

- **Frontend** : Next.js 15 (App Router), React 19, TypeScript
- **Styling** : Tailwind CSS, shadcn/ui components
- **State Management** : React Context + Zustand pour état global
- **Forms** : React Hook Form + Zod validation
- **Analytics** : Google Analytics 4, Mixpanel
- **A/B Testing** : Vercel Analytics ou Optimizely
- **Email** : Resend ou SendGrid
- **Payments** : Stripe
- **Database** : Supabase (PostgreSQL)
- **Storage** : Cloudinary pour assets
- **Deployment** : Vercel

## Architecture

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                      ACQUISITION LAYER                       │
│  (Google Ads, Facebook Ads, SEO, Referral, Direct)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   SEGMENTATION LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Persona Quiz │→ │ LocalStorage │→ │ Persona      │     │
│  │ (Modal)      │  │ + Cookies    │  │ Routing      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 PERSONALIZATION LAYER                        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Landing Pages    │  │ Dynamic Content  │                │
│  │ (4 personas)     │  │ (Hero, ROI, FAQ) │                │
│  └──────────────────┘  └──────────────────┘                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONVERSION LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Guest Upload │→ │ Soft Signup  │→ │ Onboarding   │     │
│  │ (Test)       │  │ (Progressive)│  │ (Checklist)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   MONETIZATION LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Upgrade      │→ │ Stripe       │→ │ Paid User    │     │
│  │ Triggers     │  │ Checkout     │  │ (Premium/Pro)│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    ANALYTICS LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Event        │→ │ Funnel       │→ │ A/B Testing  │     │
│  │ Tracking     │  │ Analytics    │  │ & Optimization│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Architecture des Composants

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                    # Homepage avec quiz
│   │   ├── for/
│   │   │   ├── wedding-photographers/
│   │   │   │   └── page.tsx           # Landing Mariage
│   │   │   ├── event-photographers/
│   │   │   │   └── page.tsx           # Landing Événementiel
│   │   │   ├── portrait-photographers/
│   │   │   │   └── page.tsx           # Landing Portrait
│   │   │   └── studios/
│   │   │       └── page.tsx           # Landing Studios
│   │   ├── vs/
│   │   │   ├── pixieset/
│   │   │   │   └── page.tsx           # Comparaison Pixieset
│   │   │   ├── pic-time/
│   │   │   │   └── page.tsx           # Comparaison Pic-Time
│   │   │   ├── shootproof/
│   │   │   │   └── page.tsx           # Comparaison ShootProof
│   │   │   └── alternatives/
│   │   │       └── page.tsx           # Comparateur général
│   │   ├── success-stories/
│   │   │   └── page.tsx               # Success stories
│   │   ├── testimonials/
│   │   │   └── page.tsx               # Témoignages
│   │   ├── demo/
│   │   │   └── page.tsx               # Démo interactive
│   │   ├── pricing/
│   │   │   └── page.tsx               # Pricing (modifié)
│   │   └── auth/
│   │       └── page.tsx               # Auth (modifié)
│   └── (dashboard)/
│       └── dashboard/
│           └── page.tsx               # Dashboard (modifié)
├── components/
│   ├── conversion/
│   │   ├── persona-quiz.tsx           # Quiz segmentation
│   │   ├── roi-calculator.tsx         # Calculateur ROI
│   │   ├── comparison-table.tsx       # Tableau comparatif
│   │   ├── testimonial-video.tsx      # Témoignage vidéo
│   │   ├── soft-signup-modal.tsx      # Signup progressif
│   │   ├── onboarding-checklist.tsx   # Checklist onboarding
│   │   └── upgrade-modal.tsx          # Modal upgrade
│   ├── landing/
│   │   ├── hero-section.tsx           # Hero personnalisé
│   │   ├── features-section.tsx       # Features par persona
│   │   ├── pricing-section.tsx        # Pricing avec ROI
│   │   ├── testimonials-section.tsx   # Section témoignages
│   │   └── faq-section.tsx            # FAQ personnalisée
│   └── ui/
│       └── ...                        # shadcn/ui components
├── lib/
│   ├── analytics/
│   │   ├── events.ts                  # Définition événements
│   │   ├── tracker.ts                 # Tracking service
│   │   └── funnel.ts                  # Funnel analytics
│   ├── persona/
│   │   ├── types.ts                   # Types persona
│   │   ├── quiz.ts                    # Logique quiz
│   │   ├── storage.ts                 # LocalStorage/Cookies
│   │   └── content.ts                 # Content par persona
│   ├── conversion/
│   │   ├── triggers.ts                # Upgrade triggers
│   │   ├── roi.ts                     # Calculs ROI
│   │   └── onboarding.ts              # Logique onboarding
│   └── email/
│       ├── templates.ts               # Templates email
│       └── triggers.ts                # Email triggers
└── types/
    ├── persona.ts                     # Types persona
    ├── conversion.ts                  # Types conversion
    └── analytics.ts                   # Types analytics
```

## Components and Interfaces

### Infrastructure Status

**✅ EXISTING COMPONENTS (Can be reused/enhanced):**
- Landing page with hero, stats, problem section, benefits, pricing, CTA
- Pricing section with monthly/yearly toggle
- Pricing button component
- Guest upload form component
- Upgrade modal for plan limits
- Complete auth page with signin/signup tabs
- Google OAuth integration
- Password strength indicator
- Onboarding guide component with 4 steps
- Dashboard components (header, nav, gallery cards, stats cards)
- Full analytics service and event tracking
- Visitor fingerprinting
- Lead capture service
- Subscription hook and plan configuration
- All shadcn/ui base components

**❌ NEEDS TO BE BUILT:**
- Persona quiz modal component
- Persona-specific landing pages (4 variants)
- ROI calculator component
- Comparison table component
- Testimonial video component
- Exit-intent modal
- Social proof widgets
- Trust badges component
- Testimonials carousel
- A/B testing infrastructure
- Enhanced conversion components
- Persona detection/routing logic

### Leveraging Existing Services

**Analytics & Tracking** (`src/lib/services/analytics.service.ts`):
- Already tracks events with metadata
- Use existing `trackEvent()` function for funnel events
- Extend event types to include persona, quiz, and conversion events

**Event Tracking** (`src/lib/services/events.service.ts`):
- Already has event tracking infrastructure
- Add new event types for persona quiz, ROI calculator, upgrade triggers

**Lead Capture** (`src/lib/services/lead-capture.service.ts`):
- Already captures visitor information
- Extend to store persona data and quiz results

**Subscription Management** (`src/hooks/use-subscription.ts`):
- Already manages plan limits and features
- Use for upgrade trigger conditions
- Leverage existing plan configuration from `src/config/plans.ts`

**Auth Service**:
- Already handles signup, login, OAuth
- Enhance signup flow to be progressive
- Reuse existing password validation and email verification

**Payment Service**:
- Already integrates with Stripe
- Reuse for upgrade checkout flow
- Leverage existing webhook handlers

---

### 1. PersonaQuiz Component ❌ NEW

**Responsabilité** : Segmenter les visiteurs en 4 personas via un quiz de 3 questions

**Interface** :
```typescript
interface PersonaQuizProps {
  onComplete: (result: PersonaQuizResult) => void;
  onSkip: () => void;
  trigger?: 'time' | 'scroll' | 'manual';
  delay?: number; // milliseconds
}

interface PersonaQuizResult {
  persona: Persona;
  answers: QuizAnswers;
  confidence: number; // 0-1
  timestamp: Date;
}

type Persona = 'wedding' | 'event' | 'portrait' | 'studio';

interface QuizAnswers {
  photographerType: string;
  projectsPerMonth: string;
  primaryGoal: string;
}
```

**Comportement** :
- Affichage modal après 3 secondes ou scroll 20%
- 3 questions avec choix multiples
- Calcul du persona basé sur les réponses
- Stockage dans localStorage + cookies (90 jours)
- Redirection vers landing page persona
- Tracking événement "quiz_completed"

**État Interne** :
```typescript
interface QuizState {
  currentStep: number; // 0-2
  answers: Partial<QuizAnswers>;
  isSubmitting: boolean;
  error: string | null;
}
```

### 2. ROICalculator Component ❌ NEW

**Responsabilité** : Calculer et afficher le ROI potentiel selon le persona

**Interface** :
```typescript
interface ROICalculatorProps {
  persona: Persona;
  defaultValues?: ROIInputs;
  onCalculate?: (result: ROIResult) => void;
  variant?: 'inline' | 'modal' | 'sidebar';
}

interface ROIInputs {
  projectsPerMonth: number;
  averagePrice: number;
  salesPerProject: number;
}

interface ROIResult {
  monthlyRevenue: number;
  photographerKeeps: number; // 90%
  pikSendCommission: number; // 10%
  competitorComparison: {
    competitor: string;
    commission: number;
    savings: number;
  };
  paybackPeriod: number; // months
  roi: number; // percentage
}
```

**Calculs** :
```typescript
// Revenus mensuels
monthlyRevenue = projectsPerMonth × salesPerProject × averagePrice

// Photographe garde 90%
photographerKeeps = monthlyRevenue × 0.90

// Commission PikSend 10%
pikSendCommission = monthlyRevenue × 0.10

// Comparaison concurrent (ex: 15%)
competitorCommission = monthlyRevenue × 0.15
savings = competitorCommission - pikSendCommission

// Payback period
subscriptionCost = 19.99 // ou 9.99 selon plan
paybackPeriod = subscriptionCost / (photographerKeeps - subscriptionCost)

// ROI
roi = ((photographerKeeps × 12) - (subscriptionCost × 12)) / (subscriptionCost × 12) × 100
```

### 3. ComparisonTable Component ❌ NEW

**Responsabilité** : Afficher tableau comparatif PikSend vs concurrents

**Interface** :
```typescript
interface ComparisonTableProps {
  competitors: Competitor[];
  highlightPikSend?: boolean;
  variant?: 'full' | 'compact';
  features?: ComparisonFeature[];
}

interface Competitor {
  name: string;
  logo: string;
  price: number;
  commission: number;
  features: Record<string, boolean | string>;
  url?: string;
}

interface ComparisonFeature {
  key: string;
  label: string;
  description?: string;
  important?: boolean;
}
```

**Features Comparées** :
- Prix mensuel ($/mois)
- Commission (%)
- Plugin Lightroom (boolean)
- Support (temps de réponse)
- Stockage (GB)
- Galeries (nombre)
- Domaine custom (boolean)
- Branding (boolean)

### 4. SoftSignupModal Component ✅ ENHANCE EXISTING

**Responsabilité** : Processus d'inscription progressif en 3 étapes

**Note**: The existing auth page already has signin/signup tabs, Google OAuth, and password strength indicator. This component will enhance the existing signup flow to make it progressive (email → password → profile) instead of all-at-once.

**Interface** :
```typescript
interface SoftSignupModalProps {
  trigger: SignupTrigger;
  onComplete: (user: User) => void;
  onSkip?: () => void;
  defaultEmail?: string;
}

type SignupTrigger = 
  | 'guest_upload' 
  | 'feature_locked' 
  | 'limit_reached'
  | 'time_based'
  | 'manual';

interface SignupState {
  step: 1 | 2 | 3;
  email: string;
  password: string;
  profile: Partial<UserProfile>;
  isSubmitting: boolean;
  error: string | null;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  photographerType: Persona;
  businessName?: string;
}
```

**Flow** :
1. **Step 1** : Email only + validation
2. **Step 2** : Password + confirmation
3. **Step 3** : Profil (optionnel, skippable)

**Validation** :
```typescript
// Step 1
emailSchema = z.string().email()

// Step 2
passwordSchema = z.string()
  .min(8, "Minimum 8 caractères")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/[0-9]/, "Au moins un chiffre")

// Step 3
profileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  photographerType: z.enum(['wedding', 'event', 'portrait', 'studio']).optional(),
  businessName: z.string().optional()
})
```

### 5. OnboardingChecklist Component ✅ ENHANCE EXISTING

**Responsabilité** : Guider l'utilisateur vers l'activation (première galerie)

**Note**: The existing onboarding-guide.tsx component already has 4 steps. This will enhance it with better tracking, persistence, and celebration animations.

**Interface** :
```typescript
interface OnboardingChecklistProps {
  user: User;
  completedSteps: string[];
  onStepComplete: (stepId: string) => void;
  onDismiss: () => void;
  variant?: 'modal' | 'sidebar' | 'inline';
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  estimatedTime: number; // minutes
  required: boolean;
}
```

**Steps** :
1. **create_first_gallery** : Créer première galerie (2 min, required)
2. **customize_profile** : Personnaliser profil (1 min, optional)
3. **add_logo** : Ajouter logo (1 min, optional)
4. **invite_test_client** : Inviter client test (1 min, optional)

**État** :
```typescript
interface OnboardingState {
  steps: OnboardingStep[];
  completedSteps: Set<string>;
  progress: number; // 0-100
  isVisible: boolean;
}
```

### 6. UpgradeModal Component ✅ ENHANCE EXISTING

**Responsabilité** : Inviter l'utilisateur à upgrader au bon moment

**Note**: The existing upgrade-modal.tsx component already handles plan limits. This will enhance it with smart triggers, better messaging, and ROI calculator integration.

**Interface** :
```typescript
interface UpgradeModalProps {
  trigger: UpgradeTrigger;
  currentPlan: SubscriptionPlan;
  recommendedPlan: SubscriptionPlan;
  feature?: string;
  onUpgrade: (plan: SubscriptionPlan) => void;
  onDismiss: () => void;
}

type UpgradeTrigger = 
  | 'limit_reached'
  | 'feature_locked'
  | 'time_based'
  | 'behavior_based';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
}

interface PlanFeature {
  key: string;
  label: string;
  included: boolean;
  description?: string;
}

interface PlanLimits {
  galleries: number;
  photosPerGallery: number;
  storage: number; // GB
  expirationDays: number;
}
```

**Triggers** :
```typescript
interface TriggerConfig {
  type: UpgradeTrigger;
  condition: () => boolean;
  priority: number;
  cooldown: number; // hours
  messaging: {
    title: string;
    description: string;
    cta: string;
  };
}

const triggers: TriggerConfig[] = [
  {
    type: 'limit_reached',
    condition: () => user.galleries.length >= user.plan.limits.galleries,
    priority: 1,
    cooldown: 0,
    messaging: {
      title: "Vous avez atteint la limite",
      description: "Passez à Premium pour créer 100 galeries",
      cta: "Voir les plans"
    }
  },
  {
    type: 'feature_locked',
    condition: () => user.clickedLockedFeature,
    priority: 2,
    cooldown: 24,
    messaging: {
      title: "Cette fonctionnalité est Premium",
      description: "Débloquez ZIP download et plus",
      cta: "Essayer 14 jours gratuits"
    }
  },
  // ... autres triggers
];
```

### 7. TestimonialVideo Component ❌ NEW

**Responsabilité** : Afficher témoignage vidéo avec métadonnées

**Interface** :
```typescript
interface TestimonialVideoProps {
  videoUrl: string;
  thumbnail: string;
  author: TestimonialAuthor;
  quote: string;
  metrics?: TestimonialMetrics;
  variant?: 'card' | 'inline' | 'featured';
}

interface TestimonialAuthor {
  name: string;
  role: string;
  location: string;
  photo: string;
  persona: Persona;
}

interface TestimonialMetrics {
  revenue?: string;
  timeSaved?: string;
  roi?: string;
  customMetric?: {
    label: string;
    value: string;
  };
}
```

## Data Models

### Persona Data Model

```typescript
interface PersonaData {
  id: string;
  userId?: string; // null si visiteur
  persona: Persona;
  answers: QuizAnswers;
  confidence: number;
  source: 'quiz' | 'inferred' | 'manual';
  createdAt: Date;
  expiresAt: Date;
}

// Stockage
interface PersonaStorage {
  localStorage: {
    key: 'piksend_persona';
    value: PersonaData;
    ttl: 90 * 24 * 60 * 60 * 1000; // 90 jours
  };
  cookies: {
    name: 'piksend_persona';
    value: Persona;
    maxAge: 90 * 24 * 60 * 60; // 90 jours
    httpOnly: false;
    secure: true;
    sameSite: 'lax';
  };
}
```

### Conversion Funnel Data Model

```typescript
interface FunnelEvent {
  id: string;
  sessionId: string;
  userId?: string;
  eventType: FunnelEventType;
  eventData: Record<string, any>;
  persona?: Persona;
  source: string;
  timestamp: Date;
}

type FunnelEventType =
  | 'page_view'
  | 'quiz_started'
  | 'quiz_completed'
  | 'quiz_skipped'
  | 'guest_upload_started'
  | 'guest_upload_completed'
  | 'signup_started'
  | 'signup_step_completed'
  | 'signup_completed'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'first_gallery_created'
  | 'upgrade_modal_shown'
  | 'upgrade_modal_dismissed'
  | 'upgrade_completed'
  | 'roi_calculator_used'
  | 'comparison_table_viewed'
  | 'testimonial_video_played';

interface FunnelMetrics {
  sessionId: string;
  persona?: Persona;
  source: string;
  landingPage: string;
  
  // Timestamps
  enteredAt: Date;
  quizCompletedAt?: Date;
  signupCompletedAt?: Date;
  activatedAt?: Date;
  upgradedAt?: Date;
  
  // Conversions
  completedQuiz: boolean;
  completedSignup: boolean;
  activated: boolean;
  upgraded: boolean;
  
  // Engagement
  pagesViewed: number;
  timeOnSite: number; // seconds
  roiCalculatorUsed: boolean;
  comparisonTableViewed: boolean;
  testimonialVideoPlayed: boolean;
}
```

### Onboarding State Data Model

```typescript
interface OnboardingState {
  userId: string;
  steps: OnboardingStepState[];
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  dismissed: boolean;
  dismissedAt?: Date;
}

interface OnboardingStepState {
  stepId: string;
  completed: boolean;
  completedAt?: Date;
  skipped: boolean;
  attempts: number;
}

// Database schema
table onboarding_states {
  id: uuid primary key;
  user_id: uuid references users(id);
  step_id: text;
  completed: boolean default false;
  completed_at: timestamp;
  skipped: boolean default false;
  attempts: integer default 0;
  created_at: timestamp default now();
  updated_at: timestamp default now();
  
  unique(user_id, step_id);
}
```

### Upgrade Trigger Data Model

```typescript
interface UpgradeTriggerLog {
  id: string;
  userId: string;
  triggerType: UpgradeTrigger;
  shown: boolean;
  shownAt?: Date;
  dismissed: boolean;
  dismissedAt?: Date;
  converted: boolean;
  convertedAt?: Date;
  planSelected?: string;
}

// Database schema
table upgrade_trigger_logs {
  id: uuid primary key;
  user_id: uuid references users(id);
  trigger_type: text;
  shown: boolean default false;
  shown_at: timestamp;
  dismissed: boolean default false;
  dismissed_at: timestamp;
  converted: boolean default false;
  converted_at: timestamp;
  plan_selected: text;
  created_at: timestamp default now();
  
  index(user_id, trigger_type);
  index(shown_at);
  index(converted);
}
```

### A/B Test Data Model

```typescript
interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  minimumSampleSize: number;
  confidenceLevel: number; // 0.95 = 95%
}

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  traffic: number; // 0-1 (0.5 = 50%)
  config: Record<string, any>;
}

interface ABTestAssignment {
  sessionId: string;
  userId?: string;
  testId: string;
  variantId: string;
  assignedAt: Date;
}

interface ABTestResult {
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  sampleSize: number;
  conversionRate: number;
  confidenceInterval: [number, number];
  pValue: number;
  isSignificant: boolean;
}
```

## Correctness Properties

*Une propriété est une caractéristique ou un comportement qui doit être vrai pour toutes les exécutions valides d'un système - essentiellement, une déclaration formelle sur ce que le système devrait faire. Les propriétés servent de pont entre les spécifications lisibles par l'humain et les garanties de correction vérifiables par machine.*

Basé sur l'analyse prework des acceptance criteria, les propriétés suivantes ont été identifiées pour les tests property-based. Les propriétés redondantes ont été consolidées pour éviter la duplication.

### Property 1: Quiz Modal Trigger Timing

*Pour toute* visite de la homepage sans persona stocké, le Persona_Quiz modal doit apparaître soit après 3 secondes, soit après un scroll de 20%, selon ce qui arrive en premier.

**Validates: Requirements 1.1**

### Property 2: Quiz Structure Consistency

*Pour toute* instance du Persona_Quiz, le composant doit contenir exactement 3 questions avec des choix de réponse valides.

**Validates: Requirements 1.2**

### Property 3: Persona Routing Correctness

*Pour toute* complétion du Persona_Quiz avec des réponses valides, le système doit rediriger vers la landing page correspondant au persona identifié (wedding → /for/wedding-photographers, event → /for/event-photographers, portrait → /for/portrait-photographers, studio → /for/studios).

**Validates: Requirements 1.3**

### Property 4: Persona Storage and Persistence

*Pour toute* complétion du Persona_Quiz, le système doit stocker le résultat dans localStorage et cookies avec une expiration de 90 jours, et ne pas afficher le quiz à nouveau lors des visites subséquentes tant que les données sont valides.

**Validates: Requirements 1.4, 1.5**

### Property 5: Landing Page Component Completeness

*Pour toute* landing page persona, tous les composants requis (hero section personnalisé, ROI_Calculator avec valeurs par défaut, testimonial vidéo du même persona, tableau comparatif, plan recommandé, FAQ spécifique) doivent être présents et configurés selon le persona.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

### Property 6: ROI Calculator Input Validation

*Pour tout* ROI_Calculator, le composant doit accepter exactement 3 inputs numériques (projets/mois, prix moyen, ventes/projet) et rejeter les valeurs invalides (négatives, non-numériques).

**Validates: Requirements 3.1**

### Property 7: ROI Calculator Reactive Computation

*Pour toute* modification d'input dans le ROI_Calculator, tous les valeurs dérivées (revenus mensuels, montant gardé 90%, commission 10%, comparaison concurrent, payback period, ROI%) doivent se recalculer correctement en temps réel selon les formules définies.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 8: ROI Calculator Persona Defaults

*Pour tout* ROI_Calculator affiché sur une landing page persona, les valeurs par défaut doivent correspondre aux moyennes du persona (mariage: 3 projets/mois, événementiel: 8 projets/mois, portrait: 10 projets/mois, studio: 20 projets/mois).

**Validates: Requirements 3.6**

### Property 9: Comparison Table Structure

*Pour tout* ComparisonTable, le tableau doit afficher PikSend plus au moins 3 concurrents (Pixieset, Pic-Time, ShootProof) et comparer au minimum 6 critères (prix, commission, plugin Lightroom, support, stockage, galeries).

**Validates: Requirements 4.1, 4.2**

### Property 10: Guest Upload Limits

*Pour tout* Guest_Upload sans authentification, le système doit accepter entre 3 et 5 photos et rejeter les uploads en dehors de cette plage.

**Validates: Requirements 5.1**

### Property 11: Guest Gallery Generation

*Pour tout* Guest_Upload complété, le système doit générer une galerie fonctionnelle avec une URL unique en moins de 30 secondes.

**Validates: Requirements 5.2**

### Property 12: Guest Gallery UI Elements

*Pour toute* galerie guest visualisée, tous les éléments UI requis doivent être présents : banner "Créé avec PikSend" avec CTA, fonctionnalités lockées visibles avec indication Premium/Pro, modal Soft_Signup après 2 minutes.

**Validates: Requirements 5.4, 5.5, 5.6**

### Property 13: Soft Signup Flow Structure

*Pour tout* processus Soft_Signup, le flow doit se dérouler en exactement 3 étapes (email → password → profil optionnel) avec possibilité de skip à l'étape 3.

**Validates: Requirements 6.1**

### Property 14: Email Validation and Uniqueness

*Pour toute* soumission d'email à l'étape 1 du Soft_Signup, le système doit valider le format email et vérifier que l'email n'existe pas déjà dans la base de données.

**Validates: Requirements 6.2**

### Property 15: Signup Step Progression

*Pour toute* complétion d'étape du Soft_Signup, le système doit progresser à l'étape suivante sans rechargement de page, ou créer le compte et authentifier l'utilisateur après l'étape 2.

**Validates: Requirements 6.3, 6.4, 6.5**

### Property 16: Onboarding Checklist Structure

*Pour tout* nouvel utilisateur se connectant pour la première fois, l'Onboarding_Checklist doit s'afficher avec exactement 4 tâches (créer galerie, personnaliser profil, ajouter logo, inviter client test).

**Validates: Requirements 7.1, 7.2**

### Property 17: Onboarding Task Completion Updates

*Pour toute* complétion de tâche dans l'Onboarding_Checklist, le système doit mettre à jour la progress bar, afficher une animation de célébration, et persister l'état de complétion.

**Validates: Requirements 7.3, 7.4, 7.5**

### Property 18: Upgrade Trigger Condition Matching

*Pour tout* état utilisateur correspondant à une condition de trigger (limite atteinte, feature lockée, temps écoulé, comportement détecté), le système doit afficher ou envoyer le trigger d'upgrade approprié avec le messaging correct.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 19: Upgrade Modal Content Completeness

*Pour tout* Upgrade_Trigger modal affiché, le contenu doit inclure : raison de l'upgrade, plan recommandé, bénéfices débloqués, ROI_Calculator, testimonial, et CTA "Essayer 14 jours gratuits".

**Validates: Requirements 8.6, 8.7**

### Property 20: Funnel Event Tracking Completeness

*Pour tout* événement clé du funnel (page_view, quiz_completed, signup_completed, first_gallery_created, upgrade_completed, etc.), le système doit tracker l'événement avec les métadonnées correctes (sessionId, userId, persona, source, timestamp).

**Validates: Requirements 16.1, 16.2, 16.3, 16.4**

### Property 21: Email Trigger Timing

*Pour toute* condition de trigger email (nouveau compte, pas de galerie J+1, pas de galerie J+3, J+7 sans upgrade, J+14 sans upgrade, première galerie créée, upgrade complété), le système doit envoyer l'email approprié dans le délai spécifié.

**Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7**

### Property 22: Performance Optimizations Presence

*Pour toute* page du funnel, les optimisations de performance doivent être implémentées : images optimisées (WebP/AVIF, lazy loading), code splitting, CDN pour assets statiques, prefetching des pages critiques.

**Validates: Requirements 19.3, 19.4, 19.5, 19.7**

### Property 23: Responsive Design Adaptation

*Pour tout* composant du funnel, le design doit s'adapter correctement aux 3 tailles d'écran principales (mobile 375px, tablet 768px, desktop 1280px) sans perte de fonctionnalité.

**Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6**

### Property 24: Accessibility Standards Compliance

*Pour toute* page et composant du funnel, les standards WCAG 2.1 niveau AA doivent être respectés : navigation clavier complète, labels ARIA appropriés, ratio de contraste 4.5:1 minimum, alternatives textuelles pour images/vidéos.

**Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5**

### Property 25: Security Measures Implementation

*Pour toute* communication et donnée sensible, les mesures de sécurité doivent être en place : HTTPS/TLS 1.3, mots de passe hashés (bcrypt/Argon2), protection CSRF, chiffrement des données sensibles.

**Validates: Requirements 23.1, 23.2, 23.3**

## Error Handling

### Error Categories

1. **User Input Errors**
   - Invalid email format
   - Weak password
   - Invalid ROI calculator inputs
   - Upload file size/type errors

2. **Network Errors**
   - API request failures
   - Timeout errors
   - Connection lost during upload

3. **State Errors**
   - Persona data corruption
   - Session expiration
   - Concurrent modification conflicts

4. **Integration Errors**
   - Analytics tracking failures
   - Email sending failures
   - Payment processing errors

### Error Handling Strategy

```typescript
interface ErrorHandler {
  // User-facing error messages
  getUserMessage(error: Error): string;
  
  // Retry logic for transient errors
  shouldRetry(error: Error): boolean;
  getRetryDelay(attempt: number): number;
  
  // Fallback behavior
  getFallback(context: ErrorContext): FallbackAction;
  
  // Error tracking
  trackError(error: Error, context: ErrorContext): void;
}

interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  sessionId: string;
  metadata: Record<string, any>;
}

type FallbackAction = 
  | { type: 'retry'; delay: number }
  | { type: 'fallback_ui'; component: React.ReactNode }
  | { type: 'redirect'; url: string }
  | { type: 'silent'; logOnly: true };
```

### Specific Error Handlers

**Quiz Errors**:
- Persona storage failure → Continue with generic experience, retry storage
- Invalid answers → Show validation errors, prevent submission

**Signup Errors**:
- Email already exists → Show clear message, offer login link
- Network error during signup → Save progress, allow retry
- Password validation failure → Show specific requirements

**Upload Errors**:
- File too large → Show size limit, suggest compression
- Upload timeout → Retry with exponential backoff
- Invalid file type → Show accepted formats

**Payment Errors**:
- Card declined → Show Stripe error message, allow retry
- Network error → Retry automatically, show loading state
- Webhook failure → Queue for retry, log for manual review

## Testing Strategy

### Dual Testing Approach

Le système utilise une approche de test duale combinant unit tests et property-based tests :

**Unit Tests** :
- Exemples spécifiques et cas limites
- Intégration entre composants
- Conditions d'erreur
- Interactions UI spécifiques

**Property Tests** :
- Propriétés universelles sur tous les inputs
- Couverture complète via randomisation
- Validation des invariants
- Tests de régression automatiques

### Property-Based Testing Configuration

**Librairie** : fast-check (JavaScript/TypeScript)

**Configuration** :
```typescript
import fc from 'fast-check';

// Configuration globale
const propertyTestConfig = {
  numRuns: 100, // Minimum 100 itérations par test
  seed: Date.now(), // Seed pour reproductibilité
  verbose: true,
  endOnFailure: false
};

// Exemple de test property
describe('Property 7: ROI Calculator Reactive Computation', () => {
  it('should recalculate all derived values correctly for any valid input', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // projectsPerMonth
        fc.integer({ min: 10, max: 1000 }), // averagePrice
        fc.integer({ min: 1, max: 20 }), // salesPerProject
        (projects, price, sales) => {
          const result = calculateROI({ projects, price, sales });
          
          // Vérifier les calculs
          const expectedRevenue = projects * price * sales;
          expect(result.monthlyRevenue).toBe(expectedRevenue);
          expect(result.photographerKeeps).toBe(expectedRevenue * 0.90);
          expect(result.pikSendCommission).toBe(expectedRevenue * 0.10);
          
          // Vérifier la cohérence
          expect(result.photographerKeeps + result.pikSendCommission)
            .toBe(result.monthlyRevenue);
        }
      ),
      propertyTestConfig
    );
  });
});
```

**Tag Format** :
Chaque test property doit inclure un commentaire référençant la propriété du design :

```typescript
/**
 * Feature: sales-funnel-optimization
 * Property 7: ROI Calculator Reactive Computation
 * 
 * For any modification of input in the ROI_Calculator, all derived values
 * should recalculate correctly in real-time according to defined formulas.
 */
```

### Test Coverage Requirements

**Par Composant** :
- PersonaQuiz : Properties 1-4 + unit tests pour UI
- ROICalculator : Properties 6-8 + unit tests pour edge cases
- ComparisonTable : Property 9 + unit tests pour rendering
- SoftSignupModal : Properties 13-15 + unit tests pour validation
- OnboardingChecklist : Properties 16-17 + unit tests pour state
- UpgradeModal : Properties 18-19 + unit tests pour triggers

**Par Feature** :
- Segmentation : Properties 1-5
- Conversion : Properties 10-15
- Onboarding : Properties 16-17
- Monetization : Properties 18-19
- Analytics : Property 20
- Email : Property 21
- Performance : Property 22
- Responsive : Property 23
- Accessibility : Property 24
- Security : Property 25

### Integration Testing

**Funnel End-to-End Tests** :
1. Homepage → Quiz → Landing Page → Guest Upload → Signup → Dashboard
2. Homepage → Pricing → Signup → Dashboard → Upgrade
3. Homepage → Comparison Page → Signup → Dashboard

**A/B Testing Validation** :
- Verify traffic split (50/50)
- Verify variant assignment persistence
- Verify metrics tracking per variant

**Analytics Validation** :
- Verify all funnel events tracked
- Verify event metadata correctness
- Verify funnel metrics calculation

## Deployment Strategy

### Phased Rollout

**Phase 1 : Composants Core (Semaines 1-2)**
- PersonaQuiz component
- ROICalculator component
- ComparisonTable component
- Analytics tracking setup
- Deploy to staging

**Phase 2 : Landing Pages (Semaines 3-4)**
- 4 landing pages persona
- SEO optimization
- A/B test setup
- Deploy to production (10% traffic)

**Phase 3 : Conversion Flow (Semaines 5-6)**
- SoftSignupModal component
- OnboardingChecklist component
- Email triggers
- Deploy to production (50% traffic)

**Phase 4 : Monetization (Semaines 7-8)**
- UpgradeModal component
- Upgrade triggers
- Stripe integration
- Deploy to production (100% traffic)

**Phase 5 : Optimization (Semaines 9-12)**
- A/B tests execution
- Performance optimization
- Continuous improvement
- Full production

### Monitoring and Alerts

**Key Metrics to Monitor** :
- Conversion rate (target: 8-10%)
- Quiz completion rate (target: 60%)
- Signup rate (target: +40% vs baseline)
- Activation rate (target: 60%)
- Upgrade rate (target: 20%)
- Page load times (target: <2s)
- Error rates (target: <1%)

**Alerts** :
- Conversion rate drops >10%
- Error rate exceeds 1%
- Page load time exceeds 3s
- Email delivery failures
- Payment processing failures

### Rollback Plan

**Triggers for Rollback** :
- Conversion rate drops >20%
- Critical bugs affecting >5% users
- Performance degradation >50%
- Security vulnerability discovered

**Rollback Procedure** :
1. Revert to previous deployment
2. Notify team and stakeholders
3. Analyze root cause
4. Fix issues in staging
5. Re-deploy with fixes

## Future Enhancements

### Phase 6+ (Post-Launch)

**Personnalisation Avancée** :
- ML-based persona prediction
- Dynamic content optimization
- Predictive upgrade timing
- Personalized pricing

**Expansion Internationale** :
- Multi-language support (ES, DE, IT)
- Currency localization
- Regional pricing
- Local payment methods

**Advanced Analytics** :
- Cohort analysis
- Retention curves
- LTV prediction
- Churn prediction

**Gamification** :
- Achievement badges
- Progress milestones
- Referral rewards
- Community leaderboard

**AI Features** :
- Chatbot support
- Smart recommendations
- Automated A/B test optimization
- Content generation

