# Design Document: PikSend Next.js 15+ Migration

## Overview

Ce document décrit l'architecture technique pour la migration de PikSend vers Next.js 15+ avec une approche microservices hybride. L'application conservera le design visuel existant tout en bénéficiant des fonctionnalités modernes de Next.js (App Router, Server Components, Server Actions) et d'une meilleure architecture backend.

### Objectifs Principaux
- Migration vers Next.js 15+ avec App Router
- Architecture microservices modulaire
- Authentification NextAuth.js v5
- SEO optimisé avec Metadata API
- Conservation des Edge Functions Supabase pour webhooks et crons
- Tailwind CSS 4+ avec nouvelle syntaxe d'import

## Architecture

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 15+ Application                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Pages     │  │  Components │  │   Hooks     │              │
│  │ (App Router)│  │ (shadcn/ui) │  │             │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │              Service Layer                     │              │
│  ├────────┬────────┬────────┬────────┬──────────┤              │
│  │  Auth  │Gallery │ Image  │Payment │   SEO    │              │
│  │Service │Service │Service │Service │ Service  │              │
│  └────┬───┴────┬───┴────┬───┴────┬───┴────┬─────┘              │
│       │        │        │        │        │                      │
│  ┌────┴────────┴────────┴────────┴────────┴─────┐              │
│  │           Repository Layer                    │              │
│  └──────────────────┬───────────────────────────┘              │
│                     │                                            │
├─────────────────────┼────────────────────────────────────────────┤
│  ┌──────────────────┴───────────────────────────┐              │
│  │              API Routes                       │              │
│  │  /api/auth/* /api/galleries/* /api/images/*  │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
├─────────────┬─────────────┬─────────────┬───────────────────────┤
│  Supabase   │ Cloudinary  │   Stripe    │  Supabase Edge        │
│  PostgreSQL │   (CDN)     │  Payments   │  Functions (Webhooks) │
└─────────────┴─────────────┴─────────────┴───────────────────────┘
```

### Structure des Dossiers

```
photoserve-nextjs/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group pour auth
│   │   ├── auth/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/              # Route group protégé
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── gallery/
│   │   │       ├── new/page.tsx
│   │   │       └── [id]/page.tsx
│   │   └── settings/page.tsx
│   ├── (public)/                 # Route group public
│   │   ├── page.tsx              # Landing
│   │   ├── pricing/page.tsx
│   │   └── legal/[page]/page.tsx
│   ├── g/[slug]/page.tsx         # Gallery view public
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── galleries/
│   │   │   ├── route.ts          # GET, POST
│   │   │   └── [id]/route.ts     # GET, PUT, DELETE
│   │   ├── images/
│   │   │   ├── upload/route.ts
│   │   │   └── [id]/route.ts
│   │   ├── verify-password/route.ts
│   │   └── stripe/
│   │       ├── checkout/route.ts
│   │       └── portal/route.ts
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   ├── layouts/                  # Layout components
│   └── shared/                   # Shared components
├── lib/
│   ├── services/                 # Service layer
│   │   ├── auth.service.ts
│   │   ├── gallery.service.ts
│   │   ├── image.service.ts
│   │   ├── payment.service.ts
│   │   └── seo.service.ts
│   ├── repositories/             # Data access layer
│   │   ├── profile.repository.ts
│   │   ├── gallery.repository.ts
│   │   └── image.repository.ts
│   ├── validators/               # Zod schemas
│   │   ├── gallery.schema.ts
│   │   ├── image.schema.ts
│   │   └── auth.schema.ts
│   ├── errors/                   # Custom error classes
│   │   └── index.ts
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── types.ts              # Generated types
│   ├── cloudinary/
│   │   └── client.ts
│   ├── stripe/
│   │   └── client.ts
│   └── utils.ts
├── hooks/                        # React hooks
├── types/                        # TypeScript types
├── config/                       # Configuration
│   └── auth.config.ts            # NextAuth config
├── middleware.ts                 # Auth middleware
└── supabase/                     # Edge Functions (conservées)
    └── functions/
        ├── stripe-webhook/
        ├── cleanup-expired-galleries/
        ├── cleanup-rate-limits/
        └── notify-expiring-galleries/
```

## Components and Interfaces

### Service Layer Interfaces

```typescript
// lib/services/auth.service.ts
interface IAuthService {
  signUp(email: string, password: string, name?: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signInWithGoogle(): Promise<AuthResult>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(token: string, newPassword: string): Promise<void>;
  getSession(): Promise<Session | null>;
}

// lib/services/gallery.service.ts
interface IGalleryService {
  create(data: CreateGalleryInput): Promise<Gallery>;
  getById(id: string): Promise<Gallery | null>;
  getBySlug(slug: string): Promise<Gallery | null>;
  getByUserId(userId: string): Promise<Gallery[]>;
  update(id: string, data: UpdateGalleryInput): Promise<Gallery>;
  delete(id: string): Promise<void>;
  verifyPassword(slug: string, password: string, clientIp: string): Promise<GalleryAccessResult>;
  incrementViewCount(id: string): Promise<void>;
}

// lib/services/image.service.ts
interface IImageService {
  upload(file: File, galleryId: string, orderIndex: number): Promise<Image>;
  delete(imageId: string): Promise<void>;
  getByGalleryId(galleryId: string): Promise<Image[]>;
  validateFile(file: File, userPlan: SubscriptionPlan): ValidationResult;
}

// lib/services/payment.service.ts
interface IPaymentService {
  createCheckoutSession(userId: string, priceId: string): Promise<string>;
  createPortalSession(customerId: string): Promise<string>;
  getSubscriptionStatus(userId: string): Promise<SubscriptionStatus>;
}

// lib/services/seo.service.ts
interface ISeoService {
  generateMetadata(page: PageType, data?: any): Metadata;
  generateStructuredData(type: StructuredDataType, data: any): object;
  generateSitemap(): Promise<SitemapEntry[]>;
}
```

### Repository Layer Interfaces

```typescript
// lib/repositories/gallery.repository.ts
interface IGalleryRepository {
  create(data: GalleryInsert): Promise<Gallery>;
  findById(id: string): Promise<Gallery | null>;
  findBySlug(slug: string): Promise<Gallery | null>;
  findByUserId(userId: string): Promise<Gallery[]>;
  update(id: string, data: GalleryUpdate): Promise<Gallery>;
  delete(id: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}

// lib/repositories/profile.repository.ts
interface IProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findByEmail(email: string): Promise<Profile | null>;
  create(data: ProfileInsert): Promise<Profile>;
  update(id: string, data: ProfileUpdate): Promise<Profile>;
  incrementStorage(userId: string, sizeMb: number): Promise<void>;
  decrementStorage(userId: string, sizeMb: number): Promise<void>;
}

// lib/repositories/image.repository.ts
interface IImageRepository {
  create(data: ImageInsert): Promise<Image>;
  findById(id: string): Promise<Image | null>;
  findByGalleryId(galleryId: string): Promise<Image[]>;
  delete(id: string): Promise<void>;
}
```

### Validation Schemas (Zod)

```typescript
// lib/validators/gallery.schema.ts
import { z } from 'zod';

export const createGallerySchema = z.object({
  title: z.string().min(1).max(100),
  password: z.string().min(4).max(50),
  expirationDays: z.number().int().min(1).max(365),
});

export const updateGallerySchema = z.object({
  title: z.string().min(1).max(100).optional(),
  password: z.string().min(4).max(50).optional(),
  expirationDays: z.number().int().min(1).max(365).optional(),
});

export const verifyPasswordSchema = z.object({
  slug: z.string().min(1),
  password: z.string().min(1),
});

// lib/validators/image.schema.ts
export const uploadImageSchema = z.object({
  galleryId: z.string().uuid(),
  orderIndex: z.number().int().min(0),
});

// lib/validators/auth.schema.ts
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

## Data Models

### Types TypeScript (basés sur le schéma Supabase existant)

```typescript
// types/database.ts
export type SubscriptionPlan = 'free' | 'premium' | 'pro';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  subscription_plan: SubscriptionPlan;
  storage_used_mb: number;
  storage_limit_mb: number;
  max_galleries: number;
  max_images_per_gallery: number;
  max_image_size_mb: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Gallery {
  id: string;
  user_id: string;
  title: string;
  unique_slug: string;
  password_hash: string;
  expiration_days: number;
  expires_at: string;
  views_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: string;
  gallery_id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  file_size_mb: number;
  order_index: number;
  created_at: string;
}

export interface RateLimitAttempt {
  id: string;
  key: string;
  attempts: number;
  first_attempt_at: string;
  expires_at: string;
  created_at: string;
}

export interface SubscriptionPlanLimits {
  name: SubscriptionPlan;
  storage_limit_mb: number;
  max_galleries: number;
  max_images_per_gallery: number;
  max_image_size_mb: number;
  max_expiration_days: number;
  price_monthly: number;
  price_yearly: number;
}
```

### Plan Limits Configuration

```typescript
// config/plans.ts
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    storage_limit_mb: 20,
    max_galleries: 3,
    max_images_per_gallery: 30,
    max_image_size_mb: 1,
    max_expiration_days: 30,
  },
  premium: {
    storage_limit_mb: 5120,
    max_galleries: 50,
    max_images_per_gallery: 500,
    max_image_size_mb: 50,
    max_expiration_days: 90,
  },
  pro: {
    storage_limit_mb: 51200,
    max_galleries: 500,
    max_images_per_gallery: 5000,
    max_image_size_mb: 100,
    max_expiration_days: 180,
  },
};
```



## NextAuth.js Configuration

```typescript
// config/auth.config.ts
import { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import bcrypt from 'bcryptjs';

export const authConfig: NextAuthConfig = {
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validation et authentification
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  session: {
    strategy: 'jwt',
  },
};
```

## API Routes Design

### Gallery API Routes

```typescript
// app/api/galleries/route.ts
// GET - List user galleries
// POST - Create new gallery

// app/api/galleries/[id]/route.ts
// GET - Get gallery details
// PUT - Update gallery
// DELETE - Delete gallery

// app/api/verify-password/route.ts
// POST - Verify gallery password with rate limiting
```

### Image API Routes

```typescript
// app/api/images/upload/route.ts
// POST - Upload image to Cloudinary

// app/api/images/[id]/route.ts
// DELETE - Delete image from Cloudinary and database
```

### Stripe API Routes

```typescript
// app/api/stripe/checkout/route.ts
// POST - Create Stripe Checkout session

// app/api/stripe/portal/route.ts
// POST - Create Stripe Customer Portal session
```

## Middleware Configuration

```typescript
// middleware.ts
import { auth } from '@/config/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                           req.nextUrl.pathname.startsWith('/settings');
  
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth', req.url));
  }
  
  // Redirect logged-in users away from auth page
  if (req.nextUrl.pathname === '/auth' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## SEO Implementation

### Metadata Generation

```typescript
// lib/services/seo.service.ts
import { Metadata } from 'next';

export class SeoService {
  static generateLandingMetadata(): Metadata {
    return {
      title: 'PikSend - Partagez vos photos en toute sécurité',
      description: 'Créez des galeries photo temporaires et sécurisées par mot de passe.',
      keywords: ['galerie photo', 'partage photos', 'photographe professionnel'],
      openGraph: {
        title: 'PikSend - Partagez vos photos en toute sécurité',
        description: 'Créez des galeries photo temporaires et sécurisées.',
        type: 'website',
        locale: 'fr_FR',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'PikSend',
        description: 'Partagez vos photos en toute sécurité',
      },
    };
  }

  static generateGalleryMetadata(gallery: Gallery): Metadata {
    return {
      title: `${gallery.title} | PikSend`,
      description: `Galerie photo sécurisée`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  static generateFAQStructuredData(faqs: FAQ[]): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }
}
```

### Dynamic Sitemap

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://photoserve.app';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
```

## Rate Limiting Implementation

```typescript
// lib/services/rate-limiter.service.ts
export class RateLimiterService {
  private static MAX_ATTEMPTS = 5;
  private static WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  static async checkRateLimit(
    supabase: SupabaseClient,
    key: string
  ): Promise<RateLimitResult> {
    const now = new Date();
    
    const { data: existing } = await supabase
      .from('rate_limit_attempts')
      .select('id, attempts, expires_at')
      .eq('key', key)
      .maybeSingle();

    if (existing) {
      const expiresAt = new Date(existing.expires_at);
      
      if (expiresAt <= now) {
        // Reset expired entry
        await supabase
          .from('rate_limit_attempts')
          .delete()
          .eq('id', existing.id);
        
        return this.createNewEntry(supabase, key, now);
      }
      
      if (existing.attempts >= this.MAX_ATTEMPTS) {
        const retryAfterSeconds = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
        return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
      }
      
      // Increment attempts
      const newAttempts = existing.attempts + 1;
      await supabase
        .from('rate_limit_attempts')
        .update({ attempts: newAttempts })
        .eq('id', existing.id);
      
      return { 
        allowed: true, 
        remainingAttempts: this.MAX_ATTEMPTS - newAttempts 
      };
    }
    
    return this.createNewEntry(supabase, key, now);
  }

  static async resetRateLimit(supabase: SupabaseClient, key: string): Promise<void> {
    await supabase
      .from('rate_limit_attempts')
      .delete()
      .eq('key', key);
  }

  private static async createNewEntry(
    supabase: SupabaseClient,
    key: string,
    now: Date
  ): Promise<RateLimitResult> {
    const expiresAt = new Date(now.getTime() + this.WINDOW_MS);
    
    await supabase
      .from('rate_limit_attempts')
      .insert({
        key,
        attempts: 1,
        first_attempt_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });
    
    return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
  }
}
```

## Cloudinary Integration

```typescript
// lib/cloudinary/client.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  static async uploadImage(
    file: Buffer,
    folder: string
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        }
      ).end(file);
    });
  }

  static async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  static generateOptimizedUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
    });
  }

  static generateThumbnailUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      width: 400,
      height: 400,
      crop: 'fill',
      fetch_format: 'auto',
      quality: 'auto',
    });
  }
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the acceptance criteria analysis, the following correctness properties have been identified for property-based testing:

### Property 1: Password Hashing Consistency (bcrypt)

*For any* password string, hashing it with bcrypt and then verifying the original password against the hash SHALL return true, and verifying a different password SHALL return false.

**Validates: Requirements 3.2, 4.3, 11.6**

### Property 2: User Profile Creation on Signup

*For any* valid user signup (email, password, optional name), a profile record SHALL be created with subscription_plan='free' and the corresponding free plan limits (storage_limit_mb=20, max_galleries=3, max_images_per_gallery=30, max_image_size_mb=1).

**Validates: Requirements 3.4**

### Property 3: JWT Session Establishment

*For any* successful authentication (email/password or OAuth), a valid JWT token SHALL be generated containing the user ID, and the token SHALL be verifiable with the application secret.

**Validates: Requirements 3.5**

### Property 4: Authentication Error Safety

*For any* failed authentication attempt, the error response SHALL NOT contain the actual password, password hash, or internal system details.

**Validates: Requirements 3.7**

### Property 5: Gallery Creation with Unique Slug

*For any* gallery creation request, the generated unique_slug SHALL be different from all existing slugs in the database.

**Validates: Requirements 4.2**

### Property 6: Gallery Expiration Status

*For any* gallery where the current date is past expires_at, the gallery SHALL be marked as is_active=false or treated as inactive in queries.

**Validates: Requirements 4.4**

### Property 7: Plan-Based Gallery Limits Enforcement

*For any* user attempting to create a gallery, if the user's current gallery count equals or exceeds their plan's max_galleries limit, the creation SHALL be rejected with an appropriate error.

**Validates: Requirements 4.5**

### Property 8: Gallery View Count Increment

*For any* successful gallery access (password verified), the views_count SHALL be incremented by exactly 1.

**Validates: Requirements 4.6**

### Property 9: Server-Side Password Verification

*For any* gallery password verification request, the verification SHALL use bcrypt.compare on the server and SHALL NOT expose the stored hash to the client.

**Validates: Requirements 4.7**

### Property 10: Rate Limiting Enforcement

*For any* IP/gallery combination, after 5 failed password attempts within 15 minutes, subsequent attempts SHALL be blocked until the window expires.

**Validates: Requirements 4.8**

### Property 11: Image File Validation

*For any* file upload, the Image_Service SHALL validate both the MIME type header AND the file's magic numbers, rejecting files where either check fails.

**Validates: Requirements 5.2**

### Property 12: Plan-Based Image Size Limits

*For any* image upload where file size exceeds the user's plan max_image_size_mb, the upload SHALL be rejected with an appropriate error.

**Validates: Requirements 5.3**

### Property 13: Storage Usage Tracking

*For any* image upload, the user's storage_used_mb SHALL increase by the file size. *For any* image deletion, the user's storage_used_mb SHALL decrease by the file size.

**Validates: Requirements 5.4, 5.7**

### Property 14: Optimized URL Generation

*For any* successfully uploaded image, the response SHALL include three URLs: original (full quality), optimized (auto format/quality), and thumbnail (400x400 crop).

**Validates: Requirements 5.5**

### Property 15: Complete Image Deletion

*For any* image deletion request, both the Cloudinary resource AND the database record SHALL be removed.

**Validates: Requirements 5.6**

### Property 16: Subscription Plan Synchronization

*For any* Stripe subscription event (created, updated), the user's profile limits SHALL match the corresponding plan limits (premium or pro).

**Validates: Requirements 6.3**

### Property 17: Subscription Cancellation Downgrade

*For any* Stripe subscription cancellation event, the user's profile SHALL be updated to subscription_plan='free' with free plan limits.

**Validates: Requirements 6.4**

### Property 18: Page Metadata Generation

*For any* page in the application, the generated metadata SHALL include title, description, and Open Graph tags (og:title, og:description, og:type).

**Validates: Requirements 7.1, 7.2**

### Property 19: JSON-LD Structured Data Validity

*For any* structured data generation (FAQ, Organization, ImageGallery), the output SHALL be valid JSON-LD with correct @context and @type fields.

**Validates: Requirements 7.3**

### Property 20: Gallery Page NoIndex

*For any* gallery view page (/g/[slug]), the metadata SHALL include robots: { index: false, follow: false }.

**Validates: Requirements 7.8**

### Property 21: Protected Route Redirect

*For any* unauthenticated request to a protected route (/dashboard/*, /settings), the response SHALL be a redirect to /auth.

**Validates: Requirements 8.5**

### Property 22: API Input Validation

*For any* API request with invalid input data (according to Zod schema), the response SHALL be HTTP 400 with a consistent error format containing validation details.

**Validates: Requirements 9.4**

### Property 23: API Authentication Middleware

*For any* request to a protected API route without valid authentication, the response SHALL be HTTP 401.

**Validates: Requirements 9.5**

### Property 24: Consistent API Error Format

*For any* API error response, the format SHALL be { error: string, details?: object, code?: string }.

**Validates: Requirements 9.6**

### Property 25: RLS Policy Enforcement

*For any* database query through the user client, Row Level Security SHALL prevent access to data not owned by the authenticated user.

**Validates: Requirements 10.2**

### Property 26: Unique Slug Generation

*For any* call to generate_unique_slug(), the returned slug SHALL be unique across all existing galleries.

**Validates: Requirements 10.5**

### Property 27: CORS Header Validation

*For any* cross-origin API request, the response SHALL include appropriate CORS headers only for allowed origins.

**Validates: Requirements 11.2**

### Property 28: HTTP-Only Session Cookies

*For any* session cookie set by the application, the cookie SHALL have the HttpOnly flag set to true.

**Validates: Requirements 11.5**

### Property 29: Security Error Sanitization

*For any* security-sensitive operation failure (auth, password verification), the client response SHALL NOT contain stack traces, internal paths, or database details.

**Validates: Requirements 11.7**

### Property 30: French Locale Formatting

*For any* date or currency value displayed in the UI, the format SHALL use French locale (dates: dd MMMM yyyy, currency: € with comma decimal separator).

**Validates: Requirements 12.2, 12.3**

## Error Handling

### Custom Error Classes

```typescript
// lib/errors/index.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: object
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_REQUIRED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'ACCESS_DENIED', 403);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: object) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds: number) {
    super('Too many requests', 'RATE_LIMIT_EXCEEDED', 429, { retryAfterSeconds });
    this.name = 'RateLimitError';
  }
}

export class StorageLimitError extends AppError {
  constructor(currentUsage: number, limit: number) {
    super('Storage limit exceeded', 'STORAGE_LIMIT_EXCEEDED', 400, { currentUsage, limit });
    this.name = 'StorageLimitError';
  }
}

export class GalleryLimitError extends AppError {
  constructor(currentCount: number, limit: number) {
    super('Gallery limit exceeded', 'GALLERY_LIMIT_EXCEEDED', 400, { currentCount, limit });
    this.name = 'GalleryLimitError';
  }
}
```

### API Error Handler

```typescript
// lib/api/error-handler.ts
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { ZodError } from 'zod';

export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  // Generic error - don't expose internal details
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}
```

## Testing Strategy

### Testing Framework

- **Unit Tests**: Vitest for fast unit testing
- **Property-Based Tests**: fast-check for property-based testing
- **Integration Tests**: Vitest with MSW for API mocking
- **E2E Tests**: Playwright for end-to-end testing

### Property-Based Testing Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.property.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Example Property Test

```typescript
// lib/services/__tests__/gallery.service.property.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import bcrypt from 'bcryptjs';

describe('Gallery Service Properties', () => {
  // Feature: nextjs-migration, Property 1: Password Hashing Consistency
  // Validates: Requirements 3.2, 4.3, 11.6
  it('should verify correct passwords and reject incorrect ones', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 4, maxLength: 50 }),
        fc.string({ minLength: 4, maxLength: 50 }),
        (password, wrongPassword) => {
          fc.pre(password !== wrongPassword);
          
          const hash = bcrypt.hashSync(password, 10);
          
          // Correct password should verify
          expect(bcrypt.compareSync(password, hash)).toBe(true);
          
          // Wrong password should not verify
          expect(bcrypt.compareSync(wrongPassword, hash)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: nextjs-migration, Property 5: Gallery Creation with Unique Slug
  // Validates: Requirements 4.2
  it('should generate unique slugs', () => {
    const generatedSlugs = new Set<string>();
    
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), () => {
        const slug = generateUniqueSlug(); // Mock implementation
        
        // Slug should not already exist
        expect(generatedSlugs.has(slug)).toBe(false);
        generatedSlugs.add(slug);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
```

### Test Organization

```
__tests__/
├── unit/
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── gallery.service.test.ts
│   │   └── image.service.test.ts
│   ├── repositories/
│   │   └── gallery.repository.test.ts
│   └── validators/
│       └── gallery.schema.test.ts
├── property/
│   ├── auth.property.test.ts
│   ├── gallery.property.test.ts
│   ├── image.property.test.ts
│   └── seo.property.test.ts
├── integration/
│   ├── api/
│   │   ├── galleries.test.ts
│   │   └── images.test.ts
│   └── auth/
│       └── nextauth.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── gallery-flow.spec.ts
    └── payment-flow.spec.ts
```

