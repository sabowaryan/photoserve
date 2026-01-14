# I18n Migration Plan

## Executive Summary

The i18n audit identified **492 hardcoded strings** across **106 files** in the codebase. This document categorizes these findings and provides a structured migration plan for replacing them with translation keys.

## Audit Results Summary

| Category | Count | Priority |
|----------|-------|----------|
| JSX Text Content | ~300 | High |
| Attribute Strings | ~100 | High |
| String Literals (API/Services) | ~92 | Medium |

## Categorized Findings

### 1. High Priority - User-Facing UI Components

These are visible to end users and should be migrated first.

#### 1.1 Authentication & Auth Flow
- `src/app/(auth)/auth/page.tsx` - Login/signup forms
- `src/app/(auth)/forgot-password/page.tsx` - Password reset
- `src/app/(auth)/reset-password/page.tsx` - Password reset confirmation
- `src/components/forms/forgot-password-form.tsx`
- `src/components/forms/reset-password-form.tsx`

**Key strings to migrate:**
- "Email invalide"
- "Les mots de passe ne correspondent pas"
- "Email envoyé à :"
- "Envoyer le lien"
- "Mot de passe réinitialisé avec succès"

#### 1.2 Dashboard Components
- `src/app/(dashboard)/dashboard/dashboard-client.tsx`
- `src/app/(dashboard)/dashboard/gallery-actions.tsx`
- `src/app/(dashboard)/dashboard/sign-out-button.tsx`
- `src/components/dashboard/dashboard-header.tsx`
- `src/components/dashboard/gallery-card.tsx`
- `src/components/dashboard/onboarding-guide.tsx`
- `src/components/dashboard/sidebar-section.tsx`
- `src/components/dashboard/stats-card.tsx`

**Key strings to migrate:**
- "Lien copié !"
- "Prêt à être partagé"
- "Copier le lien public"
- "Supprimer définitivement"
- "Guide de démarrage"
- "Se déconnecter"

#### 1.3 Gallery Components
- `src/components/gallery-detail/content-header.tsx`
- `src/components/gallery-detail/delete-modal.tsx`
- `src/components/gallery-detail/drag-overlay.tsx`
- `src/components/gallery-detail/gallery-hero.tsx`
- `src/components/gallery-detail/image-grid.tsx`
- `src/components/gallery-detail/quota-card.tsx`
- `src/components/gallery-detail/settings-tab.tsx`
- `src/components/gallery-detail/share-card.tsx`
- `src/components/gallery-detail/tab-switcher.tsx`
- `src/components/gallery-detail/upload-queue.tsx`

**Key strings to migrate:**
- "Quota images"
- "Plan"
- "Restantes"
- "Lien de partage"
- "Tout sélectionner"
- "Votre galerie est vide"

#### 1.4 Gallery View (Public)
- `src/app/g/[slug]/gallery-view-client.tsx`
- `src/components/gallery-view/download-modal.tsx`
- `src/components/gallery-view/expired-view.tsx`
- `src/components/gallery-view/gallery-header.tsx`
- `src/components/gallery-view/lightbox.tsx`
- `src/components/gallery-view/masonry-grid.tsx`
- `src/components/gallery-view/password-form.tsx`

**Key strings to migrate:**
- "PikSend" (brand name - keep consistent)
- "Partager"

#### 1.5 Settings Pages
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/profile-form.tsx`
- `src/app/(dashboard)/settings/settings-client.tsx`
- `src/app/(dashboard)/settings/sign-out-section.tsx`
- `src/app/(dashboard)/settings/subscription-manager.tsx`
- `src/app/(dashboard)/settings/subscription-section.tsx`

**Key strings to migrate:**
- "Profil mis à jour avec succès"
- "Erreur lors de la sauvegarde"
- "Votre nom"
- "Déconnexion"
- "Terminer votre session"

#### 1.6 Pricing Components
- `src/components/pricing/pricing-section.tsx`
- `src/components/pricing/pricing-button.tsx`

**Key strings to migrate:**
- "Testez la livraison photos HD"
- "Pour photographes actifs"
- "Pour professionnels exigeants"

### 2. Medium Priority - Admin Dashboard

#### 2.1 Admin Pages
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/analytics/page.tsx`
- `src/app/(admin)/admin/audit-logs/page.tsx`
- `src/app/(admin)/admin/galleries/page.tsx`
- `src/app/(admin)/admin/subscriptions/page.tsx`
- `src/app/(admin)/admin/users/page.tsx`

