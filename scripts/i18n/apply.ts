/**
 * I18n Apply Translations Script
 * 
 * Applies generated translations to locale files.
 * Can apply from cache or from a JSON file.
 * 
 * Usage:
 *   npx tsx scripts/i18n/apply.ts --locale fr
 *   npx tsx scripts/i18n/apply.ts --locale all
 *   npx tsx scripts/i18n/apply.ts --file translations-fr.json
 *   npx tsx scripts/i18n/apply.ts --locale fr --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TranslationEntry {
  key: string;
  english: string;
  translation: string;
}

export interface ApplyResult {
  locale: string;
  applied: number;
  skipped: number;
  errors: string[];
}

export class I18nApplier {
  private localesDir: string;
  private cacheDir: string;

  constructor(localesDir?: string) {
    this.localesDir = localesDir || path.join(process.cwd(), 'src/locales');
    this.cacheDir = path.join(process.cwd(), '.i18n-cache');
  }

  getCachedFiles(): string[] {
    if (!fs.existsSync(this.cacheDir)) {
      return [];
    }
    return fs.readdirSync(this.cacheDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(this.cacheDir, f));
  }

  private readLocaleFile(locale: string): Record<string, unknown> {
    const filePath = path.join(this.localesDir, `${locale}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Locale file not found: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  private writeLocaleFile(locale: string, content: Record<string, unknown>): void {
    const filePath = path.join(this.localesDir, `${locale}.json`);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
  }

  private setNestedValue(obj: Record<string, unknown>, keyPath: string, value: string): void {
    const keys = keyPath.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;
    
    let current: Record<string, unknown> = obj;
    for (const key of keys) {
      if (current[key] === undefined) {
        current[key] = {};
      } else if (typeof current[key] !== 'object' || current[key] === null) {
        throw new Error(`Cannot set nested key: parent "${key}" is not an object`);
      }
      current = current[key] as Record<string, unknown>;
    }
    current[lastKey] = value;
  }

  loadFromCache(locale: string, section?: string): TranslationEntry[] | null {
    const cacheFile = path.join(this.cacheDir, `${locale}${section ? `-${section.replace(/\./g, '-')}` : ''}.json`);
    if (!fs.existsSync(cacheFile)) {
      return null;
    }
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    return data.translations;
  }

  loadFromFile(filePath: string): { locale: string; translations: TranslationEntry[] } {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return { locale: data.locale, translations: data.translations };
  }

  applyTranslations(
    locale: string, 
    translations: TranslationEntry[],
    dryRun: boolean = false,
    skipEnglishFallback: boolean = false
  ): ApplyResult {
    const result: ApplyResult = { locale, applied: 0, skipped: 0, errors: [] };
    if (translations.length === 0) return result;

    const content = this.readLocaleFile(locale);

    for (const entry of translations) {
      try {
        if (skipEnglishFallback && entry.translation === entry.english) {
          result.skipped++;
          continue;
        }
        if (!entry.translation || entry.translation.trim() === '') {
          result.skipped++;
          continue;
        }
        this.setNestedValue(content, entry.key, entry.translation);
        result.applied++;
      } catch (error) {
        result.errors.push(`${entry.key}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!dryRun && result.applied > 0) {
      this.writeLocaleFile(locale, content);
    }
    return result;
  }

  applyFromCache(locale: string, section?: string, dryRun: boolean = false): ApplyResult {
    const translations = this.loadFromCache(locale, section);
    if (!translations) {
      return {
        locale,
        applied: 0,
        skipped: 0,
        errors: [`No cached translations found for ${locale}${section ? ` (section: ${section})` : ''}`],
      };
    }
    return this.applyTranslations(locale, translations, dryRun);
  }

  applyFromFile(filePath: string, dryRun: boolean = false): ApplyResult {
    const { locale, translations } = this.loadFromFile(filePath);
    return this.applyTranslations(locale, translations, dryRun);
  }

  applyAllCached(dryRun: boolean = false): ApplyResult[] {
    const results: ApplyResult[] = [];
    const cachedFiles = this.getCachedFiles();

    for (const file of cachedFiles) {
      try {
        const result = this.applyFromFile(file, dryRun);
        results.push(result);
      } catch (error) {
        const filename = path.basename(file);
        results.push({
          locale: filename.replace('.json', ''),
          applied: 0,
          skipped: 0,
          errors: [error instanceof Error ? error.message : String(error)],
        });
      }
    }
    return results;
  }

  clearCache(locale?: string): number {
    if (!fs.existsSync(this.cacheDir)) return 0;
    const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
    let deleted = 0;
    for (const file of files) {
      if (!locale || file.startsWith(locale)) {
        fs.unlinkSync(path.join(this.cacheDir, file));
        deleted++;
      }
    }
    return deleted;
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  let locale: string | undefined;
  let section: string | undefined;
  let file: string | undefined;
  let dryRun = false;
  let clearCacheFlag = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--locale' && args[i + 1]) locale = args[++i];
    else if (args[i] === '--section' && args[i + 1]) section = args[++i];
    else if (args[i] === '--file' && args[i + 1]) file = args[++i];
    else if (args[i] === '--dry-run') dryRun = true;
    else if (args[i] === '--clear-cache') clearCacheFlag = true;
    else if (args[i] === '--help') {
      console.log(`
I18n Apply Translations Script

Usage:
  npx tsx scripts/i18n/apply.ts [options]

Options:
  --locale <code>    Target locale or 'all' for all cached
  --section <name>   Only apply translations for this section
  --file <path>      Apply translations from a specific JSON file
  --dry-run          Preview changes without modifying files
  --clear-cache      Clear cached translations
  --help             Show this help message
`);
      process.exit(0);
    }
  }
  
  const applier = new I18nApplier();
  
  console.log('\n📝 I18n Apply Translations\n');
  if (dryRun) console.log('📋 DRY RUN - No files will be modified\n');
  
  if (clearCacheFlag) {
    const deleted = applier.clearCache(locale);
    console.log(`🗑️  Cleared ${deleted} cached file(s)\n`);
    process.exit(0);
  }
  
  if (file) {
    try {
      const result = applier.applyFromFile(file, dryRun);
      console.log(`  ${result.locale}: Applied ${result.applied}, Skipped ${result.skipped}`);
      if (result.errors.length > 0) {
        result.errors.forEach(e => console.log(`    - ${e}`));
      }
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  } else if (locale === 'all') {
    const results = applier.applyAllCached(dryRun);
    console.log('📊 Results:\n');
    for (const result of results) {
      const status = result.errors.length === 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${result.locale}: Applied ${result.applied}, Skipped ${result.skipped}`);
      result.errors.forEach(e => console.log(`     ❌ ${e}`));
    }
  } else if (locale) {
    const result = applier.applyFromCache(locale, section, dryRun);
    console.log(`  ${result.locale}: Applied ${result.applied}, Skipped ${result.skipped}`);
    result.errors.forEach(e => console.log(`    - ${e}`));
  } else {
    console.log('Please specify --locale <code>, --locale all, or --file <path>');
    process.exit(1);
  }
  
  console.log('\n✅ Done!\n');
}
