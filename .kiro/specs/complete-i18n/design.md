# Design Document: Complete Internationalization

## Overview

This design extends the existing i18n system to support 9 additional languages (Swedish, Norwegian, Danish, Finnish, Japanese, Korean, Simplified Chinese, Traditional Chinese, and Arabic), adds RTL support for Arabic, and ensures all hardcoded strings throughout the application are replaced with translation keys. The system will maintain the current architecture while adding new locale files, RTL layout handling, and comprehensive translation coverage.

## Architecture

### Current System

The application currently uses a React Context-based i18n system with:
- `I18nProvider` - Context provider that manages locale state
- `useTranslation()` hook - Provides `t()` function and locale management
- Translation files in `src/locales/` (en.json, fr.json)
- Language detector with localStorage persistence
- Dot notation for nested keys (e.g., "dashboard.stats.storage")

### Extended System

The extended system will add:
- 9 new locale files (sv.json, no.json, da.json, fi.json, ja.json, ko.json, zh-CN.json, zh-TW.json, ar.json)
- RTL layout detection and CSS direction management
- Comprehensive audit tool to find hardcoded strings
- Translation key generator for new strings
- Locale-aware date and number formatting
- SEO metadata localization

## Components and Interfaces

### 1. Extended Type Definitions

**File:** `src/lib/i18n/types.ts`

```typescript
// Extended locale support
export type SupportedLocale = 
  | 'en' | 'fr'  // Existing
  | 'sv' | 'no' | 'da' | 'fi'  // Northern European
  | 'ja' | 'ko' | 'zh-CN' | 'zh-TW'  // Asian
  | 'ar';  // Arabic

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;  // Name in native language
  flag: string;
  flagSvg: string;
  direction: 'ltr' | 'rtl';  // Text direction
  dateFormat: string;  // Locale-specific date format
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  // Existing
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', flagSvg: 'https://flagcdn.com/w20/gb.png', direction: 'ltr', dateFormat: 'MM/DD/YYYY', numberFormat: { decimal: '.', thousands: ',' } },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', flagSvg: 'https://flagcdn.com/w20/fr.png', direction: 'ltr', dateFormat: 'DD/MM/YYYY', numberFormat: { decimal: ',', thousands: ' ' } },
  
  // Northern European
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', flagSvg: 'https://flagcdn.com/w20/se.png', direction: 'ltr', dateFormat: 'YYYY-MM-DD', numberFormat: { decimal: ',', thousands: ' ' } },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', flagSvg: 'https://flagcdn.com/w20/no.png', direction: 'ltr', dateFormat: 'DD.MM.YYYY', numberFormat: { decimal: ',', thousands: ' ' } },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', flagSvg: 'https://flagcdn.com/w20/dk.png', direction: 'ltr', dateFormat: 'DD-MM-YYYY', numberFormat: { decimal: ',', thousands: '.' } },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', flagSvg: 'https://flagcdn.com/w20/fi.png', direction: 'ltr', dateFormat: 'D.M.YYYY', numberFormat: { decimal: ',', thousands: ' ' } },
  
  // Asian
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', flagSvg: 'https://flagcdn.com/w20/jp.png', direction: 'ltr', dateFormat: 'YYYY年MM月DD日', numberFormat: { decimal: '.', thousands: ',' } },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', flagSvg: 'https://flagcdn.com/w20/kr.png', direction: 'ltr', dateFormat: 'YYYY. MM. DD.', numberFormat: { decimal: '.', thousands: ',' } },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', flagSvg: 'https://flagcdn.com/w20/cn.png', direction: 'ltr', dateFormat: 'YYYY年MM月DD日', numberFormat: { decimal: '.', thousands: ',' } },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼', flagSvg: 'https://flagcdn.com/w20/tw.png', direction: 'ltr', dateFormat: 'YYYY年MM月DD日', numberFormat: { decimal: '.', thousands: ',' } },
  
  // Arabic
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', flagSvg: 'https://flagcdn.com/w20/sa.png', direction: 'rtl', dateFormat: 'DD/MM/YYYY', numberFormat: { decimal: '٫', thousands: '٬' } },
];

export interface RTLConfig {
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
}
```

