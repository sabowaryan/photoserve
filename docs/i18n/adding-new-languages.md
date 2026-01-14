# Adding New Languages

This guide explains how to add support for a new language in PikSend.

## Overview

PikSend's i18n system supports adding new languages through a structured process:
1. Update type definitions
2. Create locale configuration
3. Create translation file
4. Import and register the dictionary
5. Test the implementation

## Step-by-Step Process

### Step 1: Update Type Definitions

Edit `src/lib/i18n/types.ts` to add the new locale code to the `SupportedLocale` type:

```typescript
export type SupportedLocale = 
  | 'en' | 'fr'  // Existing
  | 'sv' | 'no' | 'da' | 'fi'  // Northern European
  | 'ja' | 'ko' | 'zh-CN' | 'zh-TW'  // Asian
  | 'ar'  // Arabic
  | 'pt-BR';  // NEW: Brazilian Portuguese
```

### Step 2: Add Locale Configuration

Add a new entry to the `SUPPORTED_LOCALES` array in `src/lib/i18n/types.ts`:

```typescript
export const SUPPORTED_LOCALES: LocaleConfig[] = [
  // ... existing locales ...
  
  // NEW: Brazilian Portuguese
  { 
    code: 'pt-BR', 
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    flag: '🇧🇷',
    flagSvg: 'https://flagcdn.com/w20/br.png',
    direction: 'ltr',  // or 'rtl' for right-to-left languages
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { decimal: ',', thousands: '.' }
  },
];
```

#### Configuration Fields

| Field | Description | Example |
|-------|-------------|---------|
| `code` | ISO language code | `'pt-BR'`, `'de'`, `'es'` |
| `name` | English name | `'Portuguese (Brazil)'` |
| `nativeName` | Name in native language | `'Português (Brasil)'` |
| `flag` | Emoji flag | `'🇧🇷'` |
| `flagSvg` | Flag image URL | `'https://flagcdn.com/w20/br.png'` |
| `direction` | Text direction | `'ltr'` or `'rtl'` |
| `dateFormat` | Date format pattern | `'DD/MM/YYYY'` |
| `numberFormat` | Number formatting | `{ decimal: ',', thousands: '.' }` |

### Step 3: Update I18N_CONFIG

Add the new locale code to the `supportedLocales` array in `src/lib/i18n/types.ts`:

```typescript
export const I18N_CONFIG: I18nConfig = {
  defaultLocale: DEFAULT_LOCALE,
  supportedLocales: [
    'en', 'fr', 'sv', 'no', 'da', 'fi', 
    'ja', 'ko', 'zh-CN', 'zh-TW', 'ar',
    'pt-BR'  // NEW
  ],
  fallbackLocale: FALLBACK_LOCALE,
};
```

### Step 4: Create Translation File

Create a new JSON file in `src/locales/` with the locale code as the filename:

```bash
# Copy the English file as a template
cp src/locales/en.json src/locales/pt-BR.json
```

The file structure must match `en.json` exactly. Replace English text with translations:

```json
{
  "common": {
    "loading": "Carregando...",
    "error": "Ocorreu um erro",
    "success": "Sucesso",
    "cancel": "Cancelar",
    "confirm": "Confirmar"
  }
}
```

### Step 5: Import and Register Dictionary

Edit `src/lib/i18n/context.tsx` to import and register the new locale:

```typescript
// Add import
import ptBR from '@/locales/pt-BR.json';

// Add to dictionaries record
const dictionaries: Record<SupportedLocale, TranslationDictionary> = {
  en: en as TranslationDictionary,
  fr: fr as TranslationDictionary,
  // ... other locales ...
  'pt-BR': ptBR as TranslationDictionary,  // NEW
};
```

### Step 6: Test the Implementation

1. **Build the project** to check for TypeScript errors:
   ```bash
   npm run build
   ```

2. **Test language switching** in the browser:
   - Open the language switcher
   - Select the new language
   - Verify UI updates correctly

3. **Check localStorage persistence**:
   - Select the new language
   - Refresh the page
   - Verify the language persists

4. **Test fallback behavior**:
   - Remove a key from the new locale file
   - Verify it falls back to English

## Required Configuration Changes Summary

| File | Change |
|------|--------|
| `src/lib/i18n/types.ts` | Add to `SupportedLocale` type |
| `src/lib/i18n/types.ts` | Add to `SUPPORTED_LOCALES` array |
| `src/lib/i18n/types.ts` | Add to `I18N_CONFIG.supportedLocales` |
| `src/locales/{code}.json` | Create translation file |
| `src/lib/i18n/context.tsx` | Import and register dictionary |

## Translation Workflow

### Initial Setup

1. **Copy English file** as the base template
2. **Mark untranslated keys** with `[key.name]` placeholder
3. **Prioritize high-visibility content** (navigation, common buttons)

### Translation Process

1. **Use professional translators** or native speakers
2. **Maintain context** - provide screenshots or descriptions
3. **Review for cultural appropriateness**
4. **Test in context** - translations may need adjustment for UI fit

### Quality Checklist

- [ ] All keys from `en.json` are present
- [ ] No English text remains (except proper nouns)
- [ ] Variable placeholders (`{{name}}`) are preserved
- [ ] Text fits UI elements (not too long)
- [ ] Cultural references are appropriate
- [ ] Date/number formats match locale conventions

## Adding RTL Languages

For right-to-left languages (Arabic, Hebrew, Persian, etc.):

1. Set `direction: 'rtl'` in the locale configuration
2. The RTL CSS rules in `globals.css` will automatically apply
3. Test all layouts thoroughly - see [RTL Considerations](./rtl-considerations.md)

## Common Issues

### TypeScript Errors

If you see type errors after adding a locale:
- Ensure the locale code is added to `SupportedLocale` type
- Ensure the dictionary is properly typed in `context.tsx`

### Missing Translations

If translations don't appear:
- Check the import path in `context.tsx`
- Verify the JSON file is valid (no syntax errors)
- Check browser console for warnings

### Language Not in Switcher

If the language doesn't appear in the language switcher:
- Verify it's added to `SUPPORTED_LOCALES` array
- Check that the language switcher component reads from this array

## Related Documentation

- [Translation Key Conventions](./translation-key-conventions.md)
- [RTL Considerations](./rtl-considerations.md)
- [Translation Contribution Guide](./translation-contribution-guide.md)
