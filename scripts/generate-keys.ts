/**
 * Translation Key Generator
 * 
 * Generates and manages translation keys across all locale files.
 * Ensures consistency and proper structure across all supported languages.
 * 
 * Usage:
 *   npx ts-node scripts/generate-keys.ts add <key> <english-value> [french-value]
 *   npx ts-node scripts/generate-keys.ts validate
 *   npx ts-node scripts/generate-keys.ts list [section]
 * 
 * Example:
 *   npx ts-node scripts/generate-keys.ts add "errors.validation.required" "This field is required" "Ce champ est requis"
 *   npx ts-node scripts/generate-keys.ts validate
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  isValid: boolean;
  missingKeys: Record<string, string[]>;
  extraKeys: Record<string, string[]>;
  structureMismatches: string[];
}

export interface KeyInfo {
  key: string;
  value: string;
  path: string[];
}

export class TranslationKeyGenerator {
  private localesDir: string;
  private referenceLocale: string = 'en';

  constructor(localesDir?: string) {
    this.localesDir = localesDir || path.join(process.cwd(), 'src/locales');
  }

  /**
   * Get all locale file names in the locales directory
   */
  getLocaleFiles(): string[] {
    if (!fs.existsSync(this.localesDir)) {
      throw new Error(`Locales directory not found: ${this.localesDir}`);
    }
    
    return fs.readdirSync(this.localesDir)
      .filter(f => f.endsWith('.json'))
      .sort();
  }

  /**
   * Get locale code from filename
   */
  private getLocaleCode(filename: string): string {
    return filename.replace('.json', '');
  }

  /**
   * Read a locale file and parse its contents
   */
  private readLocaleFile(locale: string): Record<string, unknown> {
    const filePath = path.join(this.localesDir, `${locale}.json`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Locale file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Write content to a locale file with proper formatting
   */
  private writeLocaleFile(locale: string, content: Record<string, unknown>): void {
    const filePath = path.join(this.localesDir, `${locale}.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify(content, null, 2) + '\n',
      'utf-8'
    );
  }

  /**
   * Add a new translation key to all locale files
   * 
   * @param key - Dot notation key (e.g., "errors.validation.required")
   * @param translations - Object mapping locale codes to translation values
   */
  addKey(key: string, translations: Record<string, string>): void {
    // Validate key format
    if (!this.isValidKeyFormat(key)) {
      throw new Error(`Invalid key format: "${key}". Keys must use dot notation with lowercase letters, numbers, and dots only.`);
    }

    const localeFiles = this.getLocaleFiles();
    
    for (const file of localeFiles) {
      const locale = this.getLocaleCode(file);
      const content = this.readLocaleFile(locale);
      
      // Get the translation value for this locale, or use a placeholder
      const value = translations[locale] || `[${key}]`;
      
      // Set the nested key
      this.setNestedKey(content, key, value);
      
      // Write back with formatting
      this.writeLocaleFile(locale, content);
    }
  }

  /**
   * Set a nested key in an object using dot notation
   * Creates intermediate objects as needed
   * 
   * @param obj - The object to modify
   * @param keyPath - Dot notation path (e.g., "section.subsection.key")
   * @param value - The value to set
   */
  setNestedKey(obj: Record<string, unknown>, keyPath: string, value: string): void {
    const keys = keyPath.split('.');
    const lastKey = keys.pop();
    
    if (!lastKey) {
      throw new Error('Invalid key path: empty key');
    }
    
    let current: Record<string, unknown> = obj;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        current[key] = {};
      } else if (typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
        throw new Error(`Cannot set nested key: "${key}" is not an object in path "${keyPath}"`);
      }
      current = current[key] as Record<string, unknown>;
    }
    
    current[lastKey] = value;
  }

  /**
   * Get a nested value from an object using dot notation
   * 
   * @param obj - The object to read from
   * @param keyPath - Dot notation path
   * @returns The value at the path, or undefined if not found
   */
  getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
    const keys = keyPath.split('.');
    let current: unknown = obj;
    
    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    
    return current;
  }

  /**
   * Validate that all locale files have the same structure
   * Returns detailed information about any mismatches
   */
  validateStructure(): ValidationResult {
    const localeFiles = this.getLocaleFiles();
    
    if (localeFiles.length === 0) {
      return {
        isValid: true,
        missingKeys: {},
        extraKeys: {},
        structureMismatches: [],
      };
    }
    
    // Use English as the reference
    const referenceFile = `${this.referenceLocale}.json`;
    if (!localeFiles.includes(referenceFile)) {
      throw new Error(`Reference locale file not found: ${referenceFile}`);
    }
    
    const referenceContent = this.readLocaleFile(this.referenceLocale);
    const referenceKeys = new Set(this.getKeys(referenceContent));
    
    const missingKeys: Record<string, string[]> = {};
    const extraKeys: Record<string, string[]> = {};
    const structureMismatches: string[] = [];
    
    for (const file of localeFiles) {
      const locale = this.getLocaleCode(file);
      
      if (locale === this.referenceLocale) continue;
      
      const content = this.readLocaleFile(locale);
      const localeKeys = new Set(this.getKeys(content));
      
      // Find missing keys (in reference but not in this locale)
      const missing: string[] = [];
      for (const key of referenceKeys) {
        if (!localeKeys.has(key)) {
          missing.push(key);
        }
      }
      if (missing.length > 0) {
        missingKeys[locale] = missing;
      }
      
      // Find extra keys (in this locale but not in reference)
      const extra: string[] = [];
      for (const key of localeKeys) {
        if (!referenceKeys.has(key)) {
          extra.push(key);
        }
      }
      if (extra.length > 0) {
        extraKeys[locale] = extra;
      }
      
      // Check for structure mismatches (same key but different types)
      for (const key of referenceKeys) {
        if (localeKeys.has(key)) {
          const refValue = this.getNestedValue(referenceContent, key);
          const localeValue = this.getNestedValue(content, key);
          
          const refType = typeof refValue;
          const localeType = typeof localeValue;
          
          if (refType !== localeType) {
            structureMismatches.push(
              `Key "${key}" has type "${refType}" in ${this.referenceLocale} but "${localeType}" in ${locale}`
            );
          }
        }
      }
    }
    
    const isValid = 
      Object.keys(missingKeys).length === 0 &&
      Object.keys(extraKeys).length === 0 &&
      structureMismatches.length === 0;
    
    return {
      isValid,
      missingKeys,
      extraKeys,
      structureMismatches,
    };
  }

  /**
   * Get all keys from a nested object using dot notation
   * 
   * @param obj - The object to extract keys from
   * @param prefix - Current key prefix (used for recursion)
   * @returns Array of all keys in dot notation
   */
  getKeys(obj: Record<string, unknown>, prefix: string = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recurse into nested objects
        keys.push(...this.getKeys(value as Record<string, unknown>, fullKey));
      } else {
        // Leaf node - add the key
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * Get all keys with their values from a locale
   * 
   * @param locale - The locale code to read from
   * @returns Array of key info objects
   */
  getKeysWithValues(locale: string): KeyInfo[] {
    const content = this.readLocaleFile(locale);
    const keys = this.getKeys(content);
    
    return keys.map(key => ({
      key,
      value: String(this.getNestedValue(content, key) ?? ''),
      path: key.split('.'),
    }));
  }

  /**
   * Check if a key exists in a locale
   * 
   * @param locale - The locale code
   * @param key - The dot notation key
   * @returns True if the key exists
   */
  hasKey(locale: string, key: string): boolean {
    const content = this.readLocaleFile(locale);
    return this.getNestedValue(content, key) !== undefined;
  }

  /**
   * Remove a key from all locale files
   * 
   * @param key - The dot notation key to remove
   */
  removeKey(key: string): void {
    const localeFiles = this.getLocaleFiles();
    
    for (const file of localeFiles) {
      const locale = this.getLocaleCode(file);
      const content = this.readLocaleFile(locale);
      
      this.removeNestedKey(content, key);
      
      this.writeLocaleFile(locale, content);
    }
  }

  /**
   * Remove a nested key from an object
   */
  private removeNestedKey(obj: Record<string, unknown>, keyPath: string): boolean {
    const keys = keyPath.split('.');
    const lastKey = keys.pop();
    
    if (!lastKey) return false;
    
    let current: Record<string, unknown> = obj;
    
    for (const key of keys) {
      if (current[key] === undefined || typeof current[key] !== 'object') {
        return false;
      }
      current = current[key] as Record<string, unknown>;
    }
    
    if (lastKey in current) {
      delete current[lastKey];
      return true;
    }
    
    return false;
  }

  /**
   * Validate that a key follows the naming convention
   * Keys must use dot notation with lowercase letters, numbers, and dots
   */
  isValidKeyFormat(key: string): boolean {
    // Must not be empty
    if (!key || key.trim() === '') return false;
    
    // Must not start or end with a dot
    if (key.startsWith('.') || key.endsWith('.')) return false;
    
    // Must not have consecutive dots
    if (key.includes('..')) return false;
    
    // Each segment must be valid (lowercase letters, numbers, camelCase allowed)
    const segments = key.split('.');
    for (const segment of segments) {
      // Segment must not be empty
      if (segment === '') return false;
      
      // Segment must start with a lowercase letter
      if (!/^[a-z]/.test(segment)) return false;
      
      // Segment can contain lowercase letters, numbers, and uppercase for camelCase
      if (!/^[a-zA-Z0-9]+$/.test(segment)) return false;
    }
    
    return true;
  }

  /**
   * Synchronize all locale files to match the reference locale structure
   * Adds missing keys with placeholder values
   */
  synchronizeLocales(): void {
    const localeFiles = this.getLocaleFiles();
    const referenceContent = this.readLocaleFile(this.referenceLocale);
    const referenceKeys = this.getKeys(referenceContent);
    
    for (const file of localeFiles) {
      const locale = this.getLocaleCode(file);
      
      if (locale === this.referenceLocale) continue;
      
      const content = this.readLocaleFile(locale);
      
      // Add missing keys with placeholder values
      for (const key of referenceKeys) {
        if (this.getNestedValue(content, key) === undefined) {
          const refValue = this.getNestedValue(referenceContent, key);
          // Use placeholder that indicates translation needed
          const placeholder = `[TODO: ${locale}] ${refValue}`;
          this.setNestedKey(content, key, placeholder);
        }
      }
      
      this.writeLocaleFile(locale, content);
    }
  }

  /**
   * Generate a validation report as a string
   */
  generateValidationReport(): string {
    const result = this.validateStructure();
    
    let report = '# Translation Structure Validation Report\n\n';
    
    if (result.isValid) {
      report += '✅ All locale files have consistent structure!\n';
      return report;
    }
    
    report += '❌ Structure inconsistencies found:\n\n';
    
    if (Object.keys(result.missingKeys).length > 0) {
      report += '## Missing Keys\n\n';
      for (const [locale, keys] of Object.entries(result.missingKeys)) {
        report += `### ${locale}\n`;
        for (const key of keys) {
          report += `- \`${key}\`\n`;
        }
        report += '\n';
      }
    }
    
    if (Object.keys(result.extraKeys).length > 0) {
      report += '## Extra Keys\n\n';
      for (const [locale, keys] of Object.entries(result.extraKeys)) {
        report += `### ${locale}\n`;
        for (const key of keys) {
          report += `- \`${key}\`\n`;
        }
        report += '\n';
      }
    }
    
    if (result.structureMismatches.length > 0) {
      report += '## Type Mismatches\n\n';
      for (const mismatch of result.structureMismatches) {
        report += `- ${mismatch}\n`;
      }
    }
    
    return report;
  }
}


// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const generator = new TranslationKeyGenerator();
  
  switch (command) {
    case 'add': {
      const key = args[1];
      const englishValue = args[2];
      const frenchValue = args[3];
      
      if (!key || !englishValue) {
        console.error('Usage: npx ts-node scripts/generate-keys.ts add <key> <english-value> [french-value]');
        console.error('Example: npx ts-node scripts/generate-keys.ts add "errors.validation.required" "This field is required" "Ce champ est requis"');
        process.exit(1);
      }
      
      try {
        const translations: Record<string, string> = {
          en: englishValue,
        };
        
        if (frenchValue) {
          translations.fr = frenchValue;
        }
        
        generator.addKey(key, translations);
        console.log(`✅ Added key "${key}" to all locale files`);
      } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
      break;
    }
    
    case 'validate': {
      console.log('\n🔍 Validating translation structure...\n');
      console.log(generator.generateValidationReport());
      
      const result = generator.validateStructure();
      if (!result.isValid) {
        process.exit(1);
      }
      break;
    }
    
    case 'sync': {
      console.log('\n🔄 Synchronizing locale files...\n');
      try {
        generator.synchronizeLocales();
        console.log('✅ All locale files synchronized with reference locale (en)');
      } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
      break;
    }
    
    case 'list': {
      const section = args[1];
      const locale = args[2] || 'en';
      
      console.log(`\n📋 Translation keys for locale: ${locale}\n`);
      
      try {
        const keys = generator.getKeysWithValues(locale);
        const filteredKeys = section 
          ? keys.filter(k => k.key.startsWith(section))
          : keys;
        
        if (filteredKeys.length === 0) {
          console.log(section ? `No keys found in section "${section}"` : 'No keys found');
        } else {
          for (const keyInfo of filteredKeys) {
            const truncatedValue = keyInfo.value.length > 50 
              ? keyInfo.value.substring(0, 47) + '...'
              : keyInfo.value;
            console.log(`  ${keyInfo.key}: "${truncatedValue}"`);
          }
          console.log(`\nTotal: ${filteredKeys.length} keys`);
        }
      } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
      break;
    }
    
    case 'remove': {
      const key = args[1];
      
      if (!key) {
        console.error('Usage: npx ts-node scripts/generate-keys.ts remove <key>');
        process.exit(1);
      }
      
      try {
        generator.removeKey(key);
        console.log(`✅ Removed key "${key}" from all locale files`);
      } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
      break;
    }
    
    case 'help':
    default: {
      console.log(`
Translation Key Generator

Usage:
  npx ts-node scripts/generate-keys.ts <command> [options]

Commands:
  add <key> <english-value> [french-value]
    Add a new translation key to all locale files.
    Example: npx ts-node scripts/generate-keys.ts add "errors.required" "Required" "Requis"

  validate
    Validate that all locale files have the same structure.
    Returns exit code 1 if validation fails.

  sync
    Synchronize all locale files to match the reference locale (en).
    Adds missing keys with placeholder values.

  list [section] [locale]
    List all translation keys, optionally filtered by section.
    Example: npx ts-node scripts/generate-keys.ts list errors en

  remove <key>
    Remove a translation key from all locale files.
    Example: npx ts-node scripts/generate-keys.ts remove "errors.deprecated"

  help
    Show this help message.
`);
      break;
    }
  }
}