### 2. RTL Layout Manager

**File:** `src/lib/i18n/rtl.ts`

```typescript
import { SupportedLocale, SUPPORTED_LOCALES } from './types';

export class RTLManager {
  /**
   * Check if a locale uses RTL direction
   */
  static isRTL(locale: SupportedLocale): boolean {
    const config = SUPPORTED_LOCALES.find(l => l.code === locale);
    return config?.direction === 'rtl';
  }

  /**
   * Get text direction for a locale
   */
  static getDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
    return this.isRTL(locale) ? 'rtl' : 'ltr';
  }

  /**
   * Apply RTL direction to document
   */
  static applyDirection(locale: SupportedLocale): void {
    if (typeof document === 'undefined') return;
    
    const direction = this.getDirection(locale);
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
  }

  /**
   * Get CSS class for RTL support
   */
  static getDirectionClass(locale: SupportedLocale): string {
    return this.isRTL(locale) ? 'rtl' : 'ltr';
  }
}
```

### 3. Enhanced I18n Context

**File:** `src/lib/i18n/context.tsx` (modifications)

```typescript
// Add RTL support to context
export interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  formatDate: (date: Date, format?: string) => string;
  formatNumber: (num: number) => string;
}

// Import all new dictionaries
import sv from '@/locales/sv.json';
import no from '@/locales/no.json';
import da from '@/locales/da.json';
import fi from '@/locales/fi.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import zhCN from '@/locales/zh-CN.json';
import zhTW from '@/locales/zh-TW.json';
import ar from '@/locales/ar.json';

const dictionaries: Record<SupportedLocale, TranslationDictionary> = {
  en, fr, sv, no, da, fi, ja, ko,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ar,
};

// Add RTL management to provider
export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  // ... existing code ...
  
  // Apply RTL direction when locale changes
  useEffect(() => {
    RTLManager.applyDirection(locale);
  }, [locale]);

  // Add RTL properties to context
  const isRTL = RTLManager.isRTL(locale);
  const direction = RTLManager.getDirection(locale);

  // Date formatting function
  const formatDate = useCallback((date: Date, format?: string): string => {
    const config = SUPPORTED_LOCALES.find(l => l.code === locale);
    const dateFormat = format || config?.dateFormat || 'MM/DD/YYYY';
    // Use date-fns or Intl.DateTimeFormat for formatting
    return new Intl.DateTimeFormat(locale).format(date);
  }, [locale]);

  // Number formatting function
  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat(locale).format(num);
  }, [locale]);

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      isRTL,
      direction,
      formatDate,
      formatNumber,
    }),
    [locale, setLocale, t, isRTL, direction, formatDate, formatNumber]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}
```

### 4. Hardcoded String Audit Tool

**File:** `scripts/audit-i18n.ts`

