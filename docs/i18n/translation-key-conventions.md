# Translation Key Conventions

This document describes the naming conventions and structure for translation keys in PikSend.

## Overview

PikSend uses a hierarchical key structure with dot notation to organize translations. All translation files are located in `src/locales/` and follow the same structure across all supported languages.

## Key Structure

### Dot Notation

Translation keys use dot notation to create a hierarchical structure:

```
section.subsection.key
```

**Examples:**
- `common.loading` → "Loading..."
- `dashboard.stats.storage` → "Storage"
- `auth.form.emailPlaceholder` → "your@email.com"
- `errors.upload.fileTooLarge` → "File too large..."

### Naming Rules

1. **Use lowercase letters only** - Keys should be in camelCase for multi-word identifiers
   - ✅ `auth.forgotPassword.title`
   - ❌ `auth.Forgot_Password.Title`

2. **Use descriptive names** - Keys should clearly indicate their purpose
   - ✅ `gallery.create.titlePlaceholder`
   - ❌ `gallery.create.tp`

3. **Group related keys** - Use consistent section prefixes
   - ✅ `pricing.plans.free.name`, `pricing.plans.premium.name`
   - ❌ `freePlanName`, `premiumPlanName`

4. **Avoid abbreviations** - Use full words for clarity
   - ✅ `settings.subscription.currentPlan`
   - ❌ `settings.sub.curPlan`

## Section Organization

### Top-Level Sections

| Section | Purpose | Example Keys |
|---------|---------|--------------|
| `common` | Shared UI elements, buttons, labels | `common.save`, `common.cancel`, `common.loading` |
| `nav` | Navigation items | `nav.home`, `nav.dashboard`, `nav.settings` |
| `landing` | Landing page content | `landing.title`, `landing.cta.primary` |
| `auth` | Authentication flows | `auth.form.email`, `auth.errors.invalidEmail` |
| `dashboard` | Dashboard UI | `dashboard.stats.storage`, `dashboard.galleriesSection.title` |
| `gallery` | Gallery-related content | `gallery.create.title`, `gallery.view.downloadAll` |
| `guest` | Guest upload flow | `guest.upload.title`, `guest.pricing.options.free.title` |
| `pricing` | Pricing page | `pricing.plans.free.name`, `pricing.faq.changePlan.question` |
| `settings` | Settings page | `settings.profile.name`, `settings.subscription.manage` |
| `admin` | Admin dashboard | `admin.users.title`, `admin.galleries.table.owner` |
| `errors` | Error messages | `errors.401.title`, `errors.upload.fileTooLarge` |
| `footer` | Footer content | `footer.copyright`, `footer.links.privacy` |

### Subsection Patterns

#### UI Components
```
section.component.element
```
Example: `auth.form.emailPlaceholder`

#### Actions
```
section.actions.actionName
```
Example: `admin.users.actions.suspend`

#### Status/State
```
section.status.stateName
```
Example: `admin.galleries.status.active`

#### Tables
```
section.table.columnName
```
Example: `admin.users.table.email`

#### Errors
```
section.errors.errorType
```
Example: `auth.errors.invalidCredentials`

## Good Key Examples

### Simple Keys
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading..."
  }
}
```

### Nested Keys
```json
{
  "dashboard": {
    "stats": {
      "currentPlan": "Current plan",
      "storage": "Storage",
      "galleries": "Galleries"
    }
  }
}
```

### Keys with Context
```json
{
  "gallery": {
    "create": {
      "title": "Create Gallery",
      "titleLabel": "Gallery Title",
      "titlePlaceholder": "My photo gallery"
    }
  }
}
```

### Error Messages
```json
{
  "errors": {
    "upload": {
      "fileTooLarge": "File too large. Maximum {{size}}MB per image.",
      "invalidFileType": "Invalid file type. Please upload JPG, PNG, or WebP images."
    }
  }
}
```

## Variable Interpolation

Use double curly braces for dynamic values:

```json
{
  "gallery": {
    "create": {
      "maxFiles": "Maximum {{count}} photos",
      "maxSize": "Maximum {{size}}MB per image"
    }
  }
}
```

**Usage in code:**
```typescript
t('gallery.create.maxFiles', { count: 50 })
// Output: "Maximum 50 photos"
```

### Variable Naming
- Use descriptive variable names: `{{count}}`, `{{name}}`, `{{size}}`
- Avoid generic names: `{{x}}`, `{{val}}`
- Use camelCase for multi-word variables: `{{userName}}`, `{{fileSize}}`

## Anti-Patterns to Avoid

### ❌ Flat Structure
```json
{
  "dashboardStatsStorage": "Storage",
  "dashboardStatsGalleries": "Galleries"
}
```

### ❌ Inconsistent Naming
```json
{
  "auth": {
    "SignIn": "Sign In",
    "sign_up": "Sign Up",
    "forgotpassword": "Forgot Password"
  }
}
```

### ❌ Hardcoded Values in Keys
```json
{
  "error404": "Page not found",
  "error500": "Server error"
}
```
Use instead:
```json
{
  "errors": {
    "404": { "title": "Page not found" },
    "500": { "title": "Server error" }
  }
}
```

### ❌ Overly Deep Nesting
```json
{
  "pages": {
    "dashboard": {
      "sections": {
        "stats": {
          "cards": {
            "storage": {
              "label": "Storage"
            }
          }
        }
      }
    }
  }
}
```
Keep nesting to 3-4 levels maximum.

## File Organization

### Alphabetical Ordering

Keys within each section should be ordered alphabetically:

```json
{
  "common": {
    "actions": "Actions",
    "cancel": "Cancel",
    "close": "Close",
    "confirm": "Confirm",
    "delete": "Delete"
  }
}
```

### Consistent Structure

All locale files must have the same structure. When adding a new key:

1. Add it to `en.json` first
2. Add the same key to ALL other locale files
3. Use the English text as a placeholder if translation is pending: `"[key.name]"`

## Related Documentation

- [Adding New Languages](./adding-new-languages.md)
- [RTL Considerations](./rtl-considerations.md)
- [Translation Contribution Guide](./translation-contribution-guide.md)