**Key strings to migrate:**
- "Total abonnés"
- "Premium"
- "Pro"
- "Actifs"
- "Total entrées"
- "Aujourd'hui"
- "Modifications"
- "galeries au total"
- "utilisateurs au total"

#### 2.2 Admin Components
- `src/components/admin/admin-header.tsx`
- `src/components/admin/admin-nav.tsx`
- `src/components/admin/analytics-chart.tsx`
- `src/components/admin/audit-log-filters.tsx`
- `src/components/admin/audit-log-table.tsx`
- `src/components/admin/gallery-actions.tsx`
- `src/components/admin/gallery-detail-card.tsx`
- `src/components/admin/gallery-table.tsx`
- `src/components/admin/recent-activity.tsx`
- `src/components/admin/stats-card.tsx`
- `src/components/admin/subscription-actions.tsx`
- `src/components/admin/subscription-table.tsx`
- `src/components/admin/top-users-table.tsx`
- `src/components/admin/user-actions.tsx`
- `src/components/admin/user-detail-card.tsx`
- `src/components/admin/user-table.tsx`

**Key strings to migrate:**
- "Se déconnecter"
- "Déconnexion..."
- "Rechercher par email ou nom..."
- "Tous les plans"
- "Email"
- "Inscription"
- "Plan actuel"
- "Stripe"
- "Nouvelles inscriptions"
- "Galeries créées"
- "Total d'activités"
- "galeries"

### 3. Medium Priority - Error Pages & Messages

#### 3.1 Error Pages
- `src/app/(errors)/401/page.tsx`
- `src/app/(errors)/403/page.tsx`
- `src/app/(errors)/500/page.tsx`
- `src/app/(errors)/503/page.tsx`
- `src/app/(errors)/401/error-401-client.tsx`
- `src/app/(errors)/403/error-403-client.tsx`
- `src/app/(errors)/500/error-500-client.tsx`
- `src/app/(errors)/503/error-503-client.tsx`
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `src/app/not-found.tsx`

**Key strings to migrate:**
- "Non authentifié - 401 | PikSend"
- "Accès refusé - 403 | PikSend"
- "Erreur serveur - 500 | PikSend"
- "Service indisponible - 503 | PikSend"
- "Raisons possibles :"
- "Service temporairement indisponible"
- "Actualisation automatique"
- "Suggestions :"

#### 3.2 Error Display Component
- `src/components/shared/error-display.tsx`

### 4. Lower Priority - API & Services

#### 4.1 API Routes
- `src/app/api/admin/audit-logs/route.ts`
- `src/app/api/admin/galleries/[id]/deactivate/route.ts`
- `src/app/api/admin/session/route.ts`
- `src/app/api/admin/subscriptions/[userId]/route.ts`
- `src/app/api/admin/users/[id]/reactivate/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/users/[id]/suspend/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/api/galleries/[id]/view/route.ts`
- `src/app/api/guest/migrate/route.ts`
- `src/app/api/profile/route.ts`
- `src/app/api/verify-password/route.ts`

**Key strings to migrate:**
- "Galerie non trouvée"
- "Galerie non accessible"
- "Erreur lors de la mise à jour"
- "Erreur serveur"
- "Invalid action type"
- "Invalid entity type"
- "Unauthorized"
- "Internal server error"
- "Subscription upgraded"
- "Subscription cancelled"
- "Validation failed"
- "User reactivated"
- "User suspended"
- "User plan updated"
- "Gallery deactivated"

#### 4.2 Services
- `src/lib/services/gallery.service.ts`
- `src/lib/api/error-handler.ts`
- `src/lib/middleware/admin-auth.ts`

**Key strings to migrate:**
- "Galerie non trouvée"
- "Cette galerie n'est plus active"
- "Cette galerie a expiré"
- "Mot de passe incorrect"
- "Validation failed"
- "An unexpected error occurred"
- "Authentication required"
- "Admin access required"

### 5. Shared Components & Layouts