```typescript
/**
 * Audit tool to find hardcoded strings in the codebase
 * Scans .tsx, .ts, .jsx, .js files for potential hardcoded text
 */

import * as fs from 'fs';
import * as path from 'path';

interface AuditResult {
  file: string;
  line: number;
  content: string;
  suggestion: string;
}

export class I18nAuditor {
  private results: AuditResult[] = [];
  private excludePatterns = [
    /node_modules/,
    /\.next/,
    /\.git/,
    /\.test\./,
    /\.spec\./,
  ];

  /**
   * Scan directory for hardcoded strings
   */
  async scanDirectory(dir: string): Promise<AuditResult[]> {
    const files = this.getFiles(dir);
    
    for (const file of files) {
      await this.scanFile(file);
    }
    
    return this.results;
  }

  /**
   * Get all relevant files recursively
   */
  private getFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      if (this.shouldExclude(fullPath)) continue;

      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFiles(fullPath));
      } else if (this.isRelevantFile(fullPath)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(filePath: string): boolean {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Check if file is relevant for scanning
   */
  private isRelevantFile(filePath: string): boolean {
    return /\.(tsx?|jsx?)$/.test(filePath);
  }

  /**
   * Scan a single file for hardcoded strings
   */
  private async scanFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for JSX text content
      const jsxTextMatches = line.matchAll(/>([^<>{}\n]+)</g);
      for (const match of jsxTextMatches) {
        const text = match[1].trim();
        if (this.isHardcodedString(text)) {
          this.results.push({
            file: filePath,
            line: i + 1,
            content: text,
            suggestion: this.generateKey(text),
          });
        }
      }

      // Look for string literals in attributes
      const attrMatches = line.matchAll(/(?:placeholder|title|alt|aria-label)=["']([^"']+)["']/g);
      for (const match of attrMatches) {
        const text = match[1];
        if (this.isHardcodedString(text)) {
          this.results.push({
            file: filePath,
            line: i + 1,
            content: text,
            suggestion: this.generateKey(text),
          });
        }
      }
    }
  }

  /**
   * Check if text is a hardcoded string that should be translated
   */
  private isHardcodedString(text: string): boolean {
    // Ignore if empty or only whitespace
    if (!text || !text.trim()) return false;
    
    // Ignore if it's a variable or expression
    if (text.includes('{') || text.includes('$')) return false;
    
    // Ignore if it's a number or date
    if (/^\d+$/.test(text)) return false;
    
    // Ignore common technical strings
    const technicalPatterns = [
      /^[A-Z_]+$/,  // Constants
      /^\w+\.\w+/,  // Already using dot notation
      /^t\(/,  // Already using translation
    ];
    
    if (technicalPatterns.some(p => p.test(text))) return false;
    
    // If it contains letters, it's likely translatable
    return /[a-zA-Z]/.test(text);
  }

  /**
   * Generate a suggested translation key
   */
  private generateKey(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join('_');
  }

  /**
   * Generate report
   */
  generateReport(): string {
    const grouped = this.groupByFile();
    let report = `# I18n Audit Report\n\n`;
    report += `Found ${this.results.length} potential hardcoded strings\n\n`;

    for (const [file, results] of Object.entries(grouped)) {
      report += `## ${file}\n\n`;
      for (const result of results) {
        report += `- Line ${result.line}: "${result.content}"\n`;
        report += `  Suggested key: \`${result.suggestion}\`\n\n`;
      }
    }

    return report;
  }

  private groupByFile(): Record<string, AuditResult[]> {
    return this.results.reduce((acc, result) => {
      if (!acc[result.file]) {
        acc[result.file] = [];
      }
      acc[result.file].push(result);
      return acc;
    }, {} as Record<string, AuditResult[]>);
  }
}
```

### 5. Translation Key Generator

**File:** `scripts/generate-keys.ts`

```typescript
/**
 * Generate translation keys for new strings
 * Ensures consistency across all locale files
 */

import * as fs from 'fs';
import * as path from 'path';

export class TranslationKeyGenerator {
  private localesDir = path.join(process.cwd(), 'src/locales');

  /**
   * Add a new translation key to all locale files
   */
  async addKey(key: string, translations: Record<string, string>): Promise<void> {
    const localeFiles = fs.readdirSync(this.localesDir)
      .filter(f => f.endsWith('.json'));

    for (const file of localeFiles) {
      const locale = file.replace('.json', '');
      const filePath = path.join(this.localesDir, file);
      
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // Set nested key
      this.setNestedKey(content, key, translations[locale] || `[${key}]`);
      
      // Write back with formatting
      fs.writeFileSync(
        filePath,
        JSON.stringify(content, null, 2) + '\n',
        'utf-8'
      );
    }
  }

