/**
 * Locale Audit Script
 * 
 * Audits translation files to find:
 * - Keys that exist in one locale but not others
 * - Keys with English fallback values that need translation
 * - Generates a report of missing translations
 * 
 * Usage:
 *   npx tsx scripts/audit-locales.ts                    # Full audit
 *   npx tsx scripts/audit-locales.ts --locale fr       # Audit specific locale
 *   npx tsx scripts/audit-locales.ts --section admin   # Audit specific section
 *   npx tsx scripts/audit-locales.ts --export          # Export missing translations to JSON
 */

import * as fs from 'fs';
import * as path from 'path';

interface AuditResult {
  locale: string;
  missingKeys: string[];
  englishFallbackKeys: string[];
  totalKeys: number;
  translatedKeys: number;
  completionRate: number;
}

interface ExportedTranslation {
  key: string;
  englishValue: string;
  currentValue: string;
  needsTranslation: boolean;
}

class LocaleAuditor {
  private localesDir: string;
  private referenceLocale: string = 'en';

  constructor(localesDir?: string) {
    this.localesDir = localesDir || path.join(process.cwd(), 'src/locales');
  }

  /**
   * Get all locale file names
   */
  getLocaleFiles(): string[] {
    if (!fs.existsSync(this.localesDir)) {
      throw new Error(`Locales directory not found: ${this.localesDir}`);
    }
    
    return fs.readdirSync(this.localesDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort();
  }

  /**
   * Read a locale file
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
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
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
   * Get all keys from a nested object
   */
  private getKeys(obj: Record<string, unknown>, prefix: string = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...this.getKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * Check if a value is the same as English (needs translation)
   */
  private isEnglishFallback(enValue: unknown, localeValue: unknown): boolean {
    if (typeof enValue !== 'string' || typeof localeValue !== 'string') {
      return false;
    }
    return enValue === localeValue;
  }

  /**
   * Audit a specific locale
   */
  auditLocale(locale: string, section?: string): AuditResult {
    const enContent = this.readLocaleFile(this.referenceLocale);
    const localeContent = this.readLocaleFile(locale);
    
    let enKeys = this.getKeys(enContent);
    
    // Filter by section if specified
    if (section) {
      enKeys = enKeys.filter(k => k.startsWith(section));
    }
    
    const missingKeys: string[] = [];
    const englishFallbackKeys: string[] = [];
    let translatedKeys = 0;
    
    for (const key of enKeys) {
      const enValue = this.getNestedValue(enContent, key);
      const localeValue = this.getNestedValue(localeContent, key);
      
      if (localeValue === undefined) {
        missingKeys.push(key);
      } else if (locale !== this.referenceLocale && this.isEnglishFallback(enValue, localeValue)) {
        englishFallbackKeys.push(key);
      } else {
        translatedKeys++;
      }
    }
    
    const totalKeys = enKeys.length;
    const completionRate = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 100;
    
    return {
      locale,
      missingKeys,
      englishFallbackKeys,
      totalKeys,
      translatedKeys,
      completionRate,
    };
  }

  /**
   * Audit all locales
   */
  auditAll(section?: string): AuditResult[] {
    const locales = this.getLocaleFiles().filter(l => l !== this.referenceLocale);
    return locales.map(locale => this.auditLocale(locale, section));
  }

  /**
   * Export missing translations for a locale
   */
  exportMissingTranslations(locale: string, section?: string): ExportedTranslation[] {
    const enContent = this.readLocaleFile(this.referenceLocale);
    const localeContent = this.readLocaleFile(locale);
    
    let enKeys = this.getKeys(enContent);
    
    if (section) {
      enKeys = enKeys.filter(k => k.startsWith(section));
    }
    
    const translations: ExportedTranslation[] = [];
    
    for (const key of enKeys) {
      const enValue = this.getNestedValue(enContent, key);
      const localeValue = this.getNestedValue(localeContent, key);
      
      const isMissing = localeValue === undefined;
      const isEnglishFallback = !isMissing && this.isEnglishFallback(enValue, localeValue);
      
      if (isMissing || isEnglishFallback) {
        translations.push({
          key,
          englishValue: String(enValue),
          currentValue: String(localeValue ?? ''),
          needsTranslation: true,
        });
      }
    }
    
    return translations;
  }

  /**
   * Generate a summary report
   */
  generateReport(section?: string): string {
    const results = this.auditAll(section);
    
    let report = '# Locale Audit Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    if (section) {
      report += `Section: ${section}\n`;
    }
    report += '\n';
    
    // Summary table
    report += '## Summary\n\n';
    report += '| Locale | Total | Translated | Missing | English Fallback | Completion |\n';
    report += '|--------|-------|------------|---------|------------------|------------|\n';
    
    for (const result of results) {
      const missing = result.missingKeys.length;
      const fallback = result.englishFallbackKeys.length;
      report += `| ${result.locale} | ${result.totalKeys} | ${result.translatedKeys} | ${missing} | ${fallback} | ${result.completionRate.toFixed(1)}% |\n`;
    }
    
    report += '\n';
    
    // Details for each locale with issues
    for (const result of results) {
      if (result.missingKeys.length > 0 || result.englishFallbackKeys.length > 0) {
        report += `## ${result.locale.toUpperCase()}\n\n`;
        
        if (result.missingKeys.length > 0) {
          report += `### Missing Keys (${result.missingKeys.length})\n\n`;
          for (const key of result.missingKeys.slice(0, 20)) {
            report += `- \`${key}\`\n`;
          }
          if (result.missingKeys.length > 20) {
            report += `- ... and ${result.missingKeys.length - 20} more\n`;
          }
          report += '\n';
        }
        
        if (result.englishFallbackKeys.length > 0) {
          report += `### Needs Translation (${result.englishFallbackKeys.length})\n\n`;
          for (const key of result.englishFallbackKeys.slice(0, 20)) {
            report += `- \`${key}\`\n`;
          }
          if (result.englishFallbackKeys.length > 20) {
            report += `- ... and ${result.englishFallbackKeys.length - 20} more\n`;
          }
          report += '\n';
        }
      }
    }
    
    return report;
  }

  /**
   * Export translations to JSON file for external translation
   */
  exportToJson(locale: string, outputPath: string, section?: string): void {
    const translations = this.exportMissingTranslations(locale, section);
    
    const exportData = {
      locale,
      section: section || 'all',
      generatedAt: new Date().toISOString(),
      totalKeys: translations.length,
      translations: translations.map(t => ({
        key: t.key,
        english: t.englishValue,
        translation: '', // Empty for translator to fill
      })),
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
  }

  /**
   * Import translations from JSON file
   */
  importFromJson(inputPath: string): { locale: string; imported: number } {
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    const locale = data.locale;
    
    const localeContent = this.readLocaleFile(locale);
    let imported = 0;
    
    for (const item of data.translations) {
      if (item.translation && item.translation.trim() !== '') {
        this.setNestedValue(localeContent, item.key, item.translation);
        imported++;
      }
    }
    
    // Write back
    const filePath = path.join(this.localesDir, `${locale}.json`);
    fs.writeFileSync(filePath, JSON.stringify(localeContent, null, 2) + '\n', 'utf-8');
    
    return { locale, imported };
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: Record<string, unknown>, keyPath: string, value: string): void {
    const keys = keyPath.split('.');
    const lastKey = keys.pop();
    
    if (!lastKey) return;
    
    let current: Record<string, unknown> = obj;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    
    current[lastKey] = value;
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const auditor = new LocaleAuditor();
  
  // Parse arguments
  let locale: string | undefined;
  let section: string | undefined;
  let exportMode = false;
  let importFile: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--locale' && args[i + 1]) {
      locale = args[++i];
    } else if (args[i] === '--section' && args[i + 1]) {
      section = args[++i];
    } else if (args[i] === '--export') {
      exportMode = true;
    } else if (args[i] === '--import' && args[i + 1]) {
      importFile = args[++i];
    }
  }
  
  console.log('\n🔍 Locale Audit Tool\n');
  
  if (importFile) {
    // Import mode
    try {
      const result = auditor.importFromJson(importFile);
      console.log(`✅ Imported ${result.imported} translations for ${result.locale}`);
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  } else if (exportMode && locale) {
    // Export mode
    const outputPath = `translations-${locale}${section ? `-${section.replace(/\./g, '-')}` : ''}.json`;
    try {
      auditor.exportToJson(locale, outputPath, section);
      console.log(`✅ Exported missing translations to ${outputPath}`);
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  } else if (locale) {
    // Single locale audit
    const result = auditor.auditLocale(locale, section);
    console.log(`Locale: ${result.locale}`);
    console.log(`Total keys: ${result.totalKeys}`);
    console.log(`Translated: ${result.translatedKeys}`);
    console.log(`Missing: ${result.missingKeys.length}`);
    console.log(`English fallback: ${result.englishFallbackKeys.length}`);
    console.log(`Completion: ${result.completionRate.toFixed(1)}%`);
    
    if (result.englishFallbackKeys.length > 0) {
      console.log('\nKeys needing translation:');
      for (const key of result.englishFallbackKeys.slice(0, 10)) {
        console.log(`  - ${key}`);
      }
      if (result.englishFallbackKeys.length > 10) {
        console.log(`  ... and ${result.englishFallbackKeys.length - 10} more`);
      }
    }
  } else {
    // Full audit
    console.log(auditor.generateReport(section));
  }
}

export { LocaleAuditor };