#### 5.1 Layout Components
- `src/components/layouts/footer.tsx`
- `src/components/layouts/landing-header.tsx`
- `src/components/layouts/mobile-nav.tsx`

**Key strings to migrate:**
- "PikSend" (brand name)
- "ID Nat"

#### 5.2 Shared Components
- `src/components/shared/language-switcher.tsx`
- `src/components/shared/logo.tsx`
- `src/components/shared/upgrade-modal.tsx`

**Key strings to migrate:**
- "Select language"
- "PikSend Logo"

### 6. Guest Upload Components
- `src/components/guest/guest-upload-form.tsx`
- `src/components/guest/pricing-modal.tsx`
- `src/components/guest/unlock-success-modal.tsx`
- `src/app/(public)/my-galleries/my-galleries-client.tsx`
- `src/app/(public)/my-galleries/page.tsx`

**Key strings to migrate:**
- "Mes galeries | PikSend"
- "Retrouvez vos galeries créées en tant qu'invité"

## Migration Strategy

### Phase 1: Add Missing Translation Keys (Task 10.1)

Add all identified strings to `en.json` and `fr.json` with proper categorization:

```json
{
  "common": {
    "loading": "...",
    "close": "Close",
    "selectLanguage": "Select language",
    "linkCopied": "Link copied!",
    "readyToShare": "Ready to share",
    "copyPublicLink": "Copy public link",
    "deleteDefinitely": "Delete permanently",
    "signOut": "Sign out",
    "signingOut": "Signing out...",
    "selectAll": "Select all",
    "share": "Share"
  },
  "auth": {
    "invalidEmail": "Invalid email",
    "passwordsDoNotMatch": "Passwords do not match",
    "emailSentTo": "Email sent to:",
    "sendLink": "Send link",
    "passwordResetSuccess": "Password reset successfully"
  },
  "gallery": {
    "notFound": "Gallery not found",
    "notAccessible": "Gallery not accessible",
    "expired": "This gallery has expired",
    "noLongerActive": "This gallery is no longer active",
    "incorrectPassword": "Incorrect password",
    "imageQuota": "Image quota",
    "remaining": "Remaining",
    "shareLink": "Share link",
    "emptyGallery": "Your gallery is empty"
  },
  "pricing": {
    "plan": "Plan",
    "premium": "Premium",
    "pro": "Pro",
    "allPlans": "All plans",
    "currentPlan": "Current plan",
    "testHdDelivery": "Test HD photo delivery",
    "forActivePhotographers": "For active photographers",
    "forDemandingProfessionals": "For demanding professionals"
  },
  "admin": {
    "totalSubscribers": "Total subscribers",
    "active": "Active",
    "totalEntries": "Total entries",
    "today": "Today",
    "modifications": "Modifications",
    "totalGalleries": "total galleries",
    "totalUsers": "total users",
    "searchByEmailOrName": "Search by email or name...",
    "newRegistrations": "New registrations",
    "galleriesCreated": "Galleries created",
    "totalActivities": "Total activities",
    "galleries": "galleries",
    "userReactivated": "User reactivated",
    "userSuspended": "User suspended",
    "galleryDeactivated": "Gallery deactivated"
  },
  "settings": {
    "profileUpdated": "Profile updated successfully",
    "saveError": "Error saving",
    "yourName": "Your name",
    "signOut": "Sign out",
    "endSession": "End your session"
  },
  "errors": {
    "invalidEmail": "Invalid email",
    "validationFailed": "Validation failed",
    "invalidData": "Invalid data",
    "failedToUpdateProfile": "Failed to update profile",
    "failedToFetchProfile": "Failed to fetch profile",
    "invalidActionType": "Invalid action type",
    "invalidEntityType": "Invalid entity type",
    "unauthorized": "Unauthorized",
    "internalServerError": "Internal server error",
    "authenticationRequired": "Authentication required",
    "adminAccessRequired": "Admin access required",
    "unexpectedError": "An unexpected error occurred",
    "updateError": "Error during update",
    "serverError": "Server error",
    "tooManyAttempts": "Too many attempts. Please try again later."
  },
  "seo": {
    "error401Title": "Not authenticated - 401 | PikSend",
    "error401Description": "Please sign in to access this page.",
    "error403Title": "Access denied - 403 | PikSend",
    "error403Description": "You don't have permission to access this resource.",
    "error500Title": "Server error - 500 | PikSend",
    "error500Description": "An internal server error occurred. Please try again later.",
    "error503Title": "Service unavailable - 503 | PikSend",
    "error503Description": "The service is temporarily unavailable for maintenance.",
    "myGalleriesTitle": "My galleries | PikSend",
    "myGalleriesDescription": "Find your galleries created as a guest"
  },
  "onboarding": {
    "gettingStartedGuide": "Getting started guide",
    "close": "Close"
  }
}
```