  /**
   * Set a nested key in an object using dot notation
   */
  private setNestedKey(obj: any, path: string, value: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (const key of keys) {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  /**
   * Validate that all locale files have the same structure
   */
  async validateStructure(): Promise<boolean> {
    const localeFiles = fs.readdirSync(this.localesDir)
      .filter(f => f.endsWith('.json'));

    const structures = localeFiles.map(file => {
      const content = JSON.parse(
        fs.readFileSync(path.join(this.localesDir, file), 'utf-8')
      );
      return this.getKeys(content);
    });

    // Check if all structures are identical
    const referenceKeys = structures[0].sort();
    
    for (let i = 1; i < structures.length; i++) {
      const keys = structures[i].sort();
      if (JSON.stringify(keys) !== JSON.stringify(referenceKeys)) {
        console.error(`Structure mismatch in ${localeFiles[i]}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get all keys from a nested object
   */
  private getKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...this.getKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }
}
```

## Data Models

### Translation File Structure

All locale files follow this structure:

```json
{
  "common": {
    "loading": "...",
    "error": "...",
    ...
  },
  "nav": { ... },
  "landing": { ... },
  "auth": { ... },
  "dashboard": { ... },
  "gallery": { ... },
  "guest": { ... },
  "pricing": { ... },
  "settings": { ... },
  "admin": { ... },
  "errors": { ... },
  "footer": { ... },
  "onboarding": { ... },
  "myGalleries": { ... }
}
```

### New Translation Keys

Based on the audit, the following sections need additional keys:

```json
{
  "seo": {
    "home": {
      "title": "...",
      "description": "..."
    },
    "dashboard": {
      "title": "...",
      "description": "..."
    }
  },
  "validation": {
    "required": "...",
    "email": "...",
    "minLength": "...",
    "maxLength": "...",
    "pattern": "..."
  },
  "toast": {
    "success": "...",
    "error": "...",
    "info": "...",
    "warning": "..."
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:

**Redundant Properties:**
1. Properties 1.5, 3.5, 3.6, 6.4, 10.1, 10.2, 10.4 are redundant - they're all covered by the general translation and structure validation properties
2. Properties 7.5, 9.2, 9.3, 9.4 are redundant - covered by general translation and interpolation properties
3. Property 10.3 is redundant - covered by date and number formatting properties
4. Property 4.5 is a combination of existing properties (fallback + RTL)

**Consolidated Properties:**
- All locale support examples (2.1-2.4, 3.1-3.4, 4.1) can be combined into one property about supported locales
- All UI translation properties can be unified into one general property
- Structure validation properties can be unified

**Unique Properties to Implement:**
1. Audit tool finds hardcoded strings
2. Translation keys follow naming convention
3. All locale files have identical structure
4. Supported locales are recognized
5. Translation function returns correct locale text
6. Fallback to English when translation missing
7. RTL direction applied for Arabic
8. Direction updates reactively when locale changes
9. Browser language detection
10. Locale persistence in localStorage
11. Missing key warning logged
12. Date formatting uses correct locale
13. Number formatting uses correct locale
14. Variable interpolation in translations
15. HTML lang attribute set correctly

### Correctness Properties

Property 1: Audit tool completeness
*For any* file containing hardcoded strings, the audit tool should identify all translatable text strings (strings containing letters that are not variables, constants, or already using translation keys)
**Validates: Requirements 1.1**

Property 2: Translation key naming convention
*For all* translation keys in any locale file, the key should follow dot notation format (e.g., "section.subsection.key") with only lowercase letters, numbers, and dots
**Validates: Requirements 1.3**

Property 3: Locale file structure consistency
*For all* locale files, they should have the exact same set of keys at all nesting levels (same structure and hierarchy)
**Validates: Requirements 1.4, 1.5, 6.4**

Property 4: Supported locale recognition
*For any* locale code in the SUPPORTED_LOCALES array, the isSupported() function should return true, and for any code not in the array, it should return false
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1**

Property 5: Translation retrieval correctness
*For any* supported locale and any valid translation key, the t() function should return the translation from the correct locale's dictionary
**Validates: Requirements 2.5, 3.5, 10.1, 10.2, 10.4**

Property 6: Fallback to English
*For any* supported locale and any translation key that exists in English but not in the selected locale, the t() function should return the English translation
**Validates: Requirements 2.6, 3.6**

Property 7: RTL direction for Arabic
*For any* locale, if the locale is 'ar', then isRTL should be true and direction should be 'rtl', otherwise isRTL should be false and direction should be 'ltr'
**Validates: Requirements 4.2**

Property 8: Reactive direction updates
*For any* locale change, the document.documentElement.dir and document.documentElement.lang attributes should update to match the new locale's direction and code without page reload
**Validates: Requirements 4.4**

Property 9: Browser language detection
*For any* browser language setting, if the language code (first part before hyphen) is in supported locales, the detector should return that locale, otherwise it should return 'en'
**Validates: Requirements 5.1, 5.2, 5.3**

Property 10: Locale persistence
*For any* locale selection via setLocale(), the locale code should be stored in localStorage under the key 'piksend_locale'
**Validates: Requirements 5.4**

Property 11: Stored preference priority
*For any* stored locale preference in localStorage, the language detector should return that locale regardless of browser language settings
**Validates: Requirements 5.5**

Property 12: Missing key warning
*For any* translation key that doesn't exist in the current locale or fallback locale, calling t() with that key should log a console warning
**Validates: Requirements 6.5**

Property 13: Date formatting locale awareness
*For any* date and any supported locale, formatDate() should format the date according to that locale's conventions (using Intl.DateTimeFormat)
**Validates: Requirements 7.1, 10.3**

Property 14: Number formatting locale awareness
*For any* number and any supported locale, formatNumber() should format the number according to that locale's conventions (using Intl.NumberFormat)
**Validates: Requirements 7.2, 10.3**

Property 15: Variable interpolation preservation
*For any* translation string containing {{variable}} placeholders and any parameter object, the t() function should replace all placeholders with their corresponding values while preserving the surrounding translated text
**Validates: Requirements 7.4, 7.5**

Property 16: HTML lang attribute synchronization
*For any* locale change, the document.documentElement.lang attribute should be set to the current locale code
**Validates: Requirements 8.1**

Property 17: Error message localization
*For any* error message key and any supported locale, the error message should be displayed in the current locale's language using the t() function
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

## Error Handling

### Translation Errors

1. **Missing Translation Key**
   - Log warning to console with key name
   - Return the key itself as fallback
   - Continue execution without breaking UI

2. **Invalid Locale**
   - Fall back to English (FALLBACK_LOCALE)
   - Log warning about invalid locale
   - Continue with fallback locale

3. **Malformed Translation File**
   - Catch JSON parse errors during import
   - Log error with file name
   - Use empty object as fallback dictionary

### RTL Layout Errors

1. **Document Not Available (SSR)**
   - Skip DOM manipulation
   - Return direction value without applying
   - Apply on client-side hydration

2. **Direction Attribute Not Supported**
   - Gracefully degrade
   - Add CSS class as fallback
   - Log warning in development

### Storage Errors

1. **localStorage Not Available**
   - Catch storage exceptions
   - Continue without persistence
   - Use session-only locale preference

2. **localStorage Quota Exceeded**
   - Clear old preferences
   - Retry storage operation
   - Fall back to session-only if still fails

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Translation Function Tests**
   - Test t() with valid keys returns correct translations
   - Test t() with missing keys returns key itself
   - Test t() with parameters interpolates correctly
   - Test t() with nested keys navigates correctly

2. **RTL Manager Tests**
   - Test isRTL() returns true for Arabic
   - Test isRTL() returns false for other locales
   - Test getDirection() returns correct direction
   - Test applyDirection() sets document attributes

3. **Language Detector Tests**
   - Test detect() with stored preference
   - Test detect() with browser language
   - Test detect() with unsupported language
   - Test setPreference() stores in localStorage
   - Test getStoredPreference() retrieves from localStorage

4. **Audit Tool Tests**
   - Test scanFile() finds hardcoded strings in JSX
   - Test scanFile() finds hardcoded strings in attributes
   - Test scanFile() ignores variables and expressions
   - Test scanFile() ignores technical strings
   - Test generateKey() creates valid key names

5. **Key Generator Tests**
   - Test addKey() adds to all locale files
   - Test setNestedKey() creates nested structure
   - Test validateStructure() detects mismatches
   - Test getKeys() extracts all keys from nested object

### Property-Based Tests

Property-based tests will verify universal properties across all inputs using a PBT library (fast-check for TypeScript):

1. **Property 1: Audit tool completeness** (Requirements 1.1)
   - Generate random React components with hardcoded strings
   - Run audit tool on generated files
   - Verify all hardcoded strings are found

2. **Property 2: Translation key naming convention** (Requirements 1.3)
   - Generate random translation keys from locale files
   - Verify all keys match pattern: /^[a-z0-9]+(\.[a-z0-9]+)*$/

3. **Property 3: Locale file structure consistency** (Requirements 1.4, 1.5, 6.4)
   - Load all locale files
   - Extract key sets from each file
   - Verify all sets are identical

4. **Property 4: Supported locale recognition** (Requirements 2.1-2.4, 3.1-3.4, 4.1)
   - Generate random locale codes
   - For codes in SUPPORTED_LOCALES, verify isSupported() returns true
   - For codes not in SUPPORTED_LOCALES, verify isSupported() returns false

5. **Property 5: Translation retrieval correctness** (Requirements 2.5, 3.5, 10.1, 10.2, 10.4)
   - Generate random supported locales and valid keys
   - Verify t() returns value from correct dictionary

6. **Property 6: Fallback to English** (Requirements 2.6, 3.6)
   - Generate random locales and keys that exist in English but not in the locale
   - Verify t() returns English translation

7. **Property 7: RTL direction for Arabic** (Requirements 4.2)
   - For locale 'ar', verify isRTL() is true and direction is 'rtl'
   - For all other locales, verify isRTL() is false and direction is 'ltr'

8. **Property 8: Reactive direction updates** (Requirements 4.4)
   - Generate random locale changes
   - Verify document.dir and document.lang update correctly

9. **Property 9: Browser language detection** (Requirements 5.1, 5.2, 5.3)
   - Generate random browser language strings
   - If language code is supported, verify detector returns it
   - If language code is not supported, verify detector returns 'en'

10. **Property 10: Locale persistence** (Requirements 5.4)
    - Generate random locale selections
    - Verify localStorage contains the selected locale

11. **Property 11: Stored preference priority** (Requirements 5.5)
    - Generate random stored preferences and browser languages
    - Verify detector returns stored preference

12. **Property 12: Missing key warning** (Requirements 6.5)
    - Generate random non-existent keys
    - Verify console.warn is called with appropriate message

13. **Property 13: Date formatting locale awareness** (Requirements 7.1, 10.3)
    - Generate random dates and locales
    - Verify formatDate() uses correct locale

14. **Property 14: Number formatting locale awareness** (Requirements 7.2, 10.3)
    - Generate random numbers and locales
    - Verify formatNumber() uses correct locale

15. **Property 15: Variable interpolation preservation** (Requirements 7.4, 7.5)
    - Generate random translation strings with {{placeholders}}
    - Generate random parameter objects
    - Verify all placeholders are replaced correctly

16. **Property 16: HTML lang attribute synchronization** (Requirements 8.1)
    - Generate random locale changes
    - Verify document.documentElement.lang matches current locale

17. **Property 17: Error message localization** (Requirements 9.1-9.4)
    - Generate random error keys and locales
    - Verify error messages use t() function and return localized text

### Test Configuration

- Use fast-check library for property-based testing
- Configure each property test to run minimum 100 iterations
- Tag each test with feature name and property number
- Example tag: `// Feature: complete-i18n, Property 3: Locale file structure consistency`

### Integration Tests

1. **Full Locale Switching Flow**
   - Mount I18nProvider with initial locale
   - Switch to different locale
   - Verify all UI text updates
   - Verify direction updates for RTL
   - Verify persistence in localStorage

2. **SSR Hydration**
   - Render on server with initial locale
   - Hydrate on client
   - Verify no hydration mismatches
   - Verify client-side detection works

3. **Fallback Chain**
   - Request translation with missing key
   - Verify fallback to English
   - Verify warning logged
   - Verify UI doesn't break

## Implementation Notes

### Phase 1: Core Infrastructure
1. Update type definitions with new locales
2. Create RTL manager
3. Enhance I18n context with RTL and formatting
4. Create empty locale files for new languages

### Phase 2: Audit and Migration
1. Implement audit tool
2. Run audit on entire codebase
3. Generate report of hardcoded strings
4. Systematically replace hardcoded strings with translation keys

### Phase 3: Translation
1. Translate all keys to new languages
2. Use professional translation services for accuracy
3. Validate translations with native speakers
4. Test RTL layout with Arabic

### Phase 4: Testing
1. Write unit tests for all components
2. Write property-based tests for all properties
3. Run integration tests
4. Perform manual QA in all languages

### Phase 5: Documentation
1. Document translation key conventions
2. Create guide for adding new languages
3. Document RTL considerations
4. Create translation contribution guide
