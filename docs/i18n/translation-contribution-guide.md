# Translation Contribution Guide

This guide explains how to contribute translations to PikSend, including adding new keys, improving existing translations, and the review process.

## Overview

PikSend supports 11 languages:
- **English (en)** - Primary language
- **French (fr)** - Secondary language
- **Northern European:** Swedish (sv), Norwegian (no), Danish (da), Finnish (fi)
- **Asian:** Japanese (ja), Korean (ko), Simplified Chinese (zh-CN), Traditional Chinese (zh-TW)
- **Arabic (ar)** - RTL language

## How to Add New Translation Keys

### Step 1: Identify the Need

Before adding a new key:
1. Check if a similar key already exists
2. Determine the appropriate section for the key
3. Follow the [naming conventions](./translation-key-conventions.md)

### Step 2: Add to English First

Always start with `src/locales/en.json`:

```json
{
  "section": {
    "newKey": "English text here"
  }
}
```

### Step 3: Add to All Other Locales

Add the same key to ALL locale files. For untranslated content, use the key as a placeholder:

```json
// src/locales/fr.json
{
  "section": {
    "newKey": "[section.newKey]"  // Placeholder until translated
  }
}
```

Or provide the translation if known:

```json
// src/locales/fr.json
{
  "section": {
    "newKey": "Texte français ici"
  }
}
```

### Step 4: Use in Code

```typescript
import { useTranslation } from '@/lib/i18n';

function MyComponent() {
  const { t } = useTranslation();
  
  return <p>{t('section.newKey')}</p>;
}
```

### Step 5: Verify

1. Run `npm run build` to check for errors
2. Test in the browser with different languages
3. Check console for missing key warnings

## Translation Quality Standards

### Accuracy

- Translations must accurately convey the original meaning
- Technical terms should be translated consistently
- Preserve the tone and formality level

### Context Awareness

- Consider where the text appears in the UI
- Button text should be concise
- Error messages should be helpful and clear
- Marketing copy can be more creative

### Variable Handling

Preserve all variable placeholders exactly:

```json
// ✅ Correct
"welcome": "Bienvenue, {{name}}!"

// ❌ Wrong - variable name changed
"welcome": "Bienvenue, {{nom}}!"

// ❌ Wrong - variable removed
"welcome": "Bienvenue!"
```

### Length Considerations

- Translations may be longer or shorter than English
- Test that text fits in UI elements
- Use abbreviations sparingly and consistently

### Cultural Appropriateness

- Avoid idioms that don't translate well
- Consider cultural differences in:
  - Date formats
  - Number formats
  - Color meanings
  - Imagery references

## Review Process

### For New Keys

1. **Create PR** with changes to all locale files
2. **Self-review** using the checklist below
3. **Request review** from a native speaker if possible
4. **Address feedback** and update translations
5. **Merge** after approval

### For Translation Improvements

1. **Identify the issue** (incorrect, unclear, outdated)
2. **Propose the change** with context
3. **Get native speaker review** if possible
4. **Update all affected keys** consistently

### Review Checklist

- [ ] Key follows naming conventions
- [ ] Key exists in ALL locale files
- [ ] English text is clear and correct
- [ ] Variables are preserved in all translations
- [ ] Text fits UI context (length, tone)
- [ ] No typos or grammatical errors
- [ ] Consistent with existing translations

## File Structure

```
src/locales/
├── en.json      # English (primary)
├── fr.json      # French
├── sv.json      # Swedish
├── no.json      # Norwegian
├── da.json      # Danish
├── fi.json      # Finnish
├── ja.json      # Japanese
├── ko.json      # Korean
├── zh-CN.json   # Simplified Chinese
├── zh-TW.json   # Traditional Chinese
└── ar.json      # Arabic (RTL)
```

## Common Scenarios

### Adding a New Feature

When adding a new feature with UI text:

1. Plan all needed translation keys
2. Group them under a logical section
3. Add all keys to `en.json` first
4. Add placeholders to other locales
5. Request translations from team/community

### Fixing a Typo

1. Fix in the affected locale file(s)
2. If the key name was wrong, update ALL files
3. Update any code references if key changed

### Removing Deprecated Keys

1. Search codebase for key usage
2. Remove from ALL locale files
3. Document the removal in PR

### Reorganizing Keys

1. Plan the new structure
2. Update ALL locale files consistently
3. Update ALL code references
4. Test thoroughly

## Tools and Scripts

### Audit Script

Run the i18n audit to find hardcoded strings:

```bash
npx ts-node scripts/audit-i18n.ts
```

### Key Generator

Add keys to all locales at once:

```bash
npx ts-node scripts/generate-keys.ts
```

### Validation

Check for missing keys across locales:

```typescript
// The build process will warn about missing keys
npm run build
```

## Best Practices

### DO

- ✅ Use descriptive key names
- ✅ Keep translations concise for UI elements
- ✅ Test translations in context
- ✅ Maintain consistent terminology
- ✅ Document any translation decisions
- ✅ Ask native speakers for review

### DON'T

- ❌ Use machine translation without review
- ❌ Change variable names in translations
- ❌ Add keys to only some locale files
- ❌ Use overly literal translations
- ❌ Ignore cultural context
- ❌ Skip testing in the actual UI

## Getting Help

### Questions About Keys

- Check existing keys for patterns
- Review [Translation Key Conventions](./translation-key-conventions.md)
- Ask in the team chat

### Questions About Translations

- Consult native speakers
- Use professional translation services for critical content
- Reference style guides for the target language

### Technical Issues

- Check the [Adding New Languages](./adding-new-languages.md) guide
- Review [RTL Considerations](./rtl-considerations.md) for Arabic
- Check build logs for errors

## Glossary of Common Terms

Maintain consistent translations for these common terms:

| English | Context |
|---------|---------|
| Gallery | Photo collection |
| Upload | Action to add files |
| Download | Action to save files |
| Share | Action to distribute link |
| Expire/Expiration | Time limit on galleries |
| Storage | Disk space quota |
| Plan | Subscription tier |
| Dashboard | User control panel |

Each language should have a consistent translation for these terms throughout the application.

## Related Documentation

- [Translation Key Conventions](./translation-key-conventions.md)
- [Adding New Languages](./adding-new-languages.md)
- [RTL Considerations](./rtl-considerations.md)
