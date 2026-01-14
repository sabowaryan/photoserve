# PikSend Internationalization (i18n) Documentation

This documentation covers the internationalization system in PikSend, including translation management, adding new languages, and RTL support.

## Supported Languages

PikSend currently supports 11 languages:

| Language | Code | Direction | Status |
|----------|------|-----------|--------|
| English | `en` | LTR | Primary |
| French | `fr` | LTR | Complete |
| Swedish | `sv` | LTR | Complete |
| Norwegian | `no` | LTR | Complete |
| Danish | `da` | LTR | Complete |
| Finnish | `fi` | LTR | Complete |
| Japanese | `ja` | LTR | Complete |
| Korean | `ko` | LTR | Complete |
| Chinese (Simplified) | `zh-CN` | LTR | Complete |
| Chinese (Traditional) | `zh-TW` | LTR | Complete |
| Arabic | `ar` | RTL | Complete |

## Documentation

### [Translation Key Conventions](./translation-key-conventions.md)
Learn about the naming conventions and structure for translation keys, including:
- Dot notation structure
- Section organization
- Good and bad examples
- Variable interpolation

### [Adding New Languages](./adding-new-languages.md)
Step-by-step guide for adding support for a new language:
- Type definition updates
- Locale configuration
- Translation file creation
- Testing procedures

### [RTL Considerations](./rtl-considerations.md)
Guidelines for right-to-left language support:
- CSS patterns for RTL
- Layout best practices
- Testing RTL layouts
- Common issues and solutions

### [Translation Contribution Guide](./translation-contribution-guide.md)
How to contribute translations:
- Adding new keys
- Translation quality standards
- Review process
- Best practices

## Quick Start

### Using Translations in Components

```typescript
import { useTranslation } from '@/lib/i18n';

function MyComponent() {
  const { t, locale, setLocale, isRTL } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('dashboard.stats.storage')}</p>
      <p>{t('gallery.create.maxFiles', { count: 50 })}</p>
    </div>
  );
}
```

### Formatting Dates and Numbers

```typescript
const { formatDate, formatNumber } = useTranslation();

// Formats according to current locale
formatDate(new Date());  // "1/13/2026" (en) or "13/01/2026" (fr)
formatNumber(1234.56);   // "1,234.56" (en) or "1 234,56" (fr)
```

### Checking RTL Status

```typescript
const { isRTL, direction } = useTranslation();

// isRTL: true for Arabic, false for others
// direction: 'rtl' or 'ltr'
```

## File Structure

```
src/
├── lib/i18n/
│   ├── context.tsx    # I18nProvider and useTranslation hook
│   ├── detector.ts    # Language detection
│   ├── rtl.ts         # RTL layout manager
│   ├── types.ts       # Type definitions and config
│   └── index.ts       # Public exports
└── locales/
    ├── en.json        # English (primary)
    ├── fr.json        # French
    ├── sv.json        # Swedish
    ├── no.json        # Norwegian
    ├── da.json        # Danish
    ├── fi.json        # Finnish
    ├── ja.json        # Japanese
    ├── ko.json        # Korean
    ├── zh-CN.json     # Simplified Chinese
    ├── zh-TW.json     # Traditional Chinese
    └── ar.json        # Arabic
```

## Key Concepts

### Fallback Behavior
When a translation is missing in the current locale, the system falls back to English (`en`).

### Language Detection
On first visit, the system detects the user's browser language. If supported, it's used automatically. Otherwise, English is the default.

### Persistence
Language preference is stored in `localStorage` under the key `piksend_locale` and persists across sessions.

### RTL Support
Arabic (`ar`) is the only RTL language. When selected, the entire UI mirrors horizontally via CSS rules triggered by `dir="rtl"` on the document element.