### Phase 2: Replace Hardcoded Strings in Components (Task 10.2)

For each component file:
1. Import `useTranslation` hook
2. Get `t` function from hook
3. Replace hardcoded strings with `t('key')` calls
4. For attributes, use `t('key')` directly

Example transformation:
```tsx
// Before
<span>Lien copié !</span>

// After
const { t } = useTranslation();
<span>{t('common.linkCopied')}</span>
```

### Phase 3: Replace Hardcoded Strings in Pages (Task 10.3)

Similar to components, but also update:
- Page metadata (title, description)
- SEO content

### Phase 4: Replace Hardcoded Strings in API Responses (Task 10.4)

For API routes:
1. Import translation utilities
2. Replace error messages with translation keys
3. Consider locale from request headers for API responses

## Files to Modify (Prioritized List)

### Batch 1 - Core UI (High Impact)
1. `src/components/dashboard/onboarding-guide.tsx`
2. `src/app/(dashboard)/dashboard/gallery-actions.tsx`
3. `src/components/gallery-detail/quota-card.tsx`
4. `src/components/gallery-detail/share-card.tsx`
5. `src/components/gallery-detail/image-grid.tsx`
6. `src/components/gallery-detail/content-header.tsx`

### Batch 2 - Auth & Settings
1. `src/app/(auth)/forgot-password/page.tsx`
2. `src/app/(auth)/reset-password/page.tsx`
3. `src/app/(dashboard)/settings/profile-form.tsx`
4. `src/app/(dashboard)/settings/sign-out-section.tsx`

### Batch 3 - Admin Dashboard
1. `src/app/(admin)/admin/subscriptions/page.tsx`
2. `src/app/(admin)/admin/audit-logs/page.tsx`
3. `src/app/(admin)/admin/galleries/page.tsx`
4. `src/app/(admin)/admin/users/page.tsx`
5. `src/components/admin/admin-header.tsx`
6. `src/components/admin/subscription-table.tsx`
7. `src/components/admin/user-detail-card.tsx`
8. `src/components/admin/recent-activity.tsx`

### Batch 4 - Error Pages
1. `src/app/(errors)/401/page.tsx`
2. `src/app/(errors)/403/page.tsx`
3. `src/app/(errors)/500/page.tsx`
4. `src/app/(errors)/503/page.tsx`
5. `src/app/error.tsx`
6. `src/app/global-error.tsx`
7. `src/app/not-found.tsx`

### Batch 5 - API Routes
1. `src/app/api/galleries/[id]/view/route.ts`
2. `src/app/api/profile/route.ts`
3. `src/app/api/auth/forgot-password/route.ts`
4. `src/app/api/auth/reset-password/route.ts`
5. `src/app/api/auth/signup/route.ts`
6. `src/lib/services/gallery.service.ts`
7. `src/lib/api/error-handler.ts`

### Batch 6 - Shared & Layout
1. `src/components/shared/language-switcher.tsx`
2. `src/components/layouts/footer.tsx`
3. `src/components/layouts/mobile-nav.tsx`
4. `src/components/pricing/pricing-section.tsx`

## Notes

- Brand name "PikSend" should remain consistent across all languages
- Some strings like "Premium" and "Pro" are plan names and may not need translation
- API error messages should be localized based on Accept-Language header
- Consider creating a separate `errors.json` for error messages if the list grows large
- The audit tool can be re-run periodically to catch new hardcoded strings

## Next Steps

1. Review this migration plan with the team
2. Begin with Task 10.1 - Add missing translation keys
3. Proceed with Task 10.2-10.4 - Replace hardcoded strings
4. Run audit tool again to verify all strings are migrated
5. Test all languages to ensure translations display correctly
